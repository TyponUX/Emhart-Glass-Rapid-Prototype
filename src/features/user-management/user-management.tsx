import { CheckCircle2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { users, type PortalRole, type UserStatus } from "@/data/portal-data";

const statusLabels: Record<UserStatus, string> = { active: "Active", invited: "Invited", deactivated: "Deactivated" };

export function UserManagement({ accountId, role }: { accountId: string; role: PortalRole }) {
  const [userStates, setUserStates] = useState<Record<string, UserStatus>>(() => Object.fromEntries(users.map((user) => [user.id, user.status])));
  const [message, setMessage] = useState("");
  const accountUsers = users.filter((user) => user.accountIds.includes(accountId));
  const isAdmin = role === "Procurement and admin";

  function updateUser(userId: string, status: UserStatus, action: string) {
    setUserStates((current) => ({ ...current, [userId]: status }));
    setMessage(`${action} is recorded locally for this prototype.`);
  }

  if (!isAdmin) return <section className="space-y-8"><div className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">User Management</h1></div><Card><CardContent className="flex items-start gap-4 p-6"><ShieldCheck className="mt-1 size-5 text-amber-600" /><div><h2 className="font-semibold">Administrator access required</h2><p className="mt-1 text-sm text-muted-foreground">Switch to the Procurement and admin role to view customer users. This demonstration gate is separate from your personal profile.</p></div></CardContent></Card></section>;

  return <section className="space-y-8"><div className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">User Management</h1><p className="max-w-2xl text-muted-foreground">Manage customer access states and review role permissions. Identity provisioning is not connected.</p></div><div className="grid gap-5 md:grid-cols-3"><Card><CardContent className="p-5"><Users className="size-5 text-primary" /><p className="mt-4 text-2xl font-semibold">{accountUsers.length}</p><p className="text-sm text-muted-foreground">Customer users</p></CardContent></Card><Card><CardContent className="p-5"><CheckCircle2 className="size-5 text-primary" /><p className="mt-4 text-2xl font-semibold">{accountUsers.filter((user) => userStates[user.id] === "active").length}</p><p className="text-sm text-muted-foreground">Active access</p></CardContent></Card><Card><CardContent className="p-5"><UserPlus className="size-5 text-primary" /><p className="mt-4 text-2xl font-semibold">{accountUsers.filter((user) => userStates[user.id] === "invited").length}</p><p className="text-sm text-muted-foreground">Pending invitations</p></CardContent></Card></div>{message && <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground" role="status">{message}</div>}<div className="space-y-4">{accountUsers.map((user) => { const status = userStates[user.id]; return <Card key={user.id}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold">{user.name}</h2><p className="text-sm text-muted-foreground">{user.role}</p></div><Badge variant={status === "deactivated" ? "outline" : status === "invited" ? "secondary" : "default"}>{statusLabels[status]}</Badge></div><div><p className="mb-2 text-sm font-medium">Permissions</p><div className="flex flex-wrap gap-2">{user.permissions.map((permission) => <Badge key={permission} variant="outline">{permission}</Badge>)}</div></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => updateUser(user.id, status === "active" ? "deactivated" : "active", status === "active" ? "Deactivate user" : "Activate user")}>{status === "active" ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="outline" onClick={() => updateUser(user.id, "invited", "Invite user")}><UserPlus className="mr-2 size-4" />Invite</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateUser(user.id, "deactivated", "Delete user")}>Delete</Button></div></CardContent></Card>; })}</div><p className="text-sm text-muted-foreground">Prototype note: actions update local display state only. No account provisioning or production permission enforcement is connected.</p></section>;
}
