"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Copy, Edit2, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";

interface SecretRow {
	id?: string;
	key: string;
	value: string;
	description?: string;
	isEditing?: boolean;
	isNew?: boolean;
}

interface SecretsTableProps {
	projectId: string;
}

export function SecretsTable({ projectId }: SecretsTableProps) {
	const [rows, setRows] = useState<SecretRow[]>([
		{ key: "", value: "", description: "", isNew: true },
	]);
	const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

	const { data: secrets, refetch } = useQuery(
		trpc.secrets.list.queryOptions({ projectId }, { enabled: !!projectId }),
	);

	const createSecret = useMutation(
		trpc.secrets.create.mutationOptions({
			onSuccess: () => {
				toast.success("Secret created");
				refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create secret");
			},
		}),
	);

	const updateSecret = useMutation(
		trpc.secrets.update.mutationOptions({
			onSuccess: () => {
				toast.success("Secret updated");
				refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update secret");
			},
		}),
	);

	const deleteSecret = useMutation(
		trpc.secrets.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Secret deleted");
				refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to delete secret");
			},
		}),
	);

	// Load secrets when data is available
	useEffect(() => {
		if (secrets) {
			const newRows = [
				...secrets.map((s) => ({
					id: s.id,
					key: s.key,
					value: s.value || "",
					description: s.description || "",
					isEditing: false,
					isNew: false,
				})),
				{ key: "", value: "", description: "", isNew: true },
			];

			setRows(newRows);

			// Hide all secret values by default
			const hiddenIndices = new Set<string>();
			for (let i = 0; i < newRows.length - 1; i++) {
				// -1 to exclude the "new" row
				hiddenIndices.add(`${i}`);
			}

			setHiddenValues(hiddenIndices);
		}
	}, [secrets]);

	const toggleValueVisibility = (index: number) => {
		const rowKey = `${index}`;
		setHiddenValues((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(rowKey)) {
				newSet.delete(rowKey);
			} else {
				newSet.add(rowKey);
			}
			return newSet;
		});
	};

	const copyToClipboard = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success("Copied to clipboard");
		} catch (_) {
			toast.error("Failed to copy");
		}
	};

	const updateRow = (index: number, field: keyof SecretRow, value: string) => {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
		);
	};

	const saveRow = (index: number) => {
		const row = rows[index];
		if (!row.key.trim() || !row.value.trim()) {
			toast.error("Key and value are required");
			return;
		}

		if (row.isNew) {
			createSecret.mutate({
				projectId,
				key: row.key,
				value: row.value,
				description: row.description || undefined,
			});

			// Reset the new row
			setRows((prev) =>
				prev.map((r, i) =>
					i === index
						? { key: "", value: "", description: "", isNew: true }
						: r,
				),
			);
		} else if (row.id) {
			updateSecret.mutate({
				id: row.id,
				key: row.key,
				value: row.value,
				description: row.description || null,
			});

			setRows((prev) =>
				prev.map((r, i) => (i === index ? { ...r, isEditing: false } : r)),
			);
		}
	};

	const deleteRow = (index: number) => {
		const row = rows[index];
		if (row.isNew || !row.id) {
			return;
		}

		deleteSecret.mutate({ id: row.id });
	};

	const startEditing = (index: number) => {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, isEditing: true } : row)),
		);
	};

	const cancelEditing = (index: number) => {
		const row = rows[index];
		if (row.isNew) {
			setRows((prev) =>
				prev.map((r, i) =>
					i === index
						? { key: "", value: "", description: "", isNew: true }
						: r,
				),
			);
		} else {
			setRows((prev) =>
				prev.map((r, i) => (i === index ? { ...r, isEditing: false } : r)),
			);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			saveRow(index);
		} else if (e.key === "Escape") {
			cancelEditing(index);
		}
	};

	return (
		<div className="space-y-4">
			<div className="rounded-lg border">
				<div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 font-medium text-sm">
					<div className="col-span-3">Name</div>
					<div className="col-span-5">Value</div>
					<div className="col-span-3">Description</div>
					<div className="col-span-1">Actions</div>
				</div>

				<div className="divide-y">
					{rows.map((row, index) => {
						const isHidden = hiddenValues.has(`${index}`);
						const isEditing = row.isEditing || row.isNew;

						return (
							<div
								key={`${row.id || index}`}
								className="group grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/30"
							>
								<div className="col-span-3">
									{isEditing ? (
										<Input
											value={row.key}
											onChange={(e) => updateRow(index, "key", e.target.value)}
											placeholder="DATABASE_URL"
											className="h-8 font-mono"
											onKeyDown={(e) => handleKeyDown(e, index)}
										/>
									) : (
										<span className="font-mono text-sm">{row.key}</span>
									)}
								</div>

								<div className="col-span-5">
									{isEditing ? (
										<Input
											type="password"
											value={row.value}
											onChange={(e) =>
												updateRow(index, "value", e.target.value)
											}
											placeholder="Enter secret value"
											className="h-8 font-mono"
											onKeyDown={(e) => handleKeyDown(e, index)}
										/>
									) : (
										<div className="flex items-center gap-2">
											<span className="font-mono text-sm">
												{isHidden ? "••••••••••••" : row.value}
											</span>
											{row.value && (
												<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
													<Button
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0"
														onClick={() => toggleValueVisibility(index)}
													>
														{isHidden ? (
															<Eye className="h-3 w-3" />
														) : (
															<EyeOff className="h-3 w-3" />
														)}
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0"
														onClick={() => copyToClipboard(row.value)}
													>
														<Copy className="h-3 w-3" />
													</Button>
												</div>
											)}
										</div>
									)}
								</div>

								<div className="col-span-3">
									{isEditing ? (
										<Input
											value={row.description || ""}
											onChange={(e) =>
												updateRow(index, "description", e.target.value)
											}
											placeholder="Optional description"
											className="h-8"
											onKeyDown={(e) => handleKeyDown(e, index)}
										/>
									) : (
										<span className="text-muted-foreground text-sm">
											{row.description}
										</span>
									)}
								</div>

								<div className="col-span-1">
									<div className="flex items-center gap-1">
										{isEditing ? (
											<>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => saveRow(index)}
													disabled={!row.key.trim() || !row.value.trim()}
												>
													<Plus className="h-3 w-3" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => cancelEditing(index)}
												>
													<Trash2 className="h-3 w-3 text-muted-foreground" />
												</Button>
											</>
										) : (
											<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => startEditing(index)}
												>
													<Edit2 className="h-3 w-3" />
												</Button>
												{!row.isNew && (
													<Button
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0"
														onClick={() => deleteRow(index)}
													>
														<Trash2 className="h-3 w-3 text-destructive" />
													</Button>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<p className="text-muted-foreground text-sm">
				Press{" "}
				<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
					⌘ + Enter
				</kbd>{" "}
				to save,{" "}
				<kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
					Esc
				</kbd>{" "}
				to cancel
			</p>
		</div>
	);
}
