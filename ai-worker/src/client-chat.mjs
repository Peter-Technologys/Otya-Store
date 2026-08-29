import { appendMessage, getOrCreateConversation, hashIdentity, listConversations, newConversation, readConversation } from './conversations.mjs'

const TELEGRAM_API='https://api.telegram.org'
const GUEST_MODEL='llama-fast'
const SIGNED_DEFAULT='otya-smart'
const MODELS={
  'llama-fast':{name:'OTYA Fast',provider:'Meta',model:'@cf/meta/llama-3.1-8b-instruct-fast',tier:'fast',description:'Fast answers for everyday questions.',freePlanSafe:true},
  'otya-smart':{name:'OTYA Smart',provider:'Z.ai',model:'@cf/zai-org/glm-4.7-flash',tier:'balanced',description:'Balanced general assistant with strong multilingual and tool-use ability.',freePlanSafe:true},
  'llama-70b':{name:'Llama 3.3 70B',provider:'Meta',model:'@cf/meta/llama-3.3-70b-instruct-fp8-fast',tier:'large',description:'Large general-purpose model for detailed answers.',freePlanSafe:true},
  'gpt-oss-20b':{name:'GPT-OSS 20B',provider:'OpenAI',model:'@cf/openai/gpt-oss-20b',tier:'reasoning',description:'Reasoning model for harder questions.',freePlanSafe:true},
  'gpt-oss-120b':{name:'GPT-OSS 120B',provider:'OpenAI',model:'@cf/openai/gpt-oss-120b',tier:'reasoning',description:'Large reasoning model for complex questions.',freePlanSafe:true},
  'gemma-4':{name:'Gemma 4 26B',provider:'Google',model:'@cf/google/gemma-4-26b-a4b-it',tier:'balanced',description:'Modern multilingual reasoning model.',freePlanSafe:true},
  'nemotron':{name:'Nemotron 120B',provider:'NVIDIA',model:'@cf/nvidia/nemotron-3-120b-a12b',tier:'large',description:'Strong reasoning and agentic model.',freePlanSafe:true},
  'llama-4-scout':{name:'Llama 4 Scout',provider:'Meta',model:'@cf/meta/llama-4-scout-17b-16e-instruct',tier:'balanced',description:'Modern multimodal-capable general assistant model.',freePlanSafe:true},
  'qwen3':{name:'Qwen3 30B',provider:'Qwen',model:'@cf/qwen/qwen3-30b-a3b-fp8',tier:'reasoning',description:'Multilingual reasoning and instruction following.',freePlanSafe:true},
  'granite':{name:'Granite 4 Micro',provider:'IBM',model:'@cf/ibm-granite/granite-4.0-h-micro',tier:'fast',description:'Compact fast model for everyday questions.',freePlanSafe:true},
  'sea-lion':{name:'SEA-LION 27B',provider:'AI Singapore',model:'@cf/aisingapore/gemma-sea-lion-v4-27b-it',tier:'balanced',description:'Regional multilingual model for Southeast Asian languages.',freePlanSafe:true},
}

const clean=(v,max=5000)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max)
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
const aiText=r=>typeof r?.response==='string'?r.response:(typeof r?.choices?.[0]?.message?.content==='string'?r.choices[0].message.content:'')
const publicModels=()=>Object.entries(MODELS).map(([id,m])=>({id,name:m.name,provider:m.provider,tier:m.tier,description:m.description,guest:id===GUEST_MODEL,free_plan_safe:m.freePlanSafe===true}))
function resolveModel(requested,signedIn){if(!signedIn)return{id:GUEST_MODEL,...MODELS[GUEST_MODEL]};const id=MODELS[requested]?requested:SIGNED_DEFAULT;return{id,...MODELS[id]}}
async function runAi(env,messages,selection){if(!env.AI?.run)throw new Error('AI unavailable');return clean(aiText(await env.AI.run(selection.model,{messages})),9000)}

