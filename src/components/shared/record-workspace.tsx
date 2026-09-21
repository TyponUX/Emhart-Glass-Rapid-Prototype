import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RecordWorkspaceEvent {
  label: string;
  date: string;
  detail?: string;
}

export function RecordWorkspace({
  eyebrow,
  title,
  status,
  metadata,
  nextAction,
  events,
  children,
}: {
  eyebrow: string;
  title: string;
  status: string;
  metadata: Array<{ label: string; value: string }>;
  nextAction: string;
  events: RecordWorkspaceEvent[];
  children?: ReactNode;
}) {
  return <section className="space-y-6"><div className="space-y-2"><p className="text-sm font-medium text-text-primary">{eyebrow}</p><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><Badge variant="secondary">{status}</Badge></div></div><div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]"><div className="space-y-6"><Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent>{children ?? <p className="text-sm text-muted-foreground">No additional details are available.</p>}</CardContent></Card><Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent className="space-y-4">{events.map((event) => <div key={`${event.date}-${event.label}`} className="border-l-2 border-border pl-4"><p className="text-sm font-medium">{event.label}</p><p className="text-xs text-muted-foreground">{event.date}</p>{event.detail && <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>}</div>)}</CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent className="space-y-4">{metadata.map((item) => <div key={item.label}><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Next action</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{nextAction}</p></CardContent></Card></div></div></section>;
  return <section className="space-y-6"><div className="space-y-2"><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><Badge variant="secondary">{status}</Badge></div></div><div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]"><div className="space-y-6"><Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent>{children ?? <p className="text-sm text-muted-foreground">No additional details are available.</p>}</CardContent></Card><Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent className="space-y-4">{events.map((event) => <div key={`${event.date}-${event.label}`} className="border-l-2 border-border pl-4"><p className="text-sm font-medium">{event.label}</p><p className="text-xs text-muted-foreground">{event.date}</p>{event.detail && <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>}</div>)}</CardContent></Card></div><div className="space-y-6"><Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent className="space-y-4">{metadata.map((item) => <div key={item.label}><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Next action</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{nextAction}</p></CardContent></Card></div></div></section>;
}
