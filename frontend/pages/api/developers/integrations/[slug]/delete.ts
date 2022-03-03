import type { NextApiHandler } from "next"
import { getSession } from "../../../../../lib/session"
import api, { FetchError } from "../../../../../lib/util/api"

const handler: NextApiHandler = async (req, res) => {
	const redir =
		typeof req.query.redirect === "string" ? req.query.redirect : "/"

	const session = await getSession(req, res)
	if (!session || !session.token) {
		const json = { error: "Unauthorized", error_description: "No session" }
		if (redir) res.redirect(redir + "?" + new URLSearchParams(json).toString())
		else res.status(401).json(json)
		return
	}

	if (typeof req.query.slug !== "string") {
		const json = {
			error: "Not found",
			error_description: "Integration not found"
		}
		res.redirect(redir + "?" + new URLSearchParams(json).toString())
		return
	}

	console.log(session)
	try {
		await api.developers.integrations.delete(session.token, req.query.slug)
		res.redirect(redir + "?" + new URLSearchParams({}).toString())
		return
	} catch (e) {
		if (!(e instanceof FetchError)) {
			const json = {
				error: "An error occured",
				error_description: "An error occured"
			}
			res.redirect(redir + "?" + new URLSearchParams(json).toString())
			return
		}
		if (e.status === 401) {
			session.dev = null
			session.token = null
		}
		const json = {
			error: e.error || "An error occured",
			error_description: e.error_description || "An error occured"
		}
		res.redirect(redir + "?" + new URLSearchParams(json).toString())
		return
	}
}

export default handler
