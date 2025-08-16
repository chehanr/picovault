import { SiteHeader } from "@/components/site-header";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ProjectCreateForm } from "./_components/project-create-form";

export default function NewProjectPage() {
	return (
		<>
			<SiteHeader />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col">
					<div className="flex flex-col gap-6 py-6">
						<div className="px-4 lg:px-6">
							<div className="max-w-2xl">
								<h1 className="mb-6 font-semibold text-2xl">
									Create New Project
								</h1>

								<Card>
									<CardHeader>
										<CardTitle>Project Details</CardTitle>
										<CardDescription>
											Create a new project to organize and manage your secrets
										</CardDescription>
									</CardHeader>
									<CardContent>
										<ProjectCreateForm />
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