async function publicOtyaContext(env){
  const base=(env.WEBSITE_URL||'https://petersmartlink.com').replace(/\/$/,'')
  const facts=[
    'OTYA is an offline-first Android music and video player by PeterSmart Link.',
    'Ask OTYA is a friendly general assistant inside OTYA. It can answer ordinary questions and has extra OTYA product context when needed.',
    `Official website: ${base}.`,
    `Official download page: ${base}/download/otya-player.`,
    `Official support page: ${base}/apps/otya-player/support.`,
    `Official Telegram: ${env.TELEGRAM_CHANNEL_URL||'https://t.me/otyaplayer'}.`,
    'Local playback, media scanning, local search and supported local transfer must keep working without signing in or using AI.',
    'New audio and video received or downloaded on the phone should appear in the normal Music or Video library after scanning.',
  ]
  try{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3500)
    const r=await fetch(`${base}/latest`,{headers:{Accept:'application/json'},signal:controller.signal})
    clearTimeout(timeout)
    if(r.ok){
      const v=await r.json().catch(()=>null)
      if(v&&typeof v==='object'){
        const version=clean(v.version,80),code=Number(v.versionCode||0),date=clean(v.date,80),changelog=clean(v.changelog,700)
        if(version)facts.push(`Current public OTYA release: version ${version}${code?` (build ${code})`:''}${date?`, release date ${date}`:''}.`)
        if(changelog)facts.push(`Current release notes: ${changelog}`)
      }
    }
  }catch(e){console.warn('[ai-live-context]',e?.message)}
  return facts.join('\n')
}

async function system(env){
  const live=await publicOtyaContext(env)
  return `You are Ask OTYA, a friendly general-purpose AI assistant built into OTYA.

GENERAL BEHAVIOR: Answer the user's question directly, whether it is about OTYA or a general topic. Be conversational, useful and concise by default. Explain more when the question needs it. Do not pretend you have live web access, current news, private account access, device access, or external tools unless the backend has explicitly supplied that information in the conversation or live context. For time-sensitive facts you cannot verify, say that they may have changed instead of inventing an answer.

OTYA EXPERTISE: When the request concerns OTYA, OTYA Player, music/video playback, media library, files, Transfer, Converter, Private/vault, Tools, personalization/themes, storage, permissions, updates, downloads, account, security, backup, website, support, or release information, use the live OTYA facts below and give product-specific guidance. Never invent an OTYA feature or claim an OTYA action happened unless the backend confirms it.

HUMAN SUPPORT: Use the exact prefix [HANDOFF] on the first line only when the user explicitly asks for a human/support agent, or when an OTYA account/support problem genuinely requires a human to continue. Do not use [HANDOFF] merely because a question is unrelated to OTYA. Do not claim support has been notified until the backend confirms a handoff request.

SAFETY & PRIVACY: Never request or expose passwords, OTPs, JWTs, API keys, private keys, payment credentials, or admin-only data. Public Ask OTYA cannot see the private Admin Assistant, admin email, GitHub, Cloudflare, private customer lists, or private support data. Refuse unsafe requests when necessary and offer a safer direction when useful.

LIVE OTYA CONTEXT:\n${live}`
}

async function rate(env,key,limit=45,seconds=60){
  if(!env.KV)return true
  const bucket=Math.floor(Date.now()/(seconds*1000)),k=`ai:client-rate:${key}:${bucket}`,n=Number(await env.KV.get(k)||0)
  if(n>=limit)return false
  await env.KV.put(k,String(n+1),{expirationTtl:seconds*2})
  return true
}
async function modelRate(env,key,selection){return rate(env,`${key}:model:${selection.id}`,['large','reasoning'].includes(selection.tier)?18:45,60)}
const unlimitedStatus=()=>({unlimited:true,limit:null,used:null,remaining:null})

function historyFrom(value){
  if(!Array.isArray(value))return[]
  return value.slice(-20).map(x=>({role:x?.role==='assistant'?'assistant':'user',content:clean(x?.content,3500)})).filter(x=>x.content)
}
function handoffResult(answer){
  const text=clean(answer,9000)
  if(!text.startsWith('[HANDOFF]'))return{answer:text,handoff_available:false}
  return{answer:clean(text.replace(/^\[HANDOFF\]\s*/,'').trim(),9000),handoff_available:true,handoff_label:'Talk to PeterSmart Link support'}
}

