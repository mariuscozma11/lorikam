import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { SITE_SETTING_MODULE } from "../modules/site-setting"
import SiteSettingModuleService from "../modules/site-setting/service"

export type UpsertSiteSettingInput = {
  key: string
  value: string | null
}

const upsertSiteSettingStep = createStep(
  "upsert-site-setting-step",
  async (input: UpsertSiteSettingInput, { container }) => {
    const service: SiteSettingModuleService =
      container.resolve(SITE_SETTING_MODULE)
    const [existing] = await service.listSiteSettings({ key: input.key })
    let setting
    if (existing) {
      setting = await service.updateSiteSettings({
        id: existing.id,
        value: input.value,
      })
    } else {
      setting = await service.createSiteSettings({
        key: input.key,
        value: input.value,
      })
    }
    return new StepResponse(setting)
  }
)

export const upsertSiteSettingWorkflow = createWorkflow(
  "upsert-site-setting",
  function (input: UpsertSiteSettingInput) {
    return new WorkflowResponse(upsertSiteSettingStep(input))
  }
)
