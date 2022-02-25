if (process.env.NODE_ENV !== "production") require("dotenv/config")

import "./checkEnv"
import app from "./app"
import { createServer } from "http"

const server = createServer(app)

const { PORT = 5000 } = process.env
server.listen(PORT, () => {
	console.log("Server listening on port " + PORT)
})
