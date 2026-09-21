          <h1 className="text-3xl font-semibold tracking-tight">Equipment support</h1>
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, FilePlus2, LifeBuoy, MessageSquare, Paperclip, Plus, RotateCcw, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accounts, assemblies, documents, machines, parts, type PortalRole } from "@/data/portal-data";
import { useSupport, type ProductionImpact, type SupportRequest, type SupportStatus } from "@/features/support/support-context";

const STATUS_LABELS: Record<SupportStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "under-review": "Under review",
  "pending-customer": "Waiting for customer",
  "in-progress": "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const emptyForm = {
  machineId: "",
  assemblyId: "",
  partId: "",
  documentId: "",
  category: "Mechanical issue",
  priority: "Medium" as SupportRequest["priority"],
  subject: "",
  description: "",
  startedAt: new Date().toISOString().slice(0, 10),
  productionImpact: "degraded" as ProductionImpact,
  attemptedSteps: "",
};

export function SupportCenter({ accountId, role }: { accountId: string; role: PortalRole }) {
  const account = accounts.find((candidate) => candidate.id === accountId) ?? accounts[0];
  const {
    supportRequests,
    selectedRequestId,
    draftContext,
    selectRequest,
    beginRequest,
    clearDraftContext,
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
  } = useSupport();

  const [creating, setCreating] = useState(Boolean(draftContext));
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    machineId: draftContext?.machineId ?? account.machineIds[0] ?? "",
    assemblyId: draftContext?.assemblyId ?? "",
    partId: draftContext?.partId ?? "",
    documentId: draftContext?.documentId ?? "",
  }));
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [supportReply, setSupportReply] = useState("Please share a close-up photo and confirm whether the issue occurs on every section.");
  const [resolution, setResolution] = useState({ summary: "Alignment restored and verified during production start-up.", rootCause: "Worn mounting set caused excess play.", actionsTaken: "Replaced the mounting set and adjusted the baffle arm.", followUp: "Recheck alignment after 500 operating hours." });
  const [reopenNote, setReopenNote] = useState("The issue returned during the next production start-up.");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!draftContext) return;
    setCreating(true);
    setForm((current) => ({
      ...current,
      machineId: draftContext.machineId,
      assemblyId: draftContext.assemblyId ?? "",
      partId: draftContext.partId ?? "",
      documentId: draftContext.documentId ?? "",
    }));
  }, [draftContext]);

  const selectedRequest = supportRequests.find((request) => request.id === selectedRequestId);
  const filteredRequests = useMemo(() => supportRequests.filter((request) => (
    request.accountId === accountId
    && (statusFilter === "all" || request.status === statusFilter)
    && (machineFilter === "all" || request.machineId === machineFilter)
    && (priorityFilter === "all" || request.priority === priorityFilter)
    && (dateFilter === "all" || request.updatedAt === new Date().toISOString().slice(0, 10))
  )), [supportRequests, accountId, statusFilter, machineFilter, priorityFilter, dateFilter]);

  function openBlankRequest() {
    clearDraftContext();
    setCreating(true);
    setForm({ ...emptyForm, machineId: account.machineIds[0] ?? "" });
    setFormError("");
  }

  function saveDraft() {
    if (!form.machineId || !form.subject.trim() || !form.description.trim()) {
      setFormError("Machine, subject, and problem description are required.");
      return;
    }

    createRequest({
      accountId,
      site: draftContext?.site ?? account.sites[0],
      machineId: form.machineId,
      assemblyId: form.assemblyId || undefined,
      partId: form.partId || undefined,
      relatedDocumentIds: form.documentId ? [form.documentId] : [],
      category: form.category,
      priority: form.priority,
      subject: form.subject.trim(),
      description: form.description.trim(),
      startedAt: form.startedAt,
      productionImpact: form.productionImpact,
      attemptedSteps: form.attemptedSteps.trim(),
      attachments: form.documentId ? [{ id: `attachment-${Date.now()}`, name: documents.find((document) => document.id === form.documentId)?.title ?? "Portal document", type: "Portal document" }] : [],
    });
    setCreating(false);
    setFormError("");
  }

  function sendCustomerReply() {
    if (!selectedRequest || !reply.trim()) return;
    addMessage(selectedRequest.id, "Customer", reply.trim());
    setReply("");
  }

  function selectAndRead(id: string) {
    selectRequest(id);
    markMessagesRead(id);
    setCreating(false);
  }

  const selectedMachine = selectedRequest ? machines.find((machine) => machine.id === selectedRequest.machineId) : undefined;
  const selectedAssembly = selectedRequest ? assemblies.find((assembly) => assembly.id === selectedRequest.assemblyId) : undefined;
  const selectedPart = selectedRequest ? parts.find((part) => part.id === selectedRequest.partId) : undefined;
  const unreadCount = (request: SupportRequest) => request.messages.filter((message) => message.unread).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          
          <h1 className="text-3xl font-semibold tracking-tight">Equipment support</h1>
          <p className="max-w-2xl text-muted-foreground"></p>
        </div>
        <div className="flex items-center gap-2"><Badge variant="outline">Customer view · {role}</Badge><Button onClick={openBlankRequest}><Plus className="mr-2 size-4" />New support request</Button></div>
      </div>

      {creating ? (
        <Card>
          <CardHeader><CardTitle>New support request</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="support-machine">Machine *</Label><Select value={form.machineId} onValueChange={(value) => setForm((current) => ({ ...current, machineId: value, assemblyId: "", partId: "" }))}><SelectTrigger id="support-machine"><SelectValue placeholder="Select a machine" /></SelectTrigger><SelectContent>{machines.filter((machine) => account.machineIds.includes(machine.id)).map((machine) => <SelectItem key={machine.id} value={machine.id}>{machine.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-assembly">Assembly</Label><Select value={form.assemblyId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, assemblyId: value === "none" ? "" : value, partId: "" }))}><SelectTrigger id="support-assembly"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not specified</SelectItem>{assemblies.filter((assembly) => assembly.machineId === form.machineId).map((assembly) => <SelectItem key={assembly.id} value={assembly.id}>{assembly.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-part">Part</Label><Select value={form.partId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, partId: value === "none" ? "" : value }))}><SelectTrigger id="support-part"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not specified</SelectItem>{parts.filter((part) => part.compatibleMachineIds.includes(form.machineId)).map((part) => <SelectItem key={part.id} value={part.id}>{part.partNumber} · {part.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-document">Related document</Label><Select value={form.documentId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, documentId: value === "none" ? "" : value }))}><SelectTrigger id="support-document"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{documents.filter((document) => document.relatedMachineIds.includes(form.machineId)).map((document) => <SelectItem key={document.id} value={document.id}>{document.documentId} · {document.title}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-category">Category</Label><Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}><SelectTrigger id="support-category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Mechanical issue">Mechanical issue</SelectItem><SelectItem value="Electrical issue">Electrical issue</SelectItem><SelectItem value="Controls and software">Controls and software</SelectItem><SelectItem value="Documentation question">Documentation question</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-priority">Priority</Label><Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value as SupportRequest["priority"] }))}><SelectTrigger id="support-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-impact">Production impact</Label><Select value={form.productionImpact} onValueChange={(value) => setForm((current) => ({ ...current, productionImpact: value as ProductionImpact }))}><SelectTrigger id="support-impact"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="stopped">Production stopped</SelectItem><SelectItem value="degraded">Production degraded</SelectItem><SelectItem value="unaffected">Production unaffected</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="support-started">Issue started</Label><Input id="support-started" type="date" value={form.startedAt} onChange={(event) => setForm((current) => ({ ...current, startedAt: event.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="support-subject">Subject *</Label><Input id="support-subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Briefly name the issue" /></div>
            <div className="space-y-2"><Label htmlFor="support-description">Problem description *</Label><Textarea id="support-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What is happening, and under which conditions?" /></div>
            <div className="space-y-2"><Label htmlFor="support-steps">Troubleshooting already attempted</Label><Textarea id="support-steps" value={form.attemptedSteps} onChange={(event) => setForm((current) => ({ ...current, attemptedSteps: event.target.value }))} placeholder="Checks, adjustments, and documents already used" /></div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex gap-2"><Button onClick={saveDraft}>Create draft</Button><Button variant="outline" onClick={() => { setCreating(false); clearDraftContext(); }}>Cancel</Button></div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.8fr)]">
          <Card className="h-fit bg-action-panel-color">
            <CardHeader><CardTitle className="text-base">Requests</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
                <Select value={machineFilter} onValueChange={setMachineFilter}><SelectTrigger aria-label="Filter by machine"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All machines</SelectItem>{machines.filter((machine) => account.machineIds.includes(machine.id)).map((machine) => <SelectItem key={machine.id} value={machine.id}>{machine.name}</SelectItem>)}</SelectContent></Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger aria-label="Filter by priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
                <Select value={dateFilter} onValueChange={setDateFilter}><SelectTrigger aria-label="Filter by date"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any activity date</SelectItem><SelectItem value="today">Updated today</SelectItem></SelectContent></Select>
              </div>
              {filteredRequests.map((request) => <button key={request.id} className={`w-full border p-3 text-left hover:bg-accent ${selectedRequest?.id === request.id ? "bg-accent" : ""}`} onClick={() => selectAndRead(request.id)}><div className="flex items-start justify-between gap-2"><span className="text-sm font-medium">{request.number}</span><Badge variant={request.status === "pending-customer" ? "destructive" : "secondary"}>{STATUS_LABELS[request.status]}</Badge></div><p className="mt-2 text-sm">{request.subject}</p><p className="mt-1 text-xs text-muted-foreground">{request.priority} · {request.updatedAt} · Next: {request.nextActionOwner}</p>{unreadCount(request) > 0 && <Badge className="mt-2">{unreadCount(request)} unread</Badge>}</button>)}
              {filteredRequests.length === 0 && <p className="text-sm text-muted-foreground">No requests match these filters.</p>}
            </CardContent>
          </Card>

          {selectedRequest ? (
            <Card className="min-w-0">
              <CardHeader className="space-y-4 border-b">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><CardTitle>{selectedRequest.number}: {selectedRequest.subject}</CardTitle><Badge variant={selectedRequest.status === "pending-customer" ? "destructive" : "secondary"}>{STATUS_LABELS[selectedRequest.status]}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedMachine?.name} · {selectedRequest.priority} priority · {selectedRequest.assignedSpecialist ?? "Unassigned"}</p>
                  </div>
                </div>
                <div className={`rounded-md border border-border p-3 ${selectedRequest.status === "pending-customer" ? "bg-amber-50" : "bg-muted/30"}`}><p className="text-xs text-muted-foreground">Next action · {selectedRequest.nextActionOwner}</p><p className="mt-1 text-sm font-medium">{selectedRequest.nextAction}</p>{selectedRequest.expectedResponse && <p className="mt-1 text-xs text-muted-foreground">Expected response: {selectedRequest.expectedResponse}</p>}</div>
                <details className="rounded-md border bg-background">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Request details</summary>
                  <div className="space-y-4 border-t p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Machine</p><p className="font-medium">{selectedMachine?.name}</p></div><div><p className="text-muted-foreground">Site</p><p className="font-medium">{selectedRequest.site}</p></div><div><p className="text-muted-foreground">Impact</p><p className="font-medium capitalize">{selectedRequest.productionImpact}</p></div><div><p className="text-muted-foreground">Assembly</p><p className="font-medium">{selectedAssembly?.name ?? "Not specified"}</p></div><div><p className="text-muted-foreground">Part</p><p className="font-medium">{selectedPart?.partNumber ?? "Not specified"}</p></div><div><p className="text-muted-foreground">Issue started</p><p className="font-medium">{selectedRequest.startedAt}</p></div></div>
                    <div><p className="text-sm font-medium">Issue</p><p className="mt-1 text-sm text-muted-foreground">{selectedRequest.description}</p></div>
                    <div><p className="text-sm font-medium">Attempted steps</p><p className="mt-1 text-sm text-muted-foreground">{selectedRequest.attemptedSteps || "None recorded."}</p></div>
                    <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-medium">Evidence</p><Button size="sm" variant="outline" onClick={() => addAttachment(selectedRequest.id, { name: `evidence-${selectedRequest.attachments.length + 1}.jpg`, type: "Photo" })}><Paperclip className="mr-2 size-3" />Attach evidence</Button></div>{selectedRequest.attachments.map((attachment) => <div key={attachment.id} className="flex items-center gap-2 border p-2 text-sm"><FilePlus2 className="size-4 text-primary" /><span>{attachment.name}</span><Badge variant="outline" className="ml-auto">{attachment.type}</Badge></div>)}</div>
                  </div>
                </details>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 border-b py-3 text-sm font-medium"><MessageSquare className="size-4" />Conversation</div>
                <div className="max-h-[500px] space-y-3 overflow-y-auto">
                  {selectedRequest.messages.map((message) => <div key={message.id} className={`rounded-md border border-border p-3 ${message.sender === "System" ? "bg-muted/40" : message.sender === "Customer" ? "ml-5" : "mr-5 bg-primary/5"}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium">{message.sender}</p><span className="text-xs text-muted-foreground">{message.date}</span></div><p className="mt-1 text-sm">{message.text}</p>{message.unread && <Badge className="mt-2">Unread</Badge>}</div>)}
                </div>

                {selectedRequest.status === "draft" && <div className="rounded-md border border-dashed p-4"><p className="mb-3 text-sm text-muted-foreground">Review the request details, then send this case to Emhart Glass.</p><Button onClick={() => submitRequest(selectedRequest.id)}>Submit support request</Button></div>}
                {selectedRequest.status === "submitted" && <div className="rounded-md border border-dashed p-4"><p className="mb-3 text-sm text-muted-foreground">The request is waiting for initial triage.</p><Button onClick={() => startReview(selectedRequest.id)}>Simulate Emhart triage</Button></div>}
                {(selectedRequest.status === "under-review" || selectedRequest.status === "in-progress") && <div className="space-y-3 rounded-md border border-dashed p-4"><p className="text-sm font-medium">Emhart Glass actions</p><Textarea value={supportReply} onChange={(event) => setSupportReply(event.target.value)} /><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => requestCustomerInfo(selectedRequest.id, supportReply)} disabled={!supportReply.trim()}>Request customer information</Button><Button size="sm" onClick={() => resolveRequest(selectedRequest.id, resolution)} disabled={!resolution.summary.trim()}>Record resolution</Button></div><details><summary className="cursor-pointer text-sm text-muted-foreground">Edit resolution details</summary><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={resolution.summary} onChange={(event) => setResolution((current) => ({ ...current, summary: event.target.value }))} aria-label="Resolution summary" placeholder="Resolution summary" /><Input value={resolution.rootCause} onChange={(event) => setResolution((current) => ({ ...current, rootCause: event.target.value }))} aria-label="Root cause" placeholder="Root cause" /><Input value={resolution.actionsTaken} onChange={(event) => setResolution((current) => ({ ...current, actionsTaken: event.target.value }))} aria-label="Actions taken" placeholder="Actions taken" /><Input value={resolution.followUp} onChange={(event) => setResolution((current) => ({ ...current, followUp: event.target.value }))} aria-label="Follow-up" placeholder="Follow-up recommendation" /></div></details></div>}
                {selectedRequest.status === "resolved" && <div className="space-y-3 rounded-md border border-border bg-green-50 p-4"><div><p className="text-sm font-medium">Resolution proposed</p><p className="text-sm text-green-900">{selectedRequest.resolutionSummary}</p><p className="mt-1 text-xs text-green-800">Root cause: {selectedRequest.rootCause}</p></div><Textarea value={reopenNote} onChange={(event) => setReopenNote(event.target.value)} aria-label="Reopen note" /><div className="flex flex-wrap gap-2"><Button onClick={() => confirmResolved(selectedRequest.id)}><CheckCircle2 className="mr-2 size-4" />Confirm resolved</Button><Button variant="outline" onClick={() => reopenRequest(selectedRequest.id, reopenNote)}><RotateCcw className="mr-2 size-4" />Issue persists</Button></div></div>}
                {selectedRequest.status === "closed" && <div className="space-y-2 border-t pt-4"><Label htmlFor="support-feedback">Optional feedback</Label><Textarea id="support-feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="How was your support experience?" /><Button variant="outline" onClick={() => submitFeedback(selectedRequest.id, feedback)} disabled={!feedback.trim()}>Submit feedback</Button>{selectedRequest.feedback && <p className="text-sm text-green-700">Feedback recorded.</p>}</div>}
                {selectedRequest.status !== "closed" && <div className="space-y-2 border-t pt-4"><Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this request..." /><div className="flex gap-2"><Button onClick={sendCustomerReply} disabled={!reply.trim()}><Send className="mr-2 size-4" />Send reply</Button><Button variant="outline" onClick={() => addAttachment(selectedRequest.id, { name: `customer-attachment-${selectedRequest.attachments.length + 1}.pdf`, type: "PDF" })}><Paperclip className="size-4" /></Button></div></div>}
              </CardContent>
            </Card>
          ) : <Card><CardContent className="flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground"><LifeBuoy className="mr-2 size-4" />Conversation appears with the selected request.</CardContent></Card>}
        </div>
      )}

      {!creating && selectedRequest?.status === "pending-customer" && <div className="flex items-center gap-2 rounded-md border border-border bg-amber-50 p-3 text-sm text-amber-900"><CircleAlert className="size-4" />Emhart Glass is waiting for your reply or additional evidence.</div>}
    </section>
  );
}
