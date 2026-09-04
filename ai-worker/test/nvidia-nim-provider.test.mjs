import assert from 'node:assert/strict'
import test from 'node:test'

import {nvidiaNimConfig,nvidiaNimText,runNvidiaNim} from '../src/providers/nvidia-nim.mjs'

const baseEnv={
  NVIDIA_NIM_ENABLED:'true',
  NVIDIA_NIM_USAGE:'testing',
  NVIDIA_API_KEY:'test-key',
  NVIDIA_NIM_MODELS:'nvidia/nemotron-3.5-lightning-30b-a3b',
}

test('NVIDIA NIM stays disabled without explicit prototype usage',()=>{
  const config=nvidiaNimConfig({...baseEnv,NVIDIA_NIM_USAGE:'production'})
  assert.equal(config.enabled,false)
  assert.equal(config.prototypeUsage,false)
})

test('NVIDIA NIM extracts OpenAI-compatible response text',()=>{
  assert.equal(nvidiaNimText({choices:[{message:{content:' hello '}}]}),'hello')
  assert.equal(nvidiaNimText({choices:[]}), '')
})

test('NVIDIA NIM rejects models outside the configured allow-list',async()=>{
  await assert.rejects(
    runNvidiaNim(baseEnv,{model:'other/model',messages:[{role:'user',content:'hello'}],fetchImpl:async()=>{throw new Error('should not call')}}),
    /not allow-listed/,
  )
})

test('NVIDIA NIM sends credentials only from server environment and parses answer',async()=>{
  let captured=null
  const result=await runNvidiaNim(baseEnv,{
    model:'nvidia/nemotron-3.5-lightning-30b-a3b',
    messages:[{role:'system',content:'You are Next.'},{role:'user',content:'Hello'}],
    fetchImpl:async(url,init)=>{
      captured={url,init}
      return new Response(JSON.stringify({choices:[{message:{content:'Hi from NIM'}}]}),{status:200,headers:{'Content-Type':'application/json'}})
    },
  })
  assert.equal(result.answer,'Hi from NIM')
  assert.equal(result.provider,'nvidia-nim')
  assert.equal(captured.url,'https://integrate.api.nvidia.com/v1/chat/completions')
  assert.equal(captured.init.headers.Authorization,'Bearer test-key')
  const body=JSON.parse(captured.init.body)
  assert.equal(body.model,'nvidia/nemotron-3.5-lightning-30b-a3b')
  assert.equal(body.stream,false)
})
