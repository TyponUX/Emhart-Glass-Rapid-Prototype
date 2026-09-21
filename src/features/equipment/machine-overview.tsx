import { useMemo, useState } from "react";
import { ArrowRight, Search, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { machines } from "@/data/portal-data";
import { getScopedMachines } from "@/lib/portal-logic";

interface MachineOverviewProps {
  accountId: string;
  onSelectMachine: (machineId: string) => void;
}

export function MachineOverview({ accountId, onSelectMachine }: MachineOverviewProps) {
  const [query, setQuery] = useState("");
  const accountMachines = useMemo(() => {
    const account = { id: accountId, organisation: "Current account", sites: [], machineIds: machines.filter((machine) => machine.accountId === accountId).map((machine) => machine.id) };
    return getScopedMachines(machines, account);
  }, [accountId]);
  const filteredMachines = accountMachines.filter((machine) => [machine.name, machine.model, machine.serialNumber, machine.site].some((value) => value.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        
        <h1 className="text-3xl font-semibold tracking-tight">My Equipment</h1>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Find a machine</CardTitle></CardHeader>
        <CardContent>
          <Label className="sr-only" htmlFor="machine-search">Search machines</Label>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="machine-search" className="pl-9" placeholder="Search by machine, model, serial number, or site" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </CardContent>
      </Card>
      {filteredMachines.length === 0 ? <Card><CardContent className="py-12 text-center"><p className="font-medium">No machines found</p><p className="mt-1 text-sm text-muted-foreground">Clear the search to see the machines in this account.</p><Button className="mt-4" variant="outline" onClick={() => setQuery("")}>Clear search</Button></CardContent></Card> : <div className="grid gap-5 md:grid-cols-2">{filteredMachines.map((machine) => <Card key={machine.id} className="overflow-hidden"><div className="aspect-[16/8] bg-muted"><img className="h-full w-full object-contain" src={machine.imageUrl} alt={machine.name} /></div><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold">{machine.name}</p><p className="text-sm text-muted-foreground">{machine.model}</p></div><Badge variant="secondary"><Wrench className="mr-1 size-3" /> Active</Badge></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Serial number</dt><dd className="font-medium">{machine.serialNumber}</dd></div><div><dt className="text-muted-foreground">Site</dt><dd className="font-medium">{machine.site}</dd></div><div className="col-span-2"><dt className="text-muted-foreground">Configuration</dt><dd className="font-medium">{machine.configuration}</dd></div></dl><Button className="w-full justify-between" onClick={() => onSelectMachine(machine.id)}>Open machine <ArrowRight className="size-4" /></Button></CardContent></Card>)}</div>}
    </section>
  );
}
