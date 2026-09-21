export type Status =
  | "draft"
  | "requested"
  | "quoted"
  | "pending-clarification"
  | "confirmed"
  | "in-progress"
  | "delivered"
  | "complete"
  | "current"
  | "reference"
  | "under-review"
  | "quote-available"
  ;

export type DocumentType = "Machine overview" | "Technical bulletin" | "Troubleshooting guide";

export type PortalRole =
  | "Maintenance technician"
  | "Procurement and admin"
  | "Asset and reliability manager"
  | "Fleet and engineering manager"
  | "Training coordinator";

export type CartStatus =
  | "empty"
  | "draft"
  | "submitted"
  | "quoted"
  | "accepted"
  | "ordered";

export type CompatibilityStatus = "compatible" | "warning" | "unavailable";

export type EquipmentLevel = "machine" | "assembly" | "part";

export interface AccountRecord {
  id: string;
  organisation: string;
  sites: string[];
  machineIds: string[];
}

export type UserStatus = "active" | "invited" | "deactivated";

export interface UserRecord {
  id: string;
  name: string;
  role: PortalRole;
  accountIds: string[];
  permissions: string[];
  status: UserStatus;
}

export interface MachineRecord {
  id: string;
  accountId: string;
  name: string;
  model: string;
  serialNumber: string;
  site: string;
  section: string;
  configuration: string;
  imageUrl: string;
  drawingUrl: string;
}

export interface AssemblyRecord {
  id: string;
  machineId: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface PartRecord {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  assemblyId?: string;
  compatibleMachineIds: string[];
  availability: string;
  leadTime: string;
  unitPrice: number;
  currency: string;
  supersededById?: string;
  replacesPartId?: string;
  alternativePartIds?: string[];
}

export interface ServiceRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  compatibleMachineIds: string[];
  leadTime: string;
  price?: number;
  currency?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  type: DocumentType;
  documentId: string;
  revision?: string;
  date?: string;
  status: Status;
  summary: string;
  contentPath: string;
  pdfPath?: string;
  level: EquipmentLevel;
  relatedMachineIds: string[];
  relatedAssemblyIds: string[];
  relatedPartIds: string[];
}

export interface LineItem {
  id: string;
  type: "part" | "service";
  partId?: string;
  serviceId?: string;
  equipmentId: string;
  quantity?: number;
  scope?: string;
  deliveryLocation?: string;
  compatibility: CompatibilityStatus;
}

export interface CartRecord {
  id: string;
  accountId: string;
  status: CartStatus;
  items: LineItem[];
}

export type MaintenanceStatus = "upcoming" | "due-soon" | "overdue" | "complete";

export interface MaintenanceRecord {
  id: string;
  machineId: string;
  activity: string;
  dueDate: string;
  status: MaintenanceStatus;
  description: string;
  relatedPartIds: string[];
  relatedDocumentIds: string[];
}

export interface TrainingRecord {
	id: string;
	title: string;
	audience: string;
	description: string;
	compatibleMachineIds: string[];
	format: "On-site" | "Remote" | "Catalogue only";
	availability: "requestable" | "unavailable";
}

export interface RequestRecord {
  id: string;
  number: string;
  type: "Service request" | "Quote request";
  subject: string;
  site: string;
  machineId: string;
  status: Status;
  priority: "Low" | "Medium" | "High";
  createdAt: string;
  updatedAt: string;
  nextAction: string;
}

export interface QuoteRecord {
  id: string;
  number: string;
  requestNumber: string;
  status: Status;
  validUntil: string;
  total: number;
  currency: string;
}

export interface OrderRecord {
  id: string;
  number: string;
  quoteNumber: string;
  status: Status;
  deliveryDate: string;
  site: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  status: Status;
  read: boolean;
  relatedId: string;
  createdAt: string;
}

