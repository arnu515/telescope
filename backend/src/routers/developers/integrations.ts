import { Router } from "express"
import prisma from "../../lib/prisma"
import { devAuth } from "./auth"
import joi from "joi"
import { nanoid } from "nanoid"
import {
	uniqueNamesGenerator as gen,
	adjectives,
	colors,
	animals
} from "unique-names-generator"

const router = Router()

router.get("/", devAuth(), async (req, res) => {
	res.json({
		integrations: await prisma.integration.findMany({
			where: {
				owner: {
					id: (req as any).dev.id
				}
			},
			include: {
				credentials: true
			}
		})
	})
})

router.get("/:id", devAuth(), async (req, res) => {
	let integration = await prisma.integration.findUnique({
		where: {
			id: req.params.id
		},
		include: {
			credentials: true,
			owner: true
		}
	})

	if (!integration) {
		res.status(404).json({ error: "Integration not found" })
		return
	}

	if (integration.ownerId !== (req as any).dev.id) {
		res.status(403).json({ error: "Integration not owned by you" })
		return
	}

	res.json({ integration })
})

router.post("/", devAuth(), async (req, res) => {
	const { error, value } = joi
		.object({
			name: joi.string().required().max(255),
			baseUrl: joi
				.string()
				.required()
				.uri({ scheme: ["https", "http"], allowRelative: false })
		})
		.validate(req.body)

	if (error) {
		res
			.status(422)
			.json({ error: "Invalid body", error_description: error.message })
		return
	}

	const { name, baseUrl } = value

	const integration = await prisma.integration.create({
		data: {
			id:
				gen({ dictionaries: [adjectives, colors, animals], separator: "-" }) +
				"-" +
				nanoid(6),
			name,
			baseUrl,
			key: nanoid(64),
			owner: {
				connect: {
					id: (req as any).dev.id
				}
			}
		}
	})

	res.json({
		integration
	})
})

router.put("/:id", devAuth(), async (req, res) => {
	const { error, value } = joi
		.object({
			name: joi.string().required().max(255),
			baseUrl: joi
				.string()
				.required()
				.uri({ scheme: ["https", "http"], allowRelative: false })
		})
		.validate(req.body)

	if (error) {
		res
			.status(422)
			.json({ error: "Invalid body", error_description: error.message })
		return
	}

	const { name, baseUrl } = value
	const id = req.params.id

	let integration = await prisma.integration.findUnique({
		where: {
			id
		}
	})

	if (!integration) {
		res.status(404).json({ error: "Integration not found" })
		return
	}

	if (integration.ownerId !== (req as any).dev.id) {
		res.status(403).json({ error: "Integration not owned by you" })
		return
	}

	integration = await prisma.integration.update({
		where: { id },
		data: {
			name,
			baseUrl
		}
	})

	res.json({
		integration
	})
})

router.delete("/:id", devAuth(), async (req, res) => {
	let integration = await prisma.integration.findUnique({
		where: {
			id: req.params.id
		}
	})

	if (!integration) {
		res.status(404).json({ error: "Integration not found" })
		return
	}

	if (integration.ownerId !== (req as any).dev.id) {
		res.status(403).json({ error: "Integration not owned by you" })
		return
	}

	await prisma.integration.delete({
		where: {
			id: req.params.id
		}
	})

	res.json({ integration })
})

export default router
