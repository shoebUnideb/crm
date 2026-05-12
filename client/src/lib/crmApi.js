const API = '/api/crm'

function getToken() {
  try { return localStorage.getItem('chart-to-jira-token') } catch { return null }
}

async function apiFetch(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch {
    throw new Error(`Server error ${res.status}`)
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const crmApi = {
  // Deals
  getDeals:    ()         => apiFetch(`${API}/deals`),
  createDeal:  (body)     => apiFetch(`${API}/deals`, { method: 'POST', body: JSON.stringify(body) }),
  updateDeal:  (id, body) => apiFetch(`${API}/deals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateStage: (id, stage, lost_reason) => apiFetch(`${API}/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage, lost_reason }) }),
  updateFollowUp: (id, follow_up_at) => apiFetch(`${API}/deals/${id}/followup`, { method: 'PATCH', body: JSON.stringify({ follow_up_at }) }),
  deleteDeal:  (id)       => apiFetch(`${API}/deals/${id}`, { method: 'DELETE' }),

  // Contacts
  getContacts:    (dealId)       => apiFetch(`${API}/deals/${dealId}/contacts`),
  addContact:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/contacts`, { method: 'POST', body: JSON.stringify(body) }),
  deleteContact:  (id)           => apiFetch(`${API}/contacts/${id}`, { method: 'DELETE' }),

  // Activities
  getActivities:  (dealId)       => apiFetch(`${API}/deals/${dealId}/activities`),
  addActivity:    (dealId, body) => apiFetch(`${API}/deals/${dealId}/activities`, { method: 'POST', body: JSON.stringify(body) }),
  deleteActivity: (id)           => apiFetch(`${API}/activities/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks:    (dealId)       => apiFetch(`${API}/deals/${dealId}/tasks`),
  addTask:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  toggleTask:  (id, done)    => apiFetch(`${API}/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  deleteTask:  (id)           => apiFetch(`${API}/tasks/${id}`, { method: 'DELETE' }),

  // Comments
  getComments:    (dealId)       => apiFetch(`${API}/deals/${dealId}/comments`),
  addComment:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  deleteComment:  (id)           => apiFetch(`${API}/comments/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals:    ()         => apiFetch(`${API}/goals`),
  saveGoal:    (body)     => apiFetch(`${API}/goals`, { method: 'POST', body: JSON.stringify(body) }),
  deleteGoal:  (id)       => apiFetch(`${API}/goals/${id}`, { method: 'DELETE' }),

  // Email Templates
  getEmailTemplates:    ()         => apiFetch(`${API}/email-templates`),
  createEmailTemplate:  (body)     => apiFetch(`${API}/email-templates`, { method: 'POST', body: JSON.stringify(body) }),
  deleteEmailTemplate:  (id)       => apiFetch(`${API}/email-templates/${id}`, { method: 'DELETE' }),

  // Bulk operations
  bulkAction: (ids, action, payload = {}) => apiFetch(`${API}/deals/bulk`, { method: 'POST', body: JSON.stringify({ ids, action, payload }) }),

  // Notifications
  getNotifications: () => apiFetch(`${API}/notifications`),

  // Revenue
  getRevenue: () => apiFetch(`${API}/revenue`),

  // ── Feature 1: Emails ──────────────────────────────────────────────────────
  getEmails:       (dealId) => apiFetch(`${API}/deals/${dealId}/emails`),
  getAllEmails:    ()        => apiFetch(`${API}/emails`),
  sendEmail:       (dealId, body) => apiFetch(`${API}/deals/${dealId}/emails`, { method: 'POST', body: JSON.stringify(body) }),
  sendEmailGlobal: (body)   => apiFetch(`${API}/emails`, { method: 'POST', body: JSON.stringify(body) }),
  deleteEmail:     (id)     => apiFetch(`${API}/emails/${id}`, { method: 'DELETE' }),

  // ── Feature 2: Timeline ────────────────────────────────────────────────────
  getTimeline:   (dealId) => apiFetch(`${API}/deals/${dealId}/timeline`),
  addTimelineEvent: (dealId, body) => apiFetch(`${API}/deals/${dealId}/timeline`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTimelineEvent: (id) => apiFetch(`${API}/timeline/${id}`, { method: 'DELETE' }),

  // ── Feature 3: Lead Scoring ────────────────────────────────────────────────
  getScoringRules:   () => apiFetch(`${API}/scoring-rules`),
  createScoringRule: (body) => apiFetch(`${API}/scoring-rules`, { method: 'POST', body: JSON.stringify(body) }),
  updateScoringRule: (id, body) => apiFetch(`${API}/scoring-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteScoringRule: (id) => apiFetch(`${API}/scoring-rules/${id}`, { method: 'DELETE' }),
  recalculateScores: () => apiFetch(`${API}/deals/recalculate-scores`, { method: 'POST' }),

  // ── Feature 4: Forecasting ─────────────────────────────────────────────────
  getForecast: (period) => apiFetch(`${API}/forecast${period ? `?period=${period}` : ''}`),

  // ── Feature 5: Custom Fields ───────────────────────────────────────────────
  getCustomFields:    (entityType) => apiFetch(`${API}/custom-fields${entityType ? `?entity_type=${entityType}` : ''}`),
  createCustomField:  (body) => apiFetch(`${API}/custom-fields`, { method: 'POST', body: JSON.stringify(body) }),
  updateCustomField:  (id, body) => apiFetch(`${API}/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomField:  (id) => apiFetch(`${API}/custom-fields/${id}`, { method: 'DELETE' }),
  getCustomFieldValues: (entityType, entityId) => apiFetch(`${API}/custom-field-values/${entityType}/${entityId}`),
  setCustomFieldValue:  (body) => apiFetch(`${API}/custom-field-values`, { method: 'POST', body: JSON.stringify(body) }),

  // ── Feature 6: Import/Export ───────────────────────────────────────────────
  importDeals:    (rows) => apiFetch(`${API}/import/deals`, { method: 'POST', body: JSON.stringify({ rows }) }),
  importContacts: (rows) => apiFetch(`${API}/import/contacts`, { method: 'POST', body: JSON.stringify({ rows }) }),
  exportDealsUrl:    () => `${API}/export/deals`,
  exportContactsUrl: () => `${API}/export/contacts`,

  // ── Feature 7: Deal Templates ──────────────────────────────────────────────
  getDealTemplates:    () => apiFetch(`${API}/deal-templates`),
  createDealTemplate:  (body) => apiFetch(`${API}/deal-templates`, { method: 'POST', body: JSON.stringify(body) }),
  updateDealTemplate:  (id, body) => apiFetch(`${API}/deal-templates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDealTemplate:  (id) => apiFetch(`${API}/deal-templates/${id}`, { method: 'DELETE' }),
  applyDealTemplate:   (id, body) => apiFetch(`${API}/deal-templates/${id}/apply`, { method: 'POST', body: JSON.stringify(body) }),

  // ── Feature 8: Automations ─────────────────────────────────────────────────
  getAutomations:    () => apiFetch(`${API}/automations`),
  createAutomation:  (body) => apiFetch(`${API}/automations`, { method: 'POST', body: JSON.stringify(body) }),
  updateAutomation:  (id, body) => apiFetch(`${API}/automations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAutomation:  (id) => apiFetch(`${API}/automations/${id}`, { method: 'DELETE' }),
  triggerAutomation: (body) => apiFetch(`${API}/automations/trigger`, { method: 'POST', body: JSON.stringify(body) }),

  // ── Feature 9: Tags & Filters ──────────────────────────────────────────────
  getTags:       () => apiFetch(`${API}/tags`),
  createTag:     (body) => apiFetch(`${API}/tags`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTag:     (id) => apiFetch(`${API}/tags/${id}`, { method: 'DELETE' }),
  linkTag:       (tagId, entityType, entityId) => apiFetch(`${API}/tags/${tagId}/link`, { method: 'POST', body: JSON.stringify({ entity_type: entityType, entity_id: entityId }) }),
  unlinkTag:     (tagId, entityType, entityId) => apiFetch(`${API}/tags/${tagId}/link`, { method: 'DELETE', body: JSON.stringify({ entity_type: entityType, entity_id: entityId }) }),
  getEntityTags: (entityType, entityId) => apiFetch(`${API}/tags/entity/${entityType}/${entityId}`),
  filterDeals:   (filters) => apiFetch(`${API}/deals/filter`, { method: 'POST', body: JSON.stringify(filters) }),

  // ── Feature 11: Call Logging ───────────────────────────────────────────────
  getCalls:    (dealId) => apiFetch(`${API}/deals/${dealId}/calls`),
  logCall:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/calls`, { method: 'POST', body: JSON.stringify(body) }),
  deleteCall:  (id) => apiFetch(`${API}/calls/${id}`, { method: 'DELETE' }),

  // ── Feature 12: Documents ──────────────────────────────────────────────────
  getDocuments:     (dealId) => apiFetch(`${API}/deals/${dealId}/documents`),
  uploadDocument:   (dealId, body) => apiFetch(`${API}/deals/${dealId}/documents`, { method: 'POST', body: JSON.stringify(body) }),
  downloadDocUrl:   (id) => `${API}/documents/${id}/download`,
  deleteDocument:   (id) => apiFetch(`${API}/documents/${id}`, { method: 'DELETE' }),

  // ── Feature 13: Meetings ───────────────────────────────────────────────────
  getMeetings:      (params) => apiFetch(`${API}/meetings${params ? '?' + new URLSearchParams(params) : ''}`),
  getDealMeetings:  (dealId) => apiFetch(`${API}/deals/${dealId}/meetings`),
  createMeeting:    (body) => apiFetch(`${API}/meetings`, { method: 'POST', body: JSON.stringify(body) }),
  updateMeeting:    (id, body) => apiFetch(`${API}/meetings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMeeting:    (id) => apiFetch(`${API}/meetings/${id}`, { method: 'DELETE' }),

  // ── Global Activities ─────────────────────────────────────────────────────
  getAllActivities:      (params) => apiFetch(`${API}/activities${params ? '?' + new URLSearchParams(params) : ''}`),
  createGlobalActivity: (body) => apiFetch(`${API}/activities`, { method: 'POST', body: JSON.stringify(body) }),
  toggleActivityDone:   (source, id) => apiFetch(`${API}/activities/${source}/${id}/done`, { method: 'PATCH' }),
  deleteGlobalActivity: (source, id) => apiFetch(`${API}/activities/${source}/${id}`, { method: 'DELETE' }),

  // ── Feature 14: Products & Line Items ──────────────────────────────────────
  getProducts:     () => apiFetch(`${API}/products`),
  createProduct:   (body) => apiFetch(`${API}/products`, { method: 'POST', body: JSON.stringify(body) }),
  updateProduct:   (id, body) => apiFetch(`${API}/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct:   (id) => apiFetch(`${API}/products/${id}`, { method: 'DELETE' }),
  getLineItems:    (dealId) => apiFetch(`${API}/deals/${dealId}/line-items`),
  addLineItem:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/line-items`, { method: 'POST', body: JSON.stringify(body) }),
  deleteLineItem:  (id) => apiFetch(`${API}/line-items/${id}`, { method: 'DELETE' }),

  // ── Feature 15: Win/Loss Analysis ──────────────────────────────────────────
  getWinLossAnalysis: () => apiFetch(`${API}/win-loss-analysis`),
  updateWinLoss:      (id, body) => apiFetch(`${API}/deals/${id}/win-loss`, { method: 'PATCH', body: JSON.stringify(body) }),

  // ── Feature 16: Duplicate Detection ────────────────────────────────────────
  getDuplicateDeals:    () => apiFetch(`${API}/duplicates/deals`),
  getDuplicateContacts: () => apiFetch(`${API}/duplicates/contacts`),
  mergeDuplicateDeals:  (keep_id, remove_id) => apiFetch(`${API}/duplicates/merge-deals`, { method: 'POST', body: JSON.stringify({ keep_id, remove_id }) }),

  // ── Feature 17: Sequences ──────────────────────────────────────────────────
  getSequences:       () => apiFetch(`${API}/sequences`),
  createSequence:     (body) => apiFetch(`${API}/sequences`, { method: 'POST', body: JSON.stringify(body) }),
  updateSequence:     (id, body) => apiFetch(`${API}/sequences/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSequence:     (id) => apiFetch(`${API}/sequences/${id}`, { method: 'DELETE' }),
  enrollInSequence:   (id, body) => apiFetch(`${API}/sequences/${id}/enroll`, { method: 'POST', body: JSON.stringify(body) }),
  getEnrollments:     (id) => apiFetch(`${API}/sequences/${id}/enrollments`),
  deleteEnrollment:   (id) => apiFetch(`${API}/enrollments/${id}`, { method: 'DELETE' }),

  // ── Feature 18: Dashboard Layouts ──────────────────────────────────────────
  getDashboardLayouts:    () => apiFetch(`${API}/dashboard-layouts`),
  createDashboardLayout:  (body) => apiFetch(`${API}/dashboard-layouts`, { method: 'POST', body: JSON.stringify(body) }),
  updateDashboardLayout:  (id, body) => apiFetch(`${API}/dashboard-layouts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDashboardLayout:  (id) => apiFetch(`${API}/dashboard-layouts/${id}`, { method: 'DELETE' }),

  // ── Feature 19: Audit Log ──────────────────────────────────────────────────
  getAuditLog: (params) => apiFetch(`${API}/audit-log${params ? '?' + new URLSearchParams(params) : ''}`),

  // ── Feature 20: Webhooks & API Keys ────────────────────────────────────────
  getWebhooks:    () => apiFetch(`${API}/webhooks`),
  createWebhook:  (body) => apiFetch(`${API}/webhooks`, { method: 'POST', body: JSON.stringify(body) }),
  updateWebhook:  (id, body) => apiFetch(`${API}/webhooks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWebhook:  (id) => apiFetch(`${API}/webhooks/${id}`, { method: 'DELETE' }),
  getApiKeys:     () => apiFetch(`${API}/api-keys`),
  createApiKey:   (body) => apiFetch(`${API}/api-keys`, { method: 'POST', body: JSON.stringify(body) }),
  deleteApiKey:   (id) => apiFetch(`${API}/api-keys/${id}`, { method: 'DELETE' }),

  // ══ CRM v6 Features ══════════════════════════════════════════════════════

  // F1: Smart Views
  getSmartViews:    () => apiFetch(`${API}/smart-views`),
  createSmartView:  (body) => apiFetch(`${API}/smart-views`, { method: 'POST', body: JSON.stringify(body) }),
  updateSmartView:  (id, body) => apiFetch(`${API}/smart-views/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSmartView:  (id) => apiFetch(`${API}/smart-views/${id}`, { method: 'DELETE' }),

  // F2: Approval Workflows
  getApprovalRules:     () => apiFetch(`${API}/approval-rules`),
  createApprovalRule:   (body) => apiFetch(`${API}/approval-rules`, { method: 'POST', body: JSON.stringify(body) }),
  updateApprovalRule:   (id, body) => apiFetch(`${API}/approval-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteApprovalRule:   (id) => apiFetch(`${API}/approval-rules/${id}`, { method: 'DELETE' }),
  requestApproval:      (dealId, body) => apiFetch(`${API}/deals/${dealId}/request-approval`, { method: 'POST', body: JSON.stringify(body) }),
  getPendingApprovals:  () => apiFetch(`${API}/approvals/pending`),
  resolveApproval:      (id, body) => apiFetch(`${API}/approvals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // F4: Multiple Pipelines
  getPipelines:    () => apiFetch(`${API}/pipelines`),
  createPipeline:  (body) => apiFetch(`${API}/pipelines`, { method: 'POST', body: JSON.stringify(body) }),
  updatePipeline:  (id, body) => apiFetch(`${API}/pipelines/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePipeline:  (id) => apiFetch(`${API}/pipelines/${id}`, { method: 'DELETE' }),

  // F5: Territory & Lead Routing
  getTerritories:    () => apiFetch(`${API}/territories`),
  createTerritory:   (body) => apiFetch(`${API}/territories`, { method: 'POST', body: JSON.stringify(body) }),
  updateTerritory:   (id, body) => apiFetch(`${API}/territories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTerritory:   (id) => apiFetch(`${API}/territories/${id}`, { method: 'DELETE' }),
  getRoutingRules:   () => apiFetch(`${API}/routing-rules`),
  createRoutingRule: (body) => apiFetch(`${API}/routing-rules`, { method: 'POST', body: JSON.stringify(body) }),
  deleteRoutingRule: (id) => apiFetch(`${API}/routing-rules/${id}`, { method: 'DELETE' }),
  applyRouting:      (deal_id) => apiFetch(`${API}/routing/apply`, { method: 'POST', body: JSON.stringify({ deal_id }) }),

  // F6: SLA Policies
  getSlaPolicies:    () => apiFetch(`${API}/sla-policies`),
  createSlaPolicy:   (body) => apiFetch(`${API}/sla-policies`, { method: 'POST', body: JSON.stringify(body) }),
  updateSlaPolicy:   (id, body) => apiFetch(`${API}/sla-policies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSlaPolicy:   (id) => apiFetch(`${API}/sla-policies/${id}`, { method: 'DELETE' }),
  getSlaBreaches:    () => apiFetch(`${API}/sla/breaches`),

  // F7: Quote Builder
  getQuotes:       (dealId) => apiFetch(`${API}/quotes${dealId ? `?deal_id=${dealId}` : ''}`),
  createQuote:     (body) => apiFetch(`${API}/quotes`, { method: 'POST', body: JSON.stringify(body) }),
  updateQuote:     (id, body) => apiFetch(`${API}/quotes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuote:     (id) => apiFetch(`${API}/quotes/${id}`, { method: 'DELETE' }),

  // F8: Deal Scoring
  getDealScoringRules:    () => apiFetch(`${API}/deal-scoring-rules`),
  createDealScoringRule:  (body) => apiFetch(`${API}/deal-scoring-rules`, { method: 'POST', body: JSON.stringify(body) }),
  deleteDealScoringRule:  (id) => apiFetch(`${API}/deal-scoring-rules/${id}`, { method: 'DELETE' }),
  recalculateDealScores:  () => apiFetch(`${API}/deals/recalculate-deal-scores`, { method: 'POST' }),

  // F9: Contact Roles
  getContactRoles:    () => apiFetch(`${API}/contact-roles`),
  createContactRole:  (body) => apiFetch(`${API}/contact-roles`, { method: 'POST', body: JSON.stringify(body) }),
  deleteContactRole:  (id) => apiFetch(`${API}/contact-roles/${id}`, { method: 'DELETE' }),
  updateDealPersonRole: (id, body) => apiFetch(`${API}/deal-people/${id}/role`, { method: 'PATCH', body: JSON.stringify(body) }),

  // F10: Renewals
  getRenewals:         () => apiFetch(`${API}/renewals`),
  getUpcomingRenewals: (days) => apiFetch(`${API}/renewals/upcoming?days=${days||30}`),
  createRenewalDeal:   (dealId) => apiFetch(`${API}/deals/${dealId}/create-renewal`, { method: 'POST' }),

  // F11: Form Builder
  getForms:           () => apiFetch(`${API}/forms`),
  createForm:         (body) => apiFetch(`${API}/forms`, { method: 'POST', body: JSON.stringify(body) }),
  updateForm:         (id, body) => apiFetch(`${API}/forms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteForm:         (id) => apiFetch(`${API}/forms/${id}`, { method: 'DELETE' }),
  getFormSubmissions: (id) => apiFetch(`${API}/forms/${id}/submissions`),

  // F12: Activity Cadences
  getCadences:       () => apiFetch(`${API}/cadences`),
  createCadence:     (body) => apiFetch(`${API}/cadences`, { method: 'POST', body: JSON.stringify(body) }),
  updateCadence:     (id, body) => apiFetch(`${API}/cadences/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCadence:     (id) => apiFetch(`${API}/cadences/${id}`, { method: 'DELETE' }),
  enrollInCadence:   (id, body) => apiFetch(`${API}/cadences/${id}/enroll`, { method: 'POST', body: JSON.stringify(body) }),
  getCadenceEnrollments: (id) => apiFetch(`${API}/cadences/${id}/enrollments`),
  updateCadenceEnrollment: (id, body) => apiFetch(`${API}/cadence-enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // F13: Deal Splitting & Exchange Rates
  splitDeal:          (dealId, splits) => apiFetch(`${API}/deals/${dealId}/split`, { method: 'POST', body: JSON.stringify({ splits }) }),
  getExchangeRates:   () => apiFetch(`${API}/exchange-rates`),
  setExchangeRate:    (body) => apiFetch(`${API}/exchange-rates`, { method: 'POST', body: JSON.stringify(body) }),
  deleteExchangeRate: (id) => apiFetch(`${API}/exchange-rates/${id}`, { method: 'DELETE' }),

  // F15: Goal Cascading
  getCascadedGoals: () => apiFetch(`${API}/goals/cascaded`),

  // F16: Snooze
  getSnoozes:     () => apiFetch(`${API}/snoozes`),
  createSnooze:   (body) => apiFetch(`${API}/snoozes`, { method: 'POST', body: JSON.stringify(body) }),
  resolveSnooze:  (id) => apiFetch(`${API}/snoozes/${id}/resolve`, { method: 'PATCH' }),
  getDueSnoozes:  () => apiFetch(`${API}/snoozes/due`),

  // F17: Velocity Rules
  getVelocityRules:    () => apiFetch(`${API}/velocity-rules`),
  createVelocityRule:  (body) => apiFetch(`${API}/velocity-rules`, { method: 'POST', body: JSON.stringify(body) }),
  updateVelocityRule:  (id, body) => apiFetch(`${API}/velocity-rules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVelocityRule:  (id) => apiFetch(`${API}/velocity-rules/${id}`, { method: 'DELETE' }),
  getVelocityViolations: () => apiFetch(`${API}/velocity/violations`),

  // F18: Related Deals
  getDealRelations:    (dealId) => apiFetch(`${API}/deals/${dealId}/relations`),
  createDealRelation:  (body) => apiFetch(`${API}/deal-relations`, { method: 'POST', body: JSON.stringify(body) }),
  deleteDealRelation:  (id) => apiFetch(`${API}/deal-relations/${id}`, { method: 'DELETE' }),

  // F19: Notification Preferences
  getNotificationPrefs:    () => apiFetch(`${API}/notification-prefs`),
  setNotificationPref:     (body) => apiFetch(`${API}/notification-prefs`, { method: 'POST', body: JSON.stringify(body) }),
  deleteNotificationPref:  (id) => apiFetch(`${API}/notification-prefs/${id}`, { method: 'DELETE' }),

  // F20: Stage Validations
  getStageValidations:     () => apiFetch(`${API}/stage-validations`),
  createStageValidation:   (body) => apiFetch(`${API}/stage-validations`, { method: 'POST', body: JSON.stringify(body) }),
  updateStageValidation:   (id, body) => apiFetch(`${API}/stage-validations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStageValidation:   (id) => apiFetch(`${API}/stage-validations/${id}`, { method: 'DELETE' }),
  checkStageValidation:    (deal_id, target_stage) => apiFetch(`${API}/stage-validations/check`, { method: 'POST', body: JSON.stringify({ deal_id, target_stage }) }),
}
