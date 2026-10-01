import type { PlantEquipmentRecord } from "@/data/plant-hierarchy";
import { assemblies, documents, maintenanceActivities, parts, requests, type DocumentRecord, type DocumentType } from "@/data/portal-data";

export type PlantTreeKind = "plant" | "furnace" | "line" | "machine" | "equipment" | "assembly" | "part";

export interface PlantTreeNode {
  id: string;
  kind: PlantTreeKind;
  label: string;
  detail?: string;
  objectId?: string;
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

export type PlantItemType = "machine" | "section-frame" | "mechanism" | "other-equipment" | "assembly" | "part";
export type AvailabilityFacet = "in-stock" | "on-request" | "unavailable";
export type PartStatusFacet = "current" | "superseded" | "alternatives";
export type ServiceFacet = "open-request" | "maintenance-due";
export type PlantSortKey = "hierarchy" | "name" | "part-number" | "lead-time" | "price-asc" | "price-desc" | "installed-newest" | "installed-oldest";
export type PlantViewMode = "tiles" | "tree";

export interface PlantScope {
  plantId?: string;
  furnaceId?: string;
  lineId?: string;
  machineId?: string;
}

export interface PlantFilters {
  types: PlantItemType[];
  availability: AvailabilityFacet[];
  partStatus: PartStatusFacet[];
  categories: string[];
  documentTypes: DocumentType[];
  inCart: boolean;
  years: string[];
  service: ServiceFacet[];
}

export const EMPTY_PLANT_FILTERS: PlantFilters = { types: [], availability: [], partStatus: [], categories: [], documentTypes: [], inCart: false, years: [], service: [] };

export const TYPE_LABELS: Record<PlantItemType, string> = {
  machine: "Machines",
  "section-frame": "Section Frames",
  mechanism: "Section Frame Mechanisms",
  "other-equipment": "Other Equipment",
  assembly: "Assemblies",
  part: "Parts",
};
export const AVAILABILITY_LABELS: Record<AvailabilityFacet, string> = { "in-stock": "In stock", "on-request": "Available to order", unavailable: "Unavailable" };
export const PART_STATUS_LABELS: Record<PartStatusFacet, string> = { current: "Current", superseded: "Superseded", alternatives: "Has alternatives" };
export const SERVICE_LABELS: Record<ServiceFacet, string> = { "open-request": "Open support request", "maintenance-due": "Maintenance due" };
export const DOCUMENT_TYPES: DocumentType[] = ["Machine overview", "Technical bulletin", "Troubleshooting guide"];
export const SORT_LABELS: Record<PlantSortKey, string> = {
  hierarchy: "Sort by",
  name: "Name A–Z",
  "part-number": "Part / object number",
  "lead-time": "Fastest delivery",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "installed-newest": "Newest installed",
  "installed-oldest": "Oldest installed",
};

export const DEMO_EQUIPMENT_PRICE = 1250;
export const DEMO_EQUIPMENT_LEAD_TIME = "4–6 weeks";
const CLOSED_REQUEST_STATUSES = new Set(["complete", "delivered"]);

export function getDemoStockCount(itemId: string): number {
  return [...itemId].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 10, 7);
}

export function getPlantNodeDocuments(node: PlantTreeNode, documentRecords: DocumentRecord[] = documents): DocumentRecord[] {
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

function parseUsDate(value?: string): Date | undefined {
  const match = value?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2])) : undefined;
}

function parseLeadTimeWeeks(leadTime: string): number {
  const weeks = leadTime.match(/(\d+)\s*week/);
  if (weeks) return Number(weeks[1]);
  const hours = leadTime.match(/(\d+)\s*hour/);
  return hours ? Number(hours[1]) / 168 : Number.POSITIVE_INFINITY;
}

export interface PlantItemFacets {
  type: PlantItemType;
  availability: AvailabilityFacet;
  partStatus: PartStatusFacet[];
  category?: string;
  documentTypes: DocumentType[];
  year?: string;
  installedAt?: number;
  service: ServiceFacet[];
  leadTimeWeeks: number;
  price: number;
  number: string;
}