export const machines: MachineRecord[] = [
  {
    id: "machine-ef-512-01",
    accountId: "account-northstar",
    name: "IS Machine EF 5 1/2",
    model: "EF 5 1/2",
    serialNumber: "EF512-NSP-0042",
    site: "Northstar Glass Plant",
    section: "Section 4",
    configuration: "DG 5 1/2, pantograph baffle configuration",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
    drawingUrl: "/assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png",
  },
  {
    id: "machine-flexlube-01",
    accountId: "account-northstar",
    name: "FleXLube installation",
    model: "IS Machine lubrication system",
    serialNumber: "FLX-NSP-0017",
    site: "Northstar Glass Plant",
    section: "Machine distribution",
    configuration: "Dual oil pump with four-zone distribution",
    imageUrl: "/assets/images/Machines/FleXLube.png",
    drawingUrl: "/assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png",
  },
  {
    id: "machine-nis-emhart",
    accountId: "catalogue-emhart",
    name: "NIS Machine",
    model: "NIS",
    serialNumber: "Catalogue reference",
    site: "Emhart Glass catalogue",
    section: "Forming",
    configuration: "Individual section machine, triple gob",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
    drawingUrl: "/assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png",
  },
  {
    id: "machine-servo-gob",
    accountId: "catalogue-emhart",
    name: "Servo Gob Distributor",
    model: "FlexGob",
    serialNumber: "Catalogue reference",
    site: "Emhart Glass catalogue",
    section: "Feeder",
    configuration: "Servo-driven scoop, trough and deflector distribution",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
    drawingUrl: "/assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png",
  },
];

export const assemblies: AssemblyRecord[] = [
  {
    id: "assembly-baffle-mechanism",
    machineId: "machine-ef-512-01",
    name: "Baffle mechanism",
    description: "Pantograph baffle mechanism and mounting for Section 4.",
    imageUrl: "/assets/images/Assembley%20organism/Redesigned%20Mounting%20Parts%20for%20Pantograph%20Baffle%20.png",
  },
  {
    id: "assembly-lubrication",
    machineId: "machine-flexlube-01",
    name: "Lubrication distribution",
    description: "Dual oil pump and zone distribution for the machine line.",
    imageUrl: "/assets/images/Machines/FleXLube.png",
  },
  {
    id: "assembly-nis-blowhead",
    machineId: "machine-nis-emhart",
    name: "Blowhead mechanism",
    description: "Quick-change blowhead arms and lock-ring configuration for the blow side.",
    imageUrl: "/assets/images/Parts/Pantograph%20Baffle%20Arm%20.png",
  },
  {
    id: "assembly-gob-distributor",
    machineId: "machine-servo-gob",
    name: "Gob distribution",
    description: "Servo scoop, trough and deflector assembly for gob delivery.",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
  },
];

