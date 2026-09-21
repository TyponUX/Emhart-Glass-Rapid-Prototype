          <h1 className="text-3xl font-semibold tracking-tight">Emhart Glass catalogue</h1>
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Download, FileText, Minus, PackageSearch, Plus, ShoppingCart, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accounts, assemblies, documents, machines, parts, services, type CompatibilityStatus } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { fitsOwnedEquipment, getCurrentPart, getEquipmentTree, getOrderability, getPartAlternatives, getPartNumberHistory, getWhereUsed, searchCatalogue, type CatalogueContentType, type CatalogueSearchResult } from "@/lib/portal-logic";

type ProductsTab = "catalogue" | "services";
type PartsMode = "list" | "bom";

function OrderabilityBadge({ status }: { status: CompatibilityStatus }) {
  if (status === "compatible") return <Badge variant="secondary"><CheckCircle2 className="mr-1 size-3" />Available</Badge>;
  if (status === "warning") return <Badge variant="outline"><AlertTriangle className="mr-1 size-3" />Review replacement</Badge>;
  return <Badge variant="destructive">Not available</Badge>;
}

export function ProductsAndServices({ accountId, onGoToCart, onRequestSupport }: { accountId: string; onGoToCart: () => void; onRequestSupport: (context: { site: string; machineId: string; documentId?: string }) => void }) {
  const account = accounts.find((candidate) => candidate.id === accountId) ?? accounts[0];
  const ownedMachineIds = account.machineIds;

  const [tab, setTab] = useState<ProductsTab>("catalogue");
  const [contentType, setContentType] = useState<CatalogueContentType>("all");
  const [query, setQuery] = useState("");
  const [machineFilter, setMachineFilter] = useState<string>("all");
  const [partsMode, setPartsMode] = useState<PartsMode>("list");
  const [selectedResult, setSelectedResult] = useState<CatalogueSearchResult>({ id: parts[0].id, type: "part", title: parts[0].partNumber, subtitle: parts[0].name });
  const [selectedPartId, setSelectedPartId] = useState(parts[0].id);
  const [quantity, setQuantity] = useState(1);
  const [serviceMachine, setServiceMachine] = useState<string>("all");
  const [lastAdded, setLastAdded] = useState<string | undefined>();

  const { addToCart, cartCount } = useTransaction();

  const catalogueResults = useMemo(
    () => searchCatalogue(query, contentType, { machines, parts, documents }, machineFilter === "all" ? undefined : machineFilter),
    [query, contentType, machineFilter],
  );
  const groupedResults = {
    machines: catalogueResults.filter((result) => result.type === "machine"),
    parts: catalogueResults.filter((result) => result.type === "part"),
    documents: catalogueResults.filter((result) => result.type === "document"),
  };
  const bomMachines = machineFilter === "all" ? machines : machines.filter((machine) => machine.id === machineFilter);

  const selectedPart = parts.find((part) => part.id === selectedPartId) ?? parts[0];
  const selectedMachine = machines.find((machine) => machine.id === selectedResult.id);
  const selectedDocument = documents.find((document) => document.id === selectedResult.id);
  const currentPart = getCurrentPart(selectedPart, parts);
  const orderability = getOrderability(selectedPart);
  const fits = fitsOwnedEquipment(selectedPart, ownedMachineIds);
  const history = getPartNumberHistory(selectedPart, parts);
  const whereUsed = getWhereUsed(selectedPart, machines, assemblies);
  const alternatives = getPartAlternatives(selectedPart, parts);

  const filteredServices = serviceMachine === "all" ? services : services.filter((service) => service.compatibleMachineIds.includes(serviceMachine));

  function selectPart(partId: string) {
    const part = parts.find((candidate) => candidate.id === partId) ?? parts[0];
    setSelectedPartId(part.id);
    setSelectedResult({ id: part.id, type: "part", title: part.partNumber, subtitle: part.name });
    setQuantity(1);
  }

  function selectResult(result: CatalogueSearchResult) {
    setSelectedResult(result);
    if (result.type === "part") {
      setSelectedPartId(result.id);
      setQuantity(1);
    }
  }

  function changeContentType(nextType: CatalogueContentType) {
    setContentType(nextType);
    setPartsMode("list");
    const firstResult = searchCatalogue(query, nextType, { machines, parts, documents }, machineFilter === "all" ? undefined : machineFilter)[0];
    if (firstResult) {
      selectResult(firstResult);
    }
  }

  function renderResult(result: CatalogueSearchResult) {
    return (
      <button key={`${result.type}-${result.id}`} className={`w-full border p-3 text-left hover:bg-accent ${selectedResult.type === result.type && selectedResult.id === result.id ? "bg-accent" : ""}`} onClick={() => selectResult(result)}>
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{result.title}</span>
          <Badge variant="outline" className="text-[10px] capitalize">{result.type}</Badge>
        </span>
        <span className="block text-xs text-muted-foreground">{result.subtitle}</span>
      </button>
    );
  }

  function handleAddPart() {
    const equipmentId = selectedPart.compatibleMachineIds.find((id) => ownedMachineIds.includes(id)) ?? selectedPart.compatibleMachineIds[0] ?? "catalogue";
    addToCart({
      type: "part",
      partId: selectedPart.id,
      equipmentId,
      quantity,
      deliveryLocation: account.sites[0],
      compatibility: orderability,
    });
    setLastAdded(`${quantity} × ${selectedPart.name}`);
  }

  function handleAddService(serviceId: string) {
    const service = services.find((candidate) => candidate.id === serviceId) ?? services[0];
    const equipmentId = service.compatibleMachineIds.find((id) => ownedMachineIds.includes(id)) ?? service.compatibleMachineIds[0] ?? "catalogue";
    addToCart({
      type: "service",
      serviceId: service.id,
      equipmentId,
      scope: "To be confirmed with Emhart Glass",
      deliveryLocation: account.sites[0],
      compatibility: "compatible",
    });
    setLastAdded(service.name);
  }

  const machineOptions = machines.map((machine) => ({ id: machine.id, label: `${machine.name}${ownedMachineIds.includes(machine.id) ? " · your equipment" : ""}` }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          
          <h1 className="text-3xl font-semibold tracking-tight">Emhart Glass catalogue</h1>
          <p className="max-w-2xl text-muted-foreground">Browse the full parts and services catalogue, search by machine or part number, and add anything to the cart for a quote request.</p>
        </div>
        <Button variant="outline" onClick={onGoToCart}><ShoppingCart className="mr-2 size-4" />View cart{cartCount > 0 && <Badge variant="secondary" className="ml-2">{cartCount}</Badge>}</Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button variant={tab === "catalogue" ? "secondary" : "ghost"} className="gap-2" onClick={() => setTab("catalogue")}><PackageSearch className="size-4" />Catalogue</Button>
        <Button variant={tab === "services" ? "secondary" : "ghost"} className="gap-2" onClick={() => setTab("services")}><Wrench className="size-4" />Services</Button>
      </div>

      {lastAdded && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-green-50 p-3 text-sm text-green-800">
          <span><strong>{lastAdded}</strong> was added to the cart.</span>
          <Button size="sm" variant="outline" onClick={onGoToCart}>Go to cart<ArrowRight className="ml-2 size-4" /></Button>
        </div>
      )}

      {tab === "catalogue" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]">
          <Card className="h-fit bg-action-panel-color">
            <CardHeader><CardTitle className="text-base">Search the catalogue</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="catalogue-search">Machine, document or part</Label>
                <Input id="catalogue-search" placeholder="e.g. NIS, TNB040 or 200-202-1" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["all", "machines", "parts", "documents"] as CatalogueContentType[]).map((type) => (
                  <Button key={type} size="sm" variant={contentType === type ? "secondary" : "outline"} onClick={() => changeContentType(type)} className="capitalize">{type}</Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine-filter">Related machine</Label>
                <Select value={machineFilter} onValueChange={setMachineFilter}>
                  <SelectTrigger id="machine-filter" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All machines</SelectItem>
                    {machineOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {contentType === "parts" && (
                <div className="flex gap-2">
                  <Button size="sm" variant={partsMode === "list" ? "secondary" : "outline"} className="flex-1" onClick={() => setPartsMode("list")}>List</Button>
                  <Button size="sm" variant={partsMode === "bom" ? "secondary" : "outline"} className="flex-1" onClick={() => setPartsMode("bom")}>Browse BOM</Button>
                </div>
              )}

              {contentType === "parts" && partsMode === "bom" ? (
                <div className="space-y-4">
                  {bomMachines.map((machine) => {
                    const tree = getEquipmentTree(machine, assemblies, parts);
                    return (
                      <div key={machine.id} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{machine.name}</p>
                        {tree.children.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No published assemblies.</p>
                        ) : (
                          tree.children.map((assemblyNode) => (
                            <div key={assemblyNode.id} className="space-y-1">
                              <p className="flex items-center gap-1 text-sm font-medium"><ChevronRight className="size-3" />{assemblyNode.label}</p>
                              <div className="ml-4 space-y-1 border-l pl-3">
                                {assemblyNode.children.map((partNode) => (
                                  <button key={partNode.id} className={`block w-full border px-3 py-2 text-left text-sm hover:bg-accent ${partNode.id === selectedPart.id ? "bg-accent" : ""}`} onClick={() => selectPart(partNode.id)}>{partNode.label}</button>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : contentType === "all" ? (
                <div className="space-y-2">
                  {catalogueResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No catalogue records match your search.</p>
                  ) : (
                    (["machines", "parts", "documents"] as const).map((group) => groupedResults[group].length > 0 && (
                      <div key={group} className="space-y-2 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                        {groupedResults[group].map(renderResult)}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {catalogueResults.length === 0 ? <p className="text-sm text-muted-foreground">No {contentType} match your search.</p> : catalogueResults.map(renderResult)}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedResult.type === "part" && (
          <Card>
            <CardHeader><CardTitle>{selectedPart.name}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start gap-4">
                <img src={selectedPart.imageUrl} alt={selectedPart.name} className="size-24 border object-cover" />
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedPart.partNumber}</Badge>
                    <OrderabilityBadge status={orderability} />
                    <Badge variant={fits ? "secondary" : "outline"}>{fits ? "Fits your equipment" : "Catalogue item"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                  <p className="text-xs text-muted-foreground">Category: {selectedPart.category}</p>
                </div>
              </div>

              {selectedPart.supersededById && (
                <div className="border border-border bg-amber-50 p-3 text-sm">This part is superseded. Order <strong>{currentPart.partNumber}</strong> ({currentPart.name}) instead.</div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-muted-foreground">Availability</p><p className="font-medium">{selectedPart.availability}</p></div>
                <div><p className="text-muted-foreground">Lead time</p><p className="font-medium">{selectedPart.leadTime}</p></div>
                <div><p className="text-muted-foreground">Unit price</p><p className="font-medium">{selectedPart.currency} {selectedPart.unitPrice.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Fits machines</p><p className="font-medium">{selectedPart.compatibleMachineIds.length}</p></div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Part number history</p>
                <div className="flex flex-wrap items-center gap-2">
                  {history.map((entry, index) => (
                    <span key={entry.id} className="flex items-center gap-2">
                      {index > 0 && <ArrowRight className="size-3 text-muted-foreground" />}
                      <Badge variant={entry.id === selectedPart.id ? "secondary" : "outline"}>{entry.partNumber}{entry.id === currentPart.id ? " · current" : ""}</Badge>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Where used</p>
                <div className="flex flex-wrap gap-2">
                  {whereUsed.assembly && <Badge variant="outline">{whereUsed.assembly.name}</Badge>}
                  {whereUsed.machines.map((machine) => <Badge key={machine.id} variant="outline">{machine.name}</Badge>)}
                  {whereUsed.machines.length === 0 && <p className="text-sm text-muted-foreground">Not linked to a machine.</p>}
                </div>
              </div>

              {alternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Compatible alternatives</p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((alternative) => (
                      <Button key={alternative.id} variant="outline" size="sm" onClick={() => selectPart(alternative.id)}>{alternative.partNumber}</Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Qty</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}><Minus className="size-3" /></Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => setQuantity((value) => value + 1)}><Plus className="size-3" /></Button>
                  </div>
                </div>
                <Button onClick={handleAddPart} disabled={orderability === "unavailable"}><ShoppingCart className="mr-2 size-4" />Add to cart · {selectedPart.currency} {(selectedPart.unitPrice * quantity).toLocaleString()}</Button>
              </div>
            </CardContent>
          </Card>
          )}

          {selectedResult.type === "machine" && selectedMachine && (
            <Card>
              <CardHeader><CardTitle>{selectedMachine.name}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-start gap-4">
                  <img src={selectedMachine.imageUrl} alt={selectedMachine.name} className="size-28 border object-cover" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedMachine.model}</Badge>
                      <Badge variant={ownedMachineIds.includes(selectedMachine.id) ? "secondary" : "outline"}>{ownedMachineIds.includes(selectedMachine.id) ? "Your equipment" : "Catalogue machine"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedMachine.configuration}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><p className="text-muted-foreground">Model</p><p className="font-medium">{selectedMachine.model}</p></div>
                  <div><p className="text-muted-foreground">Section</p><p className="font-medium">{selectedMachine.section}</p></div>
                  <div><p className="text-muted-foreground">Reference</p><p className="font-medium">{selectedMachine.serialNumber}</p></div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Assemblies</p>
                  <div className="flex flex-wrap gap-2">
                    {assemblies.filter((assembly) => assembly.machineId === selectedMachine.id).map((assembly) => <Badge key={assembly.id} variant="outline">{assembly.name}</Badge>)}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Compatible parts</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {parts.filter((part) => part.compatibleMachineIds.includes(selectedMachine.id)).map((part) => (
                      <button key={part.id} className="border p-3 text-left hover:bg-accent" onClick={() => selectPart(part.id)}>
                        <span className="block text-sm font-medium">{part.partNumber}</span>
                        <span className="block text-xs text-muted-foreground">{part.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Related documents</p>
                  <div className="space-y-2">
                    {documents.filter((document) => document.relatedMachineIds.includes(selectedMachine.id)).map((document) => (
                      <button key={document.id} className="flex w-full items-center gap-3 border p-3 text-left hover:bg-accent" onClick={() => selectResult({ id: document.id, type: "document", title: document.title, subtitle: document.documentId })}>
                        <FileText className="size-4 text-primary" /><span><span className="block text-sm font-medium">{document.title}</span><span className="block text-xs text-muted-foreground">{document.documentId} · {document.type}</span></span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedResult.type === "document" && selectedDocument && (
            <Card>
              <CardHeader><CardTitle>{selectedDocument.title}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedDocument.documentId}</Badge>
                  <Badge variant="secondary">{selectedDocument.type}</Badge>
                  <Badge variant="outline">{selectedDocument.status}</Badge>
                </div>

                <p className="text-sm text-muted-foreground">{selectedDocument.summary}</p>

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><p className="text-muted-foreground">Revision</p><p className="font-medium">{selectedDocument.revision ?? "Current"}</p></div>
                  <div><p className="text-muted-foreground">Published</p><p className="font-medium">{selectedDocument.date ?? "Not specified"}</p></div>
                  <div><p className="text-muted-foreground">Catalogue level</p><p className="font-medium capitalize">{selectedDocument.level}</p></div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Related machines</p>
                  <div className="flex flex-wrap gap-2">
                    {machines.filter((machine) => selectedDocument.relatedMachineIds.includes(machine.id)).map((machine) => (
                      <Button key={machine.id} variant="outline" size="sm" onClick={() => selectResult({ id: machine.id, type: "machine", title: machine.name, subtitle: machine.model })}>{machine.name}</Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Related parts</p>
                  <div className="flex flex-wrap gap-2">
                    {parts.filter((part) => selectedDocument.relatedPartIds.includes(part.id)).map((part) => (
                      <Button key={part.id} variant="outline" size="sm" onClick={() => selectPart(part.id)}>{part.partNumber}</Button>
                    ))}
                    {selectedDocument.relatedPartIds.length === 0 && <p className="text-sm text-muted-foreground">No directly related parts.</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedDocument.pdfPath && <Button asChild><a href={selectedDocument.pdfPath} target="_blank" rel="noreferrer"><Download className="mr-2 size-4" />Open PDF</a></Button>}
                  <Button variant="outline" onClick={() => onRequestSupport({ site: account.sites[0], machineId: selectedDocument.relatedMachineIds[0] ?? account.machineIds[0], documentId: selectedDocument.id })}>Still need help</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="service-filter">Machine</Label>
              <Select value={serviceMachine} onValueChange={setServiceMachine}>
                <SelectTrigger id="service-filter" className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All machines</SelectItem>
                  {machineOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {filteredServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services match this machine.</p>
            ) : (
              filteredServices.map((service) => (
                <Card key={service.id}>
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.category}</p>
                      </div>
                      {service.price !== undefined && <Badge variant="outline">{service.currency} {service.price.toLocaleString()}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Lead time: {service.leadTime}</span>
                      <Button size="sm" variant="outline" onClick={() => handleAddService(service.id)}><ShoppingCart className="mr-2 size-3" />Add to cart</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
