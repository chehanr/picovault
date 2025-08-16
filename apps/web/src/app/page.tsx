import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	// Get user's organisations using Better Auth
	const userOrganisations = await auth.api.listOrganizations({
		headers: await headers(),
	});

	if (!userOrganisations || userOrganisations.length === 0) {
		redirect("/organisations/create");
	}

	// Get the active organisation from the session
	const activeOrgId = session.session.activeOrganizationId;

	// If there's an active organisation, find it and redirect
	if (activeOrgId) {
		const activeOrg = userOrganisations.find((org) => org.id === activeOrgId);
		if (activeOrg?.slug) {
			redirect(`/${activeOrg.slug}`);
		}
	}

	// Otherwise, set the first organisation as active and redirect to it
	const firstOrg = userOrganisations[0];
	if (firstOrg) {
		await auth.api.setActiveOrganization({
			headers: await headers(),
			body: {
				organizationId: firstOrg.id,
			},
		});

		if (firstOrg.slug) {
			redirect(`/${firstOrg.slug}`);
		}
	}

	// If no valid organisation, redirect to create
	redirect("/organisations/create");
}
