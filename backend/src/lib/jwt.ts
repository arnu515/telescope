import * as jwt from "jsonwebtoken"
import redis from "./redis"
import { Developer } from "@prisma/client"
import prisma from "./prisma"
import i from "@arnu515/tiny-invariant"

export const secret = process.env.JWT_SECRET || process.env.SECRET || "secret"
export const ttl = parseInt(
	process.env.JWT_TTL || (60 * 60 * 24 * 7).toString()
)

export async function createToken(dev: Developer): Promise<string> {
	const token = jwt.sign(
		{
			sub: dev.id
		},
		secret,
		{
			expiresIn: ttl
		}
	)

	await redis.set(`dev:${dev.id}`, token)

	return token
}

export async function verifyToken(token?: string): Promise<Developer | null> {
	if (!token) {
		return null
	}

	try {
		const decoded = jwt.verify(token, secret)
		i(typeof decoded.sub === "string")
		const dev = await prisma.developer.findUnique({
			where: { id: decoded.sub }
		})
		i(!!dev)
		const tokenFromRedis = await redis.get(`dev:${dev.id}`)
		i(tokenFromRedis === token)
		return dev
	} catch {
		return null
	}
}
