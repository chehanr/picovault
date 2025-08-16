import { createClient } from "@picovault/auth/client";

export const authClient = createClient({
	baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
});