const STRUCTURAL_KINDS = new Set<PlantTreeKind>(["plant", "furnace", "line"]);

export function isPlantItem(node: PlantTreeNode): boolean {
  return !STRUCTURAL_KINDS.has(node.kind);
}

export function getPlantItemFacets(node: PlantTreeNode): PlantItemFacets | undefined {
  if (!isPlantItem(node)) return undefined;

  const part = node.partId ? parts.find((candidate) => candidate.id === node.partId) : undefined;
  const assembly = !part && node.assemblyId ? assemblies.find((candidate) => candidate.id === node.assemblyId) : undefined;
  const openMaintenance = maintenanceActivities.filter((activity) => activity.status !== "complete");
  const maintenancePartIds = new Set(openMaintenance.flatMap((activity) => activity.relatedPartIds));
  const service: ServiceFacet[] = [];

  if (node.kind === "machine" && requests.some((request) => request.machineId === node.machineId && !CLOSED_REQUEST_STATUSES.has(request.status))) service.push("open-request");
  if (
    (node.kind === "machine" && openMaintenance.some((activity) => activity.machineId === node.machineId))
    || (node.partId && maintenancePartIds.has(node.partId))
    || node.children.some((child) => child.partId && maintenancePartIds.has(child.partId))
  ) service.push("maintenance-due");

  const documentTypes = Array.from(new Set(getPlantNodeDocuments(node).map((document) => document.type)));

  if (part) {
    const superseded = part.availability === "Superseded" || Boolean(part.supersededById);
    const unavailable = superseded || part.availability === "Not available" || part.leadTime === "Not available";
    return {
      type: "part",
      availability: unavailable ? "unavailable" : part.availability === "In stock" ? "in-stock" : "on-request",
      partStatus: [superseded ? "superseded" : "current", ...(part.alternativePartIds?.length ? ["alternatives" as const] : [])],
      category: part.category,
      documentTypes,
      service,
      leadTimeWeeks: unavailable ? Number.POSITIVE_INFINITY : parseLeadTimeWeeks(part.leadTime),
      price: part.unitPrice,
      number: part.partNumber,
    };
  }

  const installed = parseUsDate(node.equipment?.installationDate) ?? parseUsDate(assembly?.manufacturedDate) ?? parseUsDate(node.equipment?.manufacturedDate);
  const inStock = getDemoStockCount(node.assemblyId ?? node.equipment?.id ?? node.machineId ?? node.id) > 0;
  const type: PlantItemType = node.kind === "machine" ? "machine"
    : node.equipmentType === "Section Frame" ? "section-frame"
      : node.equipmentType === "Section Frame Mechanism" ? "mechanism"
        : node.kind === "equipment" ? "other-equipment"
          : "assembly";

  return {
    type,
    availability: inStock ? "in-stock" : "unavailable",
    partStatus: [],
    documentTypes,
    year: installed ? String(installed.getFullYear()) : undefined,
    installedAt: installed?.getTime(),
    service,
    leadTimeWeeks: inStock ? 4 : Number.POSITIVE_INFINITY,
    price: DEMO_EQUIPMENT_PRICE,
    number: assembly?.objectId ?? node.equipment?.objectId ?? "",
  };
}

export function hasActiveFilters(filters: PlantFilters): boolean {
  return countActiveFilters(filters) > 0;
}

export function countActiveFilters(filters: PlantFilters): number {
  return filters.types.length + filters.availability.length + filters.partStatus.length + filters.categories.length
    + filters.documentTypes.length + filters.years.length + filters.service.length + (filters.inCart ? 1 : 0);
}

export function isScopeActive(scope: PlantScope): boolean {
  return Boolean(scope.plantId || scope.furnaceId || scope.lineId || scope.machineId);
}

