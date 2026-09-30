import { useEffect, useRef, useState, type UIEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Cog, Download, Factory, FileText, Flame, LayoutGrid, ListTree, MapPin, Minus, Plus, Rows3, Search, ShoppingCart, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EquipmentImagePlaceholder } from "@/components/shared/equipment-image-placeholder";
import { plants, type FurnaceRecord, type PlantEquipmentRecord, type PlantRecord, type ProductionLineRecord } from "@/data/plant-hierarchy";
import { assemblies, documents, machines, parts } from "@/data/portal-data";
import type { AssemblyRecord, DocumentRecord, PartRecord } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { useActionFeedback } from "@/components/shared/action-feedback";
import { getOrderability, getPartCompatibility } from "@/lib/portal-logic";

type PlantViewMode = "tiles" | "tree";
type PlantTileLevel = "plant" | "furnace" | "line" | "machine" | "equipment";
type PlantTreeKind = "plant" | "furnace" | "line" | "machine" | "equipment" | "assembly" | "part";

interface PlantTreeNode {
  id: string;
  kind: PlantTreeKind;
  label: string;
  detail?: string;
  equipmentType?: string;
  path: string[];
  plantId: string;
  furnaceId?: string;
  lineId?: string;
  machineId?: string;
  assemblyId?: string;
  partId?: string;
  equipment?: PlantEquipmentRecord;
  pictureNumber?: number;
  children: PlantTreeNode[];
}

function buildAssemblyTree(machineId: string, path: string[], plantId: string, furnaceId: string, lineId: string, parentAssemblyId?: string): PlantTreeNode[] {
  const machineAssemblies = assemblies.filter((assembly) => assembly.machineId === machineId && assembly.parentAssemblyId === parentAssemblyId);

  return machineAssemblies.map((assembly) => buildAssemblyNode(assembly, machineId, path, plantId, furnaceId, lineId));
}

function buildAssemblyNode(assembly: AssemblyRecord, machineId: string, parentPath: string[], plantId: string, furnaceId: string, lineId: string): PlantTreeNode {
  const path = [...parentPath, assembly.name];
  const childAssemblies = assemblies.filter((candidate) => candidate.parentAssemblyId === assembly.id);
  const assemblyParts = parts.filter((part) => part.assemblyId === assembly.id);

  return {
    id: assembly.id,
    kind: assembly.level === "Equipment" ? "equipment" : "assembly",
    label: assembly.name,
    detail: [assembly.objectId, assembly.serialNumber].filter(Boolean).join(" · "),
    equipmentType: assembly.equipmentType,
    path,
    plantId,
    furnaceId,
    lineId,
    machineId,
    assemblyId: assembly.id,
    pictureNumber: assembly.pictureNumber,
    children: assembly.equipmentType ? [] : [
      ...childAssemblies.map((child) => buildAssemblyNode(child, machineId, path, plantId, furnaceId, lineId)),
      ...assemblyParts.map((part) => buildPartNode(part, machineId, assembly.id, path, plantId, furnaceId, lineId)),
    ],
  };
}

function buildPartNode(part: PartRecord, machineId: string, assemblyId: string, parentPath: string[], plantId: string, furnaceId: string, lineId: string): PlantTreeNode {
  return {
    id: part.id,
    kind: "part",
    label: `${part.partNumber} · ${part.name}`,
    detail: part.category,
    path: [...parentPath, part.name],
    plantId,
    furnaceId,
    lineId,
    machineId,
    assemblyId,
    partId: part.id,
    children: [],
  };
}

function buildPlantTree(plantRecords: PlantRecord[]): PlantTreeNode[] {
  return plantRecords.map((plant) => {
    const plantPath = [plant.name];
    return {
      id: plant.id,
      kind: "plant",
      label: plant.name,
      detail: plant.location,
      path: plantPath,
      plantId: plant.id,
      children: plant.furnaces.map((furnace) => {
        const furnacePath = [...plantPath, furnace.name];
        return {
          id: furnace.id,
          kind: "furnace" as const,
          label: furnace.name,
          detail: `${furnace.lines.length} lines`,
          path: furnacePath,
          plantId: plant.id,
          furnaceId: furnace.id,
          children: furnace.lines.map((line) => {
            const linePath = [...furnacePath, line.name];
            return {
              id: line.id,
              kind: "line" as const,
              label: line.name,
              detail: `${line.equipment.length} equipment records`,
              path: linePath,
              plantId: plant.id,
              furnaceId: furnace.id,
              lineId: line.id,
              children: line.equipment.map((equipment) => {
                const equipmentPath = [...linePath, equipment.description];
                return {
                  id: equipment.id,
                  kind: equipment.equipmentType === "Machine" ? "machine" as const : "equipment" as const,
                  label: equipment.description,
                  detail: [equipment.objectId, equipment.serialNumber, equipment.equipmentType].join(" · "),
                  equipmentType: equipment.equipmentType,
                  path: equipmentPath,
                  plantId: plant.id,
                  furnaceId: furnace.id,
                  lineId: line.id,
                  machineId: equipment.machineId,
                  pictureNumber: equipment.pictureNumber,
                  equipment,
                  children: equipment.machineId ? buildAssemblyTree(equipment.machineId, equipmentPath, plant.id, furnace.id, line.id) : [],
                };
              }),
            };
          }),
        };
      }),
    };
  });
}

function filterTree(nodes: PlantTreeNode[], query: string): PlantTreeNode[] {
  if (!query) return nodes;
  return nodes.flatMap((node) => {
    const children = filterTree(node.children, query);
    const matches = `${node.label} ${node.detail ?? ""}`.toLowerCase().includes(query);
    return matches || children.length ? [{ ...node, children }] : [];
  });
}

function findTreeMatches(nodes: PlantTreeNode[], query: string): PlantTreeNode[] {
  if (!query) return [];
  return nodes.flatMap((node) => {
    const matches = `${node.label} ${node.detail ?? ""}`.toLowerCase().includes(query);
    return [...(matches ? [node] : []), ...findTreeMatches(node.children, query)];
  });
}

function flattenTreeNodes(nodes: PlantTreeNode[]): PlantTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTreeNodes(node.children)]);
}

function groupEquipmentNodes(nodes: PlantTreeNode[]): Array<{ label: string; nodes: PlantTreeNode[] }> {
  const groups = new Map<string, PlantTreeNode[]>();
  for (const node of nodes) {
    const label = getTreeGroupLabel("machine", node);
    groups.set(label, [...(groups.get(label) ?? []), node]);
  }
  return Array.from(groups, ([label, groupedNodes]) => ({ label, nodes: groupedNodes }));
}

