import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import { env } from "./lib/env";
import { secrets } from "./routes/secrets";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"X-Project-Id",
			"X-Organisation-Slug",
		],
		exposeHeaders: ["Content-Length"],
		credentials: true,
	}),
);

app.route("/api/secrets", secrets);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.get("/", (c) => {
	return c.text("OK");
});

export default app;