export function isInPlantScope(node: PlantTreeNode, scope: PlantScope): boolean {
  return (!scope.plantId || node.plantId === scope.plantId)
    && (!scope.furnaceId || node.furnaceId === scope.furnaceId)
    && (!scope.lineId || node.lineId === scope.lineId)
    && (!scope.machineId || node.machineId === scope.machineId);
}

export function matchesPlantQuery(node: PlantTreeNode, query: string): boolean {
  return !query || `${node.label} ${node.detail ?? ""}`.toLowerCase().includes(query);
}

export function matchesPlantFilters(node: PlantTreeNode, filters: PlantFilters, isInCart: (node: PlantTreeNode) => boolean): boolean {
  const facets = getPlantItemFacets(node);
  if (!facets) return false;
  if (filters.types.length && !filters.types.includes(facets.type)) return false;
  if (filters.availability.length && !filters.availability.includes(facets.availability)) return false;
  if (filters.partStatus.length && !facets.partStatus.some((status) => filters.partStatus.includes(status))) return false;
  if (filters.categories.length && !(facets.category && filters.categories.includes(facets.category))) return false;
  if (filters.documentTypes.length && !facets.documentTypes.some((type) => filters.documentTypes.includes(type))) return false;
  if (filters.years.length && !(facets.year && filters.years.includes(facets.year))) return false;
  if (filters.service.length && !facets.service.some((value) => filters.service.includes(value))) return false;
  if (filters.inCart && !isInCart(node)) return false;
  return true;
}

export interface PlantFacetCounts {
  types: Map<PlantItemType, number>;
  availability: Map<AvailabilityFacet, number>;
  partStatus: Map<PartStatusFacet, number>;
  categories: Map<string, number>;
  documentTypes: Map<DocumentType, number>;
  years: Map<string, number>;
  service: Map<ServiceFacet, number>;
  inCart: number;
}

function increment<T>(map: Map<T, number>, key: T | undefined) {
  if (key !== undefined) map.set(key, (map.get(key) ?? 0) + 1);
}

// Counts are per option within scope and search, independent of the other selected filters.
export function getPlantFacetCounts(nodes: PlantTreeNode[], isInCart: (node: PlantTreeNode) => boolean): PlantFacetCounts {
  const counts: PlantFacetCounts = { types: new Map(), availability: new Map(), partStatus: new Map(), categories: new Map(), documentTypes: new Map(), years: new Map(), service: new Map(), inCart: 0 };
  for (const node of nodes) {
    const facets = getPlantItemFacets(node);
    if (!facets) continue;
    increment(counts.types, facets.type);
    increment(counts.availability, facets.availability);
    facets.partStatus.forEach((status) => increment(counts.partStatus, status));
    increment(counts.categories, facets.category);
    facets.documentTypes.forEach((type) => increment(counts.documentTypes, type));
    increment(counts.years, facets.year);
    facets.service.forEach((value) => increment(counts.service, value));
    if (isInCart(node)) counts.inCart += 1;
  }
  return counts;
}

export function filterPlantTree(nodes: PlantTreeNode[], predicate: (node: PlantTreeNode) => boolean): PlantTreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterPlantTree(node.children, predicate);
    return predicate(node) || children.length ? [{ ...node, children }] : [];
  });
}

function compareOptional(a: number | undefined, b: number | undefined, direction: 1 | -1): number {
  const aMissing = a === undefined || !Number.isFinite(a);
  const bMissing = b === undefined || !Number.isFinite(b);
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  return (a - b) * direction;
}

export function sortPlantNodes(nodes: PlantTreeNode[], sort: PlantSortKey): PlantTreeNode[] {
  if (sort === "hierarchy") return nodes;
  const facetsById = new Map(nodes.map((node) => [node.id, getPlantItemFacets(node)]));
  return [...nodes].sort((a, b) => {
    const fa = facetsById.get(a.id);
    const fb = facetsById.get(b.id);
    switch (sort) {
      case "name": return a.label.localeCompare(b.label);
      case "part-number": return (fa?.number || "\uffff").localeCompare(fb?.number || "\uffff");
      case "lead-time": return compareOptional(fa?.leadTimeWeeks, fb?.leadTimeWeeks, 1);
      case "price-asc": return compareOptional(fa?.price || undefined, fb?.price || undefined, 1);
      case "price-desc": return compareOptional(fa?.price || undefined, fb?.price || undefined, -1);
      case "installed-newest": return compareOptional(fa?.installedAt, fb?.installedAt, -1);
      case "installed-oldest": return compareOptional(fa?.installedAt, fb?.installedAt, 1);
    }
  });
}

