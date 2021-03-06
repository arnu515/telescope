import { Router } from "express"
import prisma from "../lib/prisma"
import { integrationAuth } from "./developers/integrations"
import joi from "joi"
import { stringify } from "qs"
import { customAlphabet } from "nanoid"
import redis from "../lib/redis"
import twilio, { accountSid, apiSecret, apiSid } from "../lib/twilio"
import { jwt } from "twilio"
import crypto from "crypto"

const router = Router()

router.get("/public", async (_, res) => {
	const integrations = await prisma.integration.findMany({
		where: {
			isVerified: true
		}
	})
	res.json({ integrations })
})

router.get(["/:id", "/public/:id"], async (req, res) => {
	const { id } = req.params
	const integration = await prisma.integration.findFirst({
		where: {
			id
		},
		include: {
			owner: true
		}
	})
	if (!integration) {
		res.status(404).json({
			error: "Integration not found",
			error_description: "This integration could not be found"
		})
	} else res.json({ integration })
})

router.get("/public/:id/add", async (req, res) => {
	const { id } = req.params
	const integration = await prisma.integration.findFirst({
		where: {
			id,
			isVerified: true
		}
	})
	if (!integration) {
		res.status(404).render("error", {
			status: 404,
			error: "Integration not found",
			error_description: "This integration could not be found",
			frontend: process.env.APP_URL || "http://localhost:3000"
		})
	} else res.redirect(integration.addUrl)
})

async function getCall(id?: string) {
	if (!id) return null

	const call = await prisma.call.findUnique({
		where: {
			id
		},
		include: {
			integration: true
		}
	})

	if (!call) {
		return null
	}

	try {
		const room = await twilio.video.rooms.get(call.roomSid).fetch()
		console.log({ room })
	} catch (e) {
		console.log(e)
		// delete call because room has expired
		await prisma.call.delete({
			where: {
				id
			}
		})
	}

	return call
}

router.get("/calls/identity", async (req, res) => {
	const identity =
		typeof req.query.identity === "string" ? req.query.identity : null
	if (!identity) {
		res.json({
			nickname: customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 64)(),
			avatarUrl: "https://i.imgur.com/GhJz0Ks.png"
		})
		return
	}

	try {
		const data = JSON.parse(
			(await redis.hget("twilio-identities", identity)) || "{}"
		)
		if (!data) throw new Error()
		res.json({
			nickname: data.nickname || identity,
			avatarUrl: data.avatarUrl || "https://i.imgur.com/GhJz0Ks.png"
		})
		return
	} catch {
		res.json({
			nickname: identity,
			avatarUrl: "https://i.imgur.com/GhJz0Ks.png"
		})
		return
	}
})

router.get("/calls/:id", async (req, res) => {
	const call = await getCall(req.params.id)

	if (!call) {
		res.status(404).json({
			error: "Call not found",
			error_description: "This call could not be found"
		})
		return
	}

	res.json({ call })
})

router.all("/calls/:id/error", integrationAuth(), async (req, res) => {
	const call = await getCall(req.params.id)

	if (!call) {
		res.status(404).json({
			error: "Call not found",
			error_description: "This call could not be found"
		})
		return
	}

	if ((req as any).integration?.id !== call.integrationId) {
		res.status(403).json({
			error: "Forbidden",
			error_description: "This call was not created by this integration"
		})
		return
	}

	const { error: e, value } = joi
		.object({
			error: joi.string().required(),
			error_description: joi.string().required()
		})
		.validate(req.body || req.query)

	if (e) {
		res.status(400).json({
			error: "Invalid body",
			error_description: e.message
		})
		return
	}

	const { error, error_description } = value

	res.json({
		url:
			`${process.env.APP_URL}/calls/${call.id}?` +
			stringify({ error, error_description })
	})
})

router.all("/calls/:id/auth", integrationAuth(), async (req, res) => {
	const call = await getCall(req.params.id)

	if (!call) {
		res.status(404).json({
			error: "Call not found",
			error_description: "This call could not be found"
		})
		return
	}

	if ((req as any).integration?.id !== call.integrationId) {
		res.status(403).json({
			error: "Forbidden",
			error_description: "This call was not created by this integration"
		})
		return
	}

	const { error: e, value } = joi
		.object({
			nickname: joi.string().default("").max(255),
			avatarUrl: joi
				.string()
				.uri({ scheme: "https" })
				.default("https://i.imgur.com/GhJz0Ks.png")
		})
		.validate(req.body || req.query)

	if (e) {
		res.status(400).json({
			error: "Invalid body",
			error_description: e.message
		})
		return
	}

	const auth_token = customAlphabet(
		"abcdefghijklmnopqrstuvwxyz0123456789",
		64
	)()

	await redis.hset(
		"call:auth",
		crypto.createHash("sha256").update(auth_token).digest("hex"),
		JSON.stringify({ id: call.id, ...value })
	)

	res.json({
		url: `${process.env.APP_URL}/calls/${call.id}?` + stringify({ auth_token })
	})
})

