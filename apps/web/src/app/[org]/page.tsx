import { SiteHeader } from "@/components/site-header";

interface DashboardPageProps {
	params: Promise<{ org: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
	const { org } = await params;

	return (
		<>
			<SiteHeader />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						<div className="px-4 lg:px-6">
							<h1 className="font-semibold text-2xl">Dashboard</h1>
							<p className="text-muted-foreground">
								Welcome to {org} organisation
							</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
