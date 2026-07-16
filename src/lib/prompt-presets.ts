import { readFileSync } from "node:fs"
import { join } from "node:path"

export function normalizePresets(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

let cached: string[] | undefined

export function loadPromptPresets(): string[] {
  if (cached === undefined) {
    try {
      cached = normalizePresets(JSON.parse(readFileSync(join(process.cwd(), "presets.json"), "utf8")))
    } catch {
      cached = []
    }
  }

  return cached
}
