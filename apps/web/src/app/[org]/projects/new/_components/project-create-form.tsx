"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import {
	type ProjectCreateFormData,
	projectCreateSchema,
} from "../_lib/schemas";

export function ProjectCreateForm() {
	const router = useRouter();
	const { data: activeOrg } = authClient.useActiveOrganization();

	const form = useForm<ProjectCreateFormData>({
		resolver: zodResolver(projectCreateSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	const createProject = useMutation(
		trpc.projects.create.mutationOptions({
			onError: (error) => {
				form.setError("root", {
					type: "server",
					message: error.message || "Failed to create project",
				});
			},
			onSuccess: (project) => {
				form.clearErrors();
				if (activeOrg?.slug) {
					router.push(`/${activeOrg.slug}/projects/${project.id}`);
				}
			},
		}),
	);

	const onSubmit = (data: ProjectCreateFormData) => {
		if (!activeOrg) {
			form.setError("root", {
				type: "server",
				message: "No active organisation selected",
			});
			return;
		}

		form.clearErrors();
		createProject.mutate({
			...data,
			organisationId: activeOrg.id,
		});
	};

	const handleCancel = () => {
		if (activeOrg?.slug) {
			router.push(`/${activeOrg.slug}/projects`);
		}
	};

	const { formState, register, handleSubmit } = form;
	const isLoading =
		createProject.isPending || formState.isSubmitting || !activeOrg;

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Project name</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="e.g., Production API"
					disabled={isLoading}
					aria-invalid={!!formState.errors.name}
				/>
				{formState.errors.name && (
					<p className="text-destructive text-sm">
						{formState.errors.name.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Textarea
					id="description"
					{...register("description")}
					placeholder="Describe what this project is for..."
					disabled={isLoading}
					rows={4}
					aria-invalid={!!formState.errors.description}
				/>
				{formState.errors.description && (
					<p className="text-destructive text-sm">
						{formState.errors.description.message}
					</p>
				)}
			</div>

			{formState.errors.root && (
				<div className="rounded border bg-destructive/10 p-3 text-destructive text-sm">
					{formState.errors.root.message}
				</div>
			)}

			<div className="flex gap-2">
				<Button type="submit" disabled={isLoading}>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating...
						</>
					) : (
						"Create Project"
					)}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={handleCancel}
					disabled={isLoading}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
