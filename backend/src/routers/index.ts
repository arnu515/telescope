import type { Router as ExpressRouter } from "express"
import developersAuth from "./developers/auth"

interface Router {
	router: ExpressRouter
	path?: string
}

const routers: Router[] = [
	{
		router: developersAuth,
		path: "/api/developers/auth"
	}
]

export default routers
