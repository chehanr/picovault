import { type NextRequest, NextResponse } from "next/server";

export const config = {
	matcher: "/api/picovault/:path*",
};

export function middleware(request: NextRequest) {
	// We use middleware instead of next.config.js rewrites because:
	// - next.config.js rewrites are evaluated at build time, not runtime
	// - Environment variables in next.config.js are baked in during the build
	// - Middleware runs at runtime and can read environment variables dynamically

	// dotenv doesn't work either - even with nodejs runtime
	const serverUrl =
		process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

	// Rewrite /api/picovault/* to the backend server
	const url = new URL(
		`${serverUrl}${request.nextUrl.pathname.replace("/picovault", "")}${request.nextUrl.search}`,
	);

	return NextResponse.rewrite(url);
}
