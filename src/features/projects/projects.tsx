import { useState } from "react";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardList,
  PackageCheck,
  Plus,
  Search,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/components/shared/action-feedback";
import { parts, services, documents } from "@/data/portal-data";
import {
  useProjects,
  repairKitTemplates,
  type RepairProject,
} from "@/features/projects/project-context";

const statusVariant = (status: RepairProject["status"]) =>
  status === "Completed"
    ? "secondary"
    : status === "Waiting for parts"
      ? "outline"
      : "default";

export function Projects({ accountId, onRequestSupport, onCreateQuote, onGoToQuotes, onGoToOrders }: { accountId: string; onRequestSupport: (context: { site: string; machineId: string; partId?: string }) => void; onCreateQuote: (items: RepairProject["items"], machineId: string, packageName?: string) => { id: string; number: string } | undefined; onGoToQuotes: (quoteId: string) => void; onGoToOrders: (orderId: string) => void }) {
  const {
    projects,
    activeProject,
    setActiveProject,
    startFromKit,
    createProject,
    updateProject,
    deleteProject,
    updateItem,
    addItemToProject,
    createPurchaseBatch,
    updatePackageQuote,
  } = useProjects();
  const { showFeedback } = useActionFeedback();
  const [creating, setCreating] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<string[]>([]);
  const [editingProject, setEditingProject] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [serviceAdded, setServiceAdded] = useState(false);
  const [supportRequested, setSupportRequested] = useState(false);
  const [form, setForm] = useState({
    name: "",
    machine: "",
    issue: "",
    responsible: "",
    targetDate: "",
  });

  function submitProject() {
    if (!form.name.trim() || !form.machine.trim() || !form.issue.trim()) return;
    createProject({ ...form, accountId, status: "Planning" });
    setForm({
      name: "",
      machine: "",
      issue: "",
      responsible: "",
      targetDate: "",
    });
    setCreating(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">
            Repair workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="max-w-2xl text-muted-foreground">
            

          </p>
        </div>
        <Button onClick={() => setCreating((value) => !value)}>
          <Plus className="mr-2 size-4" />
          Create project
        </Button>
      </div>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New repair project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name / reference</Label>
              <Input
                id="project-name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Section 4 baffle repair"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-machine">Machine / equipment</Label>
              <Input
                id="project-machine"
                value={form.machine}
                onChange={(event) =>
                  setForm({ ...form, machine: event.target.value })
                }
                placeholder="Machine or equipment"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-issue">Repair issue or reason</Label>
              <Textarea
                id="project-issue"
                value={form.issue}
                onChange={(event) =>
                  setForm({ ...form, issue: event.target.value })
                }
                placeholder="What needs to be repaired?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-responsible">Responsible person</Label>
              <Input
                id="project-responsible"
                value={form.responsible}
                onChange={(event) =>
                  setForm({ ...form, responsible: event.target.value })
                }
                placeholder="Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-date">Target completion date</Label>
              <Input
                id="project-date"
                type="date"
                value={form.targetDate}
                onChange={(event) =>
                  setForm({ ...form, targetDate: event.target.value })
                }
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={submitProject}>Create project</Button>
              <Button variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="bg-action-panel-color">
          <CardHeader>
            <CardTitle className="text-base">Start from a Repair Kit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {repairKitTemplates.map((kit) => (
              <div key={kit.id} className="border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{kit.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {kit.description}
                    </p>
                  </div>
                  <Wrench className="size-5 shrink-0 text-primary" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {kit.machine} · {kit.items.length} suggested items
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => startFromKit(kit)}
                >
                  Use this kit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your repair projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No repair projects yet. Start from a kit or create one from
                scratch.
              </p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className={`w-full border p-4 text-left hover:bg-accent ${activeProject?.id === project.id ? "bg-accent" : ""}`}
                  onClick={() => setActiveProject(project.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant={statusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.machine} · {project.items.length} items · Target{" "}
                    {project.targetDate || "TBD"}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {activeProject && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{activeProject.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeProject.issue} · Responsible:{" "}
                  {activeProject.responsible || "Unassigned"} · {activeProject.machine} · Target: {activeProject.targetDate || "TBD"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(activeProject.status)}>{activeProject.status}</Badge>
                <Button size="icon" className={supportRequested ? "bg-yellow-400 text-black hover:bg-yellow-500" : "bg-black text-white hover:bg-neutral-800"} aria-label="Request support attention" title="Request support attention" onClick={() => { setSupportRequested(true); onRequestSupport({ site: "Northstar Glass Plant", machineId: activeProject.machine.includes("FleXLube") ? "machine-flexlube-01" : "machine-ef-512-01" }); }}>
                  <BellRing className="size-4" />
                </Button>
              </div>
            </div>
            <Button
              className="mt-4"
              size="icon"
              variant="outline"
              aria-label={editingProject ? "Close project settings" : "Edit project settings"}
              title={editingProject ? "Close project settings" : "Edit project settings"}
              onClick={() => setEditingProject((value) => !value)}
            >
              <Settings className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {editingProject && (
              <div className="grid gap-4 border bg-action-panel-color p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-project-name">Project name / reference</Label>
                  <Input id="edit-project-name" value={activeProject.name} onChange={(event) => updateProject(activeProject.id, { name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-machine">Machine / equipment</Label>
                  <Input id="edit-project-machine" value={activeProject.machine} onChange={(event) => updateProject(activeProject.id, { machine: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-project-issue">Repair issue or reason</Label>
                  <Textarea id="edit-project-issue" value={activeProject.issue} onChange={(event) => updateProject(activeProject.id, { issue: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-responsible">Responsible person</Label>
                  <Input id="edit-project-responsible" value={activeProject.responsible} onChange={(event) => updateProject(activeProject.id, { responsible: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-date">Target completion date</Label>
                  <Input id="edit-project-date" type="date" value={activeProject.targetDate} onChange={(event) => updateProject(activeProject.id, { targetDate: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={activeProject.status} onValueChange={(value) => updateProject(activeProject.id, { status: value as RepairProject["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Planning">Planning</SelectItem><SelectItem value="In progress">In progress</SelectItem><SelectItem value="Waiting for parts">Waiting for parts</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-end md:justify-end">
                  <Button variant="destructive" onClick={() => { if (window.confirm(`Delete ${activeProject.name}?`)) { deleteProject(activeProject.id); setEditingProject(false); } }}><Trash2 className="mr-2 size-4" />Delete project</Button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <h2 className="font-semibold">Required items</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => { const service = services.find((candidate) => candidate.id === "service-baffle-inspection") ?? services[0]; addItemToProject(activeProject.id, { type: "service", name: service.name, quantity: 1, availability: "Requestable", price: service.price, currency: service.currency, status: "Planned" }); setServiceAdded(true); }}>
                <Wrench className="mr-2 size-4" />{serviceAdded ? "Engineer service added" : "Add service engineer"}
              </Button>
            </div>
            <div className="space-y-2 border bg-action-panel-color p-3">
              <Label htmlFor="project-add-search">Add parts, documents or services</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="project-add-search" className="pl-9" value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Search the catalogue to add items" />
              </div>
              {itemSearch.trim() && (
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {parts.filter((part) => `${part.name} ${part.partNumber}`.toLowerCase().includes(itemSearch.trim().toLowerCase())).slice(0, 6).map((part) => (
                    <button key={part.id} className="flex w-full items-center justify-between gap-3 border bg-background p-2 text-left text-sm hover:bg-accent" onClick={() => { addItemToProject(activeProject.id, { type: "part", name: part.name, reference: part.partNumber, quantity: 1, availability: part.availability, price: part.unitPrice, currency: part.currency, status: part.availability === "In stock" ? "Ready to order" : "Planned" }); showFeedback({ itemName: part.name, destination: "project", projectName: activeProject.name }); setItemSearch(""); }}><span>{part.name}</span><Badge variant="outline">Part</Badge></button>
                  ))}
                  {services.filter((service) => service.name.toLowerCase().includes(itemSearch.trim().toLowerCase())).slice(0, 4).map((service) => (
                    <button key={service.id} className="flex w-full items-center justify-between gap-3 border bg-background p-2 text-left text-sm hover:bg-accent" onClick={() => { addItemToProject(activeProject.id, { type: "service", name: service.name, quantity: 1, availability: "Requestable", price: service.price, currency: service.currency, status: "Planned" }); showFeedback({ itemName: service.name, destination: "project", projectName: activeProject.name }); setItemSearch(""); }}><span>{service.name}</span><Badge variant="outline">Service</Badge></button>
                  ))}
                  {documents.filter((document) => `${document.title} ${document.documentId}`.toLowerCase().includes(itemSearch.trim().toLowerCase())).slice(0, 4).map((document) => (
                    <button key={document.id} className="flex w-full items-center justify-between gap-3 border bg-background p-2 text-left text-sm hover:bg-accent" onClick={() => { addItemToProject(activeProject.id, { type: "document", name: document.title, reference: document.documentId, quantity: 1, availability: "Available now", status: "Planned" }); showFeedback({ itemName: document.title, destination: "project", projectName: activeProject.name }); setItemSearch(""); }}><span>{document.title}</span><Badge variant="outline">Document</Badge></button>
                  ))}
                </div>
              )}
            </div>
            {activeProject.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add parts, documents, or services to this project from the
                catalogue.
              </p>
            ) : (
              <div className="space-y-2">
                {activeProject.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 border p-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        aria-label={`Select ${item.name}`}
                        checked={item.selected}
                        disabled={item.status !== "Ready to order"}
                        onCheckedChange={(checked) =>
                          updateItem(activeProject.id, item.id, {
                            selected: checked === true,
                          })
                        }
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.reference ?? item.type} · {item.availability}
                          {item.relatedOrder ? ` · ${item.relatedOrder}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeProject.packages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-2"><PackageCheck className="size-4 text-primary" /><h2 className="font-semibold">Packages</h2></div>
                {activeProject.packages.map((projectPackage) => {
                  const expanded = expandedPackages.includes(projectPackage.id);
                  return <div key={projectPackage.id} className="border">
                    <div className="flex items-start justify-between gap-3 p-3">
                      <button className="min-w-0 flex-1 text-left hover:bg-accent" onClick={() => setExpandedPackages((current) => expanded ? current.filter((id) => id !== projectPackage.id) : [...current, projectPackage.id])}>
                        <p className="font-medium">{expanded ? "▾" : "▸"} {projectPackage.name}</p><p className="mt-1 text-xs text-muted-foreground">{projectPackage.items.length} items · {projectPackage.orderNumber ?? "Not ordered"} · {projectPackage.shipmentStatus}</p>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">{projectPackage.status && <Badge variant="outline">{projectPackage.orderNumber ? "Order" : projectPackage.status}</Badge>}{!projectPackage.quoteNumber && <Button size="sm" onClick={() => { const quote = onCreateQuote(projectPackage.items, activeProject.machine.includes("FleXLube") ? "machine-flexlube-01" : "machine-ef-512-01", projectPackage.name); if (quote) updatePackageQuote(activeProject.id, projectPackage.id, quote); }}>Request Quote</Button>}{projectPackage.orderId ? <Button size="icon" variant="outline" aria-label="Open order" title="Open order" onClick={() => onGoToOrders(projectPackage.orderId!)}><ArrowRight className="size-4" /></Button> : projectPackage.quoteId ? <Button size="icon" variant="outline" aria-label="Open quote" title="Open quote" onClick={() => onGoToQuotes(projectPackage.quoteId!)}><ArrowRight className="size-4" /></Button> : null}</div>
                    </div>
                    {expanded && <div className="space-y-2 border-t bg-muted/20 p-3">{projectPackage.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border bg-background p-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.reference ?? item.type} · Qty {item.quantity} · {item.availability}</p></div>{projectPackage.status && <Badge variant="outline">{projectPackage.status}</Badge>}</div>)}<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><span>Quote: {projectPackage.quoteNumber ?? "Not requested"}</span><span>Order: {projectPackage.orderNumber ?? "Not placed"}</span><span>Shipment: {projectPackage.shipmentStatus}</span></div></div>}
                  </div>;
                })}
              </div>
            )}
            <Button
              disabled={
                !activeProject.items.some(
                  (item) => item.selected && item.status === "Ready to order",
                )
              }
              onClick={() => createPurchaseBatch(activeProject.id)}
            >
              <PackageCheck className="mr-2 size-4" />
              Create package
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
