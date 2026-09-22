import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { type LineItem, parts, services } from "@/data/portal-data";
import type { ProjectItem } from "@/features/projects/project-context";

export type ShipmentMilestoneKey =
  | "order-confirmed"
  | "in-production"
  | "ready-to-ship"
  | "shipped"
  | "out-for-delivery"
  | "delivered"
  | "received";

export interface ShipmentMilestone {
  key: ShipmentMilestoneKey;
  label: string;
  date: string;
  status: "complete" | "current" | "upcoming";
  note?: string;
}

export type QuoteStatus = "requested" | "quoted" | "pending-clarification" | "ordered";
export type OrderStatus = "received" | "confirmed" | "preparing" | "in-progress" | "delivered" | "complete";

export interface QuoteEntry {
  id: string;
  number: string;
  requestNumber: string;
  packageName?: string;
  items: LineItem[];
  status: QuoteStatus;
  revision: number;
  total: number;
  clarificationNotes: string[];
  createdAt: string;
  orderId?: string;
}

export interface OrderEntry {
  id: string;
  number: string;
  quoteNumber: string;
  items: LineItem[];
  status: OrderStatus;
  total: number;
  milestones: ShipmentMilestone[];
  shipmentStarted?: boolean;
  createdAt: string;
  estimatedArrivalByItem: Record<string, string>;
}

