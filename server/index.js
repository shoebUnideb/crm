import http from 'http'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import jiraRouter from './src/routes/jira.js'
import authRouter from './src/routes/auth.js'
import projectsRouter from './src/routes/projects.js'
import invitesRouter from './src/routes/invites.js'
import analyticsRouter from './src/routes/analytics.js'
import adminRouter from './src/routes/admin.js'
import crmRouter from './src/routes/crm.js'
import errorHandler from './src/middleware/errorHandler.js'
import { initDb } from './src/db/index.js'
import { attachCollabServer } from './src/websocket/collabServer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRouter)
app.use('/api/jira', jiraRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/invites', invitesRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/crm', crmRouter)

app.use(errorHandler)

const server = http.createServer(app)
attachCollabServer(server)

async function start() {
  try {
    await initDb()
    console.log('Database initialized')
  } catch (err) {
    console.warn('Database not available (auth + collab features degraded):', err.message)
  }
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`WebSocket collaboration on ws://localhost:${PORT}/ws`)
  })
}

start()
