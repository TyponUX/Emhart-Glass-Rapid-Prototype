const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

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
  objectId?: string;
  equipmentType?: string;
  manufacturedDate?: string;
  installationDate?: string;
  pictureNumber?: number;
}

export interface AssemblyRecord {
  id: string;
  machineId: string;
  parentAssemblyId?: string;
  level?: "Equipment";
  name: string;
  description: string;
  imageUrl?: string;
  equipmentType?: string;
  objectId?: string;
  serialNumber?: string;
  manufacturedDate?: string;
  installationDate?: string;
  pictureNumber?: number;
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
  type: "part" | "service" | "equipment";
  partId?: string;
  serviceId?: string;
  installedEquipmentId?: string;
  equipmentId?: string;
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
  topic: string;
	audience: string;
	description: string;
  date: string;
  location: string;
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
      imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    drawingUrl: assetUrl("assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png"),
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
      imageUrl: assetUrl("assets/images/Machines/FleXLube.png"),
    drawingUrl: assetUrl("assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png"),
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
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    drawingUrl: assetUrl("assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png"),
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
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    drawingUrl: assetUrl("assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png"),
  },
  {
    id: "machine-brisbane-ais-10",
    accountId: "account-northstar",
    name: "AIS 10 Section 6 1/4\"",
    model: "AIS 10 Section 6 1/4\"",
    serialNumber: "BEG000216948",
    site: "Visy Glass Brisbane",
    section: "Brisbane Line QG33",
    configuration: "IS machine, 10-section configuration",
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    drawingUrl: assetUrl("assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png"),
    objectId: "210-910-2-2M0019-QG33",
    equipmentType: "Machine",
    manufacturedDate: "7/21/2021",
    installationDate: "7/22/2021",
    pictureNumber: 1,
  },
  {
    id: "machine-demo-is",
    accountId: "account-northstar",
    name: "Prototype IS Machine",
    model: "IS Machine",
    serialNumber: "DEMO-IS-0001",
    site: "Demo Glassworks",
    section: "Demo Line 1",
    configuration: "Prototype sample equipment",
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    drawingUrl: assetUrl("assets/images/technical%20drawings/Blow%20side%20Lifting%20System.png"),
    objectId: "DEMO-IS-0001",
    equipmentType: "Machine",
    pictureNumber: 1,
  },
];

