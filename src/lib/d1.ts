/**
 * Minimal typed wrappers for Cloudflare D1 and R2 bindings.
 * Used instead of `as any` so no eslint-disable comments are needed.
 * These match the real Cloudflare runtime API surface used in this project.
 */

export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  meta: { changes: number }
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number } }>
}

export interface D1 {
  prepare(query: string): D1Statement
}

export interface R2Object {
  text(): Promise<string>
  key: string
  size: number
  uploaded: Date
}

export interface R2ListResult {
  objects: R2Object[]
  truncated: boolean
}

export interface R2 {
  get(key: string): Promise<R2Object | null>
  list(options?: { prefix?: string; limit?: number }): Promise<R2ListResult>
}

export interface KVNamespaceLocal {
  get(key: string): Promise<string | null>
  getWithMetadata<M = unknown>(key: string): Promise<{ value: string | null; metadata: M | null }>
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void>
  delete(key: string): Promise<void>
}

export function getDB(env: Record<string, unknown>): D1 {
  return env.DB as D1
}

export function getR2(env: Record<string, unknown>): R2 {
  return env.R2 as R2
}

export function getKV(env: Record<string, unknown>): KVNamespaceLocal {
  return env.KV as KVNamespaceLocal
}
