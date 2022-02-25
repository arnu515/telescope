import i from "@arnu515/tiny-invariant"

const { env } = process

i(!!env.DATABASE_URL, "DATABASE_URL is required")
