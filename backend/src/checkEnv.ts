import i from "@arnu515/tiny-invariant"

const { env } = process

i(typeof env.DATABASE_URL !== "string", "DATABASE_URL is required")

i(typeof env.GITHUB_CLIENT_ID !== "string", "GITHUB_CLIENT_ID is required")
i(
	typeof env.GITHUB_CLIENT_SECRET !== "string",
	"GITHUB_CLIENT_SECRET is required"
)
