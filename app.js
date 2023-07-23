const ConnectDatabase = require('./config/database');
const config = require('./config');

ConnectDatabase(config.mongoURI);

module.exports = async () => {
  const authMiddleware = require("./src/middleware/auth")
  const express = require("express")
  const cors = require("cors")
  const helmet = require("helmet")
  const morgan = require("morgan")
  const app = express()
  const router = express.Router()
  
  app.use(helmet())
  app.use(cors())
  app.use(morgan("dev"))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))


  const auth = require("./src/routes/auth")(router)
  app.use("/auth", auth)

  const admin = require("./src/routes/admin")(router)
  app.use("/admin", admin)

  const privateRoutes = require('./src/routes')(router)
  app.use("/api", authMiddleware, privateRoutes)

  app.get("/ping", async (req, res) => {
    res.send("pong")
  })

  return app
}
