import { Router } from "express"
import prisma from "../lib/prisma"

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

export default router
