import type {
  AccountRecord,
  AssemblyRecord,
  CartRecord,
  CompatibilityStatus,
  DocumentRecord,
  LineItem,
  MachineRecord,
  PartRecord,
  PortalRole,
  ServiceRecord,
  UserRecord,
} from "@/data/portal-data";

export interface EquipmentTreeNode {
  id: string;
  label: string;
  type: "machine" | "assembly" | "part";
  children: EquipmentTreeNode[];
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface SearchResult {
  id: string;
  type: "machine" | "assembly" | "part" | "document" | "service";
  title: string;
  subtitle: string;
  href: string;
}

export type CatalogueContentType = "all" | "machines" | "parts" | "documents";

export interface CatalogueSearchResult {
  id: string;
  type: "machine" | "part" | "document";
  title: string;
  subtitle: string;
}

export function getScopedMachines(
  machines: MachineRecord[],
  account: AccountRecord,
): MachineRecord[] {
  return machines.filter((machine) => account.machineIds.includes(machine.id));
}

export function canPerform(user: UserRecord, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function getEquipmentTree(
  machine: MachineRecord,
  assemblies: AssemblyRecord[],
  parts: PartRecord[],
): EquipmentTreeNode {
  const machineAssemblies = assemblies.filter((assembly) => assembly.machineId === machine.id);

  return {
    id: machine.id,
    label: machine.name,
    type: "machine",
    children: machineAssemblies.map((assembly) => ({
      id: assembly.id,
      label: assembly.name,
      type: "assembly",
      children: parts
        .filter((part) => part.assemblyId === assembly.id)
        .map((part) => ({
          id: part.id,
          label: `${part.partNumber} - ${part.name}`,
          type: "part",
          children: [],
        })),
    })),
  };
}

export function getPartDocuments(
  part: PartRecord,
  documents: DocumentRecord[],
): DocumentRecord[] {
  return documents.filter((document) => document.relatedPartIds.includes(part.id));
}

export function getAssemblyDocuments(
  assembly: AssemblyRecord,
  documents: DocumentRecord[],
): DocumentRecord[] {
  return documents.filter((document) => document.relatedAssemblyIds.includes(assembly.id));
}

export function getMachineDocuments(
  machine: MachineRecord,
  documents: DocumentRecord[],
): DocumentRecord[] {
  return documents.filter((document) => document.relatedMachineIds.includes(machine.id));
}

export function getPartAlternatives(
  part: PartRecord,
  parts: PartRecord[],
): PartRecord[] {
  return (part.alternativePartIds ?? [])
    .map((alternativeId) => parts.find((candidate) => candidate.id === alternativeId))
    .filter((candidate): candidate is PartRecord => candidate !== undefined);
}

export function getCurrentPart(part: PartRecord, parts: PartRecord[]): PartRecord {
  if (!part.supersededById) {
    return part;
  }

  const replacement = parts.find((candidate) => candidate.id === part.supersededById);
  return replacement ? getCurrentPart(replacement, parts) : part;
}

export function getPartCompatibility(
  part: PartRecord,
  machine: MachineRecord,
): CompatibilityStatus {
  if (!part.compatibleMachineIds.includes(machine.id)) {
    return "unavailable";
  }

  if (part.availability === "Superseded") {
    return "warning";
  }

  return "compatible";
}

export function getOrderability(part: PartRecord): CompatibilityStatus {
  if (part.availability === "Superseded") {
    return "warning";
  }

  if (part.availability === "Not available" || part.leadTime === "Not available") {
    return "unavailable";
  }

  return "compatible";
}

export function fitsOwnedEquipment(part: PartRecord, ownedMachineIds: string[]): boolean {
  return part.compatibleMachineIds.some((id) => ownedMachineIds.includes(id));
}

export function getPartNumberHistory(part: PartRecord, parts: PartRecord[]): PartRecord[] {
  const older: PartRecord[] = [];
  let previous = parts.find((candidate) => candidate.id === part.replacesPartId);
  while (previous) {
    older.unshift(previous);
    const cursor: PartRecord = previous;
    previous = parts.find((candidate) => candidate.id === cursor.replacesPartId);
  }

  const newer: PartRecord[] = [];
  let next = parts.find((candidate) => candidate.id === part.supersededById);
  while (next) {
    newer.push(next);
    const cursor: PartRecord = next;
    next = parts.find((candidate) => candidate.id === cursor.supersededById);
  }

  return [...older, part, ...newer];
}

export function getWhereUsed(
  part: PartRecord,
  machines: MachineRecord[],
  assemblies: AssemblyRecord[],
): { machines: MachineRecord[]; assembly?: AssemblyRecord } {
  return {
    machines: machines.filter((machine) => part.compatibleMachineIds.includes(machine.id)),
    assembly: assemblies.find((assembly) => assembly.id === part.assemblyId),
  };
}

export function searchParts(
  query: string,
  parts: PartRecord[],
  machines: MachineRecord[],
  machineFilter?: string,
): PartRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return parts.filter((part) => {
    if (machineFilter && !part.compatibleMachineIds.includes(machineFilter)) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const machineNames = machines
      .filter((machine) => part.compatibleMachineIds.includes(machine.id))
      .map((machine) => machine.name.toLowerCase());

    return [part.partNumber, part.name, part.description, ...machineNames]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function searchCatalogue(
  query: string,
  contentType: CatalogueContentType,
  records: {
    machines: MachineRecord[];
    parts: PartRecord[];
    documents: DocumentRecord[];
  },
  machineFilter?: string,
): CatalogueSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const results: CatalogueSearchResult[] = [];
  const matches = (values: Array<string | undefined>) => !normalizedQuery
    || values.some((value) => value?.toLowerCase().includes(normalizedQuery));

  if (contentType === "all" || contentType === "machines") {
    records.machines
      .filter((machine) => (!machineFilter || machine.id === machineFilter)
        && matches([machine.name, machine.model, machine.serialNumber, machine.configuration]))
      .forEach((machine) => results.push({
        id: machine.id,
        type: "machine",
        title: machine.name,
        subtitle: `${machine.model} · ${machine.configuration}`,
      }));
  }

  if (contentType === "all" || contentType === "parts") {
    searchParts(query, records.parts, records.machines, machineFilter)
      .forEach((part) => results.push({
        id: part.id,
        type: "part",
        title: part.partNumber,
        subtitle: part.name,
      }));
  }

  if (contentType === "all" || contentType === "documents") {
    records.documents
      .filter((document) => (!machineFilter || document.relatedMachineIds.includes(machineFilter))
        && matches([
          document.title,
          document.documentId,
          document.summary,
          document.revision,
          ...records.machines
            .filter((machine) => document.relatedMachineIds.includes(machine.id))
            .map((machine) => machine.name),
        ]))
      .forEach((document) => results.push({
        id: document.id,
        type: "document",
        title: document.title,
        subtitle: `${document.documentId} · ${document.type}`,
      }));
  }

  return results;
}

export function getSearchResults(
  query: string,
  records: {
    machines: MachineRecord[];
    assemblies: AssemblyRecord[];
    parts: PartRecord[];
    documents: DocumentRecord[];
    services: ServiceRecord[];
  },
): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const results: SearchResult[] = [];

  records.machines
    .filter((machine) => [machine.name, machine.model, machine.serialNumber].some((value) => value.toLowerCase().includes(normalizedQuery)))
    .forEach((machine) => results.push({
      id: machine.id,
      type: "machine",
      title: machine.name,
      subtitle: `${machine.model} - ${machine.serialNumber}`,
      href: `/equipment/${machine.id}`,
    }));

  records.assemblies
    .filter((assembly) => [assembly.name, assembly.description].some((value) => value.toLowerCase().includes(normalizedQuery)))
    .forEach((assembly) => results.push({
      id: assembly.id,
      type: "assembly",
      title: assembly.name,
      subtitle: assembly.description,
      href: `/equipment/assemblies/${assembly.id}`,
    }));

  records.parts
    .filter((part) => [part.partNumber, part.name, part.description].some((value) => value.toLowerCase().includes(normalizedQuery)))
    .forEach((part) => results.push({
      id: part.id,
      type: "part",
      title: `${part.partNumber} - ${part.name}`,
      subtitle: part.description,
      href: `/parts/${part.id}`,
    }));

  records.documents
    .filter((document) => [document.title, document.documentId, document.summary].some((value) => value.toLowerCase().includes(normalizedQuery)))
    .forEach((document) => results.push({
      id: document.id,
      type: "document",
      title: document.title,
      subtitle: `${document.documentId} - ${document.type}`,
      href: `/documents/${document.id}`,
    }));

  records.services
    .filter((service) => [service.name, service.category, service.description].some((value) => value.toLowerCase().includes(normalizedQuery)))
    .forEach((service) => results.push({
      id: service.id,
      type: "service",
      title: service.name,
      subtitle: service.description,
      href: `/services/${service.id}`,
    }));

  return results;
}

export function getEquipmentBreadcrumbs(
  machine: MachineRecord,
  assembly?: AssemblyRecord,
  part?: PartRecord,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "My Equipment", href: "/equipment" },
    { label: machine.name, href: `/equipment/${machine.id}` },
  ];