function findTreeNode(nodes: PlantTreeNode[], id: string): PlantTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findTreeNode(node.children, id);
    if (child) return child;
  }
  return undefined;
}

const TREE_EXPANSION_LEVELS: Record<PlantTileLevel, PlantTreeKind[]> = {
  plant: [],
  furnace: ["plant"],
  line: ["plant", "furnace"],
  machine: ["plant", "furnace", "line"],
  equipment: ["plant", "furnace", "line", "machine"],
};

function getExpandedIdsForLevel(nodes: PlantTreeNode[], level: PlantTileLevel): Set<string> {
  const expandableKinds = new Set(TREE_EXPANSION_LEVELS[level]);
  return new Set(flattenTreeNodes(nodes)
    .filter((node) => expandableKinds.has(node.kind) && node.children.length > 0)
    .map((node) => node.id));
}

function getDeepestExpandedLevel(nodes: PlantTreeNode[], expandedIds: Set<string>): PlantTileLevel {
  const levelByKind: Partial<Record<PlantTreeKind, PlantTileLevel>> = {
    plant: "furnace",
    furnace: "line",
    line: "machine",
    machine: "equipment",
  };
  const levelOrder: PlantTileLevel[] = ["plant", "furnace", "line", "machine", "equipment"];
  let deepestLevel: PlantTileLevel = "plant";

  for (const node of flattenTreeNodes(nodes)) {
    const nodeLevel = expandedIds.has(node.id) ? levelByKind[node.kind] : undefined;
    if (nodeLevel && levelOrder.indexOf(nodeLevel) > levelOrder.indexOf(deepestLevel)) deepestLevel = nodeLevel;
  }

  return deepestLevel;
}

function getTreeGroupLabel(parentKind: PlantTreeKind, node: PlantTreeNode): string {
  if (parentKind === "plant") return "Furnaces";
  if (parentKind === "furnace") return "Lines";
  if (parentKind === "line") return node.kind === "machine" ? "Machines" : "Other Line Equipment";
  if (node.kind === "part") return "Parts";
  if (node.equipmentType === "Section Frame") return "Section Frames";
  if (node.equipmentType === "Section Frame Mechanism") return "Section Frame Mechanisms";
  if (node.kind === "equipment") return "Other Equipment";
  if (node.kind === "assembly") return "Assemblies";
  return node.kind[0].toUpperCase() + node.kind.slice(1);
}

function groupTreeChildren(parent: PlantTreeNode): Array<{ label: string; nodes: PlantTreeNode[] }> {
  const groups = new Map<string, PlantTreeNode[]>();
  for (const child of parent.children) {
    const label = getTreeGroupLabel(parent.kind, child);
    groups.set(label, [...(groups.get(label) ?? []), child]);
  }
  return Array.from(groups, ([label, nodes]) => ({ label, nodes }));
}

function getPlantNodeDocuments(node: PlantTreeNode, documentRecords: DocumentRecord[]): DocumentRecord[] {
  const machineIds = new Set<string>();
  const assemblyIds = new Set<string>();
  const partIds = new Set<string>();

  if (node.machineId) machineIds.add(node.machineId);
  if (node.equipment?.machineId) machineIds.add(node.equipment.machineId);
  if (node.assemblyId) assemblyIds.add(node.assemblyId);
  if (node.partId) partIds.add(node.partId);

  let parentAssemblyId = node.assemblyId ?? (node.partId ? parts.find((part) => part.id === node.partId)?.assemblyId : undefined);
  while (parentAssemblyId) {
    assemblyIds.add(parentAssemblyId);
    parentAssemblyId = assemblies.find((assembly) => assembly.id === parentAssemblyId)?.parentAssemblyId;
  }

  return documentRecords.filter((document) =>
    document.relatedMachineIds.some((id) => machineIds.has(id))
    || document.relatedAssemblyIds.some((id) => assemblyIds.has(id))
    || document.relatedPartIds.some((id) => partIds.has(id)),
  );
}

function getDemoStockCount(itemId: string): number {
  return [...itemId].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 10, 7);
}

function getDemoPreviousSerial(serialNumber?: string): string | undefined {
  if (!serialNumber) return undefined;
  const lastDigitMatch = serialNumber.match(/\d(?=\D*$)/);
  if (!lastDigitMatch || lastDigitMatch.index === undefined) return `${serialNumber}-OLD`;
  const oldDigit = (Number(lastDigitMatch[0]) + 1) % 10;
  return `${serialNumber.slice(0, lastDigitMatch.index)}${oldDigit}${serialNumber.slice(lastDigitMatch.index + 1)}`;
}

function isPlantNodeInCart(node: PlantTreeNode, cart: ReturnType<typeof useTransaction>["cart"]): boolean {
  if (node.partId) return cart.some((item) => item.type === "part" && item.partId === node.partId);
  const installedEquipmentId = node.assemblyId ?? node.equipment?.id ?? node.machineId ?? node.id;
  return cart.some((item) => item.type === "equipment" && item.installedEquipmentId === installedEquipmentId);
}

