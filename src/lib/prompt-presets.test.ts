import assert from "node:assert/strict"
import { test } from "node:test"

import { normalizePresets } from "./prompt-presets.ts"

test("returns empty for non-array values", () => {
  assert.deepEqual(normalizePresets(null), [])
  assert.deepEqual(normalizePresets({}), [])
  assert.deepEqual(normalizePresets("preset"), [])
})

test("keeps non-empty strings, trims them, and drops blanks and non-strings", () => {
  assert.deepEqual(normalizePresets(["one", "  two  ", "", "   ", 3, null, "three"]), [
    "one",
    "two",
    "three",
  ])
})
