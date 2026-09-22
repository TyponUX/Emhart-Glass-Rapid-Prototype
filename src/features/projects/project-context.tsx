import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type ProjectStatus = "Planning" | "In progress" | "Waiting for parts" | "Completed";
export type ProjectItemType = "part" | "document" | "service";
export type ProjectItemStatus = "Planned" | "Ready to order" | "Ordered" | "Delivered";

export interface ProjectItem {
  id: string;
  type: ProjectItemType;
  name: string;
  reference?: string;
  quantity: number;
  availability: string;
  price?: number;
  currency?: string;
  status: ProjectItemStatus;
  relatedOrder?: string;
  notes?: string;
  selected: boolean;
}

export interface ProjectPackage {
  id: string;
  name: string;
  items: ProjectItem[];
  status?: "Awaiting approval & place order" | "Request clarification" | "Order in progress" | "In transit" | "Delivered";
  quoteNumber?: string;
  quoteId?: string;
  orderId?: string;
  orderNumber?: string;
  shipmentStatus?: string;
}

export interface RepairProject {
  id: string;
  name: string;
  accountId: string;
  machine: string;
  issue: string;
  status: ProjectStatus;
  responsible: string;
  targetDate: string;
  sourceTemplate?: string;
  items: ProjectItem[];
  packages: ProjectPackage[];
}

export interface RepairKitTemplate {
  id: string;
  name: string;
  description: string;
  machine: string;
  issue: string;
  items: Omit<ProjectItem, "id" | "selected">[];
}

export const repairKitTemplates: RepairKitTemplate[] = [
  {
    id: "kit-pantograph-baffle",
    name: "Pantograph baffle repair kit",
    description: "A guided starting point for alignment, mounting, and inspection work.",
    machine: "IS Machine EF 5 1/2",
    issue: "Pantograph baffle alignment and mounting repair",
    items: [
      { type: "part", name: "Pantograph Baffle Arm", reference: "210-208-1", quantity: 1, availability: "Available to order", price: 4280, currency: "EUR", status: "Ready to order" },
      { type: "part", name: "Quick-change mounting parts set", reference: "210-194-2", quantity: 1, availability: "Available to order", price: 1280, currency: "EUR", status: "Ready to order" },
      { type: "document", name: "Pantograph Baffle Arm bulletin", reference: "TNB033RevB", quantity: 1, availability: "Available now", status: "Planned" },
      { type: "service", name: "On-site baffle mechanism inspection", quantity: 1, availability: "Requestable", price: 1850, currency: "EUR", status: "Planned" },
    ],
  },
  {
    id: "kit-gob-distribution",
    name: "Gob distribution service kit",
    description: "A practical starting point for diagnosing and recommissioning gob distribution equipment.",
    machine: "Servo Gob Distributor / FlexGob",
    issue: "Gob distribution inspection and recommissioning",
    items: [
      { type: "part", name: "Servo gob scoop", reference: "300-455-2", quantity: 1, availability: "Available to order", price: 1890, currency: "EUR", status: "Ready to order" },
      { type: "part", name: "Feeder timing valve", reference: "300-120-9", quantity: 1, availability: "Available to order", price: 540, currency: "EUR", status: "Ready to order" },
      { type: "document", name: "Feeder and gob distribution documentation", quantity: 1, availability: "Available now", status: "Planned" },
      { type: "service", name: "Gob distribution inspection and recommissioning", quantity: 1, availability: "Requestable", price: 2200, currency: "EUR", status: "Planned" },
    ],
  },
];

