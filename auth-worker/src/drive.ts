/**
 * Google Drive App Folder helpers using fetch() only — no SDK.
 *
 * All functions use the Google Drive REST API v3 with an OAuth2 access token
 * that has the `drive.appdata` scope. The access token is obtained by the
 * Flutter app during Google Sign-In and forwarded to the Auth Worker.
 *
 * App Folder: a hidden, app-specific folder in the user's Google Drive.
 * Files stored here are only visible to this app — not to the user's Drive UI.
 *
 * Backup file name: "otya-backup.json"
 */

const BACKUP_FILE_NAME = 'otya-backup.json'
const DRIVE_FILES_URL  = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

// ── Helpers ───────────────────────────────────────────────────────────────────

function driveHeaders(driveToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${driveToken}`,
    'Content-Type': 'application/json',
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search the App Folder for the backup file.
 * Returns the file ID if found, or null if not found.
 */
export async function findBackupFile(driveToken: string): Promise<string | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q:      `name='${BACKUP_FILE_NAME}' and trashed=false`,
    fields: 'files(id)',
  })

  const res = await fetch(`${DRIVE_FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${driveToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive search failed: ${res.status} ${err}`)
  }

  const data = await res.json() as { files: { id: string }[] }
  return data.files?.[0]?.id ?? null
}

/**
 * Create a new backup file in the App Folder.
 * Returns the new file's ID.
 */
export async function createBackupFile(driveToken: string, data: unknown): Promise<string> {
  const metadata = JSON.stringify({
    name:    BACKUP_FILE_NAME,
    parents: ['appDataFolder'],
  })
  const content = JSON.stringify(data)

  // Multipart upload: metadata + content in one request
  const boundary = '-------otya_backup_boundary'
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

  const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&spaces=appDataFolder`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${driveToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive create failed: ${res.status} ${err}`)
  }

  const file = await res.json() as { id: string }
  return file.id
}

/**
 * Update an existing backup file's content.
 * Uses PATCH with uploadType=media to replace the file content.
 */
export async function updateBackupFile(
  driveToken: string,
  fileId: string,
  data: unknown,
): Promise<void> {
  const res = await fetch(`${DRIVE_UPLOAD_URL}/${encodeURIComponent(fileId)}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization:  `Bearer ${driveToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive update failed: ${res.status} ${err}`)
  }
}

/**
 * Download and parse the backup file content.
 * Returns the parsed JSON data.
 */
export async function downloadBackupFile(driveToken: string, fileId: string): Promise<unknown> {
  const res = await fetch(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${driveToken}` } },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive download failed: ${res.status} ${err}`)
  }

  return res.json()
}

/**
 * Delete a backup file from the App Folder.
 */
export async function deleteBackupFile(driveToken: string, fileId: string): Promise<void> {
  const res = await fetch(
    `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`,
    {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${driveToken}` },
    },
  )

  // 204 No Content is success; 404 means already deleted — both are OK
  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`Drive delete failed: ${res.status} ${err}`)
  }
}
