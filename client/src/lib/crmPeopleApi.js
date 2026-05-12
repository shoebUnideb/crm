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
  try { data = JSON.parse(text) } catch { throw new Error(`Server error ${res.status}`) }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

function downloadCsv(url) {
  const token = getToken()
  const a = document.createElement('a')
  a.href = url + (token ? `?_token=${token}` : '')
  // Use fetch + blob so auth header works
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then(r => r.blob()).then(blob => {
      const u = URL.createObjectURL(blob)
      a.href = u
      a.download = url.split('/').pop() + '.csv'
      a.click()
      URL.revokeObjectURL(u)
    })
}

export const peopleApi = {
  // People
  getPeople:           ()              => apiFetch(`${API}/people`),
  createPerson:        (body)          => apiFetch(`${API}/people`, { method: 'POST', body: JSON.stringify(body) }),
  getPersonDetail:     (id)            => apiFetch(`${API}/people/${id}`),
  updatePerson:        (id, body)      => apiFetch(`${API}/people/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePerson:        (id)            => apiFetch(`${API}/people/${id}`, { method: 'DELETE' }),
  starPerson:          (id)            => apiFetch(`${API}/people/${id}/star`, { method: 'PATCH' }),
  checkDuplicates:     (params)        => apiFetch(`${API}/people/duplicates?${new URLSearchParams(params)}`),

  // Person activities
  getPersonActivities: (personId)      => apiFetch(`${API}/people/${personId}/activities`),
  addPersonActivity:   (personId, body)=> apiFetch(`${API}/people/${personId}/activities`, { method: 'POST', body: JSON.stringify(body) }),
  deletePersonActivity:(actId)         => apiFetch(`${API}/people/activities/${actId}`, { method: 'DELETE' }),
  updatePersonActivity:(actId, body)   => apiFetch(`${API}/people/activities/${actId}`, { method: 'PUT', body: JSON.stringify(body) }),
  togglePersonActivityDone: (actId)    => apiFetch(`${API}/people/activities/${actId}/done`, { method: 'PATCH' }),

  // Deal ↔ person links
  linkPersonToDeal:    (dealId, personId, role) => apiFetch(`${API}/deals/${dealId}/people/${personId}`, { method: 'POST', body: JSON.stringify({ role }) }),
  unlinkPersonFromDeal:(dealId, personId)       => apiFetch(`${API}/deals/${dealId}/people/${personId}`, { method: 'DELETE' }),

  // Organizations
  getOrganizations:    ()              => apiFetch(`${API}/organizations`),
  getOrgDetail:        (id)            => apiFetch(`${API}/organizations/${id}`),
  getOrgStats:         (id)            => apiFetch(`${API}/organizations/${id}/stats`),
  createOrg:           (body)          => apiFetch(`${API}/organizations`, { method: 'POST', body: JSON.stringify(body) }),
  updateOrg:           (id, body)      => apiFetch(`${API}/organizations/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  patchOrg:            (id, updates)   => apiFetch(`${API}/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
  deleteOrg:           (id)            => apiFetch(`${API}/organizations/${id}`, { method: 'DELETE' }),
  starOrg:             (id)            => apiFetch(`${API}/organizations/${id}/star`, { method: 'PATCH' }),
  cloneOrg:            (id)            => apiFetch(`${API}/organizations/${id}/clone`, { method: 'POST' }),
  addPersonToOrg:      (orgId, personId) => apiFetch(`${API}/organizations/${orgId}/people/${personId}`, { method: 'POST' }),
  removePersonFromOrg: (orgId, personId) => apiFetch(`${API}/organizations/${orgId}/people/${personId}`, { method: 'DELETE' }),
  addDealToOrg:        (orgId, dealId)   => apiFetch(`${API}/organizations/${orgId}/deals/${dealId}`, { method: 'POST' }),
  removeDealFromOrg:   (orgId, dealId)   => apiFetch(`${API}/organizations/${orgId}/deals/${dealId}`, { method: 'DELETE' }),
  getAllDeals:         ()                => apiFetch(`${API}/organizations/all-deals`),

  // Org multi-value emails
  getOrgEmails:        (orgId)         => apiFetch(`${API}/organizations/${orgId}/emails`),
  addOrgEmail:         (orgId, body)   => apiFetch(`${API}/organizations/${orgId}/emails`, { method: 'POST', body: JSON.stringify(body) }),
  updateOrgEmail:      (orgId, eid, body) => apiFetch(`${API}/organizations/${orgId}/emails/${eid}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteOrgEmail:      (orgId, eid)    => apiFetch(`${API}/organizations/${orgId}/emails/${eid}`, { method: 'DELETE' }),

  // Org multi-value phones
  getOrgPhones:        (orgId)         => apiFetch(`${API}/organizations/${orgId}/phones`),
  addOrgPhone:         (orgId, body)   => apiFetch(`${API}/organizations/${orgId}/phones`, { method: 'POST', body: JSON.stringify(body) }),
  updateOrgPhone:      (orgId, pid, body) => apiFetch(`${API}/organizations/${orgId}/phones/${pid}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteOrgPhone:      (orgId, pid)    => apiFetch(`${API}/organizations/${orgId}/phones/${pid}`, { method: 'DELETE' }),

  // Org activities
  getOrgActivities:    (orgId)         => apiFetch(`${API}/organizations/${orgId}/activities`),
  addOrgActivity:      (orgId, body)   => apiFetch(`${API}/organizations/${orgId}/activities`, { method: 'POST', body: JSON.stringify(body) }),
  deleteOrgActivity:   (actId)         => apiFetch(`${API}/organizations/activities/${actId}`, { method: 'DELETE' }),
  toggleOrgActivityDone: (actId)       => apiFetch(`${API}/organizations/activities/${actId}/done`, { method: 'PATCH' }),

  // Global search
  search:              (q)             => apiFetch(`${API}/search?q=${encodeURIComponent(q)}`),

  // Dashboard
  getDashboard:        ()              => apiFetch(`${API}/dashboard`),

  // Pipeline funnel
  getPipelineFunnel:   ()              => apiFetch(`${API}/pipeline/funnel`),

  // Deal operations
  cloneDeal:           (id)            => apiFetch(`${API}/deals/${id}/clone`, { method: 'POST' }),
  starDeal:            (id)            => apiFetch(`${API}/deals/${id}/star`, { method: 'PATCH' }),

  // Tags
  getTags:             ()              => apiFetch(`${API}/tags`),
  createTag:           (body)          => apiFetch(`${API}/tags`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTag:           (id)            => apiFetch(`${API}/tags/${id}`, { method: 'DELETE' }),
  getEntityTags:       (type, id)      => apiFetch(`${API}/tags/entity/${type}/${id}`),
  linkTag:             (tagId, entity_type, entity_id) => apiFetch(`${API}/tags/${tagId}/link`, { method: 'POST', body: JSON.stringify({ entity_type, entity_id }) }),
  unlinkTag:           (tagId, entity_type, entity_id) => apiFetch(`${API}/tags/${tagId}/link`, { method: 'DELETE', body: JSON.stringify({ entity_type, entity_id }) }),

  // CSV export
  exportContacts:      ()              => downloadCsv(`${API}/export/contacts`),
  exportOrgs:          ()              => downloadCsv(`${API}/export/orgs`),
  exportDeals:         ()              => downloadCsv(`${API}/export/deals`),

  // Bulk org operations
  bulkDeleteOrgs:      (ids)           => apiFetch(`${API}/organizations/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkUpdateOrgs:      (ids, data)     => apiFetch(`${API}/organizations/bulk-update`, { method: 'PATCH', body: JSON.stringify({ ids, ...data }) }),
  mergeOrgs:           (primaryId, mergeIds) => apiFetch(`${API}/organizations/merge`, { method: 'POST', body: JSON.stringify({ primaryId, mergeIds }) }),
  exportSelectedOrgs:  (ids)           => {
    const token = getToken()
    fetch(`${API}/export/orgs/selected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ ids })
    }).then(r => r.blob()).then(blob => {
      const u = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = u; a.download = 'organizations_selected.csv'; a.click()
      URL.revokeObjectURL(u)
    })
  },

  // Pipeline stages
  getStages:     ()            => apiFetch(`${API}/stages`),
  createStage:   (body)        => apiFetch(`${API}/stages`, { method: 'POST', body: JSON.stringify(body) }),
  updateStage:   (id, body)    => apiFetch(`${API}/stages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStage:   (id, params)  => apiFetch(`${API}/stages/${id}${params ? '?' + new URLSearchParams(params) : ''}`, { method: 'DELETE' }),
  reorderStages: (order)       => apiFetch(`${API}/stages/reorder`, { method: 'POST', body: JSON.stringify(order) }),

  // Custom fields
  getCustomFields:    (entityType) => apiFetch(`${API}/custom-fields${entityType ? `?entity_type=${entityType}` : ''}`),
  createCustomField:  (body)       => apiFetch(`${API}/custom-fields`, { method: 'POST', body: JSON.stringify(body) }),
  updateCustomField:  (id, body)   => apiFetch(`${API}/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomField:  (id)         => apiFetch(`${API}/custom-fields/${id}`, { method: 'DELETE' }),
  getAllCustomFieldValues: (entityType) => apiFetch(`${API}/custom-field-values/${entityType}`),
  getCustomFieldValues: (entityType, entityId) => apiFetch(`${API}/custom-field-values/${entityType}/${entityId}`),
  setCustomFieldValue:  (body)     => apiFetch(`${API}/custom-field-values`, { method: 'POST', body: JSON.stringify(body) }),
}
