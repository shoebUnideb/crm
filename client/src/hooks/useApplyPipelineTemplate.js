import { useState } from 'react'
import { crmApi } from '../lib/crmApi'
import { peopleApi } from '../lib/crmPeopleApi'

export function useApplyPipelineTemplate() {
  const [applying, setApplying] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  async function apply(template, { includeSampleDeals = true } = {}) {
    setApplying(true)
    setError(null)
    const totalSteps = template.stages.length + (includeSampleDeals ? template.sampleDeals.length : 0)
    let current = 0

    try {
      setProgress({ step: 'pipeline', current: 0, total: totalSteps })
      const pipeline = await crmApi.createPipeline({
        name: template.name,
        description: template.description,
      })

      const stageMap = {}
      for (const stage of template.stages) {
        current++
        setProgress({ step: 'stages', current, total: totalSteps })
        const created = await peopleApi.createStage({
          name: stage.name,
          label: stage.label,
          color: stage.color,
          bg_color: stage.bg_color,
          border_color: stage.border_color,
          probability: stage.probability,
          is_won: stage.is_won || false,
          is_lost: stage.is_lost || false,
          position: stage.position,
          pipeline_id: pipeline.id,
        })
        stageMap[stage.name] = created.id
      }

      if (includeSampleDeals && template.sampleDeals.length > 0) {
        for (const deal of template.sampleDeals) {
          current++
          setProgress({ step: 'deals', current, total: totalSteps })
          await crmApi.createDeal({
            company_name: deal.company_name,
            deal_value: deal.deal_value,
            stage: deal.stage,
            contact_name: deal.contact_name,
            notes: deal.notes || '',
            pipeline_id: pipeline.id,
          })
        }
      }

      setProgress({ step: 'done', current: totalSteps, total: totalSteps })
      setApplying(false)
      return pipeline
    } catch (err) {
      setError(err.message)
      setApplying(false)
      return null
    }
  }

  function reset() {
    setProgress(null)
    setError(null)
  }

  return { apply, applying, progress, error, reset }
}
