import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import type { Context } from "./context";

export interface FieldError {
	field: string;
	type:
		| "required"
		| "invalid"
		| "unique_violation"
		| "too_long"
		| "too_short"
		| "pattern_mismatch";
	message: string;
}

export interface FormError {
	fields: FieldError[];
	message: string;
}

export interface ValidationError {
	type: "validation";
	form?: FormError;
	field?: FieldError;
}

export const t = initTRPC.context<Context>().create({
	errorFormatter(opts) {
		const { shape, error } = opts;
		return {
			...shape,
			data: {
				...shape.data,
				// Handle Zod validation errors
				zodError:
					error.code === "BAD_REQUEST" && error.cause instanceof ZodError
						? error.cause.flatten()
						: null,
				// Handle custom field errors
				fieldError:
					error.code === "BAD_REQUEST" &&
					error.cause &&
					typeof error.cause === "object" &&
					"field" in error.cause &&
					"type" in error.cause &&
					"message" in error.cause
						? (error.cause as FieldError)
						: null,
				// Handle form errors with multiple fields
				formError:
					error.code === "BAD_REQUEST" &&
					error.cause &&
					typeof error.cause === "object" &&
					"fields" in error.cause
						? (error.cause as FormError)
						: null,
				// Handle validation errors
				validationError:
					error.code === "BAD_REQUEST" &&
					error.cause &&
					typeof error.cause === "object" &&
					"type" in error.cause &&
					error.cause.type === "validation"
						? (error.cause as ValidationError)
						: null,
			},
		};
	},
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});
