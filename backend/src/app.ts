import express from "express"
import cors from "cors"
import morgan from "morgan"

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("dev"))

import routers from "./routers"

routers.forEach(({ router, path }) => {
	app.use(path || "/", router)
})

app.get("/", (_, res) => res.json({ message: "Hello World" }))

export default app
