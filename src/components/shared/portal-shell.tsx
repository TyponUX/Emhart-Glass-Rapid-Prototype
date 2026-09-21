import { useMemo, useState, type ReactNode } from "react";
import { BarChart3, Bell, CircleUserRound, GraduationCap, LayoutDashboard, LifeBuoy, PackageSearch, Search, ShieldCheck, ShoppingCart, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accounts, assemblies, documents, machines, notifications as initialNotifications, parts, services, users, type PortalRole } from "@/data/portal-data";
import { getSearchResults, type SearchResult } from "@/lib/portal-logic";
import { useTransaction } from "@/features/quotes/transaction-context";

export type PortalRoute = "dashboard" | "equipment" | "maintenance" | "training" | "user-management" | "reporting" | "products" | "quotes" | "support" | "profile" | "notifications" | "ui-inventory";

interface PortalShellProps {
	route: PortalRoute;
	role: PortalRole;
	accountId: string;
	onRouteChange: (route: PortalRoute) => void;
	onRoleChange: (role: PortalRole) => void;
	onAccountChange: (accountId: string) => void;
	children: ReactNode;
}

const primaryNavigation = [
	{ route: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
	{ route: "equipment" as const, label: "My Equipment", icon: Wrench },
	{ route: "products" as const, label: "Products & Services", icon: PackageSearch },
	{ route: "maintenance" as const, label: "Maintenance", icon: Wrench },
	{ route: "reporting" as const, label: "Reporting", icon: BarChart3 },
	{ route: "training" as const, label: "Training", icon: GraduationCap },
	{ route: "user-management" as const, label: "User Management", icon: ShieldCheck },
	{ route: "quotes" as const, label: "Quotes & Orders", icon: ShoppingCart },
	{ route: "support" as const, label: "Support & Communication", icon: LifeBuoy },
];
const disabledNavigation: string[] = [];

export function PortalShell({ route, role, accountId, onRouteChange, onRoleChange, onAccountChange, children }: PortalShellProps) {
	const [query, setQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [readIds, setReadIds] = useState(() => new Set(initialNotifications.filter((item) => item.read).map((item) => item.id)));
	const { cartCount } = useTransaction();
	const account = accounts.find((candidate) => candidate.id === accountId) ?? accounts[0];
	const user = users.find((candidate) => candidate.role === role) ?? users[0];
	const searchResults = useMemo(() => getSearchResults(query, { machines, assemblies, parts, documents, services }), [query]);
	const unreadCount = initialNotifications.filter((item) => !readIds.has(item.id)).length;

	function openSearchResult(result: SearchResult) {
		setQuery(result.title);
		setSearchOpen(false);
	}

	function markRead(id: string) {
		setReadIds((current) => new Set(current).add(id));
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
				<div className="border-b px-6 py-6"><img src={`${import.meta.env.BASE_URL}assets/images/EmharGlass-logo-white.png`} alt="Bucher Emhart Glass" className="h-14 w-auto max-w-full object-contain object-left" /><p className="mt-4 text-lg font-semibold tracking-tight">Service Portal</p></div>
				<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
					<p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-sidebar">Workspace</p>
					{primaryNavigation.map(({ route: itemRoute, label, icon: Icon }) => <Button key={itemRoute} variant={route === itemRoute ? "secondary" : "ghost"} className="w-full justify-start gap-3" aria-current={route === itemRoute ? "page" : undefined} onClick={() => onRouteChange(itemRoute)}><Icon className="size-4" /><span className="flex-1 text-left">{label}</span>{itemRoute === "quotes" && cartCount > 0 && <Badge variant="secondary">{cartCount}</Badge>}</Button>)}
					{disabledNavigation.length > 0 && <><p className="px-3 pb-2 pt-7 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coming later</p>{disabledNavigation.map((label) => <Button key={label} variant="ghost" disabled className="w-full justify-start gap-3"><span className="size-1.5 rounded-full bg-muted-foreground/40" />{label}</Button>)}</>}
				</nav>
				<div className="border-t p-3"><Button variant={route === "profile" ? "secondary" : "ghost"} className="w-full justify-start gap-3" onClick={() => onRouteChange("profile")}><CircleUserRound className="size-4" />My Profile</Button></div>
			</aside>

			<div className="lg:pl-72">
				<header className="sticky top-0 z-20 border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
					<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
						<div><p className="text-sm font-medium text-muted-foreground">{account.organisation}</p><p className="font-semibold">{route === "ui-inventory" ? "Component inventory" : primaryNavigation.find((item) => item.route === route)?.label ?? "Portal"}</p></div>
						<div className="flex flex-1 items-center justify-end gap-2">
							<div className="relative hidden max-w-md flex-1 md:flex">
								<Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
								<Input aria-label="Global search" placeholder="Search machines, parts, documents..." className="pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} />
								{searchOpen && query && <div className="absolute left-0 right-0 top-11 z-30 max-h-80 overflow-y-auto border bg-background p-2 shadow-lg">{searchResults.length ? searchResults.map((result) => <button key={`${result.type}-${result.id}`} className="block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-accent" onClick={() => openSearchResult(result)}><span className="block text-sm font-medium">{result.title}</span><span className="block text-xs text-muted-foreground">{result.type} · {result.subtitle}</span></button>) : <p className="p-3 text-sm text-muted-foreground">No matching records.</p>}</div>}
							</div>
							<div className="relative"><Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)}><Bell className="size-4" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center bg-primary text-[10px] text-primary-foreground">{unreadCount}</span>}</Button>{notificationsOpen && <div className="absolute right-0 top-11 z-30 w-80 border bg-background p-3 shadow-lg"><div className="mb-2 flex items-center justify-between"><p className="font-semibold">Notifications</p><Badge variant="secondary">{unreadCount} unread</Badge></div>{initialNotifications.map((notification) => <button key={notification.id} className="block w-full border-t px-1 py-3 text-left hover:bg-accent" onClick={() => markRead(notification.id)}><span className="block text-sm font-medium">{notification.title}</span><span className="block text-xs text-muted-foreground">{notification.message}</span><span className="mt-1 block text-xs text-text-primary">{readIds.has(notification.id) ? "Read" : "Unread"}</span></button>)}</div>}</div>
							<Select value={account.id} onValueChange={onAccountChange}><SelectTrigger aria-label="Account" className="w-44"><SelectValue /></SelectTrigger><SelectContent>{accounts.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{candidate.organisation}</SelectItem>)}</SelectContent></Select>
							<Select value={user.role} onValueChange={(value) => onRoleChange(value as PortalRole)}><SelectTrigger aria-label="Role" className="w-52"><SelectValue /></SelectTrigger><SelectContent>{users.map((candidate) => <SelectItem key={candidate.id} value={candidate.role}>{candidate.name} · {candidate.role}</SelectItem>)}</SelectContent></Select>
								
						</div>
					</div>
				</header>
				<main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">{children}</main>
			</div>
		</div>
	);
}

export function PortalPlaceholder({ title, description, eyebrow }: { title: string; description: string; eyebrow: string }) {
	return <section className="space-y-6"><div className="space-y-2"><p className="text-sm font-medium text-text-primary">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="max-w-2xl text-muted-foreground">{description}</p></div><div className="border bg-background p-8 text-center"><Badge variant="secondary">Foundation ready</Badge><p className="mt-3 font-medium">This workspace is ready for its feature task.</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">The shell, account scope, role context, global search, and notifications are available to the next module.</p></div></section>;
	return <section className="space-y-6"><div className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="max-w-2xl text-muted-foreground">{description}</p></div><div className="border bg-background p-8 text-center"><Badge variant="secondary">Foundation ready</Badge><p className="mt-3 font-medium">This workspace is ready for its feature task.</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">The shell, account scope, role context, global search, and notifications are available to the next module.</p></div></section>;
}