export const assemblies: AssemblyRecord[] = [
  {
    id: "assembly-baffle-mechanism",
    machineId: "machine-ef-512-01",
    name: "535 Servo Gob Distributor",
    description: "Servo-driven gob distribution assembly for controlled glass gob delivery.",
       imageUrl: assetUrl("assets/images/Machines/535%20Servo%20Gob%20Distributor.png"),
  },
  {
    id: "assembly-lubrication",
    machineId: "machine-flexlube-01",
    name: "Lubrication distribution",
    description: "Dual oil pump and zone distribution for the machine line.",
    imageUrl: assetUrl("assets/images/Machines/FleXLube.png"),
  },
  {
    id: "assembly-nis-blowhead",
    machineId: "machine-nis-emhart",
    name: "Blowhead mechanism",
    description: "Quick-change blowhead arms and lock-ring configuration for the blow side.",
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
  },
  {
    id: "assembly-gob-distributor",
    machineId: "machine-servo-gob",
    name: "Gob distribution",
    description: "Servo scoop, trough and deflector assembly for gob delivery.",
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
  },
  ...Array.from({ length: 10 }, (_, index): AssemblyRecord => ({
    id: `assembly-brisbane-section-frame-${index + 1}`,
    machineId: "machine-brisbane-ais-10",
    level: "Equipment",
    name: "SEC AIS2 4-1/4\" TG VISY 2M0019-QG33",
    description: "Installed AIS section frame.",
    equipmentType: "Section Frame",
    objectId: "210-1590-1-2M0019-QG33",
    serialNumber: `BEG000216${String(591 + index)}`,
    manufacturedDate: "6/10/2021",
    pictureNumber: 2,
  })),
  ...[
    { id: "neck-ring", name: "NECK RING MECHANISM", objectId: "191-5149-9", serialNumber: "BEG000212945", manufacturedDate: "11/25/2020", pictureNumber: 3 },
    { id: "servo-invert", name: "SERVO EL INVERT MECHANISM UL", objectId: "200-2000-6", serialNumber: "BEG000217923", manufacturedDate: "4/26/2021", pictureNumber: 4 },
    { id: "moc-valve", name: "MOC MECH AIS2 WITH EXTERNAL CHECK VALVE", objectId: "210-122-8", serialNumber: "BEG000215919", manufacturedDate: "5/27/2021" },
    { id: "blank-mold-support", name: "BLANK MOLD SUPPORT MECHANISM", objectId: "210-2110-7", serialNumber: "BEG000216776", manufacturedDate: "6/8/2021", pictureNumber: 5 },
    { id: "epvb-valve", name: "EPVB 26L VISY 2M0019-QG33", objectId: "210-444-20-2M0019-QG33", serialNumber: "BEG000216746", manufacturedDate: "6/8/2021" },
    { id: "baffle-mechanism", name: "BAFFLE MECH EF5 1/2 PNEUM CUSH", objectId: "210-464-1", serialNumber: "BEG000216560", manufacturedDate: "5/10/2021", pictureNumber: 6 },
    { id: "gearbox", name: "GEARBOX T/O MECH W UL FX3 5M MOTOR CABLE", objectId: "210-480-3-XB", serialNumber: "BEG000216766", manufacturedDate: "5/28/2021", pictureNumber: 7 },
    { id: "plunger", name: "PLUNGER MECHANISM TG 4 1/4", objectId: "62-4043-3", serialNumber: "BEG000219174", manufacturedDate: "5/19/2021", pictureNumber: 8 },
    { id: "funnel", name: "FUNNEL MECH TWO WAY AIR OP O-I", objectId: "801-112-1", serialNumber: "BEG000216736", manufacturedDate: "5/28/2021" },
    { id: "blow-head", name: "BLOW HEAD MECHANISM", objectId: "801-510-6", serialNumber: "BEG000216756", manufacturedDate: "6/3/2021" },
  ].map((mechanism): AssemblyRecord => ({
    id: `assembly-brisbane-${mechanism.id}`,
    machineId: "machine-brisbane-ais-10",
    level: "Equipment",
    name: mechanism.name,
    description: `Installed ${mechanism.name.toLowerCase()}.`,
    equipmentType: "Section Frame Mechanism",
    objectId: mechanism.objectId,
    serialNumber: mechanism.serialNumber,
    manufacturedDate: mechanism.manufacturedDate,
    pictureNumber: mechanism.pictureNumber,
  })),
];