export const parts: PartRecord[] = [
  {
    id: "part-pantograph-arm",
    partNumber: "210-208-1",
    name: "Pantograph Baffle Arm",
    category: "Baffle mechanism",
    description: "Pantograph baffle arm for improved alignment and reduced mechanism force.",
    imageUrl: "/assets/images/Assembley%20organism/Redesigned%20Mounting%20Parts%20for%20Pantograph%20Baffle%20.png",
    assemblyId: "assembly-baffle-mechanism",
    compatibleMachineIds: ["machine-ef-512-01"],
    availability: "Available to order",
    leadTime: "4 weeks",
    unitPrice: 4280,
    currency: "EUR",
    alternativePartIds: ["part-mounting-set"],
  },
  {
    id: "part-mounting-set",
    partNumber: "210-194-2",
    name: "Quick-change mounting parts set",
    category: "Mounting parts",
    description: "Mounting parts used to connect the pantograph baffle arm to the baffle piston rod.",
    imageUrl: "/assets/images/Parts/Pantograph%20Baffle%20Arm%20.png",
    assemblyId: "assembly-baffle-mechanism",
    compatibleMachineIds: ["machine-ef-512-01"],
    availability: "Available to order",
    leadTime: "4 weeks",
    unitPrice: 1280,
    currency: "EUR",
    replacesPartId: "part-mounting-set-legacy",
  },
  {
    id: "part-mounting-set-legacy",
    partNumber: "210-194-1",
    name: "Quick-change mounting parts set (legacy)",
    category: "Mounting parts",
    description: "Superseded mounting parts set. Replaced by 210-194-2.",
    imageUrl: "/assets/images/Parts/Pantograph%20Baffle%20Arm%20.png",
    assemblyId: "assembly-baffle-mechanism",
    compatibleMachineIds: ["machine-ef-512-01"],
    availability: "Superseded",
    leadTime: "Not available",
    unitPrice: 0,
    currency: "EUR",
    supersededById: "part-mounting-set",
  },
  {
    id: "part-flexlube-pump",
    partNumber: "200-1901-8",
    name: "Dual oil pump unit with controls",
    category: "Lubrication system",
    description: "Dual oil pump unit with control panel for up to 12 zones.",
    imageUrl: "/assets/images/Machines/FleXLube.png",
    assemblyId: "assembly-lubrication",
    compatibleMachineIds: ["machine-flexlube-01"],
    availability: "Available to order",
    leadTime: "6 weeks",
    unitPrice: 3560,
    currency: "EUR",
  },
  {
    id: "part-blowhead-arm",
    partNumber: "200-202-1",
    name: "Quick-change blowhead arm",
    category: "Blowhead",
    description: "Quick-change blowhead arm with standardised lock-ring interface for triple gob forming.",
    imageUrl: "/assets/images/Parts/Pantograph%20Baffle%20Arm%20.png",
    assemblyId: "assembly-nis-blowhead",
    compatibleMachineIds: ["machine-nis-emhart", "machine-ef-512-01"],
    availability: "Available to order",
    leadTime: "5 weeks",
    unitPrice: 2650,
    currency: "EUR",
    alternativePartIds: ["part-blowhead-arm-sg"],
  },
  {
    id: "part-blowhead-arm-sg",
    partNumber: "200-202-2",
    name: "Blowhead arm (single gob)",
    category: "Blowhead",
    description: "Single gob variant of the quick-change blowhead arm.",
    imageUrl: "/assets/images/Parts/Pantograph%20Baffle%20Arm%20.png",
    assemblyId: "assembly-nis-blowhead",
    compatibleMachineIds: ["machine-nis-emhart"],
    availability: "Available to order",
    leadTime: "5 weeks",
    unitPrice: 2450,
    currency: "EUR",
    alternativePartIds: ["part-blowhead-arm"],
  },
  {
    id: "part-lockring-set",
    partNumber: "200-210-5",
    name: "Lock-ring and lock-pin set",
    category: "Blowhead",
    description: "Standardised lock-ring and lock-pin set for quick-change blowhead and baffle arms.",
    imageUrl: "/assets/images/Parts/Pantograph%20Baffle%20Arm%20.png",
    assemblyId: "assembly-nis-blowhead",
    compatibleMachineIds: ["machine-nis-emhart", "machine-ef-512-01"],
    availability: "In stock",
    leadTime: "2 weeks",
    unitPrice: 320,
    currency: "EUR",
  },
  {
    id: "part-gob-scoop",
    partNumber: "300-455-2",
    name: "Servo gob scoop",
    category: "Gob distribution",
    description: "Servo-driven gob scoop for the FlexGob distributor.",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
    assemblyId: "assembly-gob-distributor",
    compatibleMachineIds: ["machine-servo-gob"],
    availability: "Available to order",
    leadTime: "6 weeks",
    unitPrice: 1890,
    currency: "EUR",
    replacesPartId: "part-gob-scoop-legacy",
  },
  {
    id: "part-gob-scoop-legacy",
    partNumber: "300-455-1",
    name: "Servo gob scoop (legacy)",
    category: "Gob distribution",
    description: "Superseded gob scoop. Replaced by 300-455-2.",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
    assemblyId: "assembly-gob-distributor",
    compatibleMachineIds: ["machine-servo-gob"],
    availability: "Superseded",
    leadTime: "Not available",
    unitPrice: 0,
    currency: "EUR",
    supersededById: "part-gob-scoop",
  },
  {
    id: "part-feeder-valve",
    partNumber: "300-120-9",
    name: "Feeder timing valve",
    category: "Feeder",
    description: "Timing valve for servo gob distribution and shear synchronisation.",
    imageUrl: "/assets/images/Machines/Modular%20machine%20structure%20.png",
    assemblyId: "assembly-gob-distributor",
    compatibleMachineIds: ["machine-servo-gob"],
    availability: "Available to order",
    leadTime: "3 weeks",
    unitPrice: 540,
    currency: "EUR",
  },
];