export interface TransactionNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface TransactionContextValue {
  cart: LineItem[];
  quotes: QuoteEntry[];
  orders: OrderEntry[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<LineItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  submitCart: () => string | undefined;
  requestClarification: (quoteId: string, note: string) => void;
  approveQuote: (quoteId: string) => string | undefined;
  advanceShipment: (orderId: string) => void;
  advanceOrder: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  createQuoteFromProjectItems: (items: ProjectItem[], equipmentId: string, packageName?: string) => { id: string; number: string } | undefined;
  notifications: TransactionNotification[];
}

const SHIPMENT_SEQUENCE: ShipmentMilestoneKey[] = [
  "order-confirmed",
  "in-production",
  "ready-to-ship",
  "shipped",
  "out-for-delivery",
  "delivered",
  "received",
];

const MILESTONE_LABELS: Record<ShipmentMilestoneKey, string> = {
  "order-confirmed": "Order confirmed",
  "in-production": "In production",
  "ready-to-ship": "Ready to ship",
  shipped: "Shipped",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  received: "Received",
};

const MILESTONE_NOTES: Record<ShipmentMilestoneKey, string> = {
  "order-confirmed": "Purchase order accepted and order placed.",
  "in-production": "Parts are being prepared for dispatch.",
  "ready-to-ship": "Packing is complete and carrier assignment is pending.",
  shipped: "Carrier has collected the shipment.",
  "out-for-delivery": "The shipment is arriving at the customer site.",
  delivered: "The order has arrived on site.",
  received: "Customer confirmed receipt of the shipment.",
};

const ORDER_STATUS_SEQUENCE: OrderStatus[] = ["received", "confirmed", "preparing"];

const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

function createShipmentMilestones(currentKey: ShipmentMilestoneKey = "order-confirmed"): ShipmentMilestone[] {
  const currentIndex = SHIPMENT_SEQUENCE.indexOf(currentKey);

  return SHIPMENT_SEQUENCE.map((key, index) => ({
    key,
    label: MILESTONE_LABELS[key],
    date: index <= currentIndex ? formatDate(new Date()) : "TBD",
    status: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
    note: MILESTONE_NOTES[key],
  }));
}

function advanceMilestones(milestones: ShipmentMilestone[]): ShipmentMilestone[] {
  const currentIndex = milestones.findIndex((milestone) => milestone.status === "current");
  const nextIndex = Math.min(currentIndex + 1, SHIPMENT_SEQUENCE.length - 1);

  return milestones.map((milestone, index) => {
    if (index <= currentIndex) {
      return { ...milestone, status: "complete" as const, date: milestone.date === "TBD" ? formatDate(new Date()) : milestone.date };
    }

    if (index === nextIndex) {
      return { ...milestone, status: "current" as const, date: formatDate(new Date()) };
    }

    return { ...milestone, status: "upcoming" as const };
  });
}

function computeTotal(items: LineItem[]): number {
  return items.reduce((total, item) => {
    if (item.type === "part" && item.partId) {
      const part = parts.find((candidate) => candidate.id === item.partId);
      return total + (part?.unitPrice ?? 0) * (item.quantity ?? 1);
    }

    if (item.type === "service" && item.serviceId) {
      const service = services.find((candidate) => candidate.id === item.serviceId);
      return total + (service?.price ?? 0);
    }

    return total;
  }, 0);
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<LineItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteEntry[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [notifications, setNotifications] = useState<TransactionNotification[]>([]);
  const counterRef = useRef(147);
  const orderCounterRef = useRef(91);
  const timersRef = useRef<number[]>([]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const registerTimer = useCallback((timer: number) => {
    timersRef.current.push(timer);
  }, []);

  const cartTotal = useMemo(() => computeTotal(cart), [cart]);

  const addToCart = useCallback((item: Omit<LineItem, "id">) => {
    setCart((current) => [
      ...current,
      { ...item, id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}` },
    ]);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const submitCart = useCallback(() => {
    if (cart.length === 0 || cart.some((item) => item.compatibility !== "compatible")) {
      return undefined;
    }

    const sequence = counterRef.current++;
    const requestNumber = `RFQ-2026-${String(sequence).padStart(4, "0")}`;
    const quoteNumber = `Q-2026-${String(sequence).padStart(4, "0")}`;
    const quoteId = `quote-${sequence}`;
    const items = cart;

    setQuotes((current) => [
      {
        id: quoteId,
        number: quoteNumber,
        requestNumber,
        items,
        status: "requested",
        revision: 1,
        total: computeTotal(items),
        clarificationNotes: [],
        createdAt: formatDate(new Date()),
      },
      ...current,
    ]);
    setCart([]);

    const timer = window.setTimeout(() => {
      setQuotes((current) => current.map((quote) => (quote.id === quoteId && quote.status === "requested" ? { ...quote, status: "quoted" } : quote)));
    }, 1200);
    registerTimer(timer);

    return quoteId;
  }, [cart, registerTimer]);

  const requestClarification = useCallback((quoteId: string, note: string) => {
    setQuotes((current) => current.map((quote) => (quote.id === quoteId && quote.status === "quoted"
      ? { ...quote, status: "pending-clarification", clarificationNotes: [...quote.clarificationNotes, note] }
      : quote)));

    const timer = window.setTimeout(() => {
      setQuotes((current) => current.map((quote) => (quote.id === quoteId && quote.status === "pending-clarification"
        ? { ...quote, status: "quoted", revision: quote.revision + 1 }
        : quote)));
    }, 1200);
    registerTimer(timer);
  }, [registerTimer]);

  const approveQuote = useCallback((quoteId: string) => {
    const quote = quotes.find((candidate) => candidate.id === quoteId);

    if (!quote || quote.status !== "quoted") {
      return undefined;
    }

    const sequence = orderCounterRef.current++;
    const orderNumber = `ORD-2026-${String(sequence).padStart(4, "0")}`;
    const orderId = `order-${sequence}`;

    setOrders((current) => [
      {
        id: orderId,
        number: orderNumber,
        quoteNumber: quote.number,
        items: quote.items,
        status: "received",
        total: quote.total,
        milestones: createShipmentMilestones("in-production"),
        createdAt: formatDate(new Date()),
        estimatedArrivalByItem: Object.fromEntries(quote.items.map((item, index) => [item.id, formatDate(addDays(new Date(), 14 + index * 7))])),
      },
      ...current,
    ]);
    setQuotes((current) => current.map((candidate) => (candidate.id === quoteId ? { ...candidate, status: "ordered", orderId } : candidate)));

    return orderId;
  }, [quotes]);

  const createQuoteFromProjectItems = useCallback((projectItems: ProjectItem[], equipmentId: string, packageName?: string) => {
    const items: LineItem[] = projectItems.flatMap((projectItem): LineItem[] => {
      if (projectItem.type === "document") return [];
      if (projectItem.type === "part") {
        const part = parts.find((candidate) => candidate.partNumber === projectItem.reference || candidate.name === projectItem.name);
        if (!part) return [];
        return [{ id: `line-${Date.now()}-${part.id}`, type: "part" as const, partId: part.id, equipmentId, quantity: projectItem.quantity, deliveryLocation: "Northstar Glass Plant", compatibility: "compatible" as const }];
      }
      const service = services.find((candidate) => candidate.name === projectItem.name);
      if (!service) return [];
      return [{ id: `line-${Date.now()}-${service.id}`, type: "service" as const, serviceId: service.id, equipmentId, scope: "Repair project package", deliveryLocation: "Northstar Glass Plant", compatibility: "compatible" as const }];
    });
    if (items.length === 0) return undefined;
    const sequence = counterRef.current++;
    const quoteId = `quote-${sequence}`;
    const quoteNumber = `Q-2026-${String(sequence).padStart(4, "0")}`;
    setQuotes((current) => [{ id: quoteId, number: quoteNumber, requestNumber: `RFQ-2026-${String(sequence).padStart(4, "0")}`, packageName, items, status: "requested", revision: 1, total: computeTotal(items), clarificationNotes: [], createdAt: formatDate(new Date()) }, ...current]);
    const timer = window.setTimeout(() => setQuotes((current) => current.map((quote) => quote.id === quoteId && quote.status === "requested" ? { ...quote, status: "quoted" } : quote)), 1200);
    registerTimer(timer);
    return { id: quoteId, number: quoteNumber };
  }, [registerTimer]);

  const advanceShipment = useCallback((orderId: string) => {
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      const milestones = advanceMilestones(order.milestones);
      const currentKey = milestones.find((milestone) => milestone.status === "current")?.key ?? "received";
      const status: OrderStatus = currentKey === "received" ? "complete" : currentKey === "delivered" ? "delivered" : "in-progress";
      const nextLabel = MILESTONE_LABELS[currentKey];
      setNotifications((currentNotifications) => [{ id: `shipment-${Date.now()}`, title: `Shipment update · ${order.number}`, message: `Shipment status changed to ${nextLabel}.`, createdAt: formatDate(new Date()), read: false }, ...currentNotifications]);

      return { ...order, milestones, status };
    }));
  }, []);

  const advanceOrder = useCallback((orderId: string) => {
    setOrders((current) => current.map((order) => {
      const index = ORDER_STATUS_SEQUENCE.indexOf(order.status);
      if (index < 0) return order;
      if (index === ORDER_STATUS_SEQUENCE.length - 1) return { ...order, shipmentStarted: true, milestones: createShipmentMilestones("ready-to-ship") };
      return { ...order, status: ORDER_STATUS_SEQUENCE[index + 1] };
    }));
  }, []);

  const confirmReceipt = useCallback((orderId: string) => {
    setOrders((current) => current.map((order) => (order.id === orderId
      ? { ...order, status: "complete", milestones: createShipmentMilestones("received") }
      : order)));
    const order = orders.find((candidate) => candidate.id === orderId);
    if (order) setNotifications((current) => [{ id: `shipment-${Date.now()}`, title: `Shipment update · ${order.number}`, message: "Shipment status changed to Received.", createdAt: formatDate(new Date()), read: false }, ...current]);
  }, [orders]);

  const value = useMemo<TransactionContextValue>(() => ({
    cart,
    quotes,
    orders,
    cartCount: cart.length,
    cartTotal,
    addToCart,
    removeFromCart,
    clearCart,
    submitCart,
    requestClarification,
    approveQuote,
    advanceShipment,
    advanceOrder,
    confirmReceipt,
    createQuoteFromProjectItems,
    notifications,
  }), [cart, quotes, orders, cartTotal, addToCart, removeFromCart, clearCart, submitCart, requestClarification, approveQuote, advanceShipment, advanceOrder, confirmReceipt, createQuoteFromProjectItems, notifications]);

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransaction() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error("useTransaction must be used within a TransactionProvider.");
  }

  return context;
}
