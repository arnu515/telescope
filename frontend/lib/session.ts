import createSession from "next-session"
import { SessionStore, SessionData } from "next-session/lib/types"
import { customAlphabet } from "nanoid"
import redis from "./redis"
import type { GetServerSideProps } from "next"

const genid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 32)

export const getDevFromSession: GetServerSideProps = async ({ req, res }) => {
	const session = await getSession(req, res)

	if (session) {
		return {
			props: {
				session,
				dev: session.dev
			}
		}
	}

	return { props: { dev: null, session: null } }
}

class RedisStore implements SessionStore {
	private client: typeof redis

	constructor() {
		this.client = redis
	}

	async get(sid: string): Promise<SessionData | null> {
		const session = await this.client.get(`session:${sid}`)
		return JSON.parse(session || "{}")
	}

	async set(sid: string, data: SessionData): Promise<void> {
		await this.client.set(`session:${sid}`, JSON.stringify(data))
	}

	async destroy(sid: string): Promise<void> {
		await this.client.del(`session:${sid}`)
	}

	async touch(sid: string, data: SessionData): Promise<void> {
		await this.client.set(`session:${sid}`, JSON.stringify(data))
	}
}

export const getSession = createSession({
	cookie: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
		maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
	},
	genid,
	store: new RedisStore()
})
