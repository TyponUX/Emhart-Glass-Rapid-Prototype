<h1 className="text-3xl font-semibold tracking-tight">Commercial hub</h1>;
import { useEffect, useState } from "react";
import {
  Check,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
  Trash2,
  Truck,
  Waypoints,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { assemblies, parts, services, type LineItem } from "@/data/portal-data";
import { plants } from "@/data/plant-hierarchy";
import {
  useTransaction,
  type OrderEntry,
  type QuoteEntry,
} from "@/features/quotes/transaction-context";
import { useActionFeedback } from "@/components/shared/action-feedback";

type HubTab = "cart" | "quotes" | "orders" | "shipment";

function resolveItem(item: LineItem) {
  if (item.type === "equipment") {
    const assembly = assemblies.find((candidate) => candidate.id === item.installedEquipmentId);
    const plantEquipment = plants.flatMap((plant) => plant.furnaces)
      .flatMap((furnace) => furnace.lines)
      .flatMap((line) => line.equipment)
      .find((candidate) => candidate.id === item.installedEquipmentId);
    return {
      code: assembly?.objectId ?? plantEquipment?.objectId ?? "Equipment",
      name: assembly?.name ?? plantEquipment?.description ?? "Installed equipment",
      price: undefined,
      qty: 1,
      kind: "Equipment",
    };
  }

  if (item.type === "part") {
    const part = parts.find((candidate) => candidate.id === item.partId);
    return {
      code: part?.partNumber ?? "Part",
      name: part?.name ?? "Part",
      price: (part?.unitPrice ?? 0) * (item.quantity ?? 1),
      qty: item.quantity ?? 1,
      kind: "Part",
    };
  }

  const service = services.find((candidate) => candidate.id === item.serviceId);
  return {
    code: "Service",
    name: service?.name ?? "Service",
    price: service?.price ?? 0,
    qty: 1,
    kind: "Service",
  };
}

const QUOTE_STATUS_LABEL: Record<QuoteEntry["status"], string> = {
  requested: "Awaiting quotation",
  quoted: "Awaiting approval & place order",
  "pending-clarification": "Request clarification",
  ordered: "Ordered",
};

const ORDER_STATUS_LABEL: Record<OrderEntry["status"], string> = {
  received: "Order received",
  confirmed: "Order confirmed",
  preparing: "Preparing order",
  "in-progress": "Order in progress",
  delivered: "Delivered",
  complete: "Received",
};

function ItemRow({
  item,
  onRemove,
}: {
  item: LineItem;
  onRemove?: () => void;
}) {
  const resolved = resolveItem(item);

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{resolved.code}</p>
        <p className="text-xs text-muted-foreground">
          {resolved.name} · {resolved.kind}
        </p>
        {item.compatibility !== "compatible" && (
          <Badge variant="destructive" className="mt-1">
            Not compatible
          </Badge>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">
          {resolved.price === undefined ? "To be quoted" : <>{resolved.qty > 1 ? `${resolved.qty} × ` : ""}EUR {resolved.price.toLocaleString()}</>}
        </p>
        {onRemove && (
          <button
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onRemove}
          >
            <X className="mr-1 inline size-3" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function QuoteOrder({
  view,
  initialQuoteId,
  initialOrderId,
  onNavigate,
}: {
  view: "cart" | "quotes" | "orders";
  initialQuoteId?: string;
  initialOrderId?: string;
  onNavigate: (route: "quotes" | "orders", id?: string) => void;
}) {
  const {
    cart,
    quotes,
    orders,
    cartTotal,
    removeFromCart,
    clearCart,
    submitCart,
    requestClarification,
    approveQuote,
    advanceOrder,
    advanceShipment,
    confirmReceipt,
    notificationSubscriptions,
    setNotificationSubscription,
  } = useTransaction();
  const { showFeedback } = useActionFeedback();
  const [tab, setTab] = useState<HubTab>(view === "cart" ? "cart" : view === "quotes" ? "quotes" : "orders");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | undefined>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<"all" | QuoteEntry["status"]>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderEntry["status"]>("all");
  const [clarificationNote, setClarificationNote] = useState(
    "Please confirm the mounting part revision and final delivery window.",
  );

  const visibleQuotes = quotes.filter((quote) => {
    const query = quoteSearch.trim().toLowerCase();
    const matchesSearch = !query || [quote.number, quote.requestNumber, quote.packageName ?? ""].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (quoteStatusFilter === "all" || quote.status === quoteStatusFilter);
  });
  const selectedQuote =
    visibleQuotes.find((quote) => quote.id === selectedQuoteId) ??
    visibleQuotes[0];
  const matchingOrders = orders.filter((order) => {
    const query = orderSearch.trim().toLowerCase();
    const matchesSearch = !query || [order.number, order.quoteNumber].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (orderStatusFilter === "all" || order.status === orderStatusFilter);
  });
  const orderList = matchingOrders.filter((order) => !order.shipmentStarted);
  const shipmentList = matchingOrders.filter((order) => order.shipmentStarted);
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? orderList[0] ?? shipmentList[0];
  const cartReady =
    cart.length > 0 &&
    cart.every((item) => item.compatibility === "compatible");

  useEffect(() => {
    setTab(view === "cart" ? "cart" : view === "quotes" ? "quotes" : "orders");
  }, [view]);

  useEffect(() => {
    if (initialQuoteId) {
      setSelectedQuoteId(initialQuoteId);
    }
  }, [initialQuoteId]);

  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
      setTab("orders");
    }
  }, [initialOrderId]);

  function handleSubmit() {
    const quoteId = submitCart();
    if (quoteId) {
      onNavigate("quotes", quoteId);
    }
  }

  function handleApprove(quoteId: string) {
    const orderId = approveQuote(quoteId);
    if (orderId) {
      setSelectedOrderId(orderId);
      onNavigate("orders", orderId);
    }
  }

  function handleShipmentAdvance(order: OrderEntry) {
    if (order.status === "delivered") {
      confirmReceipt(order.id);
      showFeedback({
        itemName: `Shipment ${order.number} received`,
        destination: "cart",
      });
      return;
    }
    advanceShipment(order.id);
    showFeedback({
      itemName: `Shipment ${order.number} updated`,
      destination: "cart",
    });
  }

  const tabs: Array<{
    key: HubTab;
    label: string;
    icon: typeof ShoppingCart;
    count: number;
  }> = view === "orders" ? [
    { key: "orders", label: "Orders", icon: Truck, count: orderList.length },
    { key: "shipment", label: "Shipment", icon: Waypoints, count: shipmentList.length },
  ] : [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{view === "cart" ? "Cart" : view === "quotes" ? "Quotes" : "Orders & Shipment"}</h1>
        <p className="max-w-2xl text-muted-foreground"></p>
      </div>

      {view === "orders" && <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <Button
            key={key}
            variant={tab === key ? "secondary" : "ghost"}
            className="gap-2"
            onClick={() => setTab(key)}
          >
            <Icon className="size-4" />
            {label}
            {count > 0 && (
              <Badge variant={tab === key ? "default" : "outline"}>
                {count}
              </Badge>
            )}
          </Button>
        ))}
      </div>}

      {view === "cart" && tab === "cart" && (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="bg-action-panel-color">
            <CardHeader>
              <CardTitle>Collected items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  The cart is empty. Add parts from My Equipment or Products to
                  start a quote request.
                </p>
              ) : (
                cart.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Request summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{cart.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{cart.some((item) => item.type === "equipment") ? "Known subtotal" : "Estimated total"}</span>
                <span className="font-medium">
                  EUR {cartTotal.toLocaleString()}
                </span>
              </div>
              {cart.some((item) => item.type === "equipment") && <p className="text-xs text-muted-foreground">Equipment pricing will be confirmed in the quotation.</p>}
              {!cartReady && cart.length > 0 && (
                <p className="text-xs text-destructive">
                  Remove incompatible items before submitting.
                </p>
              )}
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!cartReady}
              >
                Submit request for quote
              </Button>
              {cart.length > 0 && (
                <Button variant="ghost" className="w-full" onClick={clearCart}>
                  <Trash2 className="mr-2 size-4" />
                  Clear cart
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {view === "quotes" && tab === "quotes" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quotes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quote-search">Search quotes</Label>
                <Input id="quote-search" placeholder="Quote or request number" value={quoteSearch} onChange={(event) => setQuoteSearch(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote-status-filter">Status</Label>
                <Select value={quoteStatusFilter} onValueChange={(value) => setQuoteStatusFilter(value as "all" | QuoteEntry["status"])}>
                  <SelectTrigger id="quote-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(QUOTE_STATUS_LABEL) as QuoteEntry["status"][]).map((status) => <SelectItem key={status} value={status}>{QUOTE_STATUS_LABEL[status]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {visibleQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No quotes yet. Submit a request from the cart.
                </p>
              ) : (
                visibleQuotes.map((quote) => (
                  <button
                    key={quote.id}
                    className={`w-full border p-3 text-left hover:bg-accent ${selectedQuote?.id === quote.id ? "bg-accent" : ""}`}
                    onClick={() => setSelectedQuoteId(quote.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {quote.number}
                      </span>
                      <Badge
                        variant={
                          quote.status === "quoted"
                            ? "secondary"
                            : quote.status === "ordered"
                              ? "default"
                              : "outline"
                        }
                      >
                        {QUOTE_STATUS_LABEL[quote.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {quote.packageName ? `${quote.packageName} · ` : ""}
                      {quote.items.length} items · {quote.items.some((item) => item.type === "equipment")
                        ? `Known subtotal EUR ${quote.total.toLocaleString()} · equipment pricing pending`
                        : `EUR ${quote.total.toLocaleString()}`}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedQuote ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  {selectedQuote.packageName ?? selectedQuote.number}
                  <Badge variant="secondary">
                    {QUOTE_STATUS_LABEL[selectedQuote.status]}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedQuote.number}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Request</p>
                    <p className="font-medium">{selectedQuote.requestNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revision</p>
                    <p className="font-medium">{selectedQuote.revision}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">{selectedQuote.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{selectedQuote.items.some((item) => item.type === "equipment") ? "Known subtotal" : "Total"}</p>
                    <p className="font-medium">
                      EUR {selectedQuote.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedQuote.items.some((item) => item.type === "equipment") && <p className="text-xs text-muted-foreground">Equipment pricing is pending for the final quotation.</p>}

                <div className="space-y-2">
                  {selectedQuote.items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>

                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Documents</h3>
                  <p className="text-sm text-muted-foreground">No documents are attached to this quote.</p>
                </section>

                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Requests</h3>
                  <p className="text-sm text-muted-foreground">Request {selectedQuote.requestNumber}</p>
                  {selectedQuote.clarificationNotes.length > 0 ? selectedQuote.clarificationNotes.map((note, index) => <p key={`${selectedQuote.id}-request-${index}`} className="border p-3 text-sm">{note}</p>) : <p className="text-sm text-muted-foreground">No additional requests.</p>}
                </section>

                <section className="flex items-start gap-3 border-t pt-4">
                  <Checkbox id={`quote-notifications-${selectedQuote.id}`} checked={notificationSubscriptions[`quote:${selectedQuote.id}`] ?? false} onCheckedChange={(checked) => setNotificationSubscription(`quote:${selectedQuote.id}`, checked === true)} />
                  <Label htmlFor={`quote-notifications-${selectedQuote.id}`} className="text-sm">Subscribe to quote notifications</Label>
                </section>

                {selectedQuote.status === "requested" && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Emhart Glass is preparing your quotation. This updates
                    automatically.
                  </p>
                )}

                {selectedQuote.status === "quoted" && (
                  <div className="space-y-4 rounded-md border border-dashed p-4">
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => handleApprove(selectedQuote.id)}>
                        <Check className="mr-2 size-4" />
                        Approve &amp; place order
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          requestClarification(
                            selectedQuote.id,
                            clarificationNote,
                          )
                        }
                      >
                        Request clarification
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Clarification note</p>
                      <Textarea
                        value={clarificationNote}
                        onChange={(event) =>
                          setClarificationNote(event.target.value)
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedQuote.status === "pending-clarification" && (
                  <div className="rounded-md border border-border bg-amber-50 p-4 text-sm text-amber-900">
                    Emhart Glass is preparing a revised quotation. Latest note:{" "}
                    {
                      selectedQuote.clarificationNotes[
                        selectedQuote.clarificationNotes.length - 1
                      ]
                    }
                  </div>
                )}

                {selectedQuote.status === "ordered" && (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-green-50 p-4 text-sm">
                    <span className="text-green-800">
                      This quote was approved and converted to an order.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onNavigate("orders", selectedQuote.orderId);
                      }}
                    >
                      View order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Select a quote to review it.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {view === "orders" && tab === "orders" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-search">Search orders</Label>
                <Input id="order-search" placeholder="Order or quote number" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-status-filter">Status</Label>
                <Select value={orderStatusFilter} onValueChange={(value) => setOrderStatusFilter(value as "all" | OrderEntry["status"])}>
                  <SelectTrigger id="order-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(ORDER_STATUS_LABEL) as OrderEntry["status"][]).map((status) => <SelectItem key={status} value={status}>{ORDER_STATUS_LABEL[status]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {orderList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet. Approve a quote to place an order.
                </p>
              ) : (
                orderList.map((order) => (
                  <button
                    key={order.id}
                    className={`w-full border p-3 text-left hover:bg-accent ${selectedOrder?.id === order.id ? "bg-accent" : ""}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {order.number}
                      </span>
                      <Badge
                        variant={
                          order.status === "complete" ? "secondary" : "outline"
                        }
                      >
                        {ORDER_STATUS_LABEL[order.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      From {order.quoteNumber} · {order.items.some((item) => item.type === "equipment")
                        ? `Known subtotal EUR ${order.total.toLocaleString()} · equipment pricing pending`
                        : `EUR ${order.total.toLocaleString()}`}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  {selectedOrder.number}
                  <Badge variant="secondary">
                    {ORDER_STATUS_LABEL[selectedOrder.status]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">From quote</p>
                    <p className="font-medium">{selectedOrder.quoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Placed</p>
                    <p className="font-medium">{selectedOrder.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Items</p>
                    <p className="font-medium">{selectedOrder.items.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{selectedOrder.items.some((item) => item.type === "equipment") ? "Known subtotal" : "Total"}</p>
                    <p className="font-medium">
                      EUR {selectedOrder.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedOrder.items.some((item) => item.type === "equipment") && <p className="text-xs text-muted-foreground">Equipment pricing is pending confirmation.</p>}

                <div className="space-y-2 rounded-md border p-4">
                  <p className="text-sm font-medium">Order items</p>
                  {selectedOrder.items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                  {selectedOrder.status !== "in-progress" && selectedOrder.status !== "delivered" && selectedOrder.status !== "complete" && (
                    <Button onClick={() => { const movesToShipment = selectedOrder.status === "preparing"; advanceOrder(selectedOrder.id); if (movesToShipment) setTab("shipment"); }}>Advance order</Button>
                  )}
                  {selectedOrder.status === "in-progress" && <p className="text-xs text-muted-foreground">Order preparation is complete. Continue in Shipment when fulfilment begins.</p>}
                </div>

                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Documents</h3>
                  <p className="text-sm text-muted-foreground">No documents are attached to this order.</p>
                </section>

                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Requests</h3>
                  <p className="text-sm text-muted-foreground">Linked quote: {selectedOrder.quoteNumber}</p>
                  <p className="text-sm text-muted-foreground">No additional order requests.</p>
                </section>

                <section className="flex items-start gap-3 border-t pt-4">
                  <Checkbox id={`order-notifications-${selectedOrder.id}`} checked={notificationSubscriptions[`order:${selectedOrder.id}`] ?? false} onCheckedChange={(checked) => setNotificationSubscription(`order:${selectedOrder.id}`, checked === true)} />
                  <Label htmlFor={`order-notifications-${selectedOrder.id}`} className="text-sm">Subscribe to order and shipment notifications</Label>
                </section>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Select an order to track it.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {view === "orders" && tab === "shipment" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shipment-search">Search shipments</Label>
                <Input id="shipment-search" placeholder="Order or quote number" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipment-status-filter">Status</Label>
                <Select value={orderStatusFilter} onValueChange={(value) => setOrderStatusFilter(value as "all" | OrderEntry["status"])}>
                  <SelectTrigger id="shipment-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(ORDER_STATUS_LABEL) as OrderEntry["status"][]).map((status) => <SelectItem key={status} value={status}>{ORDER_STATUS_LABEL[status]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {shipmentList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No shipments yet. Orders appear here once fulfilment begins.
                </p>
              ) : (
                shipmentList.map((order) => (
                  <button
                    key={order.id}
                    className={`w-full border p-3 text-left hover:bg-accent ${selectedOrder?.id === order.id ? "bg-accent" : ""}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        Shipment for {order.number}
                      </span>
                      <Badge variant="outline">
                        {order.milestones.find(
                          (milestone) => milestone.status === "current",
                        )?.label ?? "Received"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.items.length} items · From {order.quoteNumber}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  Shipment for {selectedOrder.number}
                  <Badge variant="secondary">
                    <Truck className="mr-1 size-3" />
                    {selectedOrder.milestones.find(
                      (milestone) => milestone.status === "current",
                    )?.label ?? "Received"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2 rounded-md border p-4">
                  <p className="text-sm font-medium">Shipment items</p>
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 border p-3"
                    >
                      <ItemRow item={item} />
                      <div className="shrink-0 text-right"><Badge variant="outline">{selectedOrder.milestones.find((milestone) => milestone.status === "current")?.label ?? "Received"}</Badge><p className="mt-1 text-xs text-muted-foreground">ETA: {selectedOrder.estimatedArrivalByItem[item.id] ?? "To be confirmed"}</p></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 rounded-md border p-4">
                  <p className="text-sm font-medium">Shipment milestones</p>
                  {selectedOrder.milestones.map((milestone) => (
                    <div
                      key={milestone.key}
                      className={`flex items-start gap-3 rounded-md border p-3 ${milestone.status === "current" ? "bg-primary/5" : milestone.status === "complete" ? "bg-green-50" : "bg-muted/20"}`}
                    >
                      <div className="mt-0.5">
                        {milestone.status === "complete" ? (
                          <PackageCheck className="size-4 text-green-600" />
                        ) : milestone.status === "current" ? (
                          <Waypoints className="size-4 text-primary" />
                        ) : (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0.5 text-[10px]"
                          >
                            •
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{milestone.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.date}
                        </p>
                        {milestone.note && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {milestone.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedOrder.status !== "complete" && (
                    <Button
                      onClick={() => handleShipmentAdvance(selectedOrder)}
                    >
                      {selectedOrder.status === "delivered"
                        ? "Confirm receipt"
                        : "Advance shipment"}
                    </Button>
                  )}
                </div>

                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Proof of delivery</h3>
                  {selectedOrder.status === "complete" ? (
                    <div className="border p-3 text-sm"><p className="font-medium">Receipt confirmed</p><p className="text-muted-foreground">POD-{selectedOrder.number} · {selectedOrder.milestones.find((milestone) => milestone.key === "received")?.date}</p></div>
                  ) : <p className="text-sm text-muted-foreground">Proof of delivery will be available after receipt is confirmed.</p>}
                </section>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Select a shipment to track it.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
