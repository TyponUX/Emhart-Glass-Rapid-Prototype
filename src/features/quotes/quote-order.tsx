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
import { Textarea } from "@/components/ui/textarea";
import { parts, services, type LineItem } from "@/data/portal-data";
import {
  useTransaction,
  type OrderEntry,
  type QuoteEntry,
} from "@/features/quotes/transaction-context";
import { useActionFeedback } from "@/components/shared/action-feedback";

type HubTab = "cart" | "quotes" | "orders" | "shipment";

function resolveItem(item: LineItem) {
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
          {resolved.qty > 1 ? `${resolved.qty} × ` : ""}EUR{" "}
          {resolved.price.toLocaleString()}
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
  initialQuoteId,
  initialOrderId,
  onOrderPlaced,
}: {
  initialQuoteId?: string;
  initialOrderId?: string;
  onOrderPlaced?: (quoteId: string, orderId: string) => void;
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
  } = useTransaction();
  const { showFeedback } = useActionFeedback();
  const [tab, setTab] = useState<HubTab>("cart");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | undefined>();
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>();
  const [clarificationNote, setClarificationNote] = useState(
    "Please confirm the mounting part revision and final delivery window.",
  );

  const visibleQuotes = quotes.filter((quote) => quote.status !== "ordered");
  const selectedQuote =
    visibleQuotes.find((quote) => quote.id === selectedQuoteId) ??
    visibleQuotes[0];
  const orderList = orders.filter((order) => !order.shipmentStarted);
  const shipmentList = orders.filter((order) => order.shipmentStarted);
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? orderList[0] ?? shipmentList[0];
  const cartReady =
    cart.length > 0 &&
    cart.every((item) => item.compatibility === "compatible");

  useEffect(() => {
    if (initialQuoteId) {
      setSelectedQuoteId(initialQuoteId);
      setTab("quotes");
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
      setSelectedQuoteId(quoteId);
      setTab("quotes");
    }
  }

  function handleApprove(quoteId: string) {
    const orderId = approveQuote(quoteId);
    if (orderId) {
      setSelectedOrderId(orderId);
      onOrderPlaced?.(quoteId, orderId);
      setTab("orders");
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
  }> = [
    { key: "cart", label: "Cart", icon: ShoppingCart, count: cart.length },
    {
      key: "quotes",
      label: "Quotes",
      icon: ClipboardList,
      count: visibleQuotes.length,
    },
    { key: "orders", label: "Orders", icon: Truck, count: orderList.length },
    {
      key: "shipment",
      label: "Shipment",
      icon: Waypoints,
      count: shipmentList.length,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Commercial hub
        </h1>
        <p className="max-w-2xl text-muted-foreground"></p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
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
      </div>

      {tab === "cart" && (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="bg-action-panel-color">
            <CardHeader>
              <CardTitle>Collected items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  The cart is empty. Add parts from My Equipment or Products &
                  Services to start a quote request.
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
                <span className="text-muted-foreground">Estimated total</span>
                <span className="font-medium">
                  EUR {cartTotal.toLocaleString()}
                </span>
              </div>
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

      {tab === "quotes" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quotes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                      {quote.items.length} items · EUR{" "}
                      {quote.total.toLocaleString()}
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
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">
                      EUR {selectedQuote.total.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedQuote.items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>

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
                        setSelectedOrderId(selectedQuote.orderId);
                        setTab("orders");
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

      {tab === "orders" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                      From {order.quoteNumber} · EUR{" "}
                      {order.total.toLocaleString()}
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
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">
                      EUR {selectedOrder.total.toLocaleString()}
                    </p>
                  </div>
                </div>

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

      {tab === "shipment" && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
