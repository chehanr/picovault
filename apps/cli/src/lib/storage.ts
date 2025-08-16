import { join } from "node:path";
import { z } from "zod";
import {
	type SessionEntry,
	type SessionStorage,
	sessionStorageSchema,
} from "../schema/storage";

const SESSION_DIR = join(Bun.env.HOME || process.env.HOME || "", ".picovault");
const SESSION_FILE = join(SESSION_DIR, "sessions.json");

export async function loadSessions(): Promise<SessionStorage> {
	const file = Bun.file(SESSION_FILE);

	if (!(await file.exists())) {
		return {
			sessions: [],
			activeContext: undefined,
		};
	}

	try {
		const rawStorage = await file.json();
		const storage = sessionStorageSchema.parse(rawStorage);
		return storage;
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("Invalid session storage:", error.cause);
			return {
				sessions: [],
				activeContext: undefined,
			};
		}
		throw error;
	}
}

async function saveSessions(storage: SessionStorage): Promise<void> {
	const dirFile = Bun.file(SESSION_DIR);
	if (!(await dirFile.exists())) {
		await Bun.spawn(["mkdir", "-p", SESSION_DIR]).exited;
	}

	const validatedStorage = sessionStorageSchema.parse(storage);

	await Bun.write(SESSION_FILE, JSON.stringify(validatedStorage, null, 2));

	await Bun.spawn(["chmod", "600", SESSION_FILE]).exited;
}

export async function addSession(session: SessionEntry): Promise<void> {
	const storage = await loadSessions();

	const existingIndex = storage.sessions.findIndex(
		(s) => s.instanceUrl === session.instanceUrl,
	);

	if (existingIndex >= 0) {
		storage.sessions[existingIndex] = session;
	} else {
		storage.sessions.push(session);
	}

	storage.activeContext = {
		instanceUrl: session.instanceUrl,
	};

	await saveSessions(storage);
}

export async function removeSession(instanceUrl: string): Promise<void> {
	const storage = await loadSessions();

	storage.sessions = storage.sessions.filter(
		(s) => s.instanceUrl !== instanceUrl,
	);

	if (storage.activeContext?.instanceUrl === instanceUrl) {
		storage.activeContext =
			storage.sessions.length > 0
				? {
						instanceUrl: storage.sessions[0].instanceUrl,
					}
				: undefined;
	}

	await saveSessions(storage);
}

export async function clearAllSessions(): Promise<void> {
	const storage: SessionStorage = {
		sessions: [],
		activeContext: undefined,
	};

	await saveSessions(storage);
}

export async function getActiveSession(): Promise<SessionEntry | null> {
	const storage = await loadSessions();

	if (!storage.activeContext) {
		return storage.sessions.length > 0 ? storage.sessions[0] : null;
	}

	return (
		storage.sessions.find(
			(s) => s.instanceUrl === storage.activeContext?.instanceUrl,
		) || null
	);
}
