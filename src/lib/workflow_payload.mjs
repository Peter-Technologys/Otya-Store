export function decodeWorkflowPayload(raw) {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      throw new Error('workflow payload must be valid JSON')
    }
  }

  if (raw == null) return {}
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('workflow payload must be a JSON object')
  }
  return raw
}
