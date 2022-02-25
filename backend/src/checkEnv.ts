import i from "@arnu515/tiny-invariant"

const { env } = process
console.log(env)

i(typeof env.DATABASE_URL !== "string", "DATABASE_URL is required")

i(typeof env.REDIS_HOST !== "string", "REDIS_HOST is required")
i(typeof env.REDIS_PORT !== "string", "REDIS_PORT is required")

i(typeof env.GITHUB_CLIENT_ID !== "string", "GITHUB_CLIENT_ID is required")
i(
	typeof env.GITHUB_CLIENT_SECRET !== "string",
	"GITHUB_CLIENT_SECRET is required"
)
