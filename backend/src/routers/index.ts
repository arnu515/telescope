import type { Router as ExpressRouter } from "express"

interface Router {
	router: ExpressRouter
	path?: string
}

const routers: Router[] = []

export default routers
