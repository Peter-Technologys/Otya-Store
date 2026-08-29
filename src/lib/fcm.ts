import { getGoogleAccessToken } from './google_oauth'

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

/** Mint a short-lived OAuth2 access token for the FCM HTTP v1 API. */
export async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  return getGoogleAccessToken(serviceAccountJson, [FCM_SCOPE])
}

export interface FcmSendResult {
  sent: number
  failed: number
}

/**
 * Send FCM messages using a pre-fetched OAuth2 access token.
 * Callers that send many messages should obtain the token once and reuse it.
 */
export async function sendFcmWithToken(
  tokens: string[],
  title: string,
  body: string,
  url: string,
  accessToken: string,
  projectId: string,
): Promise<FcmSendResult> {
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  let sent = 0
  let failed = 0
  for (const token of tokens) {
    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { url },
          android: { priority: 'high' },
        },
      }),
    })
    if (response.ok) sent++
    else failed++
  }

  return { sent, failed }
}

/** Convenience wrapper for one batch. */
export async function sendFcmToTokens(
  tokens: string[],
  title: string,
  body: string,
  url: string,
  serviceAccountJson: string,
  projectId: string,
): Promise<FcmSendResult> {
  const accessToken = await getFcmAccessToken(serviceAccountJson)
  return sendFcmWithToken(tokens, title, body, url, accessToken, projectId)
}
