import { getGoogleAccessToken } from './google_oauth'

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const API = 'https://firebaseappdistribution.googleapis.com'

export type AppDistributionEnv = {
  FCM_SERVICE_ACCOUNT_JSON?: string
  FIREBASE_PROJECT_NUMBER?: string
  FIREBASE_ANDROID_APP_ID?: string
  FIREBASE_APP_DISTRIBUTION_TESTERS?: string
}

function configured(env: AppDistributionEnv): boolean {
  return Boolean(
    env.FCM_SERVICE_ACCOUNT_JSON?.trim()
    && env.FIREBASE_PROJECT_NUMBER?.trim()
    && env.FIREBASE_ANDROID_APP_ID?.trim(),
  )
}

function testerEmails(value?: string): string[] {
  if (!value) return []
  return [...new Set(
    value.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
  )].slice(0, 999)
}

async function token(env: AppDistributionEnv): Promise<string> {
  return getGoogleAccessToken(env.FCM_SERVICE_ACCOUNT_JSON!, [CLOUD_PLATFORM_SCOPE])
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 20_000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export async function mirrorApkToFirebaseAppDistribution(
  env: AppDistributionEnv,
  apkBody: ReadableStream,
  fileName: string,
  releaseNotes: string,
): Promise<Record<string, unknown>> {
  if (!configured(env)) return { configured: false, mirrored: false }

  const accessToken = await token(env)
  const projectNumber = env.FIREBASE_PROJECT_NUMBER!.trim()
  const appId = env.FIREBASE_ANDROID_APP_ID!.trim()
  const parent = `projects/${projectNumber}/apps/${appId}`
  const uploadResponse = await fetchWithTimeout(
    `${API}/upload/v1/${parent}/releases:upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.android.package-archive',
        'X-Goog-Upload-Protocol': 'raw',
        'X-Goog-Upload-File-Name': fileName,
      },
      body: apkBody,
    },
    60_000,
  )
  if (!uploadResponse.ok) {
    throw new Error(`Firebase App Distribution upload failed (${uploadResponse.status})`)
  }

  let operation = await uploadResponse.json() as {
    name?: string
    done?: boolean
    error?: { message?: string }
    response?: { release?: { name?: string }; result?: string }
  }

  // Uploads are long-running operations. Poll briefly; if Firebase is slow the
  // OTYA release remains valid and the caller can report a pending mirror.
  for (let attempt = 0; !operation.done && operation.name && attempt < 8; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000 + attempt * 500))
    const poll = await fetchWithTimeout(`${API}/v1/${operation.name}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!poll.ok) break
    operation = await poll.json() as typeof operation
  }

  if (operation.error) {
    throw new Error(`Firebase App Distribution operation failed: ${operation.error.message ?? 'unknown error'}`)
  }

  const releaseName = operation.response?.release?.name
  if (!releaseName) {
    return {
      configured: true,
      mirrored: true,
      pending: true,
      operation: operation.name ?? null,
    }
  }

  const notesResponse = await fetchWithTimeout(
    `${API}/v1/${releaseName}?updateMask=releaseNotes.text`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: releaseName,
        releaseNotes: { text: releaseNotes.slice(0, 10_000) },
      }),
    },
  )
  if (!notesResponse.ok) {
    console.warn(`[firebase-app-distribution] release notes update failed: ${notesResponse.status}`)
  }

  const testers = testerEmails(env.FIREBASE_APP_DISTRIBUTION_TESTERS)
  if (testers.length > 0) {
    const distribution = await fetchWithTimeout(
      `${API}/v1/${releaseName}:distribute`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testerEmails: testers }),
      },
      30_000,
    )
    if (!distribution.ok) {
      console.warn(`[firebase-app-distribution] tester distribution failed: ${distribution.status}`)
    }
  }

  return {
    configured: true,
    mirrored: true,
    pending: false,
    release: releaseName,
    testers: testers.length,
  }
}