  if (assembly) {
    breadcrumbs.push({ label: assembly.name, href: `/equipment/assemblies/${assembly.id}` });
  }

  if (part) {
    breadcrumbs.push({ label: part.partNumber, href: `/parts/${part.id}` });
  }

  return breadcrumbs;
}

export function getCartSubtotal(
  cart: CartRecord,
  parts: PartRecord[],
  services: ServiceRecord[],
): number {
  return cart.items.reduce((subtotal, item) => {
    if (item.type === "part" && item.partId) {
      const part = parts.find((candidate) => candidate.id === item.partId);
      return subtotal + (part?.unitPrice ?? 0) * (item.quantity ?? 1);
    }

    if (item.type === "service" && item.serviceId) {
      const service = services.find((candidate) => candidate.id === item.serviceId);
      return subtotal + (service?.price ?? 0);
    }

    return subtotal;
  }, 0);
}

export function isLineItemReady(item: LineItem): boolean {
  return item.compatibility === "compatible" && Boolean(item.partId || item.serviceId);
}

export function canSubmitCart(cart: CartRecord): boolean {
  return cart.items.length > 0 && cart.items.every(isLineItemReady);
}

export function getCartNextAction(cart: CartRecord): string {
  if (cart.items.length === 0) {
    return "Add a part or service to begin a quote request.";
  }

  if (!canSubmitCart(cart)) {
    return "Resolve compatibility or item information before submitting.";
  }

  if (cart.status === "draft") {
    return "Review the basket and submit the RFQ.";
  }

  if (cart.status === "quoted") {
    return "Review and accept the quotation.";
  }

  return "View the current transaction status.";
}

export const roleLabels: Record<PortalRole, string> = {
  "Maintenance technician": "Maintenance technician",
  "Procurement and admin": "Procurement and admin",
  "Asset and reliability manager": "Asset and reliability manager",
  "Fleet and engineering manager": "Fleet and engineering manager",
  "Training coordinator": "Training coordinator",
};
