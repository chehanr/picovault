import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

// Define custom permissions for projects
const statement = {
	...defaultStatements,
	project: ["create", "read", "update", "delete"],
	secret: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

// Define roles with their permissions
export const owner = ac.newRole({
	...ownerAc.statements,
	project: ["create", "read", "update", "delete"],
	secret: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
	...adminAc.statements,
	project: ["create", "read", "update", "delete"],
	secret: ["create", "read", "update", "delete"],
});

export const member = ac.newRole({
	...memberAc.statements,
	project: ["create", "read", "update"],
	secret: ["create", "read", "update"],
});

export const viewer = ac.newRole({
	project: ["read"],
	secret: ["read"],
});
