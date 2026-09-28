import { useState, type ReactNode } from "react";
import { Bell, CircleUserRound, ClipboardList, LifeBuoy, Menu, PackageSearch, ShoppingCart, Truck, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accounts, notifications as initialNotifications } from "@/data/portal-data";
import { useTransaction } from "@/features/quotes/transaction-context";
import { ActionFeedbackToast } from "@/components/shared/action-feedback";

export type PortalRoute = "dashboard" | "equipment" | "maintenance" | "training" | "projects" | "user-management" | "reporting" | "products" | "quotes" | "orders" | "cart" | "support" | "profile" | "notifications" | "ui-inventory";

interface PortalShellProps {
	route: PortalRoute;
	accountId: string;
	onRouteChange: (route: PortalRoute) => void;
	onAccountChange: (accountId: string) => void;
	children: ReactNode;
}

const primaryNavigation = [
	{ route: "equipment" as const, label: "My Equipment", icon: Wrench },
	{ route: "products" as const, label: "Products", icon: PackageSearch },
	{ route: "quotes" as const, label: "Quotes", icon: ClipboardList },
	{ route: "orders" as const, label: "Orders & Shipment", icon: Truck },
	{ route: "support" as const, label: "Support & Communication", icon: LifeBuoy },
];
const disabledNavigation: string[] = [];

export function PortalShell({ route, accountId, onRouteChange, onAccountChange, children }: PortalShellProps) {
	const [navigationCollapsed, setNavigationCollapsed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("portal-navigation-collapsed") === "true");
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [readIds, setReadIds] = useState(() => new Set(initialNotifications.filter((item) => item.read).map((item) => item.id)));
	const { cartCount, notifications } = useTransaction();
	const account = accounts.find((candidate) => candidate.id === accountId) ?? accounts[0];
	const allNotifications = [...notifications, ...initialNotifications];
	const unreadCount = allNotifications.filter((item) => !readIds.has(item.id) && !item.read).length;

	function markRead(id: string) {
		setReadIds((current) => new Set(current).add(id));
	}

	function toggleNavigation() {
		setNavigationCollapsed((collapsed) => {
			const nextCollapsed = !collapsed;
			window.localStorage.setItem("portal-navigation-collapsed", String(nextCollapsed));
			return nextCollapsed;
		});
	}

	return (
		<div className="min-h-screen min-w-[1024px] bg-background text-foreground">
			<ActionFeedbackToast />
			<header className="sticky top-0 z-30 w-full border-b bg-background/95 px-8 py-3 backdrop-blur">
				<div className="flex min-h-14 items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-6">
						<a href={`${import.meta.env.BASE_URL}`} className="flex min-w-0 items-center" aria-label="Emhart Glass home">
							<img src={`${import.meta.env.BASE_URL}assets/images/EmharGlass%20logo.png`} alt="Bucher Emhart Glass" className="h-12 w-auto max-w-60 object-contain object-left" />
						</a>
						<Button variant="ghost" size="icon" aria-label={navigationCollapsed ? "Expand navigation" : "Collapse navigation"} title={navigationCollapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!navigationCollapsed} onClick={toggleNavigation}><Menu className="size-5" /></Button>
						<Select value={account.id} onValueChange={onAccountChange}><SelectTrigger aria-label="Account Selector" className="w-44"><SelectValue>Account Selector</SelectValue></SelectTrigger><SelectContent>{accounts.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{candidate.organisation}</SelectItem>)}</SelectContent></Select>
					</div>
					<div className="flex shrink-0 items-center justify-end gap-2">
						<div className="relative"><Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications" onClick={() => setNotificationsOpen((open) => !open)}><Bell className="size-4" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center bg-primary text-[10px] text-primary-foreground">{unreadCount}</span>}</Button>{notificationsOpen && <div className="absolute right-0 top-11 z-30 w-80 border bg-background p-3 shadow-lg"><div className="mb-2 flex items-center justify-between"><p className="font-semibold">Notifications</p><Badge variant="secondary">{unreadCount} unread</Badge></div>{allNotifications.map((notification) => <button key={notification.id} className="block w-full border-t px-1 py-3 text-left hover:bg-accent" onClick={() => markRead(notification.id)}><span className="block text-sm font-medium">{notification.title}</span><span className="block text-xs text-muted-foreground">{notification.message}</span><span className="mt-1 block text-xs text-text-primary">{readIds.has(notification.id) || notification.read ? "Read" : "Unread"}</span></button>)}</div>}</div>
						<Button variant={route === "profile" ? "secondary" : "ghost"} size="icon" aria-label="My Profile" title="My Profile" onClick={() => onRouteChange("profile")}><CircleUserRound className="size-5" /></Button>
						<Button variant={route === "cart" ? "secondary" : "ghost"} size="icon" className="relative" aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"} title="Cart" onClick={() => onRouteChange("cart")}><ShoppingCart className="size-5" />{cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center bg-primary text-[10px] text-primary-foreground">{cartCount}</span>}</Button>
					</div>
				</div>
			</header>
			<aside className={`fixed bottom-0 left-0 top-[5.05rem] flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ${navigationCollapsed ? "w-20" : "w-72"}`}>
				<nav className={`flex-1 space-y-1 overflow-y-auto py-5 ${navigationCollapsed ? "px-2" : "px-3"}`} aria-label="Main navigation">
					<div className="h-6 px-3 text-xs font-semibold uppercase tracking-wide text-text-sidebar">{!navigationCollapsed && <span>Workspace</span>}</div>
					{primaryNavigation.map(({ route: itemRoute, label, icon: Icon }) => <Button key={itemRoute} variant={route === itemRoute ? "secondary" : "ghost"} className={`w-full gap-3 ${navigationCollapsed ? "justify-center px-0" : "justify-start"}`} aria-label={label} title={label} aria-current={route === itemRoute ? "page" : undefined} onClick={() => onRouteChange(itemRoute)}><Icon className="size-4 shrink-0" />{!navigationCollapsed && <span className="flex-1 text-left">{label}</span>}</Button>)}
					{!navigationCollapsed && disabledNavigation.length > 0 && <><p className="px-3 pb-2 pt-7 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coming later</p>{disabledNavigation.map((label) => <Button key={label} variant="ghost" disabled className="w-full justify-start gap-3"><span className="size-1.5 rounded-full bg-muted-foreground/40" />{label}</Button>)}</>}
				</nav>
			</aside>

			<div className={`transition-[padding] duration-200 ${navigationCollapsed ? "pl-20" : "pl-72"}`}>
				<main className="mx-auto max-w-7xl px-8 py-8">{children}</main>
			</div>
		</div>
	);
}

export function PortalPlaceholder({ title, description, eyebrow }: { title: string; description: string; eyebrow: string }) {
	return <section className="space-y-6"><div className="space-y-2"><p className="text-sm font-medium text-text-primary">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="max-w-2xl text-muted-foreground">{description}</p></div><div className="border bg-background p-8 text-center"><Badge variant="secondary">Foundation ready</Badge><p className="mt-3 font-medium">This workspace is ready for its feature task.</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">The shell, account scope, role context, and notifications are available to the next module.</p></div></section>;
	return <section className="space-y-6"><div className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="max-w-2xl text-muted-foreground">{description}</p></div><div className="border bg-background p-8 text-center"><Badge variant="secondary">Foundation ready</Badge><p className="mt-3 font-medium">This workspace is ready for its feature task.</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">The shell, account scope, role context, global search, and notifications are available to the next module.</p></div></section>;
}
