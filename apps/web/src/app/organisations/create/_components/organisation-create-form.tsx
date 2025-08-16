"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import {
	type OrganisationCreateFormData,
	organisationCreateSchema,
} from "../_lib/schemas";

export function OrganisationCreateForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const form = useForm<OrganisationCreateFormData>({
		resolver: zodResolver(organisationCreateSchema),
		defaultValues: {
			name: "",
			slug: "",
			description: "",
		},
	});

	const onSubmit = async (data: OrganisationCreateFormData) => {
		form.clearErrors();
		setIsLoading(true);

		try {
			// Check if slug is available
			const slugCheck = await authClient.organization.checkSlug({
				slug: data.slug,
			});

			if (slugCheck.data?.status === false) {
				form.setError("slug", {
					type: "server",
					message: "Organisation slug already exists",
				});
				setIsLoading(false);
				return;
			}

			// Create the organisation
			const result = await authClient.organization.create({
				name: data.name,
				slug: data.slug,
				metadata: data.description
					? { description: data.description }
					: undefined,
			});

			if (result.data) {
				form.clearErrors();
				router.push(`/${result.data.slug}`);
			} else if (result.error) {
				form.setError("root", {
					type: "server",
					message: result.error.message || "Failed to create organisation",
				});
			}
		} catch (_) {
			form.setError("root", {
				type: "server",
				message: "Failed to create organisation",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const { formState, register, handleSubmit } = form;

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Organisation name</Label>
				<Input
					id="name"
					{...register("name")}
					placeholder="Enter organisation name"
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
				<Label htmlFor="slug">Organisation slug</Label>
				<Input
					id="slug"
					{...register("slug")}
					placeholder="my-organisation"
					disabled={isLoading}
					aria-invalid={!!formState.errors.slug}
				/>
				{formState.errors.slug && (
					<p className="text-destructive text-sm">
						{formState.errors.slug.message}
					</p>
				)}
				<p className="text-muted-foreground text-xs">
					Used in URLs. Only lowercase letters, numbers, and hyphens.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Textarea
					id="description"
					{...register("description")}
					placeholder="Describe your organisation"
					disabled={isLoading}
					rows={3}
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

			<Button type="submit" disabled={isLoading} className="w-full">
				{isLoading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Creating...
					</>
				) : (
					"Create Organisation"
				)}
			</Button>
		</form>
	);
}
