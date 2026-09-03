import assert from 'node:assert/strict'
import test from 'node:test'

import worker from '../src/index.mjs'

function databaseRecorder() {
  const updates = []
  return {
    updates,
    db: {
      prepare(sql) {
        assert.match(sql, /UPDATE crash_reports SET group_id/)
        return {
          bind(...values) {
            updates.push(values)
            return { run: async () => ({ success: true }) }
          },
        }
      },
    },
  }
}

async function processCrash(body, env) {
  let acknowledged = false
  let retried = false
  await worker.queue({
    messages: [{
      body: { type: 'process_crash', ...body },
      ack() { acknowledged = true },
      retry() { retried = true },
    }],
  }, env)
  assert.equal(acknowledged, true)
  assert.equal(retried, false)
}

test('identical crashes share a deterministic group without Vectorize', async () => {
  const recorder = databaseRecorder()
  const env = { DB: recorder.db }
  const details = {
    errorType: '_AssertionError',
    description: 'audio service failed during startup',
    stackTrace: '#0 AudioServiceConfig (audio_service.dart:3525:11)',
  }

  await processCrash({ crashId: 101, ...details }, env)
  await processCrash({ crashId: 202, ...details }, env)

  assert.equal(recorder.updates.length, 2)
  assert.equal(recorder.updates[0][0], recorder.updates[1][0])
  assert.match(recorder.updates[0][0], /^crash-[0-9a-f]{32}$/)
  assert.notEqual(recorder.updates[0][0], '101')
})

test('volatile addresses and line numbers do not split a crash group', async () => {
  const recorder = databaseRecorder()
  const env = { DB: recorder.db }

  await processCrash({
    crashId: 303,
    errorType: 'StateError',
    stackTrace: '#0 Player.open (player.dart:171:9) receiver=0xabc123',
  }, env)
  await processCrash({
    crashId: 404,
    errorType: 'StateError',
    stackTrace: '#0 Player.open (player.dart:193:12) receiver=0xdef456',
  }, env)

  assert.equal(recorder.updates[0][0], recorder.updates[1][0])
})

test('Vectorize failures retain the deterministic fallback group', async () => {
  const recorder = databaseRecorder()
  const env = {
    DB: recorder.db,
    AI: { run: async () => { throw new Error('temporary AI failure') } },
    VECTORIZE: { query: async () => { throw new Error('unreachable') } },
  }

  await processCrash({
    crashId: 505,
    errorType: 'FlutterError',
    stackTrace: '#0 Widget.build (widget.dart:44:2)',
  }, env)

  assert.match(recorder.updates[0][0], /^crash-[0-9a-f]{32}$/)
})
