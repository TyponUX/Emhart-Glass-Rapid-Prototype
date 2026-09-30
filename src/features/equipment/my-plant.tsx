import { useEffect, useRef, useState, type CSSProperties, type UIEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Cog, Download, Factory, FileText, Flame, MapPin, Minus, Plus, Rows3, ShoppingCart, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentImagePlaceholder } from "@/components/shared/equipment-image-placeholder";
import { plants, type FurnaceRecord, type PlantEquipmentRecord, type PlantRecord, type ProductionLineRecord } from "@/data/plant-hierarchy";
import { assemblies, documents, machines, parts } from "@/data/portal-data";
import type { AssemblyRecord, PartRecord } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { useActionFeedback } from "@/components/shared/action-feedback";
import { getOrderability, getPartCompatibility } from "@/lib/portal-logic";
import {
  AVAILABILITY_LABELS,
  DEMO_EQUIPMENT_LEAD_TIME,
  DEMO_EQUIPMENT_PRICE,
  EMPTY_PLANT_FILTERS,
  TYPE_LABELS,
  clearPlantUrlState,
  filterPlantTree,
  getDemoStockCount,
  getPlantFacetCounts,
  getPlantItemFacets,
  getPlantNodeDocuments,
  hasActiveFilters,
  isInPlantScope,
  isPlantItem,
  isScopeActive,
  matchesPlantFilters,
  matchesPlantQuery,
  readPlantUrlState,
  sortPlantNodes,
  sortPlantTree,
  writePlantUrlState,
  type PlantFilters,
  type PlantScope,
  type PlantSortKey,
  type PlantTreeKind,
  type PlantTreeNode,
  type PlantViewMode,
} from "@/lib/plant-filters";
import { PlantToolbar, type PlantScopeLevel } from "@/features/equipment/plant-toolbar";

type PlantTileLevel = "plant" | "furnace" | "line" | "machine" | "equipment";

// Simplified Australia outline; viewBox maps lon 113–154°E to x 0–100 and lat 10–44°S to y 0–83.
const australiaMainlandPath = "M72 1.7 L74.4 9.8 L78.8 13.4 L80 17.1 L82.4 22.7 L88.3 27.1 L91.5 32.7 L97.8 42.7 L99 45.4 L94.6 55.9 L93.2 58.3 L90.2 66.1 L81.5 71 L77.8 69 L72 69.3 L62.2 60.8 L60.5 56.1 L56.1 60.5 L43.9 52.5 L21.7 58.3 L12 61 L5.1 59.5 L6.8 53.7 L3.9 45.9 L0.7 39 L2.7 29.3 L13.7 25.1 L22.4 19.5 L29.3 11 L36.8 12.2 L43.4 5.9 L57.8 5.4 L56.1 13.4 L67.3 18.5 L69.5 7.3 Z";
const tasmaniaPath = "M77.1 74.9 L86.1 75.4 L85.9 80.5 L82.4 82 L78.5 78.6 Z";

function projectToAustraliaMap({ lat, lon }: PlantRecord["coordinates"]) {
  return { left: `${((lon - 113) / 41) * 100}%`, top: `${((-lat - 10) / 34) * 100}%` };
}

