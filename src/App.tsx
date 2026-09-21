import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accounts, users, type PortalRole } from "@/data/portal-data";
import { PortalPlaceholder, PortalShell, type PortalRoute } from "@/components/shared/portal-shell";
import { MachineOverview } from "@/features/equipment/machine-overview";
import { MachineExplorer } from "@/features/equipment/machine-explorer";
import { ProductsAndServices } from "@/features/products/products-and-services";
import { QuoteOrder } from "@/features/quotes/quote-order";
import { TransactionProvider } from "@/features/quotes/transaction-context";
import { SupportCenter } from "@/features/support/support-center";
import { SupportProvider, useSupport } from "@/features/support/support-context";
import { Dashboard } from "@/features/dashboard/dashboard";
import { Profile } from "@/features/profile/profile";
import { Maintenance } from "@/features/maintenance/maintenance";
import { Training } from "@/features/training/training";
import { UserManagement } from "@/features/user-management/user-management";
import { Reporting } from "@/features/reporting/reporting";

function ComponentInventory() {
  const [selected, setSelected] = useState(true);
  const [selectedSite, setSelectedSite] = useState("Northstar Glass Plant");

  return (
    <section className="space-y-10">
      <header className="space-y-3 border-b pb-8">
        <p className="text-sm font-medium text-muted-foreground">Emhart Glass UI inventory</p>
        <h1 className="text-3xl font-semibold tracking-tight">Common shadcn components</h1>
        <p className="max-w-2xl text-muted-foreground">A live reference of the component variants and interaction states available for the prototype.</p>
      </header>
      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Buttons</h2><p className="text-sm text-muted-foreground">Default, active, selected, and disabled states.</p></div>
        <div className="flex flex-wrap items-center gap-3"><Button>Default</Button><Button className="ring-2 ring-ring ring-offset-2">Active</Button><Button variant="secondary" aria-pressed="true">Selected</Button><Button disabled>Disabled</Button><Button variant="outline">Outline</Button><Button variant="destructive">Destructive</Button></div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Inputs</CardTitle></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="default-input">Default</Label><Input id="default-input" placeholder="Enter a service request" /></div><div className="space-y-2"><Label htmlFor="active-input">Active / focused</Label><Input id="active-input" defaultValue="SR-2048" autoFocus /></div><div className="space-y-2"><Label htmlFor="disabled-input">Disabled</Label><Input id="disabled-input" placeholder="Unavailable" disabled /></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Selection</CardTitle></CardHeader><CardContent className="space-y-6"><label className="flex items-start gap-3 border p-4"><Checkbox checked={selected} onCheckedChange={(value) => setSelected(value === true)} /><span className="space-y-1"><span className="block text-sm font-medium">Selected option</span><span className="block text-sm text-muted-foreground">This checkbox is interactive.</span></span></label><div className="flex items-center gap-3"><Checkbox id="unchecked" /><Label htmlFor="unchecked">Default / unchecked</Label></div><div className="flex items-center gap-3"><Checkbox id="disabled-check" disabled /><Label htmlFor="disabled-check" className="text-muted-foreground">Disabled</Label></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Textarea</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea placeholder="Describe the issue..." /><Textarea defaultValue="This field contains an active value." /><Textarea placeholder="Disabled" disabled /></CardContent></Card>
        <Card><CardHeader><CardTitle>Dropdown</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="site-dropdown">Account site</Label><Select value={selectedSite} onValueChange={setSelectedSite}><SelectTrigger id="site-dropdown" className="w-full"><SelectValue placeholder="Select an account site" /></SelectTrigger><SelectContent><SelectItem value="Northstar Glass Plant">Northstar Glass Plant</SelectItem><SelectItem value="Steinhausen Service Centre">Steinhausen Service Centre</SelectItem><SelectItem value="Demo account - all sites">Demo account - all sites</SelectItem></SelectContent></Select></div><p className="text-sm text-muted-foreground">Selected site: <span className="font-medium text-foreground">{selectedSite}</span></p></CardContent></Card>
        <Card><CardHeader><CardTitle>Badges and status cards</CardTitle></CardHeader><CardContent className="space-y-5"><div className="flex flex-wrap gap-2"><Badge>Default</Badge><Badge variant="secondary">Selected</Badge><Badge variant="outline">Outline</Badge><Badge variant="destructive">Error</Badge></div><div className="border p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">Machine service request</p><p className="text-sm text-muted-foreground">Updated just now</p></div><Badge variant="secondary">In progress</Badge></div></div></CardContent></Card>
      </div>
    </section>
  );
}

function PortalApp() {
  const [route, setRoute] = useState<PortalRoute>("dashboard");
  const [role, setRole] = useState<PortalRole>(users[0].role);
  const [accountId, setAccountId] = useState(accounts[0].id);
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>();
  const { beginRequest } = useSupport();
  const titles: Record<Exclude<PortalRoute, "ui-inventory" | "notifications">, string> = {
    dashboard: "Welcome to the service portal",
    equipment: "My Equipment",
    maintenance: "Maintenance",
    training: "Training",
    "user-management": "User Management",
    reporting: "Reporting",
    products: "Products & Services",
    quotes: "Quotes & Orders",
    support: "Support & Communication",
    profile: "My Profile",
  };
  const pageTitle = route === "notifications" ? "Notifications" : route === "ui-inventory" ? "Component inventory" : titles[route];
  const openSupport = (context: Parameters<typeof beginRequest>[0]) => {
    beginRequest(context);
    setRoute("support");
  };
  const content = route === "ui-inventory" ? <ComponentInventory /> : route === "dashboard" ? <Dashboard accountId={accountId} onRouteChange={setRoute} /> : route === "equipment" ? selectedMachineId ? <MachineExplorer machineId={selectedMachineId} onBack={() => setSelectedMachineId(undefined)} onRequestSupport={(context) => openSupport({ accountId, ...context })} /> : <MachineOverview accountId={accountId} onSelectMachine={setSelectedMachineId} /> : route === "maintenance" ? <Maintenance accountId={accountId} /> : route === "training" ? <Training accountId={accountId} /> : route === "user-management" ? <UserManagement accountId={accountId} role={role} /> : route === "reporting" ? <Reporting accountId={accountId} /> : route === "products" ? <ProductsAndServices accountId={accountId} onGoToCart={() => setRoute("quotes")} onRequestSupport={(context) => openSupport({ accountId, ...context })} /> : route === "quotes" ? <QuoteOrder /> : route === "support" ? <SupportCenter accountId={accountId} role={role} /> : route === "profile" ? <Profile role={role} accountId={accountId} onRoleChange={setRole} /> : <PortalPlaceholder eyebrow="Prototype foundation" title={pageTitle} description="Choose a workspace area from the navigation to continue." />;

  return (
    <TransactionProvider>
      <PortalShell route={route} role={role} accountId={accountId} onRouteChange={setRoute} onRoleChange={setRole} onAccountChange={setAccountId}>{content}</PortalShell>
    </TransactionProvider>
  );
}

function App() {
  return <SupportProvider><PortalApp /></SupportProvider>;
}

export default App;
