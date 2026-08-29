import { getGoogleAccessToken } from './google_oauth'

const REMOTE_CONFIG_SCOPE = 'https://www.googleapis.com/auth/firebase.remoteconfig'
const REMOTE_CONFIG_TIMEOUT_MS = 8000
export const OTYA_CLIENT_CONFIG_PARAMETER = 'otya_client_config_json'
export const OTYA_CLIENT_CONFIG_REVISION_PARAMETER = 'otya_client_config_revision'

export type FirebaseRemoteConfigParameter = {
  defaultValue?: { value?: string }
  conditionalValues?: Record<string, { value?: string }>
  description?: string
}

export type FirebaseRemoteConfigTemplate = {
  conditions?: unknown[]
  parameters?: Record<string, FirebaseRemoteConfigParameter>
  parameterGroups?: Record<string, unknown>
  version?: Record<string, unknown>
}

export type FirebaseRemoteConfigSnapshot = {
  template: FirebaseRemoteConfigTemplate
  etag: string
}

function serviceAccountProjectId(serviceAccountJson: string): string | null {
  try {
    const parsed = JSON.parse(serviceAccountJson) as { project_id?: string }
    const projectId = parsed.project_id?.trim()
    return projectId || null
  } catch {
    return null
  }
}

export function resolveFirebaseProjectId(
  serviceAccountJson: string,
  explicitProjectId?: string,
): string {
  const projectId = explicitProjectId?.trim() || serviceAccountProjectId(serviceAccountJson)
  if (!projectId) throw new Error('Firebase project id is not configured')
  return projectId
}

async function remoteConfigAccessToken(serviceAccountJson: string): Promise<string> {
  return getGoogleAccessToken(serviceAccountJson, [REMOTE_CONFIG_SCOPE])
}

function endpoint(projectId: string): string {
  return `https://firebaseremoteconfig.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/remoteConfig`
}

export async function getFirebaseRemoteConfigTemplate(
  serviceAccountJson: string,
  explicitProjectId?: string,
): Promise<FirebaseRemoteConfigSnapshot> {
  const projectId = resolveFirebaseProjectId(serviceAccountJson, explicitProjectId)
  const accessToken = await remoteConfigAccessToken(serviceAccountJson)
  const response = await fetch(endpoint(projectId), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      // Firebase currently requires compression negotiation for reliable ETag return.
      'Accept-Encoding': 'gzip',
    },
    signal: AbortSignal.timeout(REMOTE_CONFIG_TIMEOUT_MS),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Firebase Remote Config GET failed (${response.status}): ${body.slice(0, 500)}`)
  }
  const etag = response.headers.get('etag')
  if (!etag) throw new Error('Firebase Remote Config did not return an ETag')
  return {
    template: await response.json() as FirebaseRemoteConfigTemplate,
    etag,
  }
}

async function putTemplate(
  serviceAccountJson: string,
  projectId: string,
  template: FirebaseRemoteConfigTemplate,
  etag: string,
  validateOnly: boolean,
): Promise<{ etag: string; template: FirebaseRemoteConfigTemplate }> {
  const accessToken = await remoteConfigAccessToken(serviceAccountJson)
  const url = `${endpoint(projectId)}${validateOnly ? '?validate_only=true' : ''}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept-Encoding': 'gzip',
      'If-Match': etag,
    },
    body: JSON.stringify(template),
    signal: AbortSignal.timeout(REMOTE_CONFIG_TIMEOUT_MS),
  })
  if (!response.ok) {
    const body = await response.text()
    const error = new Error(
      `Firebase Remote Config ${validateOnly ? 'validation' : 'publish'} failed (${response.status}): ${body.slice(0, 500)}`,
    ) as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return {
    etag: response.headers.get('etag') ?? etag,
    template: await response.json() as FirebaseRemoteConfigTemplate,
  }
}

function withOtyaClientConfig(
  template: FirebaseRemoteConfigTemplate,
  clientConfig: Record<string, unknown>,
  revision: number,
): FirebaseRemoteConfigTemplate {
  const parameters = { ...(template.parameters ?? {}) }
  parameters[OTYA_CLIENT_CONFIG_PARAMETER] = {
    defaultValue: { value: JSON.stringify(clientConfig) },
    description: 'OTYA client presentation/experiment configuration. Delivered to clients through Cloudflare /api/app-config.',
  }
  parameters[OTYA_CLIENT_CONFIG_REVISION_PARAMETER] = {
    defaultValue: { value: String(revision) },
    description: 'Monotonic OTYA client config revision mirrored by the Cloudflare control plane.',
  }
  return { ...template, parameters }
}

export async function publishOtyaClientConfig(
  serviceAccountJson: string,
  clientConfig: Record<string, unknown>,
  revision: number,
  explicitProjectId?: string,
): Promise<{ etag: string }> {
  const projectId = resolveFirebaseProjectId(serviceAccountJson, explicitProjectId)

  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await getFirebaseRemoteConfigTemplate(serviceAccountJson, projectId)
    const nextTemplate = withOtyaClientConfig(current.template, clientConfig, revision)

    // Validate first; this catches invalid Firebase conditions/parameter structure
    // without changing the active template.
    await putTemplate(
      serviceAccountJson,
      projectId,
      nextTemplate,
      current.etag,
      true,
    )

    try {
      const published = await putTemplate(
        serviceAccountJson,
        projectId,
        nextTemplate,
        current.etag,
        false,
      )
      return { etag: published.etag }
    } catch (error) {
      const status = (error as Error & { status?: number }).status
      if (attempt === 0 && (status === 409 || status === 400)) {
        // A Firebase console/API edit may have changed the ETag between GET and
        // publish. Re-read once rather than forcing If-Match: * and risking data loss.
        continue
      }
      throw error
    }
  }

  throw new Error('Firebase Remote Config publish conflict')
}

export function extractOtyaClientConfig(
  template: FirebaseRemoteConfigTemplate,
): { config: Record<string, unknown> | null; revision: number | null } {
  const raw = template.parameters?.[OTYA_CLIENT_CONFIG_PARAMETER]?.defaultValue?.value
  const revisionRaw = template.parameters?.[OTYA_CLIENT_CONFIG_REVISION_PARAMETER]?.defaultValue?.value
  if (!raw) return { config: null, revision: null }
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { config: null, revision: null }
    }
    const revision = revisionRaw ? Number.parseInt(revisionRaw, 10) : Number.NaN
    return {
      config: parsed as Record<string, unknown>,
      revision: Number.isFinite(revision) ? revision : null,
    }
  } catch {
    return { config: null, revision: null }
  }
}
