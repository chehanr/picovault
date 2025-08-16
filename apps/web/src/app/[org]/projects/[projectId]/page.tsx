import { project, secret } from "@picovault/db";
import { eq, sql } from "drizzle-orm";
import { ArrowLeft, Key, Settings, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { SecretsTable } from "./_components/secrets-table";

interface ProjectPageProps {
	params: Promise<{ org: string; projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
	const { org: orgSlug, projectId } = await params;

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/login");
	}

	// Fetch project with counts
	const projectData = await db
		.select({
			id: project.id,
			name: project.name,
			description: project.description,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
			secretsCount: sql<number>`
				(SELECT COUNT(*) FROM ${secret}
				WHERE ${secret.projectId} = ${project.id})
			`.as("secretsCount"),
		})
		.from(project)
		.where(eq(project.id, projectId))
		.limit(1);

	if (projectData.length <= 0) {
		notFound();
	}

	const projectInfo = projectData[0];

	return (
		<>
			<SiteHeader />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col">
					<div className="flex flex-col gap-6 py-6">
						<div className="px-4 lg:px-6">
							<div className="mb-6 flex items-center gap-4">
								<Button variant="ghost" size="sm" asChild>
									<Link href={`/${orgSlug}/projects`}>
										<ArrowLeft className="mr-2 h-4 w-4" />
										Back to Projects
									</Link>
								</Button>
							</div>

							<div className="mb-6">
								<h1 className="font-semibold text-2xl">{projectInfo.name}</h1>
								{projectInfo.description && (
									<p className="mt-1 text-muted-foreground">
										{projectInfo.description}
									</p>
								)}
							</div>

							<Tabs defaultValue="secrets" className="space-y-4">
								<TabsList>
									<TabsTrigger value="secrets">
										<Key className="mr-2 h-4 w-4" />
										Secrets
									</TabsTrigger>
									<TabsTrigger value="members">
										<Users className="mr-2 h-4 w-4" />
										Members
									</TabsTrigger>
									<TabsTrigger value="settings">
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</TabsTrigger>
								</TabsList>

								<TabsContent value="secrets" className="space-y-4">
									<Card>
										<CardHeader>
											<CardTitle>Secrets</CardTitle>
											<CardDescription>
												Manage your project's secrets and credentials
											</CardDescription>
										</CardHeader>
										<CardContent>
											<SecretsTable projectId={projectInfo.id} />
										</CardContent>
									</Card>
								</TabsContent>

								<TabsContent value="members" className="space-y-4">
									<Card>
										<CardHeader>
											<CardTitle>Project Members</CardTitle>
											<CardDescription>
												Manage who has access to this project
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="py-8 text-center text-muted-foreground">
												<Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
												<p>Access is managed at the organization level</p>
												<p className="mt-2 text-sm">
													Organization members with appropriate permissions can
													access this project
												</p>
											</div>
										</CardContent>
									</Card>
								</TabsContent>

								<TabsContent value="settings" className="space-y-4">
									<Card>
										<CardHeader>
											<CardTitle>Project Settings</CardTitle>
											<CardDescription>
												Configure your project settings
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div>
													<p className="font-medium text-sm">Project ID</p>
													<p className="font-mono text-muted-foreground text-sm">
														{projectInfo.id}
													</p>
												</div>
												<div>
													<p className="font-medium text-sm">Created</p>
													<p className="text-muted-foreground text-sm">
														{projectInfo.createdAt.toLocaleDateString()}
													</p>
												</div>
												<div>
													<p className="font-medium text-sm">Last Updated</p>
													<p className="text-muted-foreground text-sm">
														{projectInfo.updatedAt.toLocaleDateString()}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