export const documents: DocumentRecord[] = [
  {
    id: "document-tnb033",
    title: "Pantograph Baffle Arm",
    type: "Technical bulletin",
    documentId: "TNB033RevB",
    revision: "Rev B",
    date: "October 2006",
    status: "reference",
    summary: "Improved alignment, reduced force, and prolonged service life for the baffle mechanism.",
    contentPath: "/assets/documents/pantograph-baffle-arm-bulletin.md",
    pdfPath: "/assets/documents/TNB033RevB%20-%20Pantograph%20Baffle%20Arm.pdf",
    level: "part",
    relatedMachineIds: ["machine-ef-512-01"],
    relatedAssemblyIds: ["assembly-baffle-mechanism"],
    relatedPartIds: ["part-pantograph-arm", "part-mounting-set"],
  },
  {
    id: "document-tnb040",
    title: "Quick-Change Blowhead Arms 200-202",
    type: "Technical bulletin",
    documentId: "TNB040RevA",
    revision: "Rev A",
    date: "June 1995",
    status: "reference",
    summary: "Standardised lock-ring and lock-pin configurations for SG, DG, and TG blowhead arms.",
    contentPath: "/assets/documents/blowhead-arm-200-202-bulletin.md",
    pdfPath: "/assets/documents/TNB040RevA%20-%20Quick-Change%20Blowhead%20Arms%20200-202.pdf",
    level: "machine",
    relatedMachineIds: ["machine-ef-512-01"],
    relatedAssemblyIds: [],
    relatedPartIds: [],
  },
  {
    id: "document-tnb221",
    title: "FleXLube Lubrication System",
    type: "Technical bulletin",
    documentId: "TNB221",
    date: "April 2012",
    status: "reference",
    summary: "Central lubrication connection and zone concept for Emhart IS machine lines.",
    contentPath: "/assets/documents/flexlube-system-bulletin.md",
    pdfPath: "/assets/documents/TNB221%20%20%20FlexLube.pdf",
    level: "assembly",
    relatedMachineIds: ["machine-flexlube-01"],
    relatedAssemblyIds: ["assembly-lubrication"],
    relatedPartIds: ["part-flexlube-pump"],
  },
  {
    id: "document-troubleshooting-baffle",
    title: "Pantograph Baffle Troubleshooting Guide",
    type: "Troubleshooting guide",
    documentId: "EG-TS-Baffle-001",
    revision: "Prototype",
    status: "current",
    summary: "Checks for alignment, wear, mounting, and escalation of pantograph baffle issues.",
    contentPath: "/assets/documents/pantograph-baffle-troubleshooting.md",
    level: "part",
    relatedMachineIds: ["machine-ef-512-01"],
    relatedAssemblyIds: ["assembly-baffle-mechanism"],
    relatedPartIds: ["part-pantograph-arm", "part-mounting-set"],
  },
];

export const requests: RequestRecord[] = [
  {
    id: "request-sr-2048",
    number: "SR-2048",
    type: "Service request",
    subject: "Pantograph baffle alignment is inconsistent",
    site: "Northstar Glass Plant",
    machineId: "machine-ef-512-01",
    status: "under-review",
    priority: "High",
    createdAt: "2026-09-19",
    updatedAt: "2026-09-19",
    nextAction: "Emhart Glass support to review the attached evidence.",
  },
  {
    id: "request-q-2026-0147",
    number: "Q-2026-0147",
    type: "Quote request",
    subject: "Pantograph baffle mounting parts",
    site: "Northstar Glass Plant",
    machineId: "machine-ef-512-01",
    status: "quote-available",
    priority: "Medium",
    createdAt: "2026-09-18",
    updatedAt: "2026-09-19",
    nextAction: "Review the quote and accept or request clarification.",
  },
];

export const quotes: QuoteRecord[] = [
  {
    id: "quote-q-2026-0147",
    number: "Q-2026-0147",
    requestNumber: "Q-2026-0147",
    status: "quote-available",
    validUntil: "2026-10-19",
    total: 2005,
    currency: "EUR",
  },
];

export const orders: OrderRecord[] = [
  {
    id: "order-2026-0091",
    number: "ORD-2026-0091",
    quoteNumber: "Q-2026-0147",
    status: "in-progress",
    deliveryDate: "2026-10-17",
    site: "Northstar Glass Plant",
  },
];

export const notifications: NotificationRecord[] = [
  {
    id: "notification-quote",
    title: "Quote available",
    message: "Quote Q-2026-0147 is ready for review.",
    status: "quote-available",
    read: false,
    relatedId: "quote-q-2026-0147",
    createdAt: "2026-09-19",
  },
  {
    id: "notification-support",
    title: "Support request under review",
    message: "Request SR-2048 is being reviewed by Emhart Glass support.",
    status: "under-review",
    read: true,
    relatedId: "request-sr-2048",
    createdAt: "2026-09-19",
  },
];

export const portalRoles: PortalRole[] = [
  "Maintenance technician",
  "Procurement and admin",
  "Asset and reliability manager",
  "Fleet and engineering manager",
  "Training coordinator",
];

export const accounts: AccountRecord[] = [
  {
    id: "account-northstar",
    organisation: "Northstar Glass Plant",
    sites: ["Northstar Glass Plant"],
    machineIds: ["machine-ef-512-01", "machine-flexlube-01"],
  },
];

export const users: UserRecord[] = [
  {
    id: "user-marek",
    name: "Marek",
    role: "Maintenance technician",
    accountIds: ["account-northstar"],
    permissions: ["view-equipment", "identify-parts", "download-documents", "create-support-request"],
    status: "active",
  },
  {
    id: "user-sophie",
    name: "Sophie",
    role: "Procurement and admin",
    accountIds: ["account-northstar"],
    permissions: ["request-quote", "review-pricing", "upload-po", "place-order", "track-order"],
    status: "active",
  },
];

