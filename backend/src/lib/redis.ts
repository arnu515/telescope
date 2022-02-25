import Redis from "ioredis"

const redis = new Redis({
	port: parseInt(process.env.REDIS_PORT || "6379"),
	host: process.env.REDIS_HOST,
	password: process.env.REDIS_PASSWORD
})

export default redis
