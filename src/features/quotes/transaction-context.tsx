import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { type LineItem, parts, services } from "@/data/portal-data";

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
export type OrderStatus = "in-progress" | "delivered" | "complete";

export interface QuoteEntry {
  id: string;
  number: string;
  requestNumber: string;
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
  createdAt: string;
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
  confirmReceipt: (orderId: string) => void;
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

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

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
        status: "in-progress",
        total: quote.total,
        milestones: createShipmentMilestones("in-production"),
        createdAt: formatDate(new Date()),
      },
      ...current,
    ]);
    setQuotes((current) => current.map((candidate) => (candidate.id === quoteId ? { ...candidate, status: "ordered", orderId } : candidate)));

    return orderId;
  }, [quotes]);

  const advanceShipment = useCallback((orderId: string) => {
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) {
        return order;
      }

      const milestones = advanceMilestones(order.milestones);
      const currentKey = milestones.find((milestone) => milestone.status === "current")?.key ?? "received";
      const status: OrderStatus = currentKey === "received" ? "complete" : currentKey === "delivered" ? "delivered" : "in-progress";

      return { ...order, milestones, status };
    }));
  }, []);

  const confirmReceipt = useCallback((orderId: string) => {
    setOrders((current) => current.map((order) => (order.id === orderId
      ? { ...order, status: "complete", milestones: createShipmentMilestones("received") }
      : order)));
  }, []);

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
    confirmReceipt,
  }), [cart, quotes, orders, cartTotal, addToCart, removeFromCart, clearCart, submitCart, requestClarification, approveQuote, advanceShipment, confirmReceipt]);

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransaction() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error("useTransaction must be used within a TransactionProvider.");
  }

  return context;
}
