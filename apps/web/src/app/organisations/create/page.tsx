import { OrganisationCreateForm } from "./_components/organisation-create-form";

export default function CreateOrganisationPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="w-full max-w-md space-y-6 p-6">
				<div className="text-center">
					<h1 className="font-semibold text-2xl">Create Organisation</h1>
					<p className="text-muted-foreground">Set up your team's workspace</p>
				</div>
				<OrganisationCreateForm />
			</div>
		</div>
	);
}