export const parts: PartRecord[] = [
  {
    id: "part-pantograph-arm",
    partNumber: "210-208-1",
    name: "Pantograph Baffle Arm",
    category: "Baffle mechanism",
    description: "Pantograph baffle arm for improved alignment and reduced mechanism force.",
    imageUrl: assetUrl("assets/images/Parts/Pantograph%20Baffle%20Arm%20.png"),
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
    imageUrl: assetUrl("assets/images/Parts/Technical%20News%20Bulletin%20.png"),
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
    imageUrl: assetUrl("assets/images/Parts/Technical%20News%20Bulletin%20.png"),
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
    imageUrl: assetUrl("assets/images/Machines/FleXLube.png"),
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
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
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
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
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
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
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
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
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
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
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
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    assemblyId: "assembly-gob-distributor",
    compatibleMachineIds: ["machine-servo-gob"],
    availability: "Available to order",
    leadTime: "3 weeks",
    unitPrice: 540,
    currency: "EUR",
  },
  {
    id: "part-bris-baffle-arm",
    partNumber: "210-208-3",
    name: "Pantograph baffle arm EF 5 1/2",
    category: "Baffle mechanism",
    description: "Pantograph baffle arm for the EF 5 1/2 pneumatic cushion baffle mechanism.",
    imageUrl: assetUrl("assets/images/Parts/Pantograph%20Baffle%20Arm%20.png"),
    assemblyId: "assembly-brisbane-baffle-mechanism",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "In stock",
    leadTime: "1 week",
    unitPrice: 4380,
    currency: "EUR",
    alternativePartIds: ["part-bris-baffle-arm-hd"],
  },
  {
    id: "part-bris-baffle-arm-hd",
    partNumber: "210-208-4",
    name: "Pantograph baffle arm (heavy duty)",
    category: "Baffle mechanism",
    description: "Heavy-duty variant of the EF 5 1/2 pantograph baffle arm for high-speed jobs.",
    imageUrl: assetUrl("assets/images/Parts/Pantograph%20Baffle%20Arm%20.png"),
    assemblyId: "assembly-brisbane-baffle-mechanism",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "Available to order",
    leadTime: "5 weeks",
    unitPrice: 4920,
    currency: "EUR",
    alternativePartIds: ["part-bris-baffle-arm"],
  },
  {
    id: "part-bris-baffle-cushion",
    partNumber: "210-464-12",
    name: "Pneumatic cushion seal kit",
    category: "Seals and kits",
    description: "Seal kit for the pneumatic cushion of the EF 5 1/2 baffle mechanism.",
    imageUrl: assetUrl("assets/images/Parts/Technical%20News%20Bulletin%20.png"),
    assemblyId: "assembly-brisbane-baffle-mechanism",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "In stock",
    leadTime: "1 week",
    unitPrice: 260,
    currency: "EUR",
  },
  {
    id: "part-bris-blowhead-arm",
    partNumber: "801-510-15",
    name: "Blow head arm TG 4 1/4",
    category: "Blowhead",
    description: "Triple gob blow head arm for the AIS blow head mechanism.",
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
    assemblyId: "assembly-brisbane-blow-head",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "Available to order",
    leadTime: "6 weeks",
    unitPrice: 2790,
    currency: "EUR",
    replacesPartId: "part-bris-blowhead-arm-legacy",
  },
  {
    id: "part-bris-blowhead-arm-legacy",
    partNumber: "801-510-14",
    name: "Blow head arm TG (legacy)",
    category: "Blowhead",
    description: "Superseded blow head arm. Replaced by 801-510-15.",
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
    assemblyId: "assembly-brisbane-blow-head",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "Superseded",
    leadTime: "Not available",
    unitPrice: 0,
    currency: "EUR",
    supersededById: "part-bris-blowhead-arm",
  },
  {
    id: "part-bris-blowhead-lockring",
    partNumber: "801-510-21",
    name: "Blow head lock-ring set",
    category: "Blowhead",
    description: "Lock-ring and lock-pin set for the AIS blow head mechanism.",
    imageUrl: assetUrl("assets/images/Parts/Technical%20News%20Bulletin%20.png"),
    assemblyId: "assembly-brisbane-blow-head",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "Available to order",
    leadTime: "3 weeks",
    unitPrice: 340,
    currency: "EUR",
  },
  {
    id: "part-bris-plunger-cylinder",
    partNumber: "62-4043-17",
    name: "Plunger cylinder TG 4 1/4",
    category: "Plunger",
    description: "Replacement cylinder for the TG 4 1/4 plunger mechanism.",
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    assemblyId: "assembly-brisbane-plunger",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "Available to order",
    leadTime: "8 weeks",
    unitPrice: 3150,
    currency: "EUR",
  },
  {
    id: "part-bris-neck-ring-bearing",
    partNumber: "191-5149-30",
    name: "Neck ring roller bearing",
    category: "Bearings",
    description: "Roller bearing for the neck ring mechanism.",
    imageUrl: assetUrl("assets/images/Parts/Roller%20Bearing%20Neck%20Ring%20Mechanism%20.png"),
    assemblyId: "assembly-brisbane-neck-ring",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "In stock",
    leadTime: "2 weeks",
    unitPrice: 410,
    currency: "EUR",
  },
  {
    id: "part-bris-gearbox-motor",
    partNumber: "210-480-40",
    name: "FX3 servo motor with 5 m cable",
    category: "Drives",
    description: "Servo motor for the take-out gearbox. Currently not available for order.",
    imageUrl: assetUrl("assets/images/Machines/Modular%20machine%20structure%20.png"),
    assemblyId: "assembly-brisbane-gearbox",
    compatibleMachineIds: ["machine-brisbane-ais-10"],
    availability: "Not available",
    leadTime: "Not available",
    unitPrice: 6100,
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
      contentPath: assetUrl("assets/documents/pantograph-baffle-arm-bulletin.md"),
    pdfPath: assetUrl("assets/documents/TNB033RevB%20-%20Pantograph%20Baffle%20Arm.pdf"),
    level: "part",
    relatedMachineIds: ["machine-ef-512-01"],
    relatedAssemblyIds: ["assembly-baffle-mechanism", "assembly-brisbane-baffle-mechanism"],
    relatedPartIds: ["part-pantograph-arm", "part-mounting-set", "part-bris-baffle-arm", "part-bris-baffle-arm-hd"],
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
      contentPath: assetUrl("assets/documents/blowhead-arm-200-202-bulletin.md"),
    pdfPath: assetUrl("assets/documents/TNB040RevA%20-%20Quick-Change%20Blowhead%20Arms%20200-202.pdf"),
    level: "machine",
    relatedMachineIds: ["machine-ef-512-01"],
    relatedAssemblyIds: ["assembly-brisbane-blow-head"],
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
      contentPath: assetUrl("assets/documents/flexlube-system-bulletin.md"),
    pdfPath: assetUrl("assets/documents/TNB221%20%20%20FlexLube.pdf"),
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
      contentPath: assetUrl("assets/documents/pantograph-baffle-troubleshooting.md"),
    level: "part",
    relatedMachineIds: ["machine-ef-512-01"],
    relatedAssemblyIds: ["assembly-baffle-mechanism", "assembly-brisbane-baffle-mechanism"],
    relatedPartIds: ["part-pantograph-arm", "part-mounting-set", "part-bris-baffle-cushion"],
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
  {
    id: "request-sr-2061",
    number: "SR-2061",
    type: "Service request",
    subject: "Blow head arm misalignment on section 6",
    site: "Visy Glass Brisbane",
    machineId: "machine-brisbane-ais-10",
    status: "in-progress",
    priority: "Medium",
    createdAt: "2026-09-24",
    updatedAt: "2026-09-27",
    nextAction: "Emhart Glass support to schedule a remote diagnostics session.",
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
    machineIds: ["machine-ef-512-01", "machine-flexlube-01", "machine-brisbane-ais-10", "machine-demo-is"],
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
  {
    id: "maintenance-brisbane-plunger",
    machineId: "machine-brisbane-ais-10",
    activity: "Replace plunger cylinder and cushion seals",
    dueDate: "2026-10-08",
    status: "due-soon",
    description: "Planned replacement of the TG 4 1/4 plunger cylinder and baffle cushion seals on Brisbane Line QG33.",
    relatedPartIds: ["part-bris-plunger-cylinder", "part-bris-baffle-cushion"],
    relatedDocumentIds: [],
  },
];
export const trainingOfferings: TrainingRecord[] = [
	{
    id: "training-flexinspect-bc-gen-iii",
    title: "FleXinspect BC Gen III Operational & Job Change",
    topic: "FleXinspect",
    audience: "Machine operators and maintenance technicians",
    description: "Operational and job-change training for the FleXinspect BC Gen III inspection system.",
    date: "2026-11-16",
    location: "Munich, Germany",
    compatibleMachineIds: [],
		format: "On-site",
		availability: "requestable",
	},
	{
    id: "training-ais-mechanical-machine",
    title: "AIS Mechanical Machine Training",
    topic: "AIS",
    audience: "Maintenance technicians and mechanical specialists",
    description: "Mechanical machine training focused on AIS equipment operation and practical maintenance.",
    date: "2026-11-23",
    location: "Sundsvall, Sweden",
    compatibleMachineIds: [],
    format: "On-site",
		availability: "requestable",
	},
	{
    id: "training-smartfeeder-technical-operational",
    title: "SMARTFEEDER – Technical & Operational Training",
    topic: "SMARTFEEDER",
    audience: "Machine operators, maintenance technicians, and engineers",
    description: "Technical and operational training for SMARTFEEDER setup, operation, and maintenance.",
    date: "2026-12-01",
    location: "Sundsvall, Sweden",
		compatibleMachineIds: [],
    format: "On-site",
    availability: "requestable",
	},
];