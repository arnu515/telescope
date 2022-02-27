import { Router } from "express"
import prisma from "../lib/prisma"
import { integrationAuth } from "./developers/integrations"
import joi from "joi"

const router = Router()

router.get("/public", async (_, res) => {
	const integrations = await prisma.integration.findMany({
		where: {
			isVerified: true
		}
	})
	res.json({ integrations })
})

router.get("/public/:id", async (req, res) => {
	const { id } = req.params
	const integration = await prisma.integration.findFirst({
		where: {
			id,
			isVerified: true
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

	if (call.expiresAt && call.expiresAt < new Date()) {
		await prisma.call.delete({
			where: { id: call.id }
		})
		return null
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

	const call = await prisma.call.create({
		data: {
			toId,
			fromId,
			integrationData: data,
			integration: {
				connect: {
					id: (req as any).integration.id
				}
			},
			expiresAt: new Date(Date.now() + 1000 * 60 * 15)
		}
	})

	res.json({ call })
})

export default router
