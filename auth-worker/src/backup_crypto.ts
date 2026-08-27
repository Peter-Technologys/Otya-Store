const ENCRYPTION_VERSION = 1
const ALGORITHM = 'AES-GCM'
const KDF = 'HKDF-SHA-256'
const SALT_LABEL = 'OTYA Drive Backup Encryption v1'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export interface EncryptedBackupEnvelope {
  encryption_version: number
  algorithm: typeof ALGORITHM
  kdf: typeof KDF
  iv: string
  ciphertext: string
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(normalized + padding)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function deriveBackupKey(rootSecret: string, userId: string): Promise<CryptoKey> {
  if (!rootSecret) throw new Error('Backup encryption root is unavailable')
  const root = await crypto.subtle.importKey(
    'raw',
    encoder.encode(rootSecret),
    'HKDF',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(SALT_LABEL),
      info: encoder.encode(`otya-user:${userId}`),
    },
    root,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function isEncryptedBackupEnvelope(value: unknown): value is EncryptedBackupEnvelope {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return data.encryption_version === ENCRYPTION_VERSION
    && data.algorithm === ALGORITHM
    && data.kdf === KDF
    && typeof data.iv === 'string'
    && typeof data.ciphertext === 'string'
}

export async function encryptBackupPayload(
  data: unknown,
  userId: string,
  rootSecret: string,
): Promise<EncryptedBackupEnvelope> {
  const key = await deriveBackupKey(rootSecret, userId)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = encoder.encode(JSON.stringify(data))
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: encoder.encode(`OTYA:${userId}:v${ENCRYPTION_VERSION}`),
      tagLength: 128,
    },
    key,
    plaintext,
  )
  return {
    encryption_version: ENCRYPTION_VERSION,
    algorithm: ALGORITHM,
    kdf: KDF,
    iv: bytesToBase64Url(iv),
    ciphertext: bytesToBase64Url(new Uint8Array(encrypted)),
  }
}

export async function decryptBackupPayload(
  envelope: EncryptedBackupEnvelope,
  userId: string,
  rootSecret: string,
): Promise<unknown> {
  if (!isEncryptedBackupEnvelope(envelope)) {
    throw new Error('Unsupported encrypted backup format')
  }
  const key = await deriveBackupKey(rootSecret, userId)
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: base64UrlToBytes(envelope.iv),
      additionalData: encoder.encode(`OTYA:${userId}:v${ENCRYPTION_VERSION}`),
      tagLength: 128,
    },
    key,
    base64UrlToBytes(envelope.ciphertext),
  )
  try {
    return JSON.parse(decoder.decode(decrypted))
  } catch {
    throw new Error('Decrypted backup content is invalid')
  }
}
