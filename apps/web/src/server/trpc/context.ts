import { auth } from "../../lib/auth";

export type CreateContextOptions = {
	headers: Headers;
};

export async function createTRPCContext(opts: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: opts.headers,
	});

	return {
		session,
		auth,
		headers: opts.headers,
	};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