export const services: ServiceRecord[] = [
  {
    id: "service-baffle-inspection",
    name: "On-site baffle mechanism inspection",
    category: "Inspection",
    description: "Scheduled on-site inspection and alignment check of the baffle mechanism.",
    compatibleMachineIds: ["machine-ef-512-01"],
    leadTime: "3 weeks",
    price: 1450,
    currency: "EUR",
  },
  {
    id: "service-remote-support",
    name: "Remote diagnostics support",
    category: "Support",
    description: "Remote diagnostic session with an Emhart Glass specialist for troubleshooting and setup.",
    compatibleMachineIds: ["machine-ef-512-01", "machine-flexlube-01", "machine-nis-emhart", "machine-servo-gob"],
    leadTime: "48 hours",
    price: 600,
    currency: "EUR",
  },
  {
    id: "service-blowhead-overhaul",
    name: "Blowhead overhaul package",
    category: "Overhaul",
    description: "Workshop overhaul of quick-change blowhead arms including lock-ring replacement.",
    compatibleMachineIds: ["machine-nis-emhart", "machine-ef-512-01"],
    leadTime: "5 weeks",
    price: 7800,
    currency: "EUR",
  },
  {
    id: "service-flexlube-commissioning",
    name: "FleXLube commissioning",
    category: "Commissioning",
    description: "On-site commissioning and zone calibration of the FleXLube lubrication system.",
    compatibleMachineIds: ["machine-flexlube-01"],
    leadTime: "2 weeks",
    price: 3200,
    currency: "EUR",
  },
];

export const carts: CartRecord[] = [
  {
    id: "cart-northstar-draft",
    accountId: "account-northstar",
    status: "draft",
    items: [
      {
        id: "line-item-1",
        type: "part",
        partId: "part-mounting-set",
        equipmentId: "machine-ef-512-01",
        quantity: 1,
        deliveryLocation: "Northstar Glass Plant",
        compatibility: "compatible",
      },
      {
        id: "line-item-2",
        type: "service",
        serviceId: "service-baffle-inspection",
        equipmentId: "machine-ef-512-01",
        scope: "Section 4 baffle mechanism",
        deliveryLocation: "Northstar Glass Plant",
        compatibility: "compatible",
      },
    ],
  },
];

export const maintenanceActivities: MaintenanceRecord[] = [
  {
    id: "maintenance-baffle-inspection",
    machineId: "machine-ef-512-01",
    activity: "Inspect pantograph baffle alignment",
    dueDate: "2026-10-04",
    status: "due-soon",
    description: "Check alignment, pivot points, and mounting wear before the next planned production run.",
    relatedPartIds: ["part-pantograph-arm", "part-mounting-set"],
    relatedDocumentIds: ["document-tnb033", "document-troubleshooting-baffle"],
  },
  {
    id: "maintenance-lube-check",
    machineId: "machine-flexlube-01",
    activity: "Review FleXLube zone timing",
    dueDate: "2026-09-26",
    status: "upcoming",
    description: "Review lubrication intervals and confirm each zone receives the required oil supply.",
    relatedPartIds: ["part-flexlube-pump"],
    relatedDocumentIds: ["document-tnb221"],
  },
];
export const trainingOfferings: TrainingRecord[] = [
	{
		id: "training-baffle-maintenance",
		title: "Pantograph baffle maintenance fundamentals",
		audience: "Maintenance technicians and reliability teams",
		description: "Practical guidance for inspecting alignment, mounting parts, and common wear signals on the pantograph baffle mechanism.",
		compatibleMachineIds: ["machine-ef-512-01"],
		format: "On-site",
		availability: "requestable",
	},
	{
		id: "training-flexlube-operations",
		title: "FleXLube zone operation",
		audience: "Machine operators and maintenance technicians",
		description: "An equipment overview covering zone distribution, oil pump controls, and routine checks for the FleXLube installation.",
		compatibleMachineIds: ["machine-flexlube-01"],
		format: "Remote",
		availability: "requestable",
	},
	{
		id: "training-advanced-diagnostics",
		title: "Advanced IS machine diagnostics",
		audience: "Engineering and reliability managers",
		description: "A future training concept for advanced diagnostics. Details and scheduling are not available in this prototype.",
		compatibleMachineIds: [],
		format: "Catalogue only",
		availability: "unavailable",
	},
];