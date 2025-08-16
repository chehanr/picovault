import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

interface DashboardLayoutProps {
	children: ReactNode;
	params: Promise<{ org: string }>;
}

export default async function DashboardLayout({
	children,
	params,
}: DashboardLayoutProps) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	const { org: orgSlug } = await params;

	// Get user's organisations using Better Auth
	const userOrganisations = await auth.api.listOrganizations({
		headers: await headers(),
	});

	if (!userOrganisations || userOrganisations.length === 0) {
		redirect("/organisations/create");
	}

	// Check if the user has access to the requested organisation
	const currentOrg = userOrganisations.find((org) => org.slug === orgSlug);

	if (!currentOrg) {
		notFound(); // Throw 404 if the organisation is not found or user doesn't have access
	}

	// Set the active organisation
	await auth.api.setActiveOrganization({
		headers: await headers(),
		body: {
			organizationId: currentOrg.id,
		},
	});

	const user = session?.user
		? {
				name: session.user.name || "User",
				email: session.user.email || "",
				avatar: session.user.image || "/avatars/default.jpg",
			}
		: null;

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 72)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="inset" user={user} />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
