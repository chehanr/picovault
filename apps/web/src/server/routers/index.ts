import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { projectsRouter } from "./projects";
import { secretsRouter } from "./secrets";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	projects: projectsRouter,
	secrets: secretsRouter,
});

export type AppRouter = typeof appRouter;
