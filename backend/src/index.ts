if (process.env.NODE_ENV !== "production") require("dotenv/config")

import "./checkEnv"

import express from "express"
import cors from "cors"
import morgan from "morgan"
import { createServer } from "http"

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("dev"))

app.get("/", (_, res) => res.json({ message: "Hello World" }))

const server = createServer(app)

const { PORT = 5000 } = process.env
server.listen(PORT, () => {
	console.log("Server listening on port " + PORT)
})