function PlantTreeDetails({ node, onAddPart, onAddEquipment, onRequestSupport }: {
  node?: PlantTreeNode;
  onAddPart: (node: PlantTreeNode, quantity: number) => void;
  onAddEquipment: (node: PlantTreeNode) => void;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const { cart } = useTransaction();
  useEffect(() => setQuantity(1), [node?.id]);

  if (!node) {
    return <Card className="h-fit"><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Select an item in the tree to view its details here.</p></CardContent></Card>;
  }

  const plant = plants.find((candidate) => candidate.id === node.plantId);
  const furnace = plant?.furnaces.find((candidate) => candidate.id === node.furnaceId);
  const line = furnace?.lines.find((candidate) => candidate.id === node.lineId);
  const machine = node.machineId ? machines.find((candidate) => candidate.id === node.machineId) : undefined;
  const assembly = node.assemblyId ? assemblies.find((candidate) => candidate.id === node.assemblyId) : undefined;
  const part = node.partId ? parts.find((candidate) => candidate.id === node.partId) : undefined;
  const equipment = node.equipment;
  const displayedSerialNumber = part ? undefined : assembly?.serialNumber ?? equipment?.serialNumber ?? machine?.serialNumber;
  const previousSerialNumber = getDemoPreviousSerial(displayedSerialNumber);
  const cartItemAdded = cart.some((item) => part
    ? item.type === "part" && item.partId === part.id
    : item.type === "equipment" && item.installedEquipmentId === (node.assemblyId ?? equipment?.id ?? node.machineId ?? node.id));
  const itemId = part?.id ?? node.assemblyId ?? equipment?.id ?? node.machineId ?? node.id;
  const availableCount = getDemoStockCount(itemId);
  const compatibleMachines = part
    ? part.compatibleMachineIds.map((id) => machines.find((candidate) => candidate.id === id)).filter((candidate): candidate is (typeof machines)[number] => Boolean(candidate))
    : machine ? [machine] : [];
  const supportMachineId = node.machineId ?? equipment?.machineId;
  const supportSite = supportMachineId ? machines.find((candidate) => candidate.id === supportMachineId)?.site ?? plant?.name ?? "" : plant?.name ?? "";
  const nodeDocuments = getPlantNodeDocuments(node, documents);

  return (
    <div className="space-y-4">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-start justify-between gap-3"><CardTitle className="text-base">{node.label}</CardTitle><Badge variant="outline">{node.kind === "equipment" ? "Equipment" : node.kind[0].toUpperCase() + node.kind.slice(1)}</Badge></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(node.kind === "machine" || node.kind === "equipment" || node.kind === "assembly") && node.pictureNumber && <EquipmentImagePlaceholder pictureNumber={node.pictureNumber} description={node.label} className="h-48 w-full" />}
          {node.kind === "plant" && <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{plant?.location}</dd></div><div><dt className="text-muted-foreground">Furnaces</dt><dd className="font-medium">{plant?.furnaces.length ?? 0}</dd></div></dl>}
          {node.kind === "furnace" && <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Plant</dt><dd className="font-medium">{plant?.name}</dd></div><div><dt className="text-muted-foreground">Lines</dt><dd className="font-medium">{furnace?.lines.length ?? 0}</dd></div></dl>}
          {node.kind === "line" && <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Furnace</dt><dd className="font-medium">{furnace?.name}</dd></div><div><dt className="text-muted-foreground">Machines</dt><dd className="font-medium">{line?.equipment.filter((item) => item.equipmentType === "Machine").length ?? 0}</dd></div><div><dt className="text-muted-foreground">Other equipment</dt><dd className="font-medium">{line?.equipment.filter((item) => item.equipmentType !== "Machine").length ?? 0}</dd></div></dl>}
          {equipment && <dl className="grid grid-cols-2 gap-3 text-sm">{[["Object ID", equipment.objectId], ["Equipment type", equipment.equipmentType], ["Serial number", equipment.serialNumber], ["Manufactured date", equipment.manufacturedDate], ["Installation date", equipment.installationDate]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>}
          {machine && <p className="text-sm">{machine.model} · {machine.serialNumber}</p>}
          {assembly && <><p className="text-sm text-muted-foreground">{assembly.description}</p><dl className="grid grid-cols-2 gap-3 text-sm">{[["Equipment type", assembly.equipmentType], ["Object ID", assembly.objectId], ["Serial number", assembly.serialNumber], ["Manufactured date", assembly.manufacturedDate]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></>}
          {(node.kind === "machine" || node.kind === "equipment" || node.kind === "assembly") && !part && <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="font-medium text-muted-foreground">Compatible with</dt><dd className="font-medium">{compatibleMachines.length ? compatibleMachines.map((candidate) => candidate.name).join(", ") : "Parent machine / line equipment"}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Estimated delivery</dt><dd className="font-medium">{availableCount > 0 ? "4–6 weeks" : "Unavailable"}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Available now</dt><dd className={`font-medium ${availableCount >= 1 && availableCount <= 9 ? "text-green-700" : ""}`}>{availableCount} units</dd></div>
            <div><dt className="font-medium text-muted-foreground">Price</dt><dd className="font-medium">EUR 1,250</dd></div>
            {displayedSerialNumber && previousSerialNumber && <div className="col-span-2 border-t pt-2"><dt className="font-medium text-muted-foreground">Serial number change</dt><dd className="font-medium">{previousSerialNumber} <ArrowRight className="mx-1 inline size-3" /> {displayedSerialNumber}</dd></div>}
            {cartItemAdded && <div className="col-span-2"><Badge variant="secondary">Already in cart</Badge></div>}
          </dl>}
          {part && <>
            <div className="aspect-[16/9] overflow-hidden border bg-muted"><img src={part.imageUrl} alt={part.name} className="h-full w-full object-contain" /></div>
            <p className="text-sm text-muted-foreground">Part number</p>
            <p className="font-semibold">{part.partNumber}</p>
            <p className="text-sm text-muted-foreground">{part.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="font-medium text-muted-foreground">Availability</dt><dd className="font-medium">{part.availability}</dd></div>
              <div><dt className="font-medium text-muted-foreground">Compatible with</dt><dd className="font-medium">{compatibleMachines.length ? compatibleMachines.map((candidate) => candidate.name).join(", ") : "No compatible machines listed"}</dd></div>
              <div><dt className="font-medium text-muted-foreground">Estimated delivery</dt><dd className="font-medium">{part.leadTime}</dd></div>
              <div><dt className="font-medium text-muted-foreground">Available now</dt><dd className={`font-medium ${availableCount >= 1 && availableCount <= 9 ? "text-green-700" : ""}`}>{availableCount} units</dd></div>
              <div><dt className="font-medium text-muted-foreground">Price</dt><dd className="font-medium">{part.currency} {part.unitPrice.toLocaleString()} / unit</dd></div>
            </dl>
            {cartItemAdded && <Badge variant="secondary">Already in cart</Badge>}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Qty</span>
                <Button type="button" variant="outline" size="icon" className="size-8" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}><Minus className="size-3" /></Button>
                <span className="w-6 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
                <Button type="button" variant="outline" size="icon" className="size-8" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(availableCount, value + 1))} disabled={quantity >= availableCount}><Plus className="size-3" /></Button>
              </div>
              <Button variant="outline" onClick={() => supportMachineId && onRequestSupport({ site: supportSite, machineId: supportMachineId, assemblyId: node.assemblyId, partId: part.id })}>Request support</Button>
              <Button className="ml-auto" onClick={() => onAddPart(node, quantity)} disabled={availableCount === 0 || getOrderability(part) === "unavailable"}><ShoppingCart className="mr-2 size-4" />{cartItemAdded ? "Add another" : "Add to cart"}</Button>
            </div>
          </>}
          {(node.kind === "machine" || node.kind === "equipment" || node.kind === "assembly") && !part && (
            <div className="flex w-full flex-wrap gap-2">
              {supportMachineId && <Button variant="outline" onClick={() => onRequestSupport({ site: supportSite, machineId: supportMachineId, assemblyId: node.assemblyId })}>Request support</Button>}
              <Button className="ml-auto" onClick={() => onAddEquipment(node)} disabled={availableCount === 0}><ShoppingCart className="mr-2 size-4" />{cartItemAdded ? "Add another" : "Add to Cart"}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Documentation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {nodeDocuments.length ? nodeDocuments.map((document) => {
            const filePath = document.pdfPath ?? document.contentPath;
            return (
              <article key={document.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{document.title}</p>
                    <p className="text-xs text-muted-foreground">{document.documentId} · {document.type}{document.revision ? ` · ${document.revision}` : ""}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{document.summary}</p>
                  </div>
                </div>
                <Button asChild type="button" size="icon" variant="ghost" className="size-8 shrink-0" aria-label={`${document.pdfPath ? "Download" : "Open"} ${document.title}`} title={`${document.pdfPath ? "Download" : "Open"} ${document.title}`}>
                  <a href={filePath} target={document.pdfPath ? undefined : "_blank"} rel={document.pdfPath ? undefined : "noreferrer"} download={document.pdfPath ? true : undefined}>
                    <Download className="size-4" />
                  </a>
                </Button>
              </article>
            );
          }) : <p className="text-sm text-muted-foreground">No documents are linked to this item.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function PlantTreeBranch({ node, depth, query, expandedIds, activeId, cart, onToggle, onSelect }: {
  node: PlantTreeNode;
  depth: number;
  query: string;
  expandedIds: Set<string>;
  activeId?: string;
  cart: ReturnType<typeof useTransaction>["cart"];
  onToggle: (id: string) => void;
  onSelect: (node: PlantTreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const listChildrenInline = node.kind === "assembly";
  const expanded = listChildrenInline || expandedIds.has(node.id) || Boolean(query && hasChildren);
  const canToggle = hasChildren && !listChildrenInline;
  const childGroups = groupTreeChildren(node);

  return (
    <div>
      <div className={`flex min-h-10 items-center gap-2 border-b px-2 ${activeId === node.id ? "bg-accent" : "hover:bg-accent/50"}`} style={{ paddingLeft: `${depth * 22 + 8}px` }}>
        {canToggle ? <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={expanded} onClick={() => onToggle(node.id)}>{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</Button> : <span className="size-7 shrink-0" />}
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left" onClick={() => onSelect(node)}>
          {node.pictureNumber && <EquipmentImagePlaceholder pictureNumber={node.pictureNumber} description={node.label} className="h-10 w-14 min-h-0 shrink-0 p-1" />}
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{node.label}</span>{node.detail && <span className="block truncate text-xs text-muted-foreground">{node.detail}</span>}</span>
          {isPlantNodeInCart(node, cart) && <Badge variant="secondary" className="shrink-0">Already in cart</Badge>}
        </button>
      </div>
      {hasChildren && expanded && <div>{childGroups.map((group) => <section key={`${node.id}-${group.label}`}><div data-tree-level data-level-label={`${node.path.join(" / ")} / ${group.label}`} className="flex items-center gap-2 px-2 py-2" style={{ paddingLeft: `${(depth + 1) * 22 + 8}px` }}><span className="h-px min-w-4 flex-1 bg-border" /><span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">{group.label} · {group.nodes.length}</span><span className="h-px min-w-4 flex-1 bg-border" /></div>{group.nodes.map((child) => <PlantTreeBranch key={child.id} node={child} depth={depth + 1} query={query} expandedIds={expandedIds} activeId={activeId} cart={cart} onToggle={onToggle} onSelect={onSelect} />)}</section>)}</div>}
    </div>
  );
}

interface MyPlantProps {
  accountId: string;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}

export function MyPlant({ accountId, onRequestSupport }: MyPlantProps) {
  const [viewMode, setViewMode] = useState<PlantViewMode>("tiles");
  const [tileBrowseLevel, setTileBrowseLevel] = useState<PlantTileLevel>("plant");
  const [treeQuery, setTreeQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [activeTreeNodeId, setActiveTreeNodeId] = useState<string>();
  const [currentTreePath, setCurrentTreePath] = useState("My Plant");
  const [treeHasScrolled, setTreeHasScrolled] = useState(false);
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const treeHeaderRef = useRef<HTMLDivElement>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string>();
  const [selectedFurnaceId, setSelectedFurnaceId] = useState<string>();
  const [selectedLineId, setSelectedLineId] = useState<string>();
  const [selectedMachineId, setSelectedMachineId] = useState<string>();
  const [equipmentScopeMachineId, setEquipmentScopeMachineId] = useState<string>();
  const [selectedMachineAssemblyId, setSelectedMachineAssemblyId] = useState<string>();
  const [selectedTileEquipmentId, setSelectedTileEquipmentId] = useState<string>();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>();
  const tenantPlants = plants.filter((plant) => plant.accountId === accountId);
  const selectedPlant = tenantPlants.find((plant) => plant.id === selectedPlantId);
  const selectedFurnace = selectedPlant?.furnaces.find((furnace) => furnace.id === selectedFurnaceId);
  const selectedLine = selectedFurnace?.lines.find((line) => line.id === selectedLineId);
  const allTreeNodes = buildPlantTree(tenantPlants);
  const normalizedQuery = treeQuery.trim().toLowerCase();
  const treeNodes = filterTree(allTreeNodes, normalizedQuery);
  const tileSearchResults = findTreeMatches(allTreeNodes, normalizedQuery);
  const currentTreeBrowseLevel = getDeepestExpandedLevel(allTreeNodes, expandedIds);
  const selectedTreeNode = activeTreeNodeId ? findTreeNode(allTreeNodes, activeTreeNodeId) : undefined;
  const tileLevelForTreeNode = (node: PlantTreeNode): PlantTileLevel => {
    if (node.kind === "plant") return "furnace";
    if (node.kind === "furnace") return "line";
    if (node.kind === "line") return "machine";
    if (node.kind === "machine") return "equipment";
    return "equipment";
  };
  const selectedPlantTreeNode = selectedPlant ? allTreeNodes.find((node) => node.id === selectedPlant.id) : undefined;
  const plantDescendantNodes = selectedPlantTreeNode ? flattenTreeNodes(selectedPlantTreeNode.children) : [];
  const tileFurnaces = selectedPlant?.furnaces ?? [];
  const tileLines = selectedFurnace?.lines ?? selectedPlant?.furnaces.flatMap((furnace) => furnace.lines) ?? [];
  const selectedLineTreeNode = selectedLine ? findTreeNode(plantDescendantNodes, selectedLine.id) : undefined;
  const tileMachineNodes = selectedLineTreeNode
    ? selectedLineTreeNode.children.filter((node) => node.kind === "machine")
    : plantDescendantNodes.filter((node) => node.kind === "machine");
  const selectedMachineNode = selectedMachineId
    ? allTreeNodes.flatMap((plant) => plant.children)
      .flatMap((furnace) => furnace.children)
      .flatMap((line) => line.children)
      .find((node) => node.kind === "machine" && node.machineId === selectedMachineId)
    : undefined;
  const equipmentScopeMachineNode = equipmentScopeMachineId
    ? allTreeNodes.flatMap((plant) => plant.children)
      .flatMap((furnace) => furnace.children)
      .flatMap((line) => line.children)
      .find((node) => node.kind === "machine" && node.machineId === equipmentScopeMachineId)
    : undefined;
  const selectedMachineAssemblyNode = selectedMachineNode && selectedMachineAssemblyId
    ? findTreeNode(selectedMachineNode.children, selectedMachineAssemblyId)
    : undefined;
  const selectedLineEquipmentNode = selectedEquipmentId ? findTreeNode(allTreeNodes, selectedEquipmentId) : undefined;
  const tileEquipmentNodes = equipmentScopeMachineNode
    ? equipmentScopeMachineNode.children.filter((node) => node.kind === "equipment" || node.kind === "assembly")
    : plantDescendantNodes.filter((node) => node.kind === "equipment");
  const tileEquipmentGroups = equipmentScopeMachineNode
    ? groupTreeChildren(equipmentScopeMachineNode)
    : groupEquipmentNodes(tileEquipmentNodes);
  const selectedTileEquipmentNode = selectedTileEquipmentId
    ? findTreeNode(allTreeNodes, selectedTileEquipmentId)
    : selectedMachineAssemblyNode ?? selectedLineEquipmentNode ?? selectedMachineNode;
  const selectedMachineRecord = selectedMachineId ? machines.find((machine) => machine.id === selectedMachineId) : undefined;
  const { addToCart, cart } = useTransaction();
  const { showFeedback } = useActionFeedback();

  function updateCurrentTreeLevel(element: HTMLDivElement) {
    const stickyHeaderBottom = element.getBoundingClientRect().top + (treeHeaderRef.current?.offsetHeight ?? 0);
    const markers = Array.from(element.querySelectorAll<HTMLElement>("[data-tree-level]"));
    let visiblePath = "My Plant";
    for (const marker of markers) {
      if (marker.getBoundingClientRect().top <= stickyHeaderBottom + 8) visiblePath = marker.dataset.levelLabel ?? visiblePath;
      else break;
    }
    setCurrentTreePath(visiblePath);
  }

  function handleTreeScroll(event: UIEvent<HTMLDivElement>) {
    setTreeHasScrolled(event.currentTarget.scrollTop > 0);
    updateCurrentTreeLevel(event.currentTarget);
  }

  useEffect(() => {
    if (viewMode === "tree" && treeScrollRef.current) updateCurrentTreeLevel(treeScrollRef.current);
  }, [treeQuery, expandedIds, viewMode, accountId, treeHasScrolled]);

  function changeViewMode(mode: PlantViewMode) {
    if (mode === "tiles" && selectedTreeNode) {
      setSelectedPlantId(selectedTreeNode.plantId);
      setSelectedFurnaceId(selectedTreeNode.furnaceId);
      setSelectedLineId(selectedTreeNode.lineId);
      setSelectedMachineId(selectedTreeNode.machineId);
      setEquipmentScopeMachineId(selectedTreeNode.machineId);
      setSelectedMachineAssemblyId(selectedTreeNode.assemblyId);
      setSelectedTileEquipmentId(selectedTreeNode.kind === "equipment" || selectedTreeNode.kind === "assembly" || selectedTreeNode.kind === "part" ? selectedTreeNode.id : undefined);
      setSelectedEquipmentId(selectedTreeNode.equipment?.id);
      setTileBrowseLevel(tileLevelForTreeNode(selectedTreeNode));
    }
    setViewMode(mode);
  }

  function navigatePlantLevel(level: PlantTileLevel) {
    if (viewMode === "tree") {
      setTreeQuery("");
      setExpandedIds(getExpandedIdsForLevel(allTreeNodes, level));
      return;
    }

    navigateTileLevel(level);
  }

  function navigateTileLevel(level: PlantTileLevel) {
    setTileBrowseLevel(level);
    if (level === "plant") {
      setSelectedPlantId(undefined);
      setSelectedFurnaceId(undefined);
      setSelectedLineId(undefined);
      setSelectedMachineId(undefined);
      setEquipmentScopeMachineId(undefined);
      setSelectedMachineAssemblyId(undefined);
      setSelectedTileEquipmentId(undefined);
      setSelectedEquipmentId(undefined);
      return;
    }

    if (level === "furnace") {
      setSelectedFurnaceId(undefined);
      setSelectedLineId(undefined);
      setSelectedMachineId(undefined);
      setEquipmentScopeMachineId(undefined);
      setSelectedMachineAssemblyId(undefined);
      setSelectedTileEquipmentId(undefined);
      setSelectedEquipmentId(undefined);
      return;
    }

    if (level === "line") {
      setSelectedFurnaceId(undefined);
      setSelectedLineId(undefined);
      setSelectedMachineId(undefined);
      setEquipmentScopeMachineId(undefined);
      setSelectedMachineAssemblyId(undefined);
      setSelectedTileEquipmentId(undefined);
      setSelectedEquipmentId(undefined);
      return;
    }

    if (level === "machine") {
      setSelectedFurnaceId(undefined);
      setSelectedLineId(undefined);
      setSelectedMachineId(undefined);
      setEquipmentScopeMachineId(undefined);
      setSelectedMachineAssemblyId(undefined);
      setSelectedTileEquipmentId(undefined);
      setSelectedEquipmentId(undefined);
      return;
    }

    setSelectedFurnaceId(undefined);
    setSelectedLineId(undefined);
    setSelectedMachineId(undefined);
    setEquipmentScopeMachineId(undefined);
    setSelectedMachineAssemblyId(undefined);
    setSelectedTileEquipmentId(undefined);
    setSelectedEquipmentId(undefined);
  }

  function toggleTreeNode(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        const node = findTreeNode(allTreeNodes, id);
        next.delete(id);
        if (node) flattenTreeNodes(node.children).forEach((child) => next.delete(child.id));
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectTreeNode(node: PlantTreeNode) {
    setActiveTreeNodeId(node.id);
    setSelectedPlantId(node.plantId || undefined);
    setSelectedFurnaceId(node.furnaceId);
    setSelectedLineId(node.lineId);
    setSelectedEquipmentId(node.equipment?.id);
  }

  function selectHierarchySearchResult(node: PlantTreeNode) {
    setActiveTreeNodeId(node.id);
    if (viewMode === "tree") {
      selectTreeNode(node);
      return;
    }

    setSelectedPlantId(node.plantId);
    setSelectedFurnaceId(node.furnaceId);
    setSelectedLineId(node.lineId);
    setSelectedMachineId(node.machineId);
    setEquipmentScopeMachineId(node.machineId);
    setSelectedMachineAssemblyId(node.assemblyId);
    setSelectedTileEquipmentId(node.kind === "equipment" || node.kind === "assembly" || node.kind === "part" ? node.id : undefined);
    setSelectedEquipmentId(node.equipment?.id);
    setTileBrowseLevel(tileLevelForTreeNode(node));
    setTreeQuery("");
  }

  function addTreePartToCart(node: PlantTreeNode, quantity: number) {
    const part = node.partId ? parts.find((candidate) => candidate.id === node.partId) : undefined;
    const machine = node.machineId ? machines.find((candidate) => candidate.id === node.machineId) : undefined;
    if (!part || !machine) return;
    addToCart({ type: "part", partId: part.id, equipmentId: machine.id, quantity, deliveryLocation: machine.site, compatibility: getPartCompatibility(part, machine) });
    showFeedback({ itemName: `${quantity} × ${part.name}`, destination: "cart" });
  }

  function addTreeEquipmentToCart(node: PlantTreeNode) {
    const equipmentId = node.assemblyId ?? node.equipment?.id;
    if (!equipmentId) return;
    const machine = node.machineId ? machines.find((candidate) => candidate.id === node.machineId) : undefined;
    addToCart({
      type: "equipment",
      installedEquipmentId: equipmentId,
      equipmentId: node.machineId,
      quantity: 1,
      deliveryLocation: machine?.site ?? plants.find((candidate) => candidate.id === node.plantId)?.name,
      compatibility: "compatible",
    });
    showFeedback({ itemName: node.label, destination: "cart" });
  }

  function openPlant(plant: PlantRecord) {
    setSelectedPlantId(plant.id);
    setSelectedFurnaceId(undefined);
    setSelectedLineId(undefined);
    setSelectedMachineId(undefined);
    setEquipmentScopeMachineId(undefined);
    setSelectedMachineAssemblyId(undefined);
    setSelectedTileEquipmentId(undefined);
    setSelectedEquipmentId(undefined);
    setTileBrowseLevel("furnace");
    setActiveTreeNodeId(plant.id);
    setExpandedIds(new Set([plant.id]));
    setTreeHasScrolled(false);
  }

  function openFurnace(furnace: FurnaceRecord) {
    setSelectedFurnaceId(furnace.id);
    setSelectedLineId(undefined);
    setSelectedMachineId(undefined);
    setEquipmentScopeMachineId(undefined);
    setSelectedMachineAssemblyId(undefined);
    setSelectedTileEquipmentId(undefined);
    setSelectedEquipmentId(undefined);
    setTileBrowseLevel("line");
  }

  function openLine(line: ProductionLineRecord) {
    const parentFurnace = selectedPlant?.furnaces.find((furnace) => furnace.lines.some((candidate) => candidate.id === line.id));
    setSelectedFurnaceId(parentFurnace?.id);
    setSelectedLineId(line.id);
    setSelectedMachineId(undefined);
    setEquipmentScopeMachineId(undefined);
    setSelectedMachineAssemblyId(undefined);
    setSelectedTileEquipmentId(undefined);
    setSelectedEquipmentId(undefined);
    setTileBrowseLevel("machine");
  }

  function openMachineNode(node: PlantTreeNode) {
    if (!node.machineId) return;
    setSelectedPlantId(node.plantId);
    setSelectedFurnaceId(node.furnaceId);
    setSelectedLineId(node.lineId);
    setSelectedMachineId(node.machineId);
    setEquipmentScopeMachineId(node.machineId);
    setSelectedMachineAssemblyId(undefined);
    setSelectedTileEquipmentId(undefined);
    setSelectedEquipmentId(undefined);
    setTileBrowseLevel("equipment");
  }

  function selectTileEquipment(node: PlantTreeNode) {
    setSelectedPlantId(node.plantId);
    setSelectedFurnaceId(node.furnaceId);
    setSelectedLineId(node.lineId);
    setSelectedMachineId(node.machineId);
    setSelectedMachineAssemblyId(node.assemblyId);
    setSelectedTileEquipmentId(node.id);
    setSelectedEquipmentId(node.equipment?.id);
    setActiveTreeNodeId(node.id);
    setTileBrowseLevel("equipment");
  }

  function openEquipment(equipment: PlantEquipmentRecord) {
    if (equipment.machineId) {
      setSelectedEquipmentId(undefined);
      setSelectedMachineId(equipment.machineId);
      setEquipmentScopeMachineId(equipment.machineId);
      setSelectedMachineAssemblyId(undefined);
      setSelectedTileEquipmentId(undefined);
      setTileBrowseLevel("equipment");
      return;
    }
    setSelectedEquipmentId(equipment.id);
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">My Plant</h1>
        <div className="flex items-start gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search plant hierarchy"
              aria-controls={viewMode === "tiles" && normalizedQuery ? "plant-search-results" : undefined}
              aria-autocomplete="list"
              className="pl-9"
              placeholder="Search plants, furnaces, lines, equipment, parts..."
              value={treeQuery}
              onChange={(event) => setTreeQuery(event.target.value)}
            />
            {viewMode === "tiles" && normalizedQuery && (
              <div id="plant-search-results" className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto border bg-background shadow-lg" aria-label="Plant hierarchy search results">
                {tileSearchResults.length ? tileSearchResults.slice(0, 12).map((node) => (
                  <button type="button" key={`${node.kind}-${node.id}`} className="flex w-full items-start justify-between gap-4 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent" onClick={() => selectHierarchySearchResult(node)}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{node.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{node.path.join(" / ")}</span>
                    </span>
                    <Badge variant="outline" className="shrink-0">{node.kind === "equipment" ? "Equipment" : node.kind}</Badge>
                  </button>
                )) : <p className="px-3 py-4 text-sm text-muted-foreground">No hierarchy items match this search.</p>}
              </div>
            )}
          </div>
          <div className="inline-flex shrink-0 items-center gap-1" role="group" aria-label="Plant view">
            <Button type="button" size="icon" className="size-8" variant={viewMode === "tiles" ? "secondary" : "ghost"} aria-label="Tiles view" title="Tiles view" aria-pressed={viewMode === "tiles"} onClick={() => changeViewMode("tiles")}><LayoutGrid className="size-4" /></Button>
            <Button type="button" size="icon" className="size-8" variant={viewMode === "tree" ? "secondary" : "ghost"} aria-label="Tree view" title="Tree view" aria-pressed={viewMode === "tree"} onClick={() => changeViewMode("tree")}><ListTree className="size-4" /></Button>
          </div>
        </div>
      </header>

      {!(viewMode === "tiles" && tileBrowseLevel === "plant") && <nav aria-label="Plant levels" className="flex items-center gap-2">
        <Button type="button" size="icon" variant={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "plant" ? "secondary" : "ghost"} aria-label="Plant level" title="Plant" aria-current={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "plant" ? "step" : undefined} onClick={() => navigatePlantLevel("plant")}><Factory className="size-4" /></Button>
        <span aria-hidden="true" className="h-px w-5 bg-border" />
        <Button type="button" size="icon" variant={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "furnace" ? "secondary" : "ghost"} aria-label="Furnace level" title="Furnace" aria-current={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "furnace" ? "step" : undefined} disabled={viewMode === "tiles" && !selectedPlant} onClick={() => navigatePlantLevel("furnace")}><Flame className="size-4" /></Button>
        <span aria-hidden="true" className="h-px w-5 bg-border" />
        <Button type="button" size="icon" variant={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "line" ? "secondary" : "ghost"} aria-label="Production line level" title="Production line" aria-current={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "line" ? "step" : undefined} disabled={viewMode === "tiles" && !selectedPlant} onClick={() => navigatePlantLevel("line")}><Rows3 className="size-4" /></Button>
        <span aria-hidden="true" className="h-px w-5 bg-border" />
        <Button type="button" size="icon" variant={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "machine" ? "secondary" : "ghost"} aria-label="Machine level" title="Machine" aria-current={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "machine" ? "step" : undefined} disabled={viewMode === "tiles" && !selectedPlant} onClick={() => navigatePlantLevel("machine")}><Cog className="size-4" /></Button>
        <span aria-hidden="true" className="h-px w-5 bg-border" />
        <Button type="button" size="icon" variant={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "equipment" ? "secondary" : "ghost"} aria-label="Equipment level" title="Equipment" aria-current={(viewMode === "tiles" ? tileBrowseLevel : currentTreeBrowseLevel) === "equipment" ? "step" : undefined} disabled={viewMode === "tiles" && !selectedPlant} onClick={() => navigatePlantLevel("equipment")}><Wrench className="size-4" /></Button>
      </nav>}

      {viewMode === "tree" && <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <div ref={treeScrollRef} onScroll={handleTreeScroll} className="max-h-[calc(100vh-14rem)] min-h-0 overflow-y-auto border bg-card">
          <Card className="rounded-none border-0 shadow-none">
            {treeHasScrolled && <CardHeader ref={treeHeaderRef} className="sticky top-0 z-20 border-b bg-card py-3">
              <nav aria-label="Plant hierarchy" aria-live="polite" className="flex items-center gap-2 py-2 text-sm">
                {currentTreePath.split(" / ").map((label, index, path) => (
                  <span key={`${label}-${index}`} className="flex min-w-0 items-center gap-2">
                    {index > 0 && <span className="text-muted-foreground">/</span>}
                    <span className={`truncate ${index === path.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  </span>
                ))}
              </nav>
            </CardHeader>}
            <CardContent className="p-0">{treeNodes.length ? treeNodes.map((node) => <PlantTreeBranch key={node.id} node={node} depth={0} query={normalizedQuery} expandedIds={expandedIds} activeId={activeTreeNodeId} cart={cart} onToggle={toggleTreeNode} onSelect={selectTreeNode} />) : <p className="p-5 text-sm text-muted-foreground">No hierarchy items match this search.</p>}</CardContent>
          </Card>
        </div>
        <PlantTreeDetails node={selectedTreeNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} />
      </section>}

      {viewMode === "tiles" && selectedPlant && <nav aria-label="Plant hierarchy" className="sticky top-[5.05rem] z-20 flex items-center gap-2 border-b bg-background/95 py-2 text-sm backdrop-blur">
        <button className={!selectedPlant ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedPlantId(undefined); setSelectedFurnaceId(undefined); setSelectedLineId(undefined); setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); setSelectedEquipmentId(undefined); }}>My Plant</button>
        {selectedPlant && <><span className="text-muted-foreground">/</span><button className={!selectedFurnace ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedFurnaceId(undefined); setSelectedLineId(undefined); setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); setSelectedEquipmentId(undefined); }}>{selectedPlant.name}</button></>}
        {selectedFurnace && <><span className="text-muted-foreground">/</span><button className={!selectedLine ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedLineId(undefined); setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); setSelectedEquipmentId(undefined); }}>{selectedFurnace.name}</button></>}
        {selectedLine && <><span className="text-muted-foreground">/</span><button className={!selectedMachineId ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); }}>{selectedLine.name}</button></>}
        {selectedMachineRecord && <><span className="text-muted-foreground">/</span><span className="font-semibold">{selectedMachineRecord.name}</span></>}
      </nav>}

      {viewMode === "tiles" && tileBrowseLevel === "plant" && (
        <div className="grid gap-4 xl:grid-cols-3">
            {tenantPlants.map((plant) => <button type="button" key={plant.id} className="group overflow-hidden rounded border bg-card text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openPlant(plant)}><div className="flex h-36 items-center justify-center border-b bg-muted/40"><Factory className="size-10 text-muted-foreground" /></div><div className="space-y-4 p-5"><div><h3 className="font-semibold">{plant.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />{plant.location}</p></div><div className="flex items-center justify-between"><Badge variant="outline">{plant.furnaces.length} furnaces</Badge><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div></div></button>)}
        </div>
      )}

      {viewMode === "tiles" && tileBrowseLevel === "furnace" && selectedPlant && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-semibold">Furnaces</h2><p className="text-sm text-muted-foreground">{selectedPlant.name}</p></div>
          {tileFurnaces.length ? <div className="grid gap-3 md:grid-cols-2">{tileFurnaces.map((furnace) => <button key={furnace.id} className="flex items-center justify-between border bg-background p-5 text-left hover:bg-accent" onClick={() => openFurnace(furnace)}><span className="flex items-center gap-3"><Flame className="size-5 text-muted-foreground" /><span><span className="block font-medium">{furnace.name}</span><span className="text-sm text-muted-foreground">{furnace.lines.length} lines</span></span></span><ArrowRight className="size-4" /></button>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No furnaces are listed for this plant.</p>}
        </section>
      )}

      {viewMode === "tiles" && tileBrowseLevel === "line" && selectedPlant && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-semibold">Production lines</h2><p className="text-sm text-muted-foreground">{selectedPlant.name}{selectedFurnace ? ` · ${selectedFurnace.name}` : " · all furnaces"}</p></div>
          {tileLines.length ? <div className="grid gap-3 md:grid-cols-2">{tileLines.map((line) => <button key={line.id} className="flex items-center justify-between border bg-background p-5 text-left hover:bg-accent" onClick={() => openLine(line)}><span className="flex items-center gap-3"><Rows3 className="size-5 text-muted-foreground" /><span><span className="block font-medium">{line.name}</span><span className="text-sm text-muted-foreground">{line.equipment.filter((equipment) => equipment.equipmentType === "Machine").length} machines · {line.equipment.filter((equipment) => equipment.equipmentType !== "Machine").length} other equipment</span></span></span><ArrowRight className="size-4" /></button>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No line records are included for this plant.</p>}
        </section>
      )}

      {viewMode === "tiles" && tileBrowseLevel === "machine" && selectedPlant && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-semibold">Machines</h2><p className="text-sm text-muted-foreground">{selectedPlant.name}{selectedLine ? ` · ${selectedLine.name}` : " · all production lines"}</p></div>
          {tileMachineNodes.length ? <div className="grid gap-4 xl:grid-cols-2">{tileMachineNodes.map((machineNode) => {
            const equipment = machineNode.equipment;
            if (!equipment) return null;
            return <button type="button" key={machineNode.id} className="overflow-hidden border bg-card text-left transition-colors hover:bg-accent/50" onClick={() => openMachineNode(machineNode)}><div className="grid gap-4 p-4 sm:grid-cols-[9rem_minmax(0,1fr)]">{machineNode.pictureNumber && <EquipmentImagePlaceholder pictureNumber={machineNode.pictureNumber} description={machineNode.label} className="order-1 h-32 min-h-0" />}<div className="order-2 flex min-w-0 items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase text-muted-foreground">Machine</p><h3 className="mt-1 font-semibold">{machineNode.label}</h3><p className="mt-1 text-sm text-muted-foreground">{equipment.objectId} · {equipment.serialNumber}</p>{!selectedLine && <p className="mt-1 text-xs text-muted-foreground">{machineNode.path.slice(1, -1).join(" · ")}</p>}{isPlantNodeInCart(machineNode, cart) && <Badge variant="secondary" className="mt-2">Already in cart</Badge>}</div><ArrowRight className="size-4 shrink-0" /></div></div></button>;
          })}</div> : <p className="border p-6 text-sm text-muted-foreground">No machines are listed for this plant.</p>}
          {selectedLineEquipmentNode && <PlantTreeDetails node={selectedLineEquipmentNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} />}
        </section>
      )}

      {viewMode === "tiles" && tileBrowseLevel === "equipment" && selectedPlant && (
        <section className="space-y-5">
          <div><h2 className="text-lg font-semibold">Equipment</h2><p className="text-sm text-muted-foreground">{selectedPlant.name}{selectedMachineRecord ? ` · ${selectedMachineRecord.name}` : " · all equipment"}</p></div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
            <div className="space-y-5">
              {tileEquipmentGroups.map((group) => (
                <section key={group.label} className="space-y-3">
                  <div className="sticky top-[7.375rem] z-10 flex items-center justify-between border-b bg-background/95 py-2 backdrop-blur">
                    <h3 className="font-semibold">{group.label}</h3>
                    <span className="text-sm text-muted-foreground">{group.nodes.length}</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {group.nodes.map((node) => {
                      const assembly = node.assemblyId ? assemblies.find((candidate) => candidate.id === node.assemblyId) : undefined;
                      const objectId = assembly?.objectId ?? node.equipment?.objectId;
                      const serialNumber = assembly?.serialNumber ?? node.equipment?.serialNumber;
                      return (
                        <button
                          type="button"
                          key={node.id}
                          aria-pressed={selectedTileEquipmentId === node.id}
                          className={`flex min-w-0 items-center gap-4 border bg-card p-4 text-left transition-colors hover:bg-accent/50 ${selectedTileEquipmentId === node.id ? "border-primary bg-accent" : ""}`}
                          onClick={() => selectTileEquipment(node)}
                        >
                          {node.pictureNumber && <EquipmentImagePlaceholder pictureNumber={node.pictureNumber} description={node.label} className="h-20 w-28 min-h-0 shrink-0" />}
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{node.label}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">{objectId ?? "—"}</span>
                            <span className="block text-xs text-muted-foreground">{serialNumber ?? "—"}</span>
                            {isPlantNodeInCart(node, cart) && <Badge variant="secondary" className="mt-2">Already in cart</Badge>}
                          </span>
                          <ArrowRight className="size-4 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
              {!tileEquipmentNodes.length && <p className="border p-6 text-sm text-muted-foreground">No equipment is listed for this plant.</p>}
            </div>
            <div className="xl:sticky xl:top-32 xl:max-h-[calc(100vh-9rem)] xl:self-start xl:overflow-y-auto">
              <PlantTreeDetails node={selectedTileEquipmentNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} />
            </div>
          </div>
        </section>
      )}
    </section>
  );
}