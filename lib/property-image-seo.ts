const fallbackVisualContexts = [
  "gallery view",
  "residence detail",
  "Pacific Northwest setting",
  "private-stay atmosphere",
  "outdoor living detail",
  "interior detail",
]

function visualTags(tags: string[] = []) {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => /view|water|lake|ocean|beach|dock|hot tub|sauna|fire|estate|forest|mountain|kayak|outdoor|interior|gathering|private/i.test(tag))
}

function imageContext(index: number, tags: string[] = []) {
  const tag = visualTags(tags)[index % Math.max(visualTags(tags).length, 1)]
  if (tag) return `${tag.toLowerCase()} ${fallbackVisualContexts[index % fallbackVisualContexts.length]}`
  return fallbackVisualContexts[index % fallbackVisualContexts.length]
}

export function propertyGalleryImageAlt({ name, location, index, tags = [] }: { name: string; location: string; index: number; tags?: string[] }) {
  return `${name} ${imageContext(index, tags)} in ${location}`
}

export function propertyGalleryImageTitle({ name, index }: { name: string; index: number }) {
  return `${name} gallery image ${index + 1}`
}
