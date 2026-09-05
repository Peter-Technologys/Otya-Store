import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const APPROVED_APP_COMMIT = '49348d06f1bb2d6e59ddcb186f9be5e06f86475d'
const SOURCE = `https://raw.githubusercontent.com/PeterSmartLink/OtyaPlayer/${APPROVED_APP_COMMIT}/assets/branding/otya_mark_current.png`
const TARGET = resolve(process.cwd(), 'public/otya-mark-current.png')
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

async function sync() {
  const response = await fetch(SOURCE, {
    headers: { 'User-Agent': 'Otya-Server brand asset sync' },
    redirect: 'follow',
  })
  if (!response.ok) {
    throw new Error(`Could not fetch approved Otya mark (${response.status}).`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 4096 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Approved Otya mark did not resolve to a valid PNG asset.')
  }

  await mkdir(dirname(TARGET), { recursive: true })
  await writeFile(TARGET, bytes)
  console.log(`Synced approved Otya mark from OtyaPlayer@${APPROVED_APP_COMMIT}.`)
}

await sync()
