import { Router } from "express"
import prisma from "../lib/prisma"
import { integrationAuth } from "./developers/integrations"
import joi from "joi"
import { stringify } from "qs"
import { customAlphabet } from "nanoid"
import redis from "../lib/redis"
import twilio from "../lib/twilio"
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
		call.id
	)

	res.json({
		url:
			`${process.env.APP_URL}/calls/${call.id}?` +
			stringify({ ...value, auth_token })
	})
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
		unusedRoomTimeout: 15
	})

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
