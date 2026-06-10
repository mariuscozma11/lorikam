import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Input,
  Label,
  Badge,
  Switch,
} from "@medusajs/ui"
import { DocumentText, Plus } from "@medusajs/icons"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import MDEditor from "@uiw/react-md-editor"
import remarkBreaks from "remark-breaks"
import { sdk } from "../../lib/sdk"

type ContentPage = {
  id: string
  slug: string
  title: string
  content: string | null
  is_published: boolean
}

const DocumentePage = () => {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [content, setContent] = useState<string>("")
  const [isPublished, setIsPublished] = useState(true)
  const [creatingNew, setCreatingNew] = useState(false)

  const { data, isLoading } = useQuery<{ content_pages: ContentPage[] }>({
    queryFn: () => sdk.client.fetch("/admin/content-pages"),
    queryKey: ["content-pages"],
  })
  const pages = data?.content_pages || []

  const selected = pages.find((p) => p.id === selectedId) || null

  useEffect(() => {
    if (selected) {
      setTitle(selected.title)
      setSlug(selected.slug)
      setContent(selected.content || "")
      setIsPublished(selected.is_published)
      setCreatingNew(false)
    }
  }, [selectedId])

  const startNew = () => {
    setSelectedId(null)
    setCreatingNew(true)
    setTitle("")
    setSlug("")
    setContent("")
    setIsPublished(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { title, slug, content, is_published: isPublished }
      if (creatingNew) {
        return sdk.client.fetch("/admin/content-pages", {
          method: "POST",
          body,
        })
      }
      return sdk.client.fetch(`/admin/content-pages/${selectedId}`, {
        method: "POST",
        body: { title, content, is_published: isPublished },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] })
      toast.success("Document salvat!")
      setCreatingNew(false)
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/content-pages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] })
      setSelectedId(null)
      toast.success("Document șters!")
    },
    onError: (e) => toast.error("Eroare: " + (e as Error).message),
  })

  const editing = creatingNew || !!selected

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <Heading level="h1">Documente</Heading>
          <Text size="small" className="text-ui-fg-muted mt-1">
            Editează paginile legale și informative (Markdown)
          </Text>
        </div>
        <Button variant="secondary" onClick={startNew}>
          <Plus />
          Document nou
        </Button>
      </div>

      <div className="flex flex-col medium:flex-row">
        {/* List */}
        <div className="medium:w-64 medium:min-w-64 border-r divide-y">
          {isLoading ? (
            <div className="px-4 py-3">
              <Text className="text-ui-fg-muted">Se încarcă...</Text>
            </div>
          ) : (
            pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-4 py-3 hover:bg-ui-bg-base-hover transition-colors ${
                  selectedId === p.id ? "bg-ui-bg-base-pressed" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{p.title}</span>
                  {!p.is_published && (
                    <Badge size="2xsmall" color="grey">
                      ascuns
                    </Badge>
                  )}
                </div>
                <code className="text-xs text-ui-fg-muted">/{p.slug}</code>
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 p-6">
          {!editing ? (
            <Text className="text-ui-fg-muted">
              Selectează un document din listă sau creează unul nou.
            </Text>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doc-title" className="font-medium">
                    Titlu
                  </Label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ex. Termeni și condiții"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-slug" className="font-medium">
                    Slug (URL)
                  </Label>
                  <Input
                    id="doc-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="termeni-si-conditii"
                    disabled={!creatingNew}
                    className="mt-2"
                  />
                  {!creatingNew && (
                    <Text size="small" className="text-ui-fg-muted mt-1">
                      Slug-ul nu poate fi schimbat după creare.
                    </Text>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  id="doc-pub"
                />
                <Label htmlFor="doc-pub">Publicat</Label>
              </div>

              <div data-color-mode="light">
                <Label className="font-medium">Conținut (Markdown)</Label>
                <div className="mt-2">
                  <MDEditor
                    value={content}
                    onChange={(v) => setContent(v || "")}
                    height={420}
                    previewOptions={{ remarkPlugins: [remarkBreaks] }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => saveMutation.mutate()}
                  disabled={
                    saveMutation.isPending ||
                    !title.trim() ||
                    (creatingNew && !slug.trim())
                  }
                >
                  {saveMutation.isPending ? "Se salvează..." : "Salvează"}
                </Button>
                {selected && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm("Sigur vrei să ștergi acest document?"))
                        deleteMutation.mutate(selected.id)
                    }}
                  >
                    Șterge
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Documente",
  icon: DocumentText,
})

export default DocumentePage
