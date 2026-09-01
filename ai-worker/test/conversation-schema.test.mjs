import assert from 'node:assert/strict'
import test from 'node:test'

import { ensureConversationSchema } from '../src/conversations.mjs'

function makeDb({ failFirst = false } = {}) {
  let prepareCount = 0
  let failed = false
  const db = {
    prepare() {
      prepareCount += 1
      return {
        async run() {
          if (failFirst && !failed) {
            failed = true
            throw new Error('temporary D1 failure')
          }
          await new Promise((resolve) => setTimeout(resolve, 2))
          return { success: true }
        },
      }
    },
  }
  return { db, count: () => prepareCount }
}

test('conversation schema initialization is shared by concurrent and later calls', async () => {
  const mock = makeDb()
  const env = { DB: mock.db }

  await Promise.all([
    ensureConversationSchema(env),
    ensureConversationSchema(env),
    ensureConversationSchema(env),
  ])
  await ensureConversationSchema(env)

  assert.equal(mock.count(), 4)
})

test('failed schema initialization is not cached permanently', async () => {
  const mock = makeDb({ failFirst: true })
  const env = { DB: mock.db }

  await assert.rejects(() => ensureConversationSchema(env), /temporary D1 failure/)
  await ensureConversationSchema(env)

  // First failed statement + complete four-statement retry.
  assert.equal(mock.count(), 5)
})
