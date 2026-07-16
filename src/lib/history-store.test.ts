import assert from "node:assert/strict"
import { test } from "node:test"

import { planHistoryTrim, type HistoryEntry } from "./history-store.ts"

function entry(id: string, createdAt: number, imageCount: number): HistoryEntry {
  return { id, createdAt, imageCount, response: null }
}

test("keeps everything when under the cap", () => {
  const entries = [entry("a", 1, 4), entry("b", 2, 4)]
  const { kept, removedIds } = planHistoryTrim(entries, 30)

  assert.deepEqual(kept.map((e) => e.id), ["b", "a"])
  assert.deepEqual(removedIds, [])
})

test("drops oldest batches once the image cap is exceeded", () => {
  const entries = [entry("old", 1, 4), entry("mid", 2, 4), entry("new", 3, 4)]
  const { kept, removedIds } = planHistoryTrim(entries, 6)

  assert.deepEqual(kept.map((e) => e.id), ["new"])
  assert.deepEqual(removedIds, ["mid", "old"])
})

test("always keeps the newest batch even if it alone exceeds the cap", () => {
  const { kept, removedIds } = planHistoryTrim([entry("big", 5, 4)], 1)

  assert.deepEqual(kept.map((e) => e.id), ["big"])
  assert.deepEqual(removedIds, [])
})
