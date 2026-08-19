import { absoluteUrl } from "@/lib/utils"

function uniquePaths(paths: Array<string | undefined | null>) {
  return paths
    .map((path) => path?.trim())
    .filter((path): path is string => Boolean(path))
    .filter((path, index, all) => all.indexOf(path) === index)
}

export function significantLinks(paths: Array<string | undefined | null>) {
  return uniquePaths(paths).map((path) => absoluteUrl(path))
}

export function webpageRefs(paths: Array<string | undefined | null>) {
  return uniquePaths(paths).map((path) => ({ "@id": `${absoluteUrl(path)}#webpage` }))
}