async function persistentReply(env,{userId,message,channel,conversationId,selection,forceNew=false}){
  const ownerKey=await hashIdentity(env,`user:${userId}`)
  const conv=forceNew?await newConversation(env,{ownerType:'client',ownerKey,title:message.slice(0,80)}):await getOrCreateConversation(env,{ownerType:'client',ownerKey,conversationId})
  const previous=await readConversation(env,{ownerType:'client',ownerKey,conversationId:conv.id,limit:22})
  const history=(previous?.messages||[]).map(x=>({role:x.role,content:clean(x.content,3500)}))
  await appendMessage(env,{conversationId:conv.id,role:'user',content:message,channel})
  const raw=await runAi(env,[{role:'system',content:await system(env)},...history,{role:'user',content:clean(message,3000)}],selection)
  const result=handoffResult(raw)
  await appendMessage(env,{conversationId:conv.id,role:'assistant',content:result.answer,channel})
  return{conversation_id:conv.id,...result,persisted:true,model:selection.id,model_name:selection.name}
}
async function temporaryReply(env,{message,history=[],selection}){
  const raw=await runAi(env,[{role:'system',content:await system(env)},...historyFrom(history),{role:'user',content:clean(message,3000)}],selection)
  return{...handoffResult(raw),persisted:false,model:selection.id,model_name:selection.name}
}

async function sendAdminHandoff(env,{message,email,name,source,userId}){
  if(!env.RESEND_API_KEY)throw new Error('Support email is unavailable')
  const ticket=`OTYA-${Date.now().toString(36).toUpperCase()}`
  const admin=env.ADMIN_REPORT_EMAIL||'petersmartlink@gmail.com'
  const lines=[
    `New OTYA support handoff: ${ticket}`,
    '',
    `Source: ${clean(source,80)||'OTYA'}`,
    `User: ${clean(name,120)||'Not provided'}`,
    `Email: ${clean(email,180)||'Not provided'}`,
    `Account ID: ${clean(userId,120)||'Guest'}`,
    '',
    'Question:',
    clean(message,3000),
    '',
    'Open the private OTYA Admin console to review support and reply through the approved support tools.',
  ]
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:'OTYA Support <noreply@petersmartlink.com>',
      to:[admin],
      reply_to:clean(email,180)||'support@petersmartlink.com',
      subject:`OTYA support handoff · ${ticket}`,
      text:lines.join('\n'),
    }),
  })
  if(!r.ok)throw new Error(`Support email failed (${r.status})`)
  return ticket
}

async function telegram(env,method,body){
  if(!env.TELEGRAM_BOT_TOKEN)throw new Error('Telegram unavailable')
  const r=await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  if(!r.ok)throw new Error('Telegram send failed')
}

export async function handleSharedTelegram(request,env){
  const url=new URL(request.url)
  if(!url.pathname.endsWith('/webhook'))return null
  if(request.method!=='POST')return json({error:'Method not allowed'},405)
  if(!env.TELEGRAM_WEBHOOK_SECRET)return json({error:'Telegram webhook unavailable'},503)
  if((request.headers.get('X-Telegram-Bot-Api-Secret-Token')||'')!==env.TELEGRAM_WEBHOOK_SECRET)return json({error:'Unauthorized'},401)
  const update=await request.json().catch(()=>null),m=update?.message,chatId=m?.chat?.id,sender=m?.from?.id??chatId,text=clean(m?.text,3000)
  if(!chatId||m?.chat?.type!=='private'||!text)return json({ok:true})
  const key=await hashIdentity(env,`telegram:${sender}`)
  if(!(await rate(env,key,45,60))){await telegram(env,'sendMessage',{chat_id:chatId,text:'Too many messages at once. Please wait a moment.'});return json({ok:true,rate_limited:true})}
  const selection=resolveModel(null,false)
  let answer
  if(text==='/start')answer='Welcome to Ask OTYA. Ask me a general question or ask about OTYA Player, playback, files, Transfer, account, updates and troubleshooting.'
  else if(text==='/download')answer=`Official OTYA download: ${(env.WEBSITE_URL||'https://petersmartlink.com').replace(/\/$/,'')}/download/otya-player`
  else if(text==='/privacy')answer='Never send passwords, OTPs, payment details or secret keys here.'
  else{
    try{
      const result=await temporaryReply(env,{message:text,selection})
      answer=result.handoff_available?`${result.answer}\n\nFor human OTYA help, use the official support page: ${(env.WEBSITE_URL||'https://petersmartlink.com').replace(/\/$/,'')}/apps/otya-player/support`:result.answer
    }catch(e){console.error('[telegram-shared]',e?.message);answer='Ask OTYA is unavailable right now. Please try again shortly.'}
  }
  await telegram(env,'sendMessage',{chat_id:chatId,text:clean(answer,3500),disable_web_page_preview:true})
  return json({ok:true})
}