function PlantLocationMap({ plantRecords, onSelect }: { plantRecords: PlantRecord[]; onSelect: (plant: PlantRecord) => void }) {
  return (
    <div className="flex justify-center border bg-neutral-100 p-4" aria-label="Plant locations map">
      <div className="relative aspect-[100/83] h-64">
        <svg viewBox="0 0 100 83" className="absolute inset-0 size-full" aria-hidden="true">
          <path d={australiaMainlandPath} fill="none" stroke="black" strokeWidth="0.6" strokeLinejoin="round" />
          <path d={tasmaniaPath} fill="none" stroke="black" strokeWidth="0.6" strokeLinejoin="round" />
        </svg>
        {plantRecords.map((plant) => (
          <button key={plant.id} type="button" className="group absolute -translate-x-1/2 -translate-y-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={projectToAustraliaMap(plant.coordinates)} aria-label={`Open ${plant.name}`} title={plant.name} onClick={() => onSelect(plant)}>
            <MapPin className="size-6 fill-red-600 text-red-700" />
            <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-black">{plant.location.split(",")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
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
    children: [
      ...(assembly.equipmentType ? [] : childAssemblies.map((child) => buildAssemblyNode(child, machineId, path, plantId, furnaceId, lineId))),
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

function flattenTreeNodes(nodes: PlantTreeNode[]): PlantTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTreeNodes(node.children)]);
}

function findMachineNode(nodes: PlantTreeNode[], machineId?: string): PlantTreeNode | undefined {
  return machineId ? flattenTreeNodes(nodes).find((node) => node.kind === "machine" && node.machineId === machineId) : undefined;
}

function getRevealIds(nodes: PlantTreeNode[], target: PlantScope & { assemblyId?: string }): string[] {
  return [target.plantId, target.furnaceId, target.lineId, findMachineNode(nodes, target.machineId)?.id, target.assemblyId].filter((id): id is string => Boolean(id));
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

function PlantTreeDetails({ node, onAddPart, onAddEquipment, onRequestSupport, onSelectChild }: {
  node?: PlantTreeNode;
  onAddPart: (node: PlantTreeNode, quantity: number) => void;
  onAddEquipment: (node: PlantTreeNode) => void;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
  onSelectChild?: (node: PlantTreeNode) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const { cart } = useTransaction();
  useEffect(() => setQuantity(1), [node?.id]);

  if (!node) {
    return <Card className="h-fit"><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Select an item to view its details here.</p></CardContent></Card>;
  }

  const plant = plants.find((candidate) => candidate.id === node.plantId);
  const furnace = plant?.furnaces.find((candidate) => candidate.id === node.furnaceId);
  const line = furnace?.lines.find((candidate) => candidate.id === node.lineId);
  const machine = node.machineId ? machines.find((candidate) => candidate.id === node.machineId) : undefined;
  const assembly = node.assemblyId && !node.partId ? assemblies.find((candidate) => candidate.id === node.assemblyId) : undefined;
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
  const childParts = node.kind === "equipment" || node.kind === "assembly" ? node.children.filter((child) => child.kind === "part") : [];

  return (
    <div className="space-y-4">
      <Card className="h-fit">
        <CardHeader>
          {node.path.length > 1 && <p className="text-xs text-muted-foreground">{node.path.slice(0, -1).join(" / ")}</p>}
          <div className="flex items-start justify-between gap-3"><CardTitle className="text-base">{node.label}</CardTitle><Badge variant="outline">{node.kind === "equipment" ? "Equipment" : node.kind[0].toUpperCase() + node.kind.slice(1)}</Badge></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(node.kind === "machine" || node.kind === "equipment" || node.kind === "assembly") && node.pictureNumber && <EquipmentImagePlaceholder pictureNumber={node.pictureNumber} description={node.label} className="h-48 w-full" />}
          {node.kind === "plant" && <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{plant?.location}</dd></div><div><dt className="text-muted-foreground">Furnaces</dt><dd className="font-medium">{plant?.furnaces.length ?? 0}</dd></div></dl>}
          {node.kind === "furnace" && <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Plant</dt><dd className="font-medium">{plant?.name}</dd></div><div><dt className="text-muted-foreground">Lines</dt><dd className="font-medium">{furnace?.lines.length ?? 0}</dd></div></dl>}
          {node.kind === "line" && <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Furnace</dt><dd className="font-medium">{furnace?.name}</dd></div><div><dt className="text-muted-foreground">Machines</dt><dd className="font-medium">{line?.equipment.filter((item) => item.equipmentType === "Machine").length ?? 0}</dd></div><div><dt className="text-muted-foreground">Other equipment</dt><dd className="font-medium">{line?.equipment.filter((item) => item.equipmentType !== "Machine").length ?? 0}</dd></div></dl>}
          {equipment && <dl className="grid grid-cols-2 gap-3 text-sm">{[["Object ID", equipment.objectId], ["Equipment type", equipment.equipmentType], ["Serial number", equipment.serialNumber], ["Manufactured date", equipment.manufacturedDate], ["Installation date", equipment.installationDate]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>}
          {machine && !node.partId && <p className="text-sm">{machine.model} · {machine.serialNumber}</p>}
          {assembly && <><p className="text-sm text-muted-foreground">{assembly.description}</p><dl className="grid grid-cols-2 gap-3 text-sm">{[["Equipment type", assembly.equipmentType], ["Object ID", assembly.objectId], ["Serial number", assembly.serialNumber], ["Manufactured date", assembly.manufacturedDate]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></>}
          {(node.kind === "machine" || node.kind === "equipment" || node.kind === "assembly") && !part && <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="font-medium text-muted-foreground">Compatible with</dt><dd className="font-medium">{compatibleMachines.length ? compatibleMachines.map((candidate) => candidate.name).join(", ") : "Parent machine / line equipment"}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Estimated delivery</dt><dd className="font-medium">{availableCount > 0 ? DEMO_EQUIPMENT_LEAD_TIME : "Unavailable"}</dd></div>
            <div><dt className="font-medium text-muted-foreground">Available now</dt><dd className={`font-medium ${availableCount >= 1 && availableCount <= 9 ? "text-green-700" : ""}`}>{availableCount} units</dd></div>
            <div><dt className="font-medium text-muted-foreground">Price</dt><dd className="font-medium">EUR {DEMO_EQUIPMENT_PRICE.toLocaleString()}</dd></div>
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

      {childParts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Parts · {childParts.length}</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-0 pb-2">
            {childParts.map((child) => {
              const facets = getPlantItemFacets(child);
              return (
                <button type="button" key={child.id} className="flex w-full items-center justify-between gap-3 px-6 py-2 text-left hover:bg-accent" onClick={() => onSelectChild?.(child)} disabled={!onSelectChild}>
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{child.label}</span><span className="block text-xs text-muted-foreground">{child.detail}</span></span>
                  {facets && <Badge variant={facets.availability === "unavailable" ? "outline" : "secondary"} className="shrink-0">{AVAILABILITY_LABELS[facets.availability]}</Badge>}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

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

function PlantTreeBranch({ node, depth, autoExpand, expandedIds, activeId, cart, onToggle, onSelect }: {
  node: PlantTreeNode;
  depth: number;
  autoExpand: boolean;
  expandedIds: Set<string>;
  activeId?: string;
  cart: ReturnType<typeof useTransaction>["cart"];
  onToggle: (id: string) => void;
  onSelect: (node: PlantTreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const listChildrenInline = node.kind === "assembly";
  const expanded = listChildrenInline || expandedIds.has(node.id) || (autoExpand && hasChildren);
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
      {hasChildren && expanded && <div>{childGroups.map((group) => <section key={`${node.id}-${group.label}`}><div data-tree-level data-level-label={`${node.path.join(" / ")} / ${group.label}`} className="flex items-center gap-2 px-2 py-2" style={{ paddingLeft: `${(depth + 1) * 22 + 8}px` }}><span className="h-px min-w-4 flex-1 bg-border" /><span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">{group.label} · {group.nodes.length}</span><span className="h-px min-w-4 flex-1 bg-border" /></div>{group.nodes.map((child) => <PlantTreeBranch key={child.id} node={child} depth={depth + 1} autoExpand={autoExpand} expandedIds={expandedIds} activeId={activeId} cart={cart} onToggle={onToggle} onSelect={onSelect} />)}</section>)}</div>}
    </div>
  );
}

interface MyPlantProps {
  accountId: string;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}

export function MyPlant({ accountId, onRequestSupport }: MyPlantProps) {
  const [initialUrlState] = useState(() => readPlantUrlState(window.location.search));
  const [viewMode, setViewMode] = useState<PlantViewMode>(initialUrlState.view);
  const [tileBrowseLevel, setTileBrowseLevel] = useState<PlantTileLevel>("plant");
  const [treeQuery, setTreeQuery] = useState(initialUrlState.query);
  const [filters, setFilters] = useState<PlantFilters>(initialUrlState.filters);
  const [sort, setSort] = useState<PlantSortKey>(initialUrlState.sort);
  const [locationFilter, setLocationFilter] = useState<PlantScope>(initialUrlState.scope);
  const [selectedResultId, setSelectedResultId] = useState<string>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => initialUrlState.view === "tree"
    ? new Set(getRevealIds(buildPlantTree(plants.filter((plant) => plant.accountId === accountId)), initialUrlState.scope))
    : new Set());
  const [activeTreeNodeId, setActiveTreeNodeId] = useState<string>();
  const [currentTreePath, setCurrentTreePath] = useState("My Plant");
  const [treeHasScrolled, setTreeHasScrolled] = useState(false);
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const treeHeaderRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [selectedPlantId, setSelectedPlantId] = useState<string>();
  const [selectedFurnaceId, setSelectedFurnaceId] = useState<string>();
  const [selectedLineId, setSelectedLineId] = useState<string>();
  const [selectedMachineId, setSelectedMachineId] = useState<string>();
  const [equipmentScopeMachineId, setEquipmentScopeMachineId] = useState<string>();
  const [selectedMachineAssemblyId, setSelectedMachineAssemblyId] = useState<string>();
  const [selectedTileEquipmentId, setSelectedTileEquipmentId] = useState<string>();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>();
  const { addToCart, cart } = useTransaction();
  const tenantPlants = plants.filter((plant) => plant.accountId === accountId);
  const selectedPlant = tenantPlants.find((plant) => plant.id === selectedPlantId);
  const selectedFurnace = selectedPlant?.furnaces.find((furnace) => furnace.id === selectedFurnaceId);
  const selectedLine = selectedFurnace?.lines.find((line) => line.id === selectedLineId);
  const allTreeNodes = buildPlantTree(tenantPlants);
  const normalizedQuery = treeQuery.trim().toLowerCase();
  const activeScope = locationFilter;
  const attributeFiltersActive = hasActiveFilters(filters);
  const filtersActive = attributeFiltersActive || isScopeActive(locationFilter);
  const isInCart = (node: PlantTreeNode) => isPlantNodeInCart(node, cart);
  const nodeMatches = (node: PlantTreeNode) => isInPlantScope(node, activeScope)
    && matchesPlantQuery(node, normalizedQuery)
    && (!attributeFiltersActive || matchesPlantFilters(node, filters, isInCart));
  const scopedItemNodes = flattenTreeNodes(allTreeNodes).filter((node) => isPlantItem(node) && isInPlantScope(node, activeScope) && matchesPlantQuery(node, normalizedQuery));
  const facetCounts = getPlantFacetCounts(scopedItemNodes, isInCart);
  const filteredItemNodes = sortPlantNodes(attributeFiltersActive ? scopedItemNodes.filter((node) => matchesPlantFilters(node, filters, isInCart)) : scopedItemNodes, sort);
  const treeNodes = normalizedQuery || filtersActive || sort !== "hierarchy"
    ? sortPlantTree(filterPlantTree(allTreeNodes, nodeMatches), sort)
    : allTreeNodes;
  const tileSearchResults = normalizedQuery ? flattenTreeNodes(allTreeNodes).filter(nodeMatches) : [];
  const selectedResultNode = selectedResultId ? findTreeNode(allTreeNodes, selectedResultId) : undefined;
  const scopePlant = tenantPlants.find((plant) => plant.id === activeScope.plantId);
  const scopeFurnace = scopePlant?.furnaces.find((furnace) => furnace.id === activeScope.furnaceId);
  const scopeLines = scopeFurnace?.lines ?? scopePlant?.furnaces.flatMap((furnace) => furnace.lines) ?? [];
  const scopeMachineNodes = flattenTreeNodes(allTreeNodes).filter((node) => node.kind === "machine" && node.machineId && isInPlantScope(node, { ...activeScope, machineId: undefined }));
  const scopeLabel = isScopeActive(activeScope)
    ? [scopePlant?.name, scopeFurnace?.name, scopeLines.find((line) => line.id === activeScope.lineId)?.name, findMachineNode(allTreeNodes, activeScope.machineId)?.label].filter(Boolean).join(" / ")
    : undefined;
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
  const tileMachineNodes = sortPlantNodes(selectedLineTreeNode
    ? selectedLineTreeNode.children.filter((node) => node.kind === "machine")
    : plantDescendantNodes.filter((node) => node.kind === "machine"), sort);
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
  const tileEquipmentGroups = (equipmentScopeMachineNode
    ? groupTreeChildren(equipmentScopeMachineNode)
    : groupEquipmentNodes(tileEquipmentNodes)).map((group) => ({ ...group, nodes: sortPlantNodes(group.nodes, sort) }));
  const selectedTileEquipmentNode = selectedTileEquipmentId
    ? findTreeNode(allTreeNodes, selectedTileEquipmentId)
    : selectedMachineAssemblyNode ?? selectedLineEquipmentNode ?? selectedMachineNode;
  const selectedMachineRecord = selectedMachineId ? machines.find((machine) => machine.id === selectedMachineId) : undefined;
  const { showFeedback } = useActionFeedback();

  useEffect(() => {
    writePlantUrlState({ view: viewMode, query: treeQuery, scope: activeScope, filters, sort });
  }, [viewMode, treeQuery, activeScope.plantId, activeScope.furnaceId, activeScope.lineId, activeScope.machineId, filters, sort]);

  useEffect(() => () => clearPlantUrlState(), []);

  useEffect(() => {
    const element = toolbarRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setToolbarHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function applyScope(scope: PlantScope) {
    setSelectedResultId(undefined);
    setLocationFilter(scope);
    if (viewMode === "tree") setExpandedIds(new Set(getRevealIds(allTreeNodes, scope)));
  }

  function changeScope(level: PlantScopeLevel, id?: string) {
    if (level === "plant") return applyScope({ plantId: id });
    if (level === "furnace") return applyScope({ plantId: activeScope.plantId, furnaceId: id });
    if (level === "line") {
      const furnaceId = id ? scopePlant?.furnaces.find((furnace) => furnace.lines.some((line) => line.id === id))?.id : activeScope.furnaceId;
      return applyScope({ plantId: activeScope.plantId, furnaceId, lineId: id });
    }
    const machineNode = findMachineNode(allTreeNodes, id);
    applyScope(machineNode
      ? { plantId: machineNode.plantId, furnaceId: machineNode.furnaceId, lineId: machineNode.lineId, machineId: machineNode.machineId }
      : { plantId: activeScope.plantId, furnaceId: activeScope.furnaceId, lineId: activeScope.lineId });
  }

  function clearAllFilters() {
    setFilters(EMPTY_PLANT_FILTERS);
    applyScope({});
  }

  const filterResultSummary = (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      <span className="font-medium text-foreground">{filteredItemNodes.length}</span> {filteredItemNodes.length === 1 ? "item matches" : "items match"} your filters
    </p>
  );

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

  function revealTreeNode(node: PlantTreeNode) {
    selectTreeNode(node);
    setExpandedIds((current) => new Set([...current, ...getRevealIds(allTreeNodes, node)]));
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
    <section className="space-y-6" style={{ "--plant-toolbar-h": `${toolbarHeight}px` } as CSSProperties}>
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">My Plant</h1>
        {viewMode === "tiles" && !filtersActive && tileBrowseLevel === "plant" && <PlantLocationMap plantRecords={tenantPlants} onSelect={openPlant} />}
      </header>

      <div ref={toolbarRef} className="sticky top-[5.05rem] z-20 bg-background">
        <PlantToolbar
          query={treeQuery}
          onQueryChange={setTreeQuery}
          searchResults={viewMode === "tiles" && normalizedQuery ? tileSearchResults : undefined}
          onSelectSearchResult={selectHierarchySearchResult}
          viewMode={viewMode}
          onViewModeChange={changeViewMode}
          sort={sort}
          onSortChange={setSort}
          scope={activeScope}
          scopeLabel={scopeLabel}
          plantOptions={tenantPlants.map((plant) => ({ id: plant.id, label: plant.name }))}
          furnaceOptions={scopePlant?.furnaces.map((furnace) => ({ id: furnace.id, label: furnace.name })) ?? []}
          lineOptions={scopeLines.map((line) => ({ id: line.id, label: line.name }))}
          machineOptions={scopeMachineNodes.map((node) => ({ id: node.machineId as string, label: node.label }))}
          onScopeChange={changeScope}
          filters={filters}
          onFiltersChange={(next) => { setFilters(next); setSelectedResultId(undefined); }}
          counts={facetCounts}
          onClear={clearAllFilters}
        />
      </div>

      {!(viewMode === "tiles" && (tileBrowseLevel === "plant" || filtersActive)) && <nav aria-label="Plant levels" className="flex items-center gap-2">
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

      {viewMode === "tree" && filtersActive && filterResultSummary}

      {viewMode === "tree" && <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <div ref={treeScrollRef} onScroll={handleTreeScroll} className="max-h-[calc(100vh-8rem-var(--plant-toolbar-h))] min-h-0 overflow-y-auto border bg-card">
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
            <CardContent className="p-0">{treeNodes.length ? treeNodes.map((node) => <PlantTreeBranch key={node.id} node={node} depth={0} autoExpand={Boolean(normalizedQuery) || attributeFiltersActive} expandedIds={expandedIds} activeId={activeTreeNodeId} cart={cart} onToggle={toggleTreeNode} onSelect={selectTreeNode} />) : <p className="p-5 text-sm text-muted-foreground">No hierarchy items match this search.</p>}</CardContent>
          </Card>
        </div>
        <PlantTreeDetails node={selectedTreeNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} onSelectChild={revealTreeNode} />
      </section>}

      {viewMode === "tiles" && !filtersActive && selectedPlant && <nav aria-label="Plant hierarchy" className="sticky top-[calc(5.05rem+var(--plant-toolbar-h))] z-10 flex items-center gap-2 border-b bg-background/95 py-2 text-sm backdrop-blur">
        <button className={!selectedPlant ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => navigateTileLevel("plant")}>My Plant</button>
        {selectedPlant && <><span className="text-muted-foreground">/</span><button className={!selectedFurnace ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedFurnaceId(undefined); setSelectedLineId(undefined); setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); setSelectedEquipmentId(undefined); }}>{selectedPlant.name}</button></>}
        {selectedFurnace && <><span className="text-muted-foreground">/</span><button className={!selectedLine ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedLineId(undefined); setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); setSelectedEquipmentId(undefined); }}>{selectedFurnace.name}</button></>}
        {selectedLine && <><span className="text-muted-foreground">/</span><button className={!selectedMachineId ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedMachineId(undefined); setSelectedMachineAssemblyId(undefined); }}>{selectedLine.name}</button></>}
        {selectedMachineRecord && <><span className="text-muted-foreground">/</span><span className="font-semibold">{selectedMachineRecord.name}</span></>}
      </nav>}

      {viewMode === "tiles" && !filtersActive && tileBrowseLevel === "plant" && (
        <div className="grid gap-4 xl:grid-cols-3">
            {tenantPlants.map((plant) => <button type="button" key={plant.id} className="group overflow-hidden rounded border bg-card text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => openPlant(plant)}><div className="flex h-36 items-center justify-center border-b bg-muted/40"><Factory className="size-10 text-muted-foreground" /></div><div className="space-y-4 p-5"><div><h3 className="font-semibold">{plant.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />{plant.location}</p></div><div className="flex items-center justify-between"><Badge variant="outline">{plant.furnaces.length} furnaces</Badge><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div></div></button>)}
        </div>
      )}

      {viewMode === "tiles" && !filtersActive && tileBrowseLevel === "furnace" && selectedPlant && (
        <section>
          {tileFurnaces.length ? <div className="grid gap-3 md:grid-cols-2">{tileFurnaces.map((furnace) => <button key={furnace.id} className="flex items-center justify-between border bg-background p-5 text-left hover:bg-accent" onClick={() => openFurnace(furnace)}><span className="flex items-center gap-3"><Flame className="size-5 text-muted-foreground" /><span><span className="block font-medium">{furnace.name}</span><span className="text-sm text-muted-foreground">{furnace.lines.length} lines</span></span></span><ArrowRight className="size-4" /></button>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No furnaces are listed for this plant.</p>}
        </section>
      )}

      {viewMode === "tiles" && !filtersActive && tileBrowseLevel === "line" && selectedPlant && (
        <section>
          {tileLines.length ? <div className="grid gap-3 md:grid-cols-2">{tileLines.map((line) => <button key={line.id} className="flex items-center justify-between border bg-background p-5 text-left hover:bg-accent" onClick={() => openLine(line)}><span className="flex items-center gap-3"><Rows3 className="size-5 text-muted-foreground" /><span><span className="block font-medium">{line.name}</span><span className="text-sm text-muted-foreground">{line.equipment.filter((equipment) => equipment.equipmentType === "Machine").length} machines · {line.equipment.filter((equipment) => equipment.equipmentType !== "Machine").length} other equipment</span></span></span><ArrowRight className="size-4" /></button>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No line records are included for this plant.</p>}
        </section>
      )}

      {viewMode === "tiles" && !filtersActive && tileBrowseLevel === "machine" && selectedPlant && (
        <section>
          {tileMachineNodes.length ? <div className="grid gap-4 xl:grid-cols-2">{tileMachineNodes.map((machineNode) => {
            const equipment = machineNode.equipment;
            if (!equipment) return null;
            return <button type="button" key={machineNode.id} className="overflow-hidden border bg-card text-left transition-colors hover:bg-accent/50" onClick={() => openMachineNode(machineNode)}><div className="grid gap-4 p-4 sm:grid-cols-[9rem_minmax(0,1fr)]">{machineNode.pictureNumber && <EquipmentImagePlaceholder pictureNumber={machineNode.pictureNumber} description={machineNode.label} className="order-1 h-32 min-h-0" />}<div className="order-2 flex min-w-0 items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase text-muted-foreground">Machine</p><h3 className="mt-1 font-semibold">{machineNode.label}</h3><p className="mt-1 text-sm text-muted-foreground">{equipment.objectId} · {equipment.serialNumber}</p>{!selectedLine && <p className="mt-1 text-xs text-muted-foreground">{machineNode.path.slice(1, -1).join(" · ")}</p>}{isPlantNodeInCart(machineNode, cart) && <Badge variant="secondary" className="mt-2">Already in cart</Badge>}</div><ArrowRight className="size-4 shrink-0" /></div></div></button>;
          })}</div> : <p className="border p-6 text-sm text-muted-foreground">No machines are listed for this plant.</p>}
          {selectedLineEquipmentNode && <PlantTreeDetails node={selectedLineEquipmentNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} onSelectChild={selectTileEquipment} />}
        </section>
      )}

      {viewMode === "tiles" && !filtersActive && tileBrowseLevel === "equipment" && selectedPlant && (
        <section className="space-y-5">
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
            <div className="space-y-5">
              {tileEquipmentGroups.map((group) => (
                <section key={group.label} className="space-y-3">
                  <div className="sticky top-[calc(7.375rem+var(--plant-toolbar-h))] z-10 flex items-center justify-between border-b bg-background/95 py-2 backdrop-blur">
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
            <div className="xl:sticky xl:top-[calc(6rem+var(--plant-toolbar-h))] xl:max-h-[calc(100vh-7rem-var(--plant-toolbar-h))] xl:self-start xl:overflow-y-auto">
              <PlantTreeDetails node={selectedTileEquipmentNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} onSelectChild={selectTileEquipment} />
            </div>
          </div>
        </section>
      )}

      {viewMode === "tiles" && filtersActive && (
        <section aria-label="Filtered plant items" className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
          <div className="space-y-2">
            {filterResultSummary}
            {filteredItemNodes.length ? filteredItemNodes.map((node) => {
              const facets = getPlantItemFacets(node);
              return (
                <button
                  type="button"
                  key={node.id}
                  aria-pressed={selectedResultId === node.id}
                  className={`flex w-full min-w-0 items-center gap-4 border bg-card p-3 text-left transition-colors hover:bg-accent/50 ${selectedResultId === node.id ? "border-primary bg-accent" : ""}`}
                  onClick={() => setSelectedResultId(node.id)}
                >
                  {node.pictureNumber ? <EquipmentImagePlaceholder pictureNumber={node.pictureNumber} description={node.label} className="h-14 w-20 min-h-0 shrink-0 p-1" /> : <span className="flex h-14 w-20 shrink-0 items-center justify-center border bg-muted/40"><Wrench className="size-5 text-muted-foreground" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-muted-foreground" title={node.path.slice(0, -1).join(" / ")}>{(node.path.length > 4 ? [node.path[0], "…", ...node.path.slice(-3, -1)] : node.path.slice(0, -1)).join(" / ")}</span>
                    <span className="block truncate font-medium">{node.label}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {facets && <Badge variant="outline">{TYPE_LABELS[facets.type]}</Badge>}
                      {facets && <Badge variant={facets.availability === "unavailable" ? "outline" : "secondary"}>{AVAILABILITY_LABELS[facets.availability]}</Badge>}
                      {facets?.partStatus.includes("superseded") && <Badge variant="destructive">Superseded</Badge>}
                      {isPlantNodeInCart(node, cart) && <Badge variant="secondary">Already in cart</Badge>}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0" />
                </button>
              );
            }) : (
              <div className="space-y-3 border p-6 text-sm text-muted-foreground">
                <p>No items match these filters{scopeLabel ? ` in ${scopeLabel}` : ""}.</p>
                <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>Clear all filters</Button>
              </div>
            )}
          </div>
          <div className="xl:sticky xl:top-[calc(6rem+var(--plant-toolbar-h))] xl:max-h-[calc(100vh-7rem-var(--plant-toolbar-h))] xl:self-start xl:overflow-y-auto">
            <PlantTreeDetails node={selectedResultNode} onAddPart={addTreePartToCart} onAddEquipment={addTreeEquipmentToCart} onRequestSupport={onRequestSupport} onSelectChild={(child) => setSelectedResultId(child.id)} />
          </div>
        </section>
      )}
    </section>
  );
}