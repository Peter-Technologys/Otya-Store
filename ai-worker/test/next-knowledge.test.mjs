import assert from 'node:assert/strict'
import test from 'node:test'

import { retrieveOtyaKnowledge, shouldRetrieveOtyaKnowledge } from '../src/next-knowledge.mjs'

test('general questions do not spend Otya knowledge queries', () => {
  assert.equal(shouldRetrieveOtyaKnowledge('Explain photosynthesis in simple words'), false)
  assert.equal(shouldRetrieveOtyaKnowledge('Write a birthday message for my friend'), false)
  assert.equal(shouldRetrieveOtyaKnowledge('Recommend music for studying'), false)
  assert.equal(shouldRetrieveOtyaKnowledge('Explain video compression'), false)
  assert.equal(shouldRetrieveOtyaKnowledge('What theme is used in Hamlet?'), false)
  assert.equal(shouldRetrieveOtyaKnowledge('Create a strong password for me'), false)
})

test('Otya product/help questions opt into retrieval', () => {
  assert.equal(shouldRetrieveOtyaKnowledge('How does Otya Transfer work?'), true)
  assert.equal(shouldRetrieveOtyaKnowledge('Why is my music missing from the Library?'), true)
  assert.equal(shouldRetrieveOtyaKnowledge('How do I reset my password?'), true)
  assert.equal(shouldRetrieveOtyaKnowledge('Why does the app notification not appear?'), true)
})

test('retrieval is bounded and does not enable expensive rewrite or reranking', async () => {
  let request
  const env = {
    AI_SEARCH: {
      async search(value) {
        request = value
        return {
          chunks: Array.from({ length: 8 }, (_, index) => ({ text: `chunk ${index + 1}` })),
        }
      },
    },
  }

  const result = await retrieveOtyaKnowledge(env, 'How does Otya Private work?')
  assert.equal(result.used, true)
  assert.equal(result.chunks, 4)
  assert.match(result.context, /chunk 1/)
  assert.doesNotMatch(result.context, /chunk 5/)
  assert.equal(request.ai_search_options.retrieval.retrieval_type, 'hybrid')
  assert.equal(request.ai_search_options.retrieval.match_threshold, 0.45)
  assert.equal(request.ai_search_options.retrieval.max_num_results, 4)
  assert.equal(request.ai_search_options.query_rewrite.enabled, false)
  assert.equal(request.ai_search_options.reranking.enabled, false)
})

test('AI Search failure does not break Next', async () => {
  const result = await retrieveOtyaKnowledge({
    AI_SEARCH: { async search() { throw new Error('temporary search outage') } },
  }, 'Otya account help')

  assert.equal(result.used, false)
  assert.equal(result.degraded, true)
  assert.equal(result.context, '')
})
