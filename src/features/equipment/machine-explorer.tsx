import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentImagePlaceholder } from "@/components/shared/equipment-image-placeholder";
import { assemblies, documents, machines, parts } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { useActionFeedback } from "@/components/shared/action-feedback";
import {
  getAssemblyDocuments,
  getEquipmentBreadcrumbs,
  getEquipmentTree,
  getMachineDocuments,
  getPartDocuments,
  getPartCompatibility,
  type EquipmentTreeNode,
} from "@/lib/portal-logic";

interface MachineExplorerProps {
  machineId: string;
  hierarchyContext?: string[];
  initialAssemblyId?: string;
  initialPartId?: string;
  onBack: () => void;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}

function EquipmentTreeBranch({
  node,
  selectedAssemblyId,
  selectedPartId,
  onSelectAssembly,
  onSelectPart,
}: {
  node: EquipmentTreeNode;
  selectedAssemblyId?: string;
  selectedPartId?: string;
  onSelectAssembly: (assemblyId: string) => void;
  onSelectPart: (partId: string, assemblyId: string) => void;
}) {
  const isPart = node.type === "part";
  const selected = isPart ? selectedPartId === node.id : selectedAssemblyId === node.id;

  return (
    <div className="space-y-2">
      <button
        className={`flex w-full items-center gap-2 border px-3 py-2 text-left text-sm hover:bg-accent ${selected ? "bg-accent" : ""} ${isPart ? "font-normal" : "font-medium"}`}
        onClick={() => isPart ? onSelectPart(node.id, node.parentAssemblyId ?? "") : onSelectAssembly(node.id)}
      >
        <span className="min-w-0 flex-1">{node.label}</span>
        {node.pictureNumber && <EquipmentImagePlaceholder pictureNumber={node.pictureNumber} description={node.label} className="h-10 w-14 min-h-0 shrink-0 p-1" />}
      </button>
      {node.children.length > 0 && (
        <div className="ml-4 space-y-2 border-l pl-3">
          {node.children.map((child) => (
            <EquipmentTreeBranch
              key={child.id}
              node={child}
              selectedAssemblyId={selectedAssemblyId}
              selectedPartId={selectedPartId}
              onSelectAssembly={onSelectAssembly}
              onSelectPart={onSelectPart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MachineExplorer({
  machineId,
  hierarchyContext = [],
  initialAssemblyId,
  initialPartId,
  onBack,
  onRequestSupport,
}: MachineExplorerProps) {
  const machine = machines.find((candidate) => candidate.id === machineId) ?? machines[0];
  const tree = useMemo(() => getEquipmentTree(machine, assemblies, parts), [machine]);
  const machineAssemblies = useMemo(
    () => assemblies
      .filter((assembly) => assembly.machineId === machine.id)
      .sort((first, second) => (first.name ?? "").localeCompare(second.name ?? "")),
    [machine.id],
  );

  const { addToCart } = useTransaction();
  const { showFeedback } = useActionFeedback();
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | undefined>(initialAssemblyId);
  const [selectedPartId, setSelectedPartId] = useState<string | undefined>(initialPartId);
  const [addedPart, setAddedPart] = useState<string | undefined>();

  const selectedAssembly = assemblies.find((assembly) => assembly.id === selectedAssemblyId);
  const selectedPart = parts.find((part) => part.id === selectedPartId);
  const currentDocuments = selectedPart
    ? getPartDocuments(selectedPart, documents)
    : selectedAssembly
      ? getAssemblyDocuments(selectedAssembly, documents)
      : getMachineDocuments(machine, documents);
  const equipmentBreadcrumbs = getEquipmentBreadcrumbs(machine, selectedAssembly, selectedPart).slice(1);
  const breadcrumbs = [...hierarchyContext.map((label) => ({ label, href: "" })), ...equipmentBreadcrumbs];

  function selectAssembly(id: string) {
    setSelectedAssemblyId(id);
    setSelectedPartId(undefined);
  }

  function selectPart(id: string, assemblyId: string) {
    setSelectedAssemblyId(assemblyId);
    setSelectedPartId(id);
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
    showFeedback({ itemName: part.name, destination: "cart" });
  }

  return (
    <section className="space-y-6">
      <div>
        <Button variant="ghost" className="mb-2 -ml-3" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          {hierarchyContext.length ? "Back to line" : "Back to My Plant"}
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="hidden size-16 shrink-0 overflow-hidden rounded-md border bg-muted sm:block">
              {machine.pictureNumber ? (
                <span className="flex h-full items-center justify-center text-xs font-medium">Image {machine.pictureNumber}</span>
              ) : (
                <img className="h-full w-full object-contain" src={machine.imageUrl} alt={machine.name} />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{machine.name}</h1>
              <p className="text-muted-foreground">{machine.model} · {machine.serialNumber} · {machine.site}</p>
            </div>
          </div>
          <Badge variant="secondary">{machine.configuration}</Badge>
        </div>
      </div>

      <nav aria-label="Equipment breadcrumbs" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((breadcrumb, index) => (
          <span key={`${breadcrumb.label}-${index}`}>
            {index > 0 && " / "}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{breadcrumb.label}</span>
            ) : (
              <span>{breadcrumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {selectedAssembly?.level === "Equipment" && (
        <div className="flex gap-2">
          <Badge variant="outline">Level: Equipment</Badge>
          {selectedAssembly.equipmentType && <Badge variant="outline">{selectedAssembly.equipmentType}</Badge>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-6">
          <Card className="bg-action-panel-color">
            <CardHeader><CardTitle>Installed equipment tree</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tree.children.map((node) => (
                <EquipmentTreeBranch
                  key={node.id}
                  node={node}
                  selectedAssemblyId={selectedAssemblyId}
                  selectedPartId={selectedPartId}
                  onSelectAssembly={selectAssembly}
                  onSelectPart={selectPart}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attached equipment</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border-b px-3 py-2 font-semibold">Object ID</th>
                    <th className="border-b px-3 py-2 font-semibold">Description</th>
                    <th className="border-b px-3 py-2 font-semibold">Type</th>
                    <th className="border-b px-3 py-2 font-semibold">Serial</th>
                  </tr>
                </thead>
                <tbody>
                  {machineAssemblies.length ? machineAssemblies.map((assembly) => (
                    <tr key={assembly.id} className="border-b last:border-b-0 hover:bg-accent/50">
                      <td className="px-3 py-2 font-medium">{assembly.objectId ?? "—"}</td>
                      <td className="px-3 py-2">{assembly.name}</td>
                      <td className="px-3 py-2">{assembly.equipmentType ?? "Assembly"}</td>
                      <td className="px-3 py-2">{assembly.serialNumber ?? "—"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-muted-foreground">No attached equipment is configured for this machine.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{selectedPart ? selectedPart.name : selectedAssembly ? selectedAssembly.name : machine.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPart ? (
                <>
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                    <img className="h-full w-full object-contain" src={selectedPart.imageUrl} alt={selectedPart.name} />
                  </div>
                  <p className="text-sm text-muted-foreground">Part number</p>
                  <p className="text-lg font-semibold">{selectedPart.partNumber}</p>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selectedPart.availability}</Badge>
                    <Badge variant="outline">Lead time: {selectedPart.leadTime}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleAddPart(selectedPart.id)}>
                      <ShoppingCart className="mr-2 size-4" />
                      {addedPart === selectedPart.id ? "Added to cart" : "Add to cart"}
                    </Button>
                    <Button variant="outline" onClick={() => onRequestSupport({ site: machine.site, machineId: machine.id, assemblyId: selectedAssemblyId, partId: selectedPart.id })}>
                      Request support
                    </Button>
                  </div>
                </>
              ) : selectedAssembly ? (
                <>
                  <p className="text-sm text-muted-foreground">{selectedAssembly.description}</p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Equipment type", selectedAssembly.equipmentType],
                      ["Object ID", selectedAssembly.objectId],
                      ["Serial number", selectedAssembly.serialNumber],
                      ["Manufactured date", selectedAssembly.manufacturedDate],
                      ["Installation date", selectedAssembly.installationDate],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Button variant="outline" onClick={() => onRequestSupport({ site: machine.site, machineId: machine.id, assemblyId: selectedAssemblyId })}>
                    Request support
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{machine.configuration}</p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Equipment type", machine.equipmentType],
                      ["Object ID", machine.objectId],
                      ["Serial number", machine.serialNumber],
                      ["Manufactured date", machine.manufacturedDate],
                      ["Installation date", machine.installationDate],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-sm text-muted-foreground">Select a section frame, mechanism, or part in the installed equipment tree.</p>
                  <Button variant="outline" onClick={() => onRequestSupport({ site: machine.site, machineId: machine.id })}>
                    Request support
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Documents for this level</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {currentDocuments.length ? currentDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 border p-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{document.title}</p>
                      <p className="text-xs text-muted-foreground">{document.documentId} · {document.type} · {document.status}</p>
                    </div>
                  </div>
                  {document.pdfPath && (
                    <Button asChild variant="outline" size="sm">
                      <a href={document.pdfPath} download>
                        <Download className="mr-2 size-3" />
                        PDF
                      </a>
                    </Button>
                  )}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No documents are available for this level.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
