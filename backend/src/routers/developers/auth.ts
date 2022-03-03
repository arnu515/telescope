import { Router, Request, Response, NextFunction } from "express"
import qs, { stringify } from "qs"
import redis from "../../lib/redis"
import { nanoid } from "nanoid"
import joi from "joi"
import axios from "../../lib/axios"
import prisma from "../../lib/prisma"
import { createToken, verifyToken } from "../../lib/jwt"

const router = Router()
const gh = (path: string) =>
	process.env.GITHUB_API_URL || "https://api.github.com" + path

router.get("/github/connect", async (_, res) => {
	const state = nanoid(32)
	await redis.sadd("github:state", state)
	await redis.expire("github:state", 60 * 15)

	res.redirect(
		"https://github.com/login/oauth/authorize?" +
			qs.stringify({
				client_id: process.env.GITHUB_CLIENT_ID,
				state,
				scope: "user:email"
			})
	)
})

export function devAuth(authRequired = true) {
	return async (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers.authorization?.split(" ")?.[1]
		if (!token) {
			if (authRequired) {
				return res
					.status(401)
					.json({
						error: "Unauthorized",
						error_description: "Token not present in header"
					})
			}
			return next()
		}

		const dev = await verifyToken(token)

		if (!dev) {
			if (authRequired) {
				return res
					.status(401)
					.json({ error: "Unauthorized", error_description: "Invalid token" })
			}
			return next()
		}

		;(req as any).dev = dev

		next()
	}
}

router.get("/github/callback", async (req, res) => {
	const frontend = process.env.APP_URL || "http://localhost:3000"
	const { error: e1, value } = joi
		.object({
			state: joi.string().required().length(32).trim(),
			code: joi.string().required().trim()
		})
		.validate(req.query)

	if (e1) {
		res.status(422).render("error", {
			status: 500,
			error: "Invalid query string",
			error_description: e1.message + ". Please try again.",
			frontend
		})
		return
	}

	// verify state
	if (!(await redis.sismember("github:state", value.state))) {
		res.status(422).render("error", {
			status: 500,
			error: "Invalid state",
			error_description: "The state has expired. Please try again.",
			frontend
		})
		return
	}

	const res1 = await axios.post(
		"https://github.com/login/oauth/access_token",
		qs.stringify({
			client_id: process.env.GITHUB_CLIENT_ID,
			client_secret: process.env.GITHUB_CLIENT_SECRET,
			code: value.code
		})
	)

	res1.data = qs.parse(res1.data) as any

	if (res1.data.error) {
		console.log(res1.status, res1.data)
		res.status(422).render("error", {
			status: res1.status,
			error: "Failed to get access token",
			error_description: qs.parse(res1.data).error_description,
			frontend
		})
		return
	}

	const { access_token, scope } = res1.data

	// check scope
	if (!scope.includes("user:email")) {
		res.status(422).render("error", {
			status: 500,
			error: "Insufficient scope",
			error_description: "Insufficient scope. Please try again.",
			frontend
		})
		return
	}

	const res2 = await axios.get(gh("/user"), {
		headers: {
			Authorization: `token ${access_token}`
		}
	})

	if (res2.status !== 200) {
		console.log(res2.status, res2.data)
		res.status(422).render("error", {
			status: res2.status,
			error: "Failed to get user info",
			error_description: res2.data.message,
			frontend
		})
		return
	}

	let userEmail = res2.data.email
	if (!userEmail) {
		const res3 = await axios.get(gh("/user/emails"), {
			headers: {
				Authorization: `token ${access_token}`
			}
		})
		if (res3.status !== 200) {
			console.log(res3.status, res3.data)
			res.status(422).render("error", {
				status: res3.status,
				error: "Failed to get user email",
				error_description: res3.data.message,
				frontend
			})
			return
		}
		userEmail = res3.data.find((email: any) => email.primary).email
		if (!userEmail) {
			res.status(422).render("error", {
				status: 403,
				error: "Failed to get email",
				error_description:
					"Please ensure that you have a primary verified email address on your GitHub account.",
				frontend
			})
			return
		}
	}

	res2.data.id = res2.data.id.toString()

	let dev = await prisma.developer.findFirst({
		where: { githubId: res2.data.id }
	})

	dev = await prisma.developer.upsert({
		where: { githubId: res2.data.id },
		create: {
			githubId: res2.data.id,
			email: userEmail,
			username: res2.data.login,
			avatarUrl: res2.data.avatar_url,
			name: res2.data.name || res2.data.login
		},
		update: {
			email: userEmail,
			username: res2.data.login,
			avatarUrl: res2.data.avatar_url,
			name: res2.data.name || res2.data.login
		}
	})

	const token = await createToken(dev)

	res.redirect(process.env.APP_URL + "/developers/auth?" + stringify({ token }))
})

router.get("/me", devAuth(), (req, res) => {
	res.json({ dev: (req as any).dev })
})

export default router