export function sortPlantTree(nodes: PlantTreeNode[], sort: PlantSortKey): PlantTreeNode[] {
  if (sort === "hierarchy") return nodes;
  return sortPlantNodes(nodes, sort).map((node) => ({ ...node, children: sortPlantTree(node.children, sort) }));
}

const URL_KEYS = ["plantView", "q", "plant", "furnace", "line", "machine", "type", "avail", "status", "cat", "doc", "cart", "year", "svc", "sort"];

export interface PlantUrlState {
  view: PlantViewMode;
  query: string;
  scope: PlantScope;
  filters: PlantFilters;
  sort: PlantSortKey;
}

function pickAllowed<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return values.filter((value): value is T => (allowed as readonly string[]).includes(value));
}

export function readPlantUrlState(search: string): PlantUrlState {
  const params = new URLSearchParams(search);
  const sort = params.get("sort");
  return {
    view: params.get("plantView") === "tree" ? "tree" : "tiles",
    query: params.get("q") ?? "",
    scope: {
      plantId: params.get("plant") ?? undefined,
      furnaceId: params.get("furnace") ?? undefined,
      lineId: params.get("line") ?? undefined,
      machineId: params.get("machine") ?? undefined,
    },
    filters: {
      types: pickAllowed(params.getAll("type"), Object.keys(TYPE_LABELS) as PlantItemType[]),
      availability: pickAllowed(params.getAll("avail"), Object.keys(AVAILABILITY_LABELS) as AvailabilityFacet[]),
      partStatus: pickAllowed(params.getAll("status"), Object.keys(PART_STATUS_LABELS) as PartStatusFacet[]),
      categories: params.getAll("cat"),
      documentTypes: pickAllowed(params.getAll("doc"), DOCUMENT_TYPES),
      inCart: params.get("cart") === "1",
      years: params.getAll("year").filter((year) => /^\d{4}$/.test(year)),
      service: pickAllowed(params.getAll("svc"), Object.keys(SERVICE_LABELS) as ServiceFacet[]),
    },
    sort: sort && sort in SORT_LABELS ? sort as PlantSortKey : "hierarchy",
  };
}

export function writePlantUrlState(state: PlantUrlState) {
  const params = new URLSearchParams(window.location.search);
  URL_KEYS.forEach((key) => params.delete(key));
  if (state.view === "tree") params.set("plantView", "tree");
  if (state.query) params.set("q", state.query);
  if (state.scope.plantId) params.set("plant", state.scope.plantId);
  if (state.scope.furnaceId) params.set("furnace", state.scope.furnaceId);
  if (state.scope.lineId) params.set("line", state.scope.lineId);
  if (state.scope.machineId) params.set("machine", state.scope.machineId);
  state.filters.types.forEach((value) => params.append("type", value));
  state.filters.availability.forEach((value) => params.append("avail", value));
  state.filters.partStatus.forEach((value) => params.append("status", value));
  state.filters.categories.forEach((value) => params.append("cat", value));
  state.filters.documentTypes.forEach((value) => params.append("doc", value));
  if (state.filters.inCart) params.set("cart", "1");
  state.filters.years.forEach((value) => params.append("year", value));
  state.filters.service.forEach((value) => params.append("svc", value));
  if (state.sort !== "hierarchy") params.set("sort", state.sort);
  const search = params.toString();
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
}

export function clearPlantUrlState() {
  const params = new URLSearchParams(window.location.search);
  URL_KEYS.forEach((key) => params.delete(key));
  const search = params.toString();
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
}
