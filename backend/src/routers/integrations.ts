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

export default router
