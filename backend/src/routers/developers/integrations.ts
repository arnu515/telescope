import { NextFunction, Request, Response, Router } from "express"
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
import crypto from "crypto"
import i from "@arnu515/tiny-invariant"

const router = Router()

export function integrationAuth(required = true) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const basicAuth = req.headers.authorization?.split(" ")?.[1]
			i(!!basicAuth, "Basic auth header is required")
			const decodedBAuth = Buffer.from(basicAuth, "base64")
				.toString("utf-8")
				.split(":")
			const clientId = decodedBAuth[0]
			const clientSecret = decodedBAuth.slice(1).join(":")
			i(!!clientId && !!clientSecret, "Invalid basic auth header")
			const creds = await prisma.integrationCredentials.findFirst({
				where: {
					id: clientId,
					secret: crypto.createHash("sha256").update(clientSecret).digest("hex")
				},
				include: { integration: { include: { owner: true } } }
			})
			i(!!creds, "Invalid credentials")
			;(req as any).integration = creds.integration
			await prisma.integrationCredentials.update({
				where: { id: clientId },
				data: { uses: { increment: 1 } }
			})
			next()
		} catch (e) {
			if (required) {
				return res
					.status(401)
					.json({ error: "Unauthorized", error_description: e.message })
			}
			return next()
		}
	}
}

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
				.uri({ scheme: ["https", "http"], allowRelative: false }),
			addUrl: joi
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

	const { name, baseUrl, addUrl } = value

	const integration = await prisma.integration.create({
		data: {
			id:
				gen({ dictionaries: [adjectives, colors, animals], separator: "-" }) +
				"-" +
				nanoid(6),
			name,
			baseUrl,
			addUrl,
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
				.uri({ scheme: ["https", "http"], allowRelative: false }),
			addUrl: joi
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

	const { name, baseUrl, addUrl } = value
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
			baseUrl,
			addUrl
		}
	})

	res.json({
		integration
	})
})

router.delete("/:id", devAuth(), async (req, res) => {
	const integration = await prisma.integration.findUnique({
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

router.post("/:id/credentials", devAuth(), async (req, res) => {
	const integration = await prisma.integration.findUnique({
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

	let secret = nanoid(16)
	secret += "-" + crypto.createHash("md5").update(secret).digest("hex")
	secret += "-" + crypto.createHash("sha256").update(secret).digest("hex")
	const credentials = await prisma.integrationCredentials.create({
		data: {
			id: nanoid(16),
			secret: crypto.createHash("sha256").update(secret).digest("hex"),
			integration: {
				connect: {
					id: integration.id
				}
			}
		},
		include: {
			integration: true
		}
	})

	res.json({ credentials, secret })
})

router.delete("/:id/credentials/:credentialId", devAuth(), async (req, res) => {
	const integration = await prisma.integration.findUnique({
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

	const creds = await prisma.integrationCredentials.findUnique({
		where: {
			id: req.params.credentialId
		}
	})

	if (!creds) {
		res.status(404).json({ error: "Credentials not found" })
		return
	}

	if (creds.integrationId !== integration.id) {
		res.status(403).json({ error: "Credentials not owned by this integration" })
		return
	}

	await prisma.integrationCredentials.delete({
		where: {
			id: req.params.credentialId
		}
	})

	res.json({ credentials: creds })
})

export default router
