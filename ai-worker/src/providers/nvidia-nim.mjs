const DEFAULT_BASE_URL='https://integrate.api.nvidia.com/v1'
const DEFAULT_ALLOWED_MODELS=[
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'deepseek-ai/deepseek-v4-flash-0731',
  'deepseek-ai/deepseek-v4-pro-0813',
]
const PROTOTYPE_USAGES=new Set(['prototype','development','testing','evaluation'])

const clean=(value,max=300)=>String(value??'').trim().slice(0,max)
const parseCsv=(value)=>String(value??'').split(',').map((item)=>clean(item,160)).filter(Boolean)

export function nvidiaNimConfig(env={}){
  const configured=parseCsv(env.NVIDIA_NIM_MODELS)
  const allowedModels=configured.length?configured:DEFAULT_ALLOWED_MODELS
  const usage=clean(env.NVIDIA_NIM_USAGE,40).toLowerCase()
  const enabled=String(env.NVIDIA_NIM_ENABLED??'').toLowerCase()==='true'
  const hasKey=Boolean(clean(env.NVIDIA_API_KEY,500))
  const prototypeUsage=PROTOTYPE_USAGES.has(usage)
  return{
    enabled:enabled&&hasKey&&prototypeUsage,
    configured:enabled,
    hasKey,
    usage:usage||null,
    prototypeUsage,
    baseUrl:(clean(env.NVIDIA_NIM_BASE_URL,300)||DEFAULT_BASE_URL).replace(/\/$/,''),
    allowedModels,
  }
}

function assertConfigured(env,model){
  const config=nvidiaNimConfig(env)
  if(!config.configured)throw new Error('NVIDIA NIM is disabled')
  if(!config.hasKey)throw new Error('NVIDIA NIM API key is unavailable')
  if(!config.prototypeUsage)throw new Error('NVIDIA NIM prototype endpoint is not approved for this usage')
  const selected=clean(model,160)
  if(!selected||!config.allowedModels.includes(selected))throw new Error('NVIDIA NIM model is not allow-listed')
  return{config,model:selected}
}

function normalizeMessages(messages){
  if(!Array.isArray(messages))return[]
  return messages.slice(-32).map((item)=>({
    role:['system','assistant','user'].includes(item?.role)?item.role:'user',
    content:clean(item?.content,12000),
  })).filter((item)=>item.content)
}

export function nvidiaNimText(payload){
  const value=payload?.choices?.[0]?.message?.content
  return typeof value==='string'?value.trim():''
}

export async function runNvidiaNim(env,{model,messages,maxTokens=2048,temperature=0.4,fetchImpl=fetch}={}){
  const selected=assertConfigured(env,model)
  const safeMessages=normalizeMessages(messages)
  if(!safeMessages.length)throw new Error('NVIDIA NIM request has no messages')

  const controller=new AbortController()
  const timeoutMs=Math.max(1000,Math.min(Number(env.NVIDIA_NIM_TIMEOUT_MS||25000),60000))
  const timeout=setTimeout(()=>controller.abort('timeout'),timeoutMs)
  let response
  try{
    response=await fetchImpl(`${selected.config.baseUrl}/chat/completions`,{
      method:'POST',
      headers:{
        Authorization:`Bearer ${env.NVIDIA_API_KEY}`,
        'Content-Type':'application/json',
        Accept:'application/json',
      },
      body:JSON.stringify({
        model:selected.model,
        messages:safeMessages,
        stream:false,
        max_tokens:Math.max(64,Math.min(Number(maxTokens)||2048,8192)),
        temperature:Math.max(0,Math.min(Number(temperature)||0,2)),
      }),
      signal:controller.signal,
    })
  }catch(error){
    if(controller.signal.aborted)throw new Error('NVIDIA NIM request timed out')
    throw new Error(`NVIDIA NIM request failed: ${clean(error?.message,160)||'network error'}`)
  }finally{
    clearTimeout(timeout)
  }

  if(!response?.ok)throw new Error(`NVIDIA NIM request failed (${response?.status||'unknown'})`)
  const payload=await response.json().catch(()=>null)
  const answer=nvidiaNimText(payload)
  if(!answer)throw new Error('NVIDIA NIM returned an empty response')
  return{answer,model:selected.model,provider:'nvidia-nim',prototype:true}
}
