import type { Router as ExpressRouter } from "express"
import developersAuth from "./developers/auth"
import developersIntegrations from "./developers/integrations"
import integrations from "./integrations"

interface Router {
	router: ExpressRouter
	path?: string
}

const routers: Router[] = [
	{
		router: developersAuth,
		path: "/api/developers/auth"
	},
	{
		router: developersIntegrations,
		path: "/api/developers/integrations"
	},
	{
		router: integrations,
		path: "/api/integrations"
	}
]

export default routers
