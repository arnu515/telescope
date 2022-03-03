import { NextApiHandler } from "next"
import { getSession } from "../../../lib/session"

const handler: NextApiHandler = async (req, res) => {
	const session = await getSession(req, res)

	session.dev = null

	if (req.method === "GET") res.redirect("/developers/auth")
	else res.status(200).json({})
}

export default handler
