import i from "@arnu515/tiny-invariant"

const { env } = process

i(!!env.DATABASE_URL, "DATABASE_URL is required")

i(!!env.GITHUB_CLIENT_ID, "GITHUB_CLIENT_ID is required")
i(!!env.GITHUB_CLIENT_SECRET, "GITHUB_CLIENT_SECRET is required")