export async function handlePublicChat(request,env){
  const url=new URL(request.url)
  const userId=clean(request.headers.get('X-OTYA-User-ID'),120)
  const signedIn=request.headers.get('X-OTYA-Persist-Chat')==='1'&&Boolean(userId)
  const ownerKey=signedIn?await hashIdentity(env,`user:${userId}`):null

  if(request.method==='GET'){
    if(url.searchParams.get('quota')==='1')return json({ok:true,signed_in:signedIn,quota:unlimitedStatus()})
    if(url.searchParams.get('models')==='1')return json({ok:true,signed_in:signedIn,guest_model:GUEST_MODEL,default_model:SIGNED_DEFAULT,models:signedIn?publicModels():publicModels().filter(m=>m.id===GUEST_MODEL),quota:unlimitedStatus()})
    if(!signedIn)return json({error:'Sign in to load saved conversations'},401)
    if(url.searchParams.get('list')==='1')return json({ok:true,conversations:await listConversations(env,{ownerType:'client',ownerKey,limit:40})})
    const id=clean(url.searchParams.get('conversation_id'),80)
    if(!id)return json({error:'conversation_id is required'},400)
    const conversation=await readConversation(env,{ownerType:'client',ownerKey,conversationId:id,limit:100})
    return conversation?json({ok:true,conversation,persisted:true}):json({error:'Conversation not found'},404)
  }

  if(request.method!=='POST')return json({error:'Method not allowed'},405)
  const body=await request.json().catch(()=>({}))
  const message=clean(body.message,3000)
  if(!message)return json({error:'message is required'},400)

  if(body.request_handoff===true){
    try{
      const ticket=await sendAdminHandoff(env,{message,email:body.contact_email,name:body.contact_name,source:body.surface||body.channel||'web',userId})
      return json({ok:true,handoff_sent:true,ticket,message:'PeterSmart Link support has been notified.'})
    }catch(e){
      console.error('[support-handoff]',e?.message)
      return json({error:'Could not notify support right now. Please use support@petersmartlink.com.',code:'HANDOFF_FAILED'},503)
    }
  }

  const guest=clean(body.guest_id,120),ip=request.headers.get('CF-Connecting-IP')||'unknown'
  const rateIdentity=signedIn?`user:${userId}`:`guest:${guest||ip}`
  const rateKey=await hashIdentity(env,`${rateIdentity}:${ip}`)
  if(!(await rate(env,rateKey,signedIn?60:45,60)))return json({error:'Too many messages at once. Please wait a moment.',code:'AI_RATE_LIMIT'},429)

  const selection=resolveModel(clean(body.model,60),signedIn)
  if(!(await modelRate(env,rateKey,selection)))return json({error:'This model is receiving too many requests at once. Please wait a moment.',code:'AI_RATE_LIMIT'},429)

  try{
    const result=signedIn
      ?await persistentReply(env,{userId,message,channel:clean(body.channel,20)||'web',conversationId:clean(body.conversation_id,80),selection,forceNew:body.new_chat===true})
      :await temporaryReply(env,{message,history:body.history,selection})
    return json({ok:true,...result,scope:'general',quota:unlimitedStatus()})
  }catch(e){
    console.error('[public-ai]',selection.id,e?.message)
    return json({error:'Ask OTYA is unavailable right now. Please try again shortly.'},503)
  }
}
