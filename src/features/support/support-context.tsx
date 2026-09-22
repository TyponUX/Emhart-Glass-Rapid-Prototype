import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type SupportStatus = "draft" | "submitted" | "under-review" | "pending-customer" | "in-progress" | "resolved" | "closed";
export type ProductionImpact = "stopped" | "degraded" | "unaffected";
export type NextActionOwner = "Customer" | "Emhart Glass" | "None";

export interface SupportAttachment {
  id: string;
  name: string;
  type: "Photo" | "Video" | "PDF" | "Log" | "Checklist" | "Portal document";
}

export interface SupportMessage {
  id: string;
  sender: "Customer" | "Emhart Glass" | "System";
  text: string;
  date: string;
  unread?: boolean;
}

export interface SupportRequest {
  id: string;
  number: string;
  accountId: string;
  site: string;
  machineId: string;
  assemblyId?: string;
  partId?: string;
  relatedDocumentIds: string[];
  category: string;
  priority: "Low" | "Medium" | "High";
  subject: string;
  description: string;
  startedAt: string;
  productionImpact: ProductionImpact;
  attemptedSteps: string;
  status: SupportStatus;
  assignedSpecialist?: string;
  nextActionOwner: NextActionOwner;
  nextAction: string;
  expectedResponse?: string;
  attachments: SupportAttachment[];
  messages: SupportMessage[];
  resolutionSummary?: string;
  rootCause?: string;
  actionsTaken?: string;
  followUp?: string;
  feedback?: string;
  feedbackRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportDraftContext {
  accountId: string;
  site: string;
  machineId: string;
  assemblyId?: string;
  partId?: string;
  documentId?: string;
}

interface SupportContextValue {
  supportRequests: SupportRequest[];
  selectedRequestId?: string;
  draftContext?: SupportDraftContext;
  selectRequest: (id: string) => void;
  beginRequest: (context: SupportDraftContext) => void;
  clearDraftContext: () => void;
  createRequest: (request: Omit<SupportRequest, "id" | "number" | "status" | "assignedSpecialist" | "nextActionOwner" | "nextAction" | "expectedResponse" | "messages" | "resolutionSummary" | "rootCause" | "actionsTaken" | "followUp" | "feedback" | "createdAt" | "updatedAt">) => string;
  submitRequest: (id: string) => void;
  addAttachment: (id: string, attachment: Omit<SupportAttachment, "id">) => void;
  addMessage: (id: string, sender: SupportMessage["sender"], text: string) => void;
  startReview: (id: string) => void;
  requestCustomerInfo: (id: string, text: string) => void;
  resolveRequest: (id: string, resolution: { summary: string; rootCause: string; actionsTaken: string; followUp: string }) => void;
  confirmResolved: (id: string) => void;
  reopenRequest: (id: string, note: string) => void;
  submitFeedback: (id: string, feedback: string, rating: number) => void;
  markMessagesRead: (id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const now = () => "Just now";

const initialRequest: SupportRequest = {
  id: "request-sr-2048",
  number: "SR-2048",
  accountId: "account-northstar",
  site: "Northstar Glass Plant",
  machineId: "machine-ef-512-01",
  assemblyId: "assembly-baffle-mechanism",
  partId: "part-pantograph-arm",
  relatedDocumentIds: ["document-troubleshooting-baffle"],
  category: "Mechanical issue",
  priority: "High",
  subject: "Pantograph baffle alignment is inconsistent",
  description: "Alignment becomes inconsistent during production start-up.",
  startedAt: "2026-09-19",
  productionImpact: "degraded",
  attemptedSteps: "Checked mounting torque and completed the troubleshooting guide.",
  status: "under-review",
  assignedSpecialist: "Elena Fischer",
  nextActionOwner: "Emhart Glass",
  nextAction: "Review the attached evidence and propose the next diagnostic step.",
  expectedResponse: "Within 4 business hours",
  attachments: [
    { id: "attachment-1", name: "baffle-alignment-checklist.pdf", type: "Checklist" },
    { id: "attachment-2", name: "Pantograph Baffle Troubleshooting Guide", type: "Portal document" },
  ],
  messages: [
    { id: "message-1", sender: "Customer", text: "Baffle alignment is inconsistent during production start-up. Photos and completed checks are attached.", date: "Today, 09:12" },
    { id: "message-2", sender: "Emhart Glass", text: "Thanks. We are reviewing the machine configuration and mounting parts.", date: "Today, 10:04", unread: true },
  ],
  createdAt: "2026-09-19",
  updatedAt: "2026-09-20",
};

const additionalRequests: SupportRequest[] = [
  {
    id: "request-sr-2049",
    number: "SR-2049",
    accountId: "account-northstar",
    site: "Northstar Glass Plant",
    machineId: "machine-flexlube-01",
    assemblyId: "assembly-lubrication",
    partId: "part-flexlube-pump",
    relatedDocumentIds: ["document-tnb221"],
    category: "Controls and software",
    priority: "High",
    subject: "FleXLube zone 3 pressure alarm",
    description: "Zone 3 intermittently reports low pressure even though the reservoir level is normal.",
    startedAt: "2026-09-20",
    productionImpact: "degraded",
    attemptedSteps: "Checked the reservoir level, inspected visible lines, and restarted the control panel.",
    status: "pending-customer",
    assignedSpecialist: "Jonas Keller",
    nextActionOwner: "Customer",
    nextAction: "Upload the zone-pressure log and confirm the alarm code shown on the panel.",
    expectedResponse: "Within 4 business hours after your reply",
    attachments: [
      { id: "attachment-2049-1", name: "FleXLube Lubrication System", type: "Portal document" },
    ],
    messages: [
      { id: "message-2049-1", sender: "Customer", text: "Zone 3 pressure drops briefly during start-up and triggers an alarm.", date: "Today, 08:25" },
      { id: "message-2049-2", sender: "System", text: "Jonas Keller was assigned and triage started.", date: "Today, 09:10" },
      { id: "message-2049-3", sender: "Emhart Glass", text: "Please upload the zone-pressure log and confirm the alarm code displayed on the control panel.", date: "Today, 09:18", unread: true },
    ],
    createdAt: "2026-09-20",
    updatedAt: "2026-09-20",
  },
  {
    id: "request-sr-2050",
    number: "SR-2050",
    accountId: "account-northstar",
    site: "Northstar Glass Plant",
    machineId: "machine-ef-512-01",
    assemblyId: "assembly-baffle-mechanism",
    partId: "part-mounting-set",
    relatedDocumentIds: ["document-tnb033"],
    category: "Mechanical issue",
    priority: "Medium",
    subject: "Baffle mounting set wear confirmed",
    description: "Excessive play was found in the quick-change mounting set during planned inspection.",
    startedAt: "2026-09-12",
    productionImpact: "unaffected",
    attemptedSteps: "Measured play against the technical bulletin and inspected the lock pin.",
    status: "closed",
    assignedSpecialist: "Elena Fischer",
    nextActionOwner: "None",
    nextAction: "Request closed. Feedback is optional.",
    expectedResponse: "Completed",
    attachments: [
      { id: "attachment-2050-1", name: "mounting-set-inspection.jpg", type: "Photo" },
      { id: "attachment-2050-2", name: "Pantograph Baffle Arm", type: "Portal document" },
    ],
    messages: [
      { id: "message-2050-1", sender: "Customer", text: "The mounting set exceeds the permitted play. Inspection photo attached.", date: "2026-09-12, 14:20" },
      { id: "message-2050-2", sender: "Emhart Glass", text: "Replace the mounting set with part 210-194-2 and verify alignment after installation.", date: "2026-09-13, 09:05" },
      { id: "message-2050-3", sender: "System", text: "Customer confirmed the repair and closed the request.", date: "2026-09-15, 16:40" },
    ],
    resolutionSummary: "Mounting set replaced and baffle alignment verified.",
    rootCause: "Wear in the legacy mounting set introduced excess play.",
    actionsTaken: "Installed part 210-194-2 and completed an alignment check.",
    followUp: "Inspect mounting play at the next planned maintenance interval.",
    createdAt: "2026-09-12",
    updatedAt: "2026-09-15",
  },
];

const SupportContext = createContext<SupportContextValue | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([...additionalRequests, initialRequest]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>(initialRequest.id);
  const [draftContext, setDraftContext] = useState<SupportDraftContext | undefined>();
  const requestCounter = useRef(2051);

  const updateRequest = useCallback((id: string, update: (request: SupportRequest) => SupportRequest) => {
    setSupportRequests((current) => current.map((request) => request.id === id ? update(request) : request));
  }, []);

  const addSystemMessage = useCallback((request: SupportRequest, text: string): SupportRequest => ({
    ...request,
    updatedAt: today(),
    messages: [...request.messages, { id: `message-${Date.now()}-${Math.random()}`, sender: "System", text, date: now() }],
  }), []);

  const beginRequest = useCallback((context: SupportDraftContext) => {
    setDraftContext(context);
    setSelectedRequestId(undefined);
  }, []);

  const createRequest: SupportContextValue["createRequest"] = useCallback((request) => {
    const sequence = requestCounter.current++;
    const id = `request-sr-${sequence}`;
    const created: SupportRequest = {
      ...request,
      id,
      number: `SR-${sequence}`,
      status: "draft",
      assignedSpecialist: undefined,
      nextActionOwner: "Customer",
      nextAction: "Review the request and submit it to Emhart Glass.",
      messages: [{ id: `message-${Date.now()}`, sender: "System", text: "Support request draft created.", date: now() }],
      createdAt: today(),
      updatedAt: today(),
    };
    setSupportRequests((current) => [created, ...current]);
    setSelectedRequestId(id);
    setDraftContext(undefined);
    return id;
  }, []);

  const submitRequest = useCallback((id: string) => updateRequest(id, (request) => addSystemMessage({
    ...request,
    status: "submitted",
    nextActionOwner: "Emhart Glass",
    nextAction: "Emhart Glass will triage and assign the request.",
    expectedResponse: request.priority === "High" ? "Within 4 business hours" : "Within 1 business day",
  }, "Request submitted to Emhart Glass.")), [addSystemMessage, updateRequest]);

  const addAttachment = useCallback((id: string, attachment: Omit<SupportAttachment, "id">) => updateRequest(id, (request) => ({
    ...request,
    updatedAt: today(),
    attachments: [...request.attachments, { ...attachment, id: `attachment-${Date.now()}` }],
  })), [updateRequest]);

  const addMessage = useCallback((id: string, sender: SupportMessage["sender"], text: string) => updateRequest(id, (request) => {
    const customerReply = sender === "Customer" && request.status === "pending-customer";
    return {
      ...request,
      status: customerReply ? "in-progress" : request.status,
      nextActionOwner: customerReply ? "Emhart Glass" : request.nextActionOwner,
      nextAction: customerReply ? "Review the customer's new information and continue investigation." : request.nextAction,
      updatedAt: today(),
      messages: [...request.messages, { id: `message-${Date.now()}`, sender, text, date: now(), unread: sender === "Emhart Glass" }],
    };
  }), [updateRequest]);

  const startReview = useCallback((id: string) => updateRequest(id, (request) => addSystemMessage({
    ...request,
    status: "under-review",
    assignedSpecialist: "Elena Fischer",
    nextActionOwner: "Emhart Glass",
    nextAction: "Assigned specialist reviews the evidence and equipment context.",
  }, "Elena Fischer was assigned and triage started.")), [addSystemMessage, updateRequest]);

  const requestCustomerInfo = useCallback((id: string, text: string) => updateRequest(id, (request) => ({
    ...request,
    status: "pending-customer",
    nextActionOwner: "Customer",
    nextAction: "Reply with the requested information or add evidence.",
    updatedAt: today(),
    messages: [
      ...request.messages,
      { id: `message-${Date.now()}-system`, sender: "System", text: "Emhart Glass requested additional information.", date: now() },
      { id: `message-${Date.now()}-support`, sender: "Emhart Glass", text, date: now(), unread: true },
    ],
  })), [addSystemMessage, updateRequest]);

  const resolveRequest = useCallback((id: string, resolution: { summary: string; rootCause: string; actionsTaken: string; followUp: string }) => updateRequest(id, (request) => addSystemMessage({
    ...request,
    status: "resolved",
    nextActionOwner: "Customer",
    nextAction: "Confirm the resolution or report that the issue persists.",
    resolutionSummary: resolution.summary,
    rootCause: resolution.rootCause,
    actionsTaken: resolution.actionsTaken,
    followUp: resolution.followUp,
  }, "Emhart Glass marked the request resolved.")), [addSystemMessage, updateRequest]);

  const confirmResolved = useCallback((id: string) => updateRequest(id, (request) => addSystemMessage({
    ...request,
    status: "closed",
    nextActionOwner: "None",
    nextAction: "Request closed. Feedback is optional.",
  }, "Customer confirmed the resolution and closed the request.")), [addSystemMessage, updateRequest]);

  const reopenRequest = useCallback((id: string, note: string) => updateRequest(id, (request) => ({
    ...request,
    status: "in-progress",
    nextActionOwner: "Emhart Glass",
    nextAction: "Resume investigation based on the customer's update.",
    updatedAt: today(),
    messages: [
      ...request.messages,
      { id: `message-${Date.now()}-system`, sender: "System", text: "Customer reopened the request.", date: now() },
      { id: `message-${Date.now()}-customer`, sender: "Customer", text: note, date: now() },
    ],
  })), [addSystemMessage, updateRequest]);

  const submitFeedback = useCallback((id: string, feedback: string, rating: number) => updateRequest(id, (request) => ({ ...request, feedback, feedbackRating: rating, updatedAt: today() })), [updateRequest]);

  const markMessagesRead = useCallback((id: string) => updateRequest(id, (request) => ({
    ...request,
    messages: request.messages.map((message) => ({ ...message, unread: false })),
  })), [updateRequest]);

  const value = useMemo<SupportContextValue>(() => ({
    supportRequests,
    selectedRequestId,
    draftContext,
    selectRequest: setSelectedRequestId,
    beginRequest,
    clearDraftContext: () => setDraftContext(undefined),
    createRequest,
    submitRequest,
    addAttachment,
    addMessage,
    startReview,
    requestCustomerInfo,
    resolveRequest,
    confirmResolved,
    reopenRequest,
    submitFeedback,
    markMessagesRead,
  }), [supportRequests, selectedRequestId, draftContext, beginRequest, createRequest, submitRequest, addAttachment, addMessage, startReview, requestCustomerInfo, resolveRequest, confirmResolved, reopenRequest, submitFeedback, markMessagesRead]);

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) throw new Error("useSupport must be used within a SupportProvider.");
  return context;
}
