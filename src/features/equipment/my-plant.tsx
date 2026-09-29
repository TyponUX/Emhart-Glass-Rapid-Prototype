import { useEffect, useRef, useState, type UIEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Factory, Flame, LayoutGrid, ListTree, MapPin, Rows3, Search, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EquipmentImagePlaceholder } from "@/components/shared/equipment-image-placeholder";
import { plants, type FurnaceRecord, type PlantEquipmentRecord, type PlantRecord, type ProductionLineRecord } from "@/data/plant-hierarchy";
import { assemblies, machines, parts } from "@/data/portal-data";
import { MachineExplorer } from "@/features/equipment/machine-explorer";
import type { AssemblyRecord, PartRecord } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { useActionFeedback } from "@/components/shared/action-feedback";
import { getPartCompatibility } from "@/lib/portal-logic";

type PlantViewMode = "tiles" | "tree";
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

function findTreeNode(nodes: PlantTreeNode[], id: string): PlantTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findTreeNode(node.children, id);
    if (child) return child;
  }
  return undefined;
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

function PlantTreeDetails({ node, onAddPart, onRequestSupport }: {
  node?: PlantTreeNode;
  onAddPart: (node: PlantTreeNode) => void;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}) {
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
  const supportMachineId = node.machineId ?? equipment?.machineId;
  const supportSite = supportMachineId ? machines.find((candidate) => candidate.id === supportMachineId)?.site ?? plant?.name ?? "" : plant?.name ?? "";

  return (
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
        {machine && <><p className="text-sm text-muted-foreground">{machine.configuration}</p><p className="text-sm">{machine.model} · {machine.serialNumber}</p></>}
        {assembly && <><p className="text-sm text-muted-foreground">{assembly.description}</p><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Level</dt><dd className="font-medium">{assembly.level ?? "Assembly"}</dd></div>{[["Equipment type", assembly.equipmentType], ["Object ID", assembly.objectId], ["Serial number", assembly.serialNumber], ["Manufactured date", assembly.manufacturedDate]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></>}
        {part && <><div className="aspect-[16/9] overflow-hidden border bg-muted"><img src={part.imageUrl} alt={part.name} className="h-full w-full object-contain" /></div><p className="text-sm text-muted-foreground">Part number</p><p className="font-semibold">{part.partNumber}</p><p className="text-sm text-muted-foreground">{part.description}</p><div className="flex flex-wrap gap-2"><Badge variant="secondary">{part.availability}</Badge><Badge variant="outline">Lead time: {part.leadTime}</Badge></div><div className="flex flex-wrap gap-2"><Button onClick={() => onAddPart(node)}><ShoppingCart className="mr-2 size-4" />Add to cart</Button><Button variant="outline" onClick={() => supportMachineId && onRequestSupport({ site: supportSite, machineId: supportMachineId, assemblyId: node.assemblyId, partId: part.id })}>Request support</Button></div></>}
        {supportMachineId && !part && <Button variant="outline" onClick={() => onRequestSupport({ site: supportSite, machineId: supportMachineId, assemblyId: node.assemblyId })}>Request support</Button>}
      </CardContent>
    </Card>
  );
}

function PlantTreeBranch({ node, depth, query, expandedIds, activeId, onToggle, onSelect }: {
  node: PlantTreeNode;
  depth: number;
  query: string;
  expandedIds: Set<string>;
  activeId?: string;
  onToggle: (id: string) => void;
  onSelect: (node: PlantTreeNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const listChildrenInline = node.kind === "machine" || node.kind === "assembly";
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
        </button>
      </div>
      {hasChildren && expanded && <div>{childGroups.map((group) => <section key={`${node.id}-${group.label}`}><div data-tree-level data-level-label={group.label} className="flex items-center gap-2 px-2 py-2" style={{ paddingLeft: `${(depth + 1) * 22 + 8}px` }}><span className="h-px min-w-4 flex-1 bg-border" /><span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">{group.label} · {group.nodes.length}</span><span className="h-px min-w-4 flex-1 bg-border" /></div>{group.nodes.map((child) => <PlantTreeBranch key={child.id} node={child} depth={depth + 1} query={query} expandedIds={expandedIds} activeId={activeId} onToggle={onToggle} onSelect={onSelect} />)}</section>)}</div>}
    </div>
  );
}

interface MyPlantProps {
  accountId: string;
  onRequestSupport: (context: { site: string; machineId: string; assemblyId?: string; partId?: string }) => void;
}

export function MyPlant({ accountId, onRequestSupport }: MyPlantProps) {
  const [viewMode, setViewMode] = useState<PlantViewMode>(() => window.localStorage.getItem("my-plant-view-mode") === "tree" ? "tree" : "tiles");
  const [treeQuery, setTreeQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [activeTreeNodeId, setActiveTreeNodeId] = useState<string>();
  const [currentTreeLevel, setCurrentTreeLevel] = useState("Plants");
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const treeHeaderRef = useRef<HTMLDivElement>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string>();
  const [selectedFurnaceId, setSelectedFurnaceId] = useState<string>();
  const [selectedLineId, setSelectedLineId] = useState<string>();
  const [selectedMachineId, setSelectedMachineId] = useState<string>();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>();
  const tenantPlants = plants.filter((plant) => plant.accountId === accountId);
  const selectedPlant = tenantPlants.find((plant) => plant.id === selectedPlantId);
  const selectedFurnace = selectedPlant?.furnaces.find((furnace) => furnace.id === selectedFurnaceId);
  const selectedLine = selectedFurnace?.lines.find((line) => line.id === selectedLineId);
  const selectedEquipment = selectedLine?.equipment.find((equipment) => equipment.id === selectedEquipmentId);
  const lineMachines = selectedLine?.equipment.filter((equipment) => equipment.equipmentType === "Machine") ?? [];
  const otherLineEquipment = selectedLine?.equipment.filter((equipment) => equipment.equipmentType !== "Machine") ?? [];
  const treeNodes = filterTree(buildPlantTree(tenantPlants), treeQuery.trim().toLowerCase());
  const allTreeNodes = buildPlantTree(tenantPlants);
  const selectedTreeNode = activeTreeNodeId ? findTreeNode(allTreeNodes, activeTreeNodeId) : undefined;
  const { addToCart } = useTransaction();
  const { showFeedback } = useActionFeedback();

  function updateCurrentTreeLevel(element: HTMLDivElement) {
    const stickyHeaderBottom = element.getBoundingClientRect().top + (treeHeaderRef.current?.offsetHeight ?? 0);
    const markers = Array.from(element.querySelectorAll<HTMLElement>("[data-tree-level]"));
    let visibleLevel = "Plants";
    for (const marker of markers) {
      if (marker.getBoundingClientRect().top <= stickyHeaderBottom + 8) visibleLevel = marker.dataset.levelLabel ?? visibleLevel;
      else break;
    }
    setCurrentTreeLevel(visibleLevel);
  }

  function handleTreeScroll(event: UIEvent<HTMLDivElement>) {
    updateCurrentTreeLevel(event.currentTarget);
  }

  useEffect(() => {
    if (viewMode === "tree" && treeScrollRef.current) updateCurrentTreeLevel(treeScrollRef.current);
  }, [treeQuery, expandedIds, viewMode, accountId]);

  function changeViewMode(mode: PlantViewMode) {
    setViewMode(mode);
    window.localStorage.setItem("my-plant-view-mode", mode);
  }

  function toggleTreeNode(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  function addTreePartToCart(node: PlantTreeNode) {
    const part = node.partId ? parts.find((candidate) => candidate.id === node.partId) : undefined;
    const machine = node.machineId ? machines.find((candidate) => candidate.id === node.machineId) : undefined;
    if (!part || !machine) return;
    addToCart({ type: "part", partId: part.id, equipmentId: machine.id, quantity: 1, deliveryLocation: machine.site, compatibility: getPartCompatibility(part, machine) });
    showFeedback({ itemName: part.name, destination: "cart" });
  }

  const [initialExplorerAssemblyId, setInitialExplorerAssemblyId] = useState<string | undefined>();
  const [initialExplorerPartId, setInitialExplorerPartId] = useState<string | undefined>();
  const [explorerHierarchyContext, setExplorerHierarchyContext] = useState<string[]>([]);

  function openPlant(plant: PlantRecord) {
    setSelectedPlantId(plant.id);
    setSelectedFurnaceId(undefined);
    setSelectedLineId(undefined);
    setSelectedEquipmentId(undefined);
  }

  function openFurnace(furnace: FurnaceRecord) {
    setSelectedFurnaceId(furnace.id);
    setSelectedLineId(undefined);
    setSelectedEquipmentId(undefined);
  }

  function openLine(line: ProductionLineRecord) {
    setSelectedLineId(line.id);
    setSelectedEquipmentId(undefined);
  }

  function openEquipment(equipment: PlantEquipmentRecord) {
    if (equipment.machineId) {
      setSelectedEquipmentId(undefined);
      setSelectedMachineId(equipment.machineId);
      return;
    }
    setSelectedEquipmentId(equipment.id);
  }

  if (selectedMachineId) {
    return (
      <MachineExplorer
        machineId={selectedMachineId}
        hierarchyContext={explorerHierarchyContext.length ? explorerHierarchyContext : [selectedPlant?.name, selectedFurnace?.name, selectedLine?.name].filter((value): value is string => Boolean(value))}
        initialAssemblyId={initialExplorerAssemblyId}
        initialPartId={initialExplorerPartId}
        onBack={() => { setSelectedMachineId(undefined); setInitialExplorerAssemblyId(undefined); setInitialExplorerPartId(undefined); }}
        onRequestSupport={onRequestSupport}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-3xl font-semibold tracking-tight">My Plant</h1>
          <div className="inline-flex border p-1" role="group" aria-label="Plant view">
            <Button type="button" size="sm" variant={viewMode === "tiles" ? "secondary" : "ghost"} aria-pressed={viewMode === "tiles"} onClick={() => changeViewMode("tiles")}><LayoutGrid className="mr-2 size-4" />Tiles</Button>
            <Button type="button" size="sm" variant={viewMode === "tree" ? "secondary" : "ghost"} aria-pressed={viewMode === "tree"} onClick={() => changeViewMode("tree")}><ListTree className="mr-2 size-4" />Tree</Button>
          </div>
        </div>
      </header>

      {viewMode === "tree" && <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <div ref={treeScrollRef} onScroll={handleTreeScroll} className="max-h-[calc(100vh-14rem)] min-h-0 overflow-y-auto border bg-card">
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader ref={treeHeaderRef} className="sticky top-0 z-20 space-y-3 border-b bg-card">
              <CardTitle className="text-base">Plant hierarchy</CardTitle>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search plant hierarchy" className="pl-9" placeholder="Search plants, furnaces, lines, equipment, parts..." value={treeQuery} onChange={(event) => setTreeQuery(event.target.value)} /></div>
              <div className="border-t pt-2 text-xs font-semibold uppercase text-muted-foreground" aria-live="polite">Browsing: {currentTreeLevel}</div>
            </CardHeader>
            <CardContent className="p-0">{treeNodes.length ? treeNodes.map((node) => <PlantTreeBranch key={node.id} node={node} depth={0} query={treeQuery.trim().toLowerCase()} expandedIds={expandedIds} activeId={activeTreeNodeId} onToggle={toggleTreeNode} onSelect={selectTreeNode} />) : <p className="p-5 text-sm text-muted-foreground">No hierarchy items match this search.</p>}</CardContent>
          </Card>
        </div>
        <PlantTreeDetails node={selectedTreeNode} onAddPart={addTreePartToCart} onRequestSupport={onRequestSupport} />
      </section>}

      {viewMode === "tiles" && <nav aria-label="Plant hierarchy" className="flex items-center gap-2 border-b pb-3 text-sm">
        <button className={!selectedPlant ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedPlantId(undefined); setSelectedFurnaceId(undefined); setSelectedLineId(undefined); setSelectedEquipmentId(undefined); }}>My Plant</button>
        {selectedPlant && <><span className="text-muted-foreground">/</span><button className={!selectedFurnace ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedFurnaceId(undefined); setSelectedLineId(undefined); setSelectedEquipmentId(undefined); }}>{selectedPlant.name}</button></>}
        {selectedFurnace && <><span className="text-muted-foreground">/</span><button className={!selectedLine ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"} onClick={() => { setSelectedLineId(undefined); setSelectedEquipmentId(undefined); }}>{selectedFurnace.name}</button></>}
        {selectedLine && <><span className="text-muted-foreground">/</span><span className="font-semibold">{selectedLine.name}</span></>}
      </nav>}

      {viewMode === "tiles" && !selectedPlant && (
        <div className="space-y-4">
          <div><h2 className="text-lg font-semibold">Plants</h2><p className="text-sm text-muted-foreground">Select a plant to browse its furnaces and production lines.</p></div>
          <div className="grid gap-4 xl:grid-cols-3">
            {tenantPlants.map((plant) => <Card key={plant.id} className="overflow-hidden"><div className="flex h-36 items-center justify-center border-b bg-muted/40"><Factory className="size-10 text-muted-foreground" /></div><CardContent className="space-y-4 p-5"><div><h3 className="font-semibold">{plant.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />{plant.location}</p></div><div className="flex items-center justify-between"><Badge variant="outline">{plant.furnaces.length} furnaces</Badge><Button size="sm" onClick={() => openPlant(plant)}>Open plant<ArrowRight className="ml-2 size-4" /></Button></div></CardContent></Card>)}
          </div>
        </div>
      )}

      {viewMode === "tiles" && selectedPlant && !selectedFurnace && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-semibold">Furnaces</h2><p className="text-sm text-muted-foreground">{selectedPlant.name}</p></div>
          {selectedPlant.furnaces.length ? <div className="grid gap-3 md:grid-cols-2">{selectedPlant.furnaces.map((furnace) => <button key={furnace.id} className="flex items-center justify-between border bg-background p-5 text-left hover:bg-accent" onClick={() => openFurnace(furnace)}><span className="flex items-center gap-3"><Flame className="size-5 text-muted-foreground" /><span><span className="block font-medium">{furnace.name}</span><span className="text-sm text-muted-foreground">{furnace.lines.length} lines</span></span></span><ArrowRight className="size-4" /></button>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No furnaces are listed for this plant.</p>}
        </section>
      )}

      {viewMode === "tiles" && selectedFurnace && !selectedLine && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-semibold">Lines</h2><p className="text-sm text-muted-foreground">{selectedPlant?.name} · {selectedFurnace.name}</p></div>
          {selectedFurnace.lines.length ? <div className="grid gap-3 md:grid-cols-2">{selectedFurnace.lines.map((line) => <button key={line.id} className="flex items-center justify-between border bg-background p-5 text-left hover:bg-accent" onClick={() => openLine(line)}><span className="flex items-center gap-3"><Rows3 className="size-5 text-muted-foreground" /><span><span className="block font-medium">{line.name}</span><span className="text-sm text-muted-foreground">{line.equipment.filter((equipment) => equipment.equipmentType === "Machine").length} machines · {line.equipment.filter((equipment) => equipment.equipmentType !== "Machine").length} other equipment</span></span></span><ArrowRight className="size-4" /></button>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No line records are included for this furnace yet.</p>}
        </section>
      )}

      {viewMode === "tiles" && selectedLine && (
        <section className="space-y-4">
          <div><h2 className="text-lg font-semibold">Machines</h2><p className="text-sm text-muted-foreground">{selectedPlant?.name} · {selectedFurnace?.name} · {selectedLine.name}</p></div>
          {lineMachines.length ? <div className="grid gap-4 xl:grid-cols-2">{lineMachines.map((machine) => <Card key={machine.id} className="overflow-hidden"><div className="grid gap-4 p-4 sm:grid-cols-[9rem_minmax(0,1fr)]"><EquipmentImagePlaceholder pictureNumber={machine.pictureNumber} description={machine.description} className="h-32 min-h-0" /><div className="flex min-w-0 flex-col justify-between gap-4"><div><p className="text-xs font-medium uppercase text-muted-foreground">Machine</p><h3 className="mt-1 font-semibold">{machine.description}</h3><p className="mt-1 text-sm text-muted-foreground">{machine.objectId} · {machine.serialNumber}</p></div><Button className="self-start" onClick={() => openEquipment(machine)}>Open machine<ArrowRight className="ml-2 size-4" /></Button></div></div></Card>)}</div> : <p className="border p-6 text-sm text-muted-foreground">No machines are listed for this line yet.</p>}
          {otherLineEquipment.length > 0 && <section className="space-y-3 pt-4"><div><h3 className="font-semibold">Other line equipment</h3><p className="text-sm text-muted-foreground">Equipment installed on this line outside the machine hierarchy.</p></div><div className="overflow-x-auto border"><table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead className="bg-muted"><tr>{["Object ID", "Object Description", "Level", "Equipment Type", "Serial Number", "Manufactured Date", "Installation Date", "Picture"].map((heading) => <th key={heading} className="border-b px-3 py-2 font-semibold">{heading}</th>)}</tr></thead><tbody>{otherLineEquipment.map((equipment) => <tr key={equipment.id} className="border-b last:border-b-0 hover:bg-accent/50"><td className="whitespace-nowrap px-3 py-2 font-medium">{equipment.objectId}</td><td className="px-3 py-2">{equipment.description}</td><td className="px-3 py-2">{equipment.level}</td><td className="px-3 py-2">{equipment.equipmentType}</td><td className="whitespace-nowrap px-3 py-2">{equipment.serialNumber}</td><td className="whitespace-nowrap px-3 py-2">{equipment.manufacturedDate}</td><td className="whitespace-nowrap px-3 py-2">{equipment.installationDate}</td><td className="px-3 py-2"><EquipmentImagePlaceholder pictureNumber={equipment.pictureNumber} description={equipment.description} className="min-h-0 w-24 p-2" /></td></tr>)}</tbody></table></div></section>}
          {selectedEquipment && <Card><CardHeader><CardTitle>{selectedEquipment.description}</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-[12rem_1fr]"><EquipmentImagePlaceholder pictureNumber={selectedEquipment.pictureNumber} description={selectedEquipment.description} className="min-h-40" /><dl className="grid grid-cols-2 gap-4 text-sm">{[["Object ID", selectedEquipment.objectId], ["Equipment type", selectedEquipment.equipmentType], ["Serial number", selectedEquipment.serialNumber], ["Manufactured date", selectedEquipment.manufacturedDate], ["Installation date", selectedEquipment.installationDate]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></CardContent></Card>}
        </section>
      )}
    </section>
  );
}