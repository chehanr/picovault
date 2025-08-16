import type { Server } from "bun";
import { z } from "zod";

const callbackParamsSchema = z.object({
	code: z.string().nullable().optional(),
	state: z.string().nullable().optional(),
	error: z.string().nullable().optional(),
	error_description: z.string().nullable().optional(),
});

export type CallbackParams = z.infer<typeof callbackParamsSchema>;

export interface AuthServerOptions {
	onSuccess: (params: CallbackParams) => Promise<void>;
	onError?: (error: Error) => void;
}

const SUCCESS_PAGE = `<!DOCTYPE html>
<html>
<head>
	<title>Authentication Successful</title>
	<style>
		body {
			font-family: system-ui, -apple-system, sans-serif;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		}
		.container {
			background: white;
			padding: 2rem;
			border-radius: 8px;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
			text-align: center;
			max-width: 400px;
		}
		h1 {
			color: #10b981;
			margin: 0 0 1rem 0;
		}
		p {
			color: #6b7280;
			margin: 0;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>Authentication Successful</h1>
		<p>You can now close this window and return to your terminal.</p>
	</div>
	<script>
		setTimeout(() => window.close(), 3000);
	</script>
</body>
</html>`;

export async function startAuthServer(
	options: AuthServerOptions,
): Promise<{ port: number; close: () => void }> {
	let server: Server | null = null;
	let resolved = false;

	const port = await findAvailablePort();

	server = Bun.serve({
		port,
		async fetch(req) {
			const url = new URL(req.url);

			if (url.pathname !== "/callback") {
				return new Response("Not found", { status: 404 });
			}

			// If already resolved, return the success page
			if (resolved) {
				return new Response(SUCCESS_PAGE, {
					headers: { "Content-Type": "text/html" },
				});
			}

			try {
				const params = callbackParamsSchema.parse({
					code: url.searchParams.get("code"),
					state: url.searchParams.get("state"),
					error: url.searchParams.get("error"),
					error_description: url.searchParams.get("error_description"),
				});

				if (params.error) {
					throw new Error(params.error_description || params.error);
				}

				// Mark as resolved and call success handler
				resolved = true;
				await options.onSuccess(params);

				// Auto-close server after 1 second
				setTimeout(() => server?.stop(), 1000);

				// Return success page
				return new Response(SUCCESS_PAGE, {
					headers: { "Content-Type": "text/html" },
				});
			} catch (error) {
				if (error instanceof z.ZodError) {
					return new Response("Invalid authentication response", {
						status: 400,
					});
				}
				if (options.onError) {
					options.onError(error as Error);
				}
				return new Response("Authentication failed", { status: 500 });
			}
		},
	});

	return {
		port,
		close: () => server?.stop(),
	};
}

async function findAvailablePort(
	startPort = 8910,
	maxAttempts = 100,
): Promise<number> {
	for (let i = 0; i < maxAttempts; i++) {
		const port = startPort + i;
		try {
			const testServer = Bun.serve({
				port,
				fetch() {
					return new Response("");
				},
			});
			testServer.stop();
			return port;
		} catch {
			// Port is in use, try next one
		}
	}
	throw new Error("Could not find available port");
}
