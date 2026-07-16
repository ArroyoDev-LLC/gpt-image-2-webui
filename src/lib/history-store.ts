export type HistoryEntry<T = unknown> = {
  id: string
  createdAt: number
  imageCount: number
  response: T
}

const DB_NAME = "imgx-studio"
const STORE_NAME = "history"
const MAX_HISTORY_IMAGES = 30

export function planHistoryTrim<T>(entries: HistoryEntry<T>[], cap = MAX_HISTORY_IMAGES) {
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)
  const kept: HistoryEntry<T>[] = []
  const removedIds: string[] = []
  let total = 0

  for (const entry of sorted) {
    const nextTotal = total + entry.imageCount

    if (kept.length === 0 || nextTotal <= cap) {
      total = nextTotal
      kept.push(entry)
    } else {
      removedIds.push(entry.id)
    }
  }

  return { kept, removedIds }
}

function hasIndexedDb() {
  return typeof indexedDB !== "undefined"
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDatabase()

  try {
    const transaction = db.transaction(STORE_NAME, mode)
    const result = await run(transaction.objectStore(STORE_NAME))
    await transactionDone(transaction)
    return result
  } finally {
    db.close()
  }
}

export async function loadHistory<T = unknown>(): Promise<HistoryEntry<T>[]> {
  if (!hasIndexedDb()) {
    return []
  }

  const entries = await withStore("readonly", (store) =>
    promisifyRequest(store.getAll() as IDBRequest<HistoryEntry<T>[]>)
  )

  return planHistoryTrim(entries).kept
}

export async function saveHistoryEntry<T = unknown>(entry: HistoryEntry<T>): Promise<HistoryEntry<T>[]> {
  if (!hasIndexedDb()) {
    return [entry]
  }

  return withStore("readwrite", async (store) => {
    await promisifyRequest(store.put(entry))
    const entries = await promisifyRequest(store.getAll() as IDBRequest<HistoryEntry<T>[]>)
    const { kept, removedIds } = planHistoryTrim(entries)

    for (const id of removedIds) {
      await promisifyRequest(store.delete(id))
    }

    return kept
  })
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    return
  }

  await withStore("readwrite", (store) => promisifyRequest(store.delete(id)))
}

export async function clearHistory(): Promise<void> {
  if (!hasIndexedDb()) {
    return
  }

  await withStore("readwrite", (store) => promisifyRequest(store.clear()))
}