interface ProjectContextValue {
  projects: RepairProject[];
  activeProjectId?: string;
  activeProject?: RepairProject;
  setActiveProject: (projectId?: string) => void;
  createProject: (project: Omit<RepairProject, "id" | "items" | "packages">) => string;
  startFromKit: (kit: RepairKitTemplate) => void;
  updateProjectItems: (projectId: string, itemIds: string[]) => void;
  updateItem: (projectId: string, itemId: string, changes: Partial<ProjectItem>) => void;
  updateProject: (projectId: string, changes: Partial<Omit<RepairProject, "id" | "items" | "packages">>) => void;
  deleteProject: (projectId: string) => void;
  addItemToProject: (projectId: string, item: Omit<ProjectItem, "id" | "selected">) => void;
  createPurchaseBatch: (projectId: string) => string | undefined;
  updatePackageQuote: (projectId: string, packageId: string, quote: { id: string; number: string }) => void;
  updatePackageOrderByQuote: (quoteId: string, order: { id: string; number: string }) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

function makeItems(items: RepairKitTemplate["items"]): ProjectItem[] {
  return items.map((item, index) => ({ ...item, id: `${Date.now()}-${index}`, selected: true }));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<RepairProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>();

  const value = useMemo<ProjectContextValue>(() => ({
    projects,
    activeProjectId,
    activeProject: projects.find((project) => project.id === activeProjectId),
    setActiveProject: setActiveProjectId,
    createProject: (project) => {
      const id = `project-${Date.now()}`;
      setProjects((current) => [...current, { ...project, id, items: [], packages: [] }]);
      setActiveProjectId(id);
      return id;
    },
    startFromKit: (kit) => {
      const id = `project-${Date.now()}`;
      setProjects((current) => [...current, { id, name: kit.name, accountId: "account-northstar", machine: kit.machine, issue: kit.issue, status: "Planning", responsible: "Marek", targetDate: "2026-12-31", sourceTemplate: kit.name, items: makeItems(kit.items), packages: [] }]);
      setActiveProjectId(id);
    },
    updateProjectItems: (projectId, itemIds) => setProjects((current) => current.map((project) => project.id !== projectId ? project : { ...project, items: project.items.map((item) => ({ ...item, selected: itemIds.includes(item.id) })) })),
    updateItem: (projectId, itemId, changes) => setProjects((current) => current.map((project) => project.id !== projectId ? project : { ...project, items: project.items.map((item) => item.id === itemId ? { ...item, ...changes } : item) })),
    updateProject: (projectId, changes) => setProjects((current) => current.map((project) => project.id === projectId ? { ...project, ...changes } : project)),
    deleteProject: (projectId) => {
      setProjects((current) => current.filter((project) => project.id !== projectId));
      setActiveProjectId((current) => current === projectId ? undefined : current);
    },
    addItemToProject: (projectId, item) => setProjects((current) => current.map((project) => project.id !== projectId ? project : { ...project, items: [...project.items, { ...item, id: `${Date.now()}-${project.items.length}`, selected: true }] })),
    createPurchaseBatch: (projectId) => {
      const packageId = `package-${Date.now()}`;
      setProjects((current) => current.map((project) => {
        if (project.id !== projectId) return project;
        const packageNumber = project.packages.length + 1;
        const selectedItems = project.items.filter((item) => item.selected && item.status === "Ready to order").map((item) => ({ ...item, status: "Ordered" as const, selected: false, relatedOrder: `Package ${packageNumber}` }));
        if (selectedItems.length === 0) return project;
        return { ...project, packages: [...project.packages, { id: packageId, name: `${project.name} · Package ${packageNumber}`, items: selectedItems, shipmentStatus: "Package ready for quote" }], items: project.items.filter((item) => !selectedItems.some((selectedItem) => selectedItem.id === item.id)), status: "In progress" };
      }));
      return packageId;
    },
    updatePackageQuote: (projectId, packageId, quote) => setProjects((current) => current.map((project) => project.id !== projectId ? project : { ...project, packages: project.packages.map((projectPackage) => projectPackage.id === packageId ? { ...projectPackage, quoteId: quote.id, quoteNumber: quote.number, status: "Awaiting approval & place order", shipmentStatus: "Quote requested" } : projectPackage) })),
    updatePackageOrderByQuote: (quoteId, order) => setProjects((current) => current.map((project) => ({ ...project, packages: project.packages.map((projectPackage) => projectPackage.quoteId === quoteId ? { ...projectPackage, orderId: order.id, orderNumber: order.number, status: "Order in progress", shipmentStatus: "Order confirmed" } : projectPackage) }))),
  }), [activeProjectId, projects]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used inside ProjectProvider");
  return context;
}
