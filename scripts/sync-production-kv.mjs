import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const projectRoot = new URL('../', import.meta.url)

export const PRODUCTION_KV_SOURCES = Object.freeze([
  { key: 'app:remote-config', file: 'config/app-remote-config.production.json' },
  { key: 'themes:catalog', file: 'config/themes-catalog.production.json' },
])

export function readBindingNamespaceId(wrangler, binding = 'KV') {
  const blocks = wrangler.split('[[kv_namespaces]]').slice(1)
  for (const rawBlock of blocks) {
    const block = rawBlock.split(/\n\s*\[\[/, 1)[0]
    const blockBinding = block.match(/^\s*binding\s*=\s*"([^"]+)"/m)?.[1]
    const namespaceId = block.match(/^\s*id\s*=\s*"([^"]+)"/m)?.[1]
    if (blockBinding === binding && namespaceId) return namespaceId
  }
  throw new Error(`Cloudflare KV binding ${binding} has no namespace id in wrangler.toml`)
}

export async function syncProductionKv({
  accountId = process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken = process.env.CLOUDFLARE_API_TOKEN,
  fetchImpl = globalThis.fetch,
  log = console.log,
} = {}) {
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is required')
  if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN is required')
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required')

  const wrangler = await readFile(new URL('wrangler.toml', projectRoot), 'utf8')
  const namespaceId = readBindingNamespaceId(wrangler)

  for (const source of PRODUCTION_KV_SOURCES) {
    const raw = await readFile(new URL(source.file, projectRoot), 'utf8')
    JSON.parse(raw)

    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces/${encodeURIComponent(namespaceId)}/values/${encodeURIComponent(source.key)}`
    const response = await fetchImpl(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: raw,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`Cloudflare KV publish failed for ${source.key} (HTTP ${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`)
    }
    log(`Published ${source.key} from ${source.file}`)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  syncProductionKv().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
