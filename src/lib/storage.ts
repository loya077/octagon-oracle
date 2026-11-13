import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'octagon-oracle:v1:'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable (private mode, quota) — keep working in memory */
  }
}

/** useState that persists to localStorage. Re-reads when `key` changes. */
export function usePersistentState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<{ key: string; value: T }>(() => ({ key, value: loadJSON(key, fallback) }))
  const value = state.key === key ? state.value : loadJSON(key, fallback)
  useEffect(() => {
    if (state.key !== key) setState({ key, value: loadJSON(key, fallback) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setState((prev) => {
        const base = prev.key === key ? prev.value : loadJSON(key, fallback)
        const next = typeof v === 'function' ? (v as (p: T) => T)(base) : v
        saveJSON(key, next)
        return { key, value: next }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, set]
}
