import { organization, project, secret } from "@picovault/db";
import { eq, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { auth } from "@/lib/auth";

interface ProjectsPageProps {
	params: Promise<{ org: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
	const { org: orgSlug } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	// Get organisation from slug
	const orgData = await db
		.select()
		.from(organization)
		.where(eq(organization.slug, orgSlug))
		.limit(1);

	if (orgData.length <= 0) {
		notFound();
	}

	const currentOrg = orgData[0];

	// Fetch projects with counts
	const projects = await db
		.select({
			id: project.id,
			name: project.name,
			description: project.description,
			updatedAt: project.updatedAt,
			secretsCount: sql<number>`
				(SELECT COUNT(*) FROM ${secret}
				WHERE ${secret.projectId} = ${project.id})
			`.as("secretsCount"),
		})
		.from(project)
		.where(eq(project.organizationId, currentOrg.id))
		.orderBy(project.updatedAt);

	return (
		<>
			<SiteHeader />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col">
					<div className="flex flex-col gap-6 py-6">
						<div className="px-4 lg:px-6">
							<div className="flex items-center justify-between">
								<div>
									<h1 className="font-semibold text-2xl">Projects</h1>
									<p className="text-muted-foreground">
										Manage your projects and their secrets
									</p>
								</div>
								<Button asChild>
									<Link href={`/${orgSlug}/projects/new`}>
										<Plus className="mr-2 h-4 w-4" />
										New Project
									</Link>
								</Button>
							</div>
						</div>

						<div className="px-4 lg:px-6">
							{projects.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-16">
										<p className="mb-4 text-muted-foreground">
											No projects yet. Create your first project to get started.
										</p>
										<Button asChild>
											<Link href={`/${orgSlug}/projects/new`}>
												<Plus className="mr-2 h-4 w-4" />
												Create Project
											</Link>
										</Button>
									</CardContent>
								</Card>
							) : (
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{projects.map((project) => (
										<Card
											key={project.id}
											className="transition-shadow hover:shadow-md"
										>
											<CardHeader>
												<CardTitle className="flex items-center justify-between">
													<Link
														href={`/${orgSlug}/projects/${project.id}`}
														className="hover:underline"
													>
														{project.name}
													</Link>
												</CardTitle>
												<CardDescription>{project.description}</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex items-center justify-between text-muted-foreground text-sm">
													<div>
														<span>{project.secretsCount} secrets</span>
													</div>
												</div>
												<div className="mt-4 text-muted-foreground text-xs">
													Updated {project.updatedAt.toLocaleDateString()}
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
