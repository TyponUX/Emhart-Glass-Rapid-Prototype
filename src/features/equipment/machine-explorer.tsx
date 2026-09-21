import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assemblies, documents, machines, parts } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { getAssemblyDocuments, getEquipmentBreadcrumbs, getEquipmentTree, getMachineDocuments, getPartDocuments, getPartCompatibility } from "@/lib/portal-logic";

interface MachineExplorerProps {
  machineId: string;
  onBack: () => void;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}

export function MachineExplorer({ machineId, onBack, onRequestSupport }: MachineExplorerProps) {
  const machine = machines.find((candidate) => candidate.id === machineId) ?? machines[0];
  const tree = useMemo(() => getEquipmentTree(machine, assemblies, parts), [machine]);
  const { addToCart } = useTransaction();
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | undefined>();
  const [selectedPartId, setSelectedPartId] = useState<string | undefined>();
  const [addedPart, setAddedPart] = useState<string | undefined>();
  const selectedAssembly = assemblies.find((assembly) => assembly.id === selectedAssemblyId);
  const selectedPart = parts.find((part) => part.id === selectedPartId);
  const currentDocuments = selectedPart ? getPartDocuments(selectedPart, documents) : selectedAssembly ? getAssemblyDocuments(selectedAssembly, documents) : getMachineDocuments(machine, documents);
  const breadcrumbs = getEquipmentBreadcrumbs(machine, selectedAssembly, selectedPart);
  const selectedImage = selectedPart?.imageUrl ?? selectedAssembly?.imageUrl ?? machine.imageUrl;
  const selectedImageLabel = selectedPart ? selectedPart.name : selectedAssembly ? selectedAssembly.name : machine.name;

  function selectAssembly(id: string) {
    setSelectedAssemblyId(id);
    setSelectedPartId(undefined);
  }

  function handleAddPart(partId: string) {
    const part = parts.find((candidate) => candidate.id === partId) ?? parts[0];
    addToCart({
      type: "part",
      partId: part.id,
      equipmentId: machine.id,
      quantity: 1,
      deliveryLocation: machine.site,
      compatibility: getPartCompatibility(part, machine),
    });
    setAddedPart(part.id);
  }

  return (
    <section className="space-y-6">
      <div><Button variant="ghost" className="mb-2 -ml-3" onClick={onBack}><ArrowLeft className="mr-2 size-4" />All equipment</Button><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-4"><div className="hidden size-16 shrink-0 overflow-hidden rounded-md border bg-muted sm:block"><img className="h-full w-full object-contain" src={machine.imageUrl} alt={machine.name} /></div><div><h1 className="text-3xl font-semibold tracking-tight">{machine.name}</h1><p className="text-muted-foreground">{machine.model} · {machine.serialNumber} · {machine.site}</p></div></div><Badge variant="secondary">{machine.configuration}</Badge></div></div>
      <nav aria-label="Equipment breadcrumbs" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{breadcrumbs.map((breadcrumb, index) => <span key={breadcrumb.href}>{index > 0 && " / "}{index === breadcrumbs.length - 1 ? <span className="font-medium text-foreground">{breadcrumb.label}</span> : <a className="underline-offset-4 hover:underline" href={breadcrumb.href}>{breadcrumb.label}</a>}</span>)}</nav>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="bg-action-panel-color"><CardHeader><CardTitle>Installed equipment tree</CardTitle></CardHeader><CardContent className="space-y-2">{tree.children.map((assemblyNode) => <div key={assemblyNode.id}><button className={`w-full border px-3 py-3 text-left text-sm font-medium hover:bg-accent ${selectedAssemblyId === assemblyNode.id ? "bg-accent" : ""}`} onClick={() => selectAssembly(assemblyNode.id)}>{assemblyNode.label}</button>{selectedAssemblyId === assemblyNode.id && <div className="ml-4 space-y-2 border-l pl-3 pt-2">{assemblyNode.children.map((partNode) => <button key={partNode.id} className={`block w-full border px-3 py-2 text-left text-sm hover:bg-accent ${selectedPartId === partNode.id ? "bg-accent" : ""}`} onClick={() => { setSelectedPartId(partNode.id); setSelectedAssemblyId(assemblyNode.id); }}>{partNode.label}</button>)}</div>}</div>)}</CardContent></Card>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>{selectedPart ? selectedPart.name : selectedAssembly ? selectedAssembly.name : machine.name}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted"><img className="h-full w-full object-contain" src={selectedImage} alt={selectedImageLabel} /></div>{selectedPart ? <><p className="text-sm text-muted-foreground">Part number</p><p className="text-lg font-semibold">{selectedPart.partNumber}</p><p className="text-sm text-muted-foreground">{selectedPart.description}</p><div className="flex flex-wrap gap-2"><Badge variant="secondary">{selectedPart.availability}</Badge><Badge variant="outline">Lead time: {selectedPart.leadTime}</Badge></div><div className="flex flex-wrap gap-2"><Button onClick={() => handleAddPart(selectedPart.id)}><ShoppingCart className="mr-2 size-4" />{addedPart === selectedPart.id ? "Added to cart" : "Add to cart"}</Button><Button variant="outline" onClick={() => onRequestSupport({ site: machine.site, machineId: machine.id, assemblyId: selectedAssemblyId, partId: selectedPart.id })}>Request support</Button></div></> : <><p className="text-sm text-muted-foreground">Select an assembly or part to inspect its details and related documents.</p><Button variant="outline" onClick={() => onRequestSupport({ site: machine.site, machineId: machine.id, assemblyId: selectedAssemblyId })}>Request support</Button></>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Documents for this level</CardTitle></CardHeader><CardContent className="space-y-3">{currentDocuments.length ? currentDocuments.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 border p-3"><div className="flex items-start gap-3"><FileText className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-medium">{document.title}</p><p className="text-xs text-muted-foreground">{document.documentId} · {document.type} · {document.status}</p></div></div>{document.pdfPath && <Button asChild variant="outline" size="sm"><a href={document.pdfPath} download><Download className="mr-2 size-3" />PDF</a></Button>}</div>) : <p className="text-sm text-muted-foreground">No documents are available for this level.</p>}</CardContent></Card>
        </div>
      </div>
    </section>
  );
}