router.get("/calls/:id/tokendata", async (req, res) => {
	const call = await getCall(req.params.id)

	if (!call) {
		res.status(404).json({
			error: "Call not found",
			error_description: "This call could not be found"
		})
		return
	}

	const token = req.headers["authorization"]?.split?.(" ")?.[1]
	if (!token) {
		res.status(404).json({
			error: "Token not found",
			error_description: "This token could not be found"
		})
		return
	}

	try {
		const data = JSON.parse(
			(await redis.hget(
				"call:auth",
				crypto.createHash("sha256").update(token).digest("hex")
			)) || ""
		)
		if (!data) throw new Error()
		res.json({
			data
		})
	} catch {
		res.status(404).json({
			error: "Token not found",
			error_description: "This token could not be found"
		})
		return
	}
})

router.post("/calls/:id/calltoken", async (req, res) => {
	const { error, value } = joi
		.object({
			nickname: joi.string().required().max(255),
			avatarUrl: joi
				.string()
				.uri({ scheme: "https" })
				.default("https://i.imgur.com/GhJz0Ks.png")
		})
		.validate(req.body)

	if (error) {
		res.status(422).json({
			error: "Invalid body",
			error_description: error.message
		})
		return
	}

	const call = await getCall(req.params.id)

	if (!call) {
		res.status(404).json({
			error: "Call not found",
			error_description: "This call could not be found"
		})
		return
	}

	const token = req.headers["authorization"]?.split?.(" ")?.[1]
	if (!token) {
		res.status(404).json({
			error: "Token not found",
			error_description: "This token could not be found"
		})
		return
	}

	if (
		!(await redis.hget(
			"call:auth",
			crypto.createHash("sha256").update(token).digest("hex")
		))
	) {
		res.status(404).json({
			error: "Token not found",
			error_description: "This token could not be found"
		})
		return
	}

	await redis.hdel(
		"call:auth",
		crypto.createHash("sha256").update(token).digest("hex")
	)

	try {
		const room = await twilio.video.rooms.get(call.roomSid).fetch()
		if (room.participants.length > 1) {
			res.status(403).json({
				error: "Call is full",
				error_description:
					"The call already has two people in it. Please create a new call or try again later"
			})
			return
		}
		const grant = new jwt.AccessToken.VideoGrant({ room: room.uniqueName })
		const token = new jwt.AccessToken(accountSid, apiSid, apiSecret)
		token.addGrant(grant)
		const { nickname, avatarUrl } = value
		const identity = customAlphabet(
			"abcdefghijklmnopqrstuvwxyz0123456789",
			64
		)()
		await redis.hset(
			"twilio-identities",
			identity,
			JSON.stringify({ nickname, avatarUrl })
		)
		token.identity = identity
		res.json({ token: token.toJwt() })
		return
	} catch (e) {
		// delete the call
		await prisma.call.delete({
			where: {
				id: call.id
			}
		})
		res.status(404).json({
			error: "Call not found",
			error_description: "This call could not be found"
		})
		return
	}
})

router.post("/calls/create", integrationAuth(), async (req, res) => {
	const { error, value } = joi
		.object({
			toId: joi.string().required(),
			fromId: joi.string().required(),
			data: joi.object().default({})
		})
		.validate(req.body)

	if (error) {
		res.status(400).json({
			error: "Invalid body",
			error_description: error.message
		})
		return
	}

	const { toId, fromId, data } = value

	const room = await twilio.video.rooms.create({
		emptyRoomTimeout: 15,
		unusedRoomTimeout: 15,
		type: "go"
	})

	console.log({ room })

	const call = await prisma.call.create({
		data: {
			toId,
			fromId,
			integrationData: data,
			roomSid: room.sid,
			integration: {
				connect: {
					id: (req as any).integration.id
				}
			}
		}
	})

	res.json({ call })
})

export default router
