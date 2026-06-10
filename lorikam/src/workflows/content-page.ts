import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTENT_PAGE_MODULE } from "../modules/content-page"
import ContentPageModuleService from "../modules/content-page/service"

export type CreateContentPageInput = {
  slug: string
  title: string
  content?: string | null
  is_published?: boolean
}

const createContentPageStep = createStep(
  "create-content-page-step",
  async (input: CreateContentPageInput, { container }) => {
    const service: ContentPageModuleService =
      container.resolve(CONTENT_PAGE_MODULE)
    const page = await service.createContentPages({
      slug: input.slug,
      title: input.title,
      content: input.content ?? null,
      is_published: input.is_published ?? true,
    })
    return new StepResponse(page, page.id)
  },
  async (id: string, { container }) => {
    const service: ContentPageModuleService =
      container.resolve(CONTENT_PAGE_MODULE)
    await service.deleteContentPages(id)
  }
)

export const createContentPageWorkflow = createWorkflow(
  "create-content-page",
  function (input: CreateContentPageInput) {
    return new WorkflowResponse(createContentPageStep(input))
  }
)

export type UpdateContentPageInput = {
  id: string
  slug?: string
  title?: string
  content?: string | null
  is_published?: boolean
}

const updateContentPageStep = createStep(
  "update-content-page-step",
  async (input: UpdateContentPageInput, { container }) => {
    const service: ContentPageModuleService =
      container.resolve(CONTENT_PAGE_MODULE)
    const page = await service.updateContentPages({
      id: input.id,
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.is_published !== undefined && {
        is_published: input.is_published,
      }),
    })
    return new StepResponse(page)
  }
)

export const updateContentPageWorkflow = createWorkflow(
  "update-content-page",
  function (input: UpdateContentPageInput) {
    return new WorkflowResponse(updateContentPageStep(input))
  }
)

const deleteContentPageStep = createStep(
  "delete-content-page-step",
  async (id: string, { container }) => {
    const service: ContentPageModuleService =
      container.resolve(CONTENT_PAGE_MODULE)
    await service.deleteContentPages(id)
    return new StepResponse(id)
  }
)

export const deleteContentPageWorkflow = createWorkflow(
  "delete-content-page",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteContentPageStep(input.id))
  }
)
