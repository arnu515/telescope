import express from "express"
import cors from "cors"
import morgan from "morgan"
import path from "path"

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan("dev"))

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "templates"))
app.use(express.static(path.join(__dirname, "static")))

import routers from "./routers"

routers.forEach(({ router, path }) => {
	app.use(path || "/", router)
})

app.get("/", (_, res) => res.json({ message: "Hello World" }))

export default app
