"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export function OrganisationSelector() {
	const router = useRouter();
	const { data: organisations, isPending: isLoadingOrgs } =
		authClient.useListOrganizations();
	const { data: activeOrg, isPending: isLoadingActive } =
		authClient.useActiveOrganization();

	// Ensure organisations is an array
	const orgList = organisations || [];

	const handleOrganisationChange = async (organizationId: string) => {
		if (organizationId !== activeOrg?.id) {
			// Set the active organization
			await authClient.organization.setActive({
				organizationId,
			});

			// Find the organization to get its slug
			const org = orgList.find((o) => o.id === organizationId);
			if (org?.slug) {
				router.push(`/${org.slug}`);
			}
		}
	};

	if (isLoadingOrgs || isLoadingActive) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" disabled>
						<Skeleton className="h-8 w-8 rounded-lg" />
						<div className="flex flex-col gap-0.5">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-16" />
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (!activeOrg || orgList.length === 0) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						onClick={() => router.push("/organisations/create")}
					>
						<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							<Plus className="size-4" />
						</div>
						<div className="flex flex-col gap-0.5 leading-none">
							<span className="font-semibold">Create Organisation</span>
							<span className="text-muted-foreground text-xs">Get started</span>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								{activeOrg.name.charAt(0).toUpperCase()}
							</div>
							<div className="flex flex-col gap-0.5 leading-none">
								<span className="font-semibold">{activeOrg.name}</span>
								<span className="text-muted-foreground text-xs">
									{orgList.length}{" "}
									{orgList.length === 1 ? "organisation" : "organisations"}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width]"
						align="start"
					>
						<DropdownMenuLabel>Organisations</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{orgList.map((org) => (
							<DropdownMenuItem
								key={org.id}
								onClick={() => handleOrganisationChange(org.id)}
								className="gap-2"
							>
								<div className="flex size-6 items-center justify-center rounded-sm border">
									{org.name.charAt(0).toUpperCase()}
								</div>
								<span className="flex-1">{org.name}</span>
								{org.id === activeOrg.id && <Check className="size-4" />}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => router.push("/organisations/create")}
							className="gap-2"
						>
							<Plus className="size-4" />
							<span>Create organisation</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
