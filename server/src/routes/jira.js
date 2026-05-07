import { Router } from 'express'
import { getIssueTypes, createTickets, getSprints, searchIssues } from '../services/jiraService.js'
import authenticate from '../middleware/authenticate.js'

const router = Router()

router.get('/issue-types', authenticate, async (req, res, next) => {
  const { baseUrl, email, apiToken, projectKey } = req.query
  if (!baseUrl || !email || !apiToken || !projectKey) {
    return res.status(400).json({ error: 'Missing required query parameters: baseUrl, email, apiToken, projectKey' })
  }
  try {
    const types = await getIssueTypes({ baseUrl, email, apiToken, projectKey })
    res.json(types)
  } catch (err) {
    next(err)
  }
})

router.get('/sprints', authenticate, async (req, res, next) => {
  const { baseUrl, email, apiToken, boardId } = req.query
  if (!baseUrl || !email || !apiToken || !boardId) {
    return res.status(400).json({ error: 'Missing required query parameters: baseUrl, email, apiToken, boardId' })
  }
  try {
    const sprints = await getSprints({ baseUrl, email, apiToken, boardId })
    res.json(sprints)
  } catch (err) {
    next(err)
  }
})

router.get('/search', authenticate, async (req, res, next) => {
  const { baseUrl, email, apiToken, jql } = req.query
  if (!baseUrl || !email || !apiToken || !jql) {
    return res.status(400).json({ error: 'Missing required query parameters: baseUrl, email, apiToken, jql' })
  }
  try {
    const issues = await searchIssues({ baseUrl, email, apiToken, jql })
    res.json(issues)
  } catch (err) {
    next(err)
  }
})

router.post('/create-tickets', authenticate, async (req, res, next) => {
  const { jira, tree } = req.body
  if (!jira || !tree) {
    return res.status(400).json({ error: 'Request body must include jira and tree' })
  }
  if (!jira.baseUrl || !jira.email || !jira.apiToken || !jira.projectKey) {
    return res.status(400).json({ error: 'jira config must include baseUrl, email, apiToken, projectKey' })
  }
  try {
    const result = await createTickets({ jira, tree })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
