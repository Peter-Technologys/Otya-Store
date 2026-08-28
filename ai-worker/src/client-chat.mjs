import { appendMessage, getOrCreateConversation, hashIdentity, readConversation } from './conversations.mjs'
const MODEL='@cf/meta/llama-3.1-8b-instruct-fast'
const TELEGRAM_API='https://api.telegram.org'
const clean=(v,max=5000)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max)
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
const aiText=r=>typeof r?.response==='string'?r.response:(typeof r?.choices?.[0]?.message?.content==='string'?r.choices[0].message.content:'')
async function runAi(env,messages){if(!env.AI?.run)throw new Error('AI unavailable');return clean(aiText(await env.AI.run(env.OTYA_AI_MODEL||MODEL,{messages})),7000)}

async function publicOtyaContext(env){
  const base=(env.WEBSITE_URL||'https://petersmartlink.com').replace(/\/$/,'')
  const facts=[
    'OTYA AI is the official assistant for OTYA Player from PeterSmart Link.',
    `Official website: ${base}.`,
    `Official download page: ${base}/download/otya-player.`,
    `Official Telegram: ${env.TELEGRAM_CHANNEL_URL||'https://t.me/otyaplayer'}.`,
    'OTYA Player is an offline-first Android media player. Local media files, including files stored in Android Download/Downloads folders, belong in the normal music or video library according to media type.'
  ]
  try{
    const controller=new AbortController()
    const timeout=setTimeout(()=>controller.abort(),3500)
    const r=await fetch(`${base}/api/version`,{headers:{Accept:'application/json'},signal:controller.signal})
    clearTimeout(timeout)
    if(r.ok){
      const v=await r.json().catch(()=>null)
      if(v&&typeof v==='object'){
        const version=clean(v.version,80)
        const code=Number(v.versionCode||0)
        const date=clean(v.date,80)
        const changelog=clean(v.changelog,700)
        if(version) facts.push(`Current public OTYA Player release reported by the OTYA backend: version ${version}${code?` (build ${code})`:''}${date?`, release date ${date}`:''}.`)
        if(changelog) facts.push(`Current release notes: ${changelog}`)
      }
    }
  }catch(e){
    console.warn('[ai-live-context] version lookup unavailable',e?.message)
  }
  return facts.join('\n')
}

async function system(env){
  const live=await publicOtyaContext(env)
  return `You are OTYA AI, a general-purpose conversational assistant from PeterSmart Link and the official assistant for OTYA Player.

You should feel like a capable modern assistant: answer directly, maintain conversation context, write naturally, help with explanations, writing, planning, learning, troubleshooting and everyday questions. Be concise by default but give detail when useful. Do not repeatedly describe yourself as a language model and do not tell users to check the OTYA website for information already supplied in the live OTYA context below.

OTYA-specific behavior:
- Treat the live public OTYA context below as authoritative for current public product facts such as release version and official links.
- Explain OTYA Player features and troubleshooting clearly.
- If the requested OTYA fact is not present in the live context and cannot be safely inferred, say you do not have that specific live fact yet.
- PeterSmart Link is the developer/publisher/brand behind OTYA Player. Do not invent private personal details about its owner or staff.
- OTYA AI is connected to safe public OTYA product information through the OTYA backend, but it does not have unrestricted administrative access.

Safety and privacy:
- Never expose or request passwords, OTPs, JWTs, API keys, secrets, payment credentials or private backend information.
- You have no unrestricted access to admin Gmail, GitHub, Cloudflare, private customer lists or infrastructure tools.
- Never claim an account action, refund, deletion, deployment, email send or other external action occurred unless a verified backend/tool action confirms it.
- For account-specific or sensitive requests direct the user to the signed-in OTYA flow or support@petersmartlink.com.

LIVE PUBLIC OTYA CONTEXT:
${live}`
}

async function rate(env,key,limit=20,seconds=60){if(!env.KV)return true;const bucket=Math.floor(Date.now()/(seconds*1000));const k=`ai:client-rate:${key}:${bucket}`;const n=Number(await env.KV.get(k)||0);if(n>=limit)return false;await env.KV.put(k,String(n+1),{expirationTtl:seconds*2});return true}
function historyFrom(value){if(!Array.isArray(value))return[];return value.slice(-20).map(x=>({role:x?.role==='assistant'?'assistant':'user',content:clean(x?.content,3500)})).filter(x=>x.content)}
async function persistentReply(env,{userId,message,channel,conversationId}){const ownerKey=await hashIdentity(env,`user:${userId}`);const conv=await getOrCreateConversation(env,{ownerType:'client',ownerKey,conversationId});const previous=await readConversation(env,{ownerType:'client',ownerKey,conversationId:conv.id,limit:22});const history=(previous?.messages||[]).map(x=>({role:x.role,content:clean(x.content,3500)}));await appendMessage(env,{conversationId:conv.id,role:'user',content:message,channel});const answer=await runAi(env,[{role:'system',content:await system(env)},...history,{role:'user',content:clean(message,3000)}]);await appendMessage(env,{conversationId:conv.id,role:'assistant',content:answer,channel});return{conversation_id:conv.id,answer,persisted:true}}
async function temporaryReply(env,{message,history=[]}){const answer=await runAi(env,[{role:'system',content:await system(env)},...historyFrom(history),{role:'user',content:clean(message,3000)}]);return{answer,persisted:false}}
async function telegram(env,method,body){if(!env.TELEGRAM_BOT_TOKEN)throw new Error('Telegram unavailable');const r=await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('Telegram send failed')}
export async function handleSharedTelegram(request,env){const url=new URL(request.url);if(!url.pathname.endsWith('/webhook'))return null;if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!env.TELEGRAM_WEBHOOK_SECRET)return json({error:'Telegram webhook unavailable'},503);if((request.headers.get('X-Telegram-Bot-Api-Secret-Token')||'')!==env.TELEGRAM_WEBHOOK_SECRET)return json({error:'Unauthorized'},401);const update=await request.json().catch(()=>null);const m=update?.message;const chatId=m?.chat?.id;const sender=m?.from?.id??chatId;const text=clean(m?.text,3000);if(!chatId||m?.chat?.type!=='private'||!text)return json({ok:true});const key=await hashIdentity(env,`telegram:${sender}`);if(!(await rate(env,key,20,60))){await telegram(env,'sendMessage',{chat_id:chatId,text:'You are sending messages too quickly. Please wait a moment.',disable_web_page_preview:true});return json({ok:true,rate_limited:true})}let answer;if(text==='/start')answer='Welcome to OTYA AI. Ask me general questions or anything about OTYA Player. Telegram chat is not saved to your OTYA account unless account linking is enabled later.';else if(text==='/download')answer=`Official OTYA Player download: ${(env.WEBSITE_URL||'https://petersmartlink.com').replace(/\/$/,'')}/download/otya-player`;else if(text==='/privacy')answer='Never send passwords, OTPs, payment credentials or secret keys here. Telegram conversations are not stored as OTYA account history.';else{try{answer=(await temporaryReply(env,{message:text})).answer}catch(e){console.error('[telegram-shared]',e?.message);answer='I cannot answer reliably right now. Please contact support@petersmartlink.com.'}}await telegram(env,'sendMessage',{chat_id:chatId,text:clean(answer,3500),disable_web_page_preview:true});return json({ok:true})}
export async function handlePublicChat(request,env){const url=new URL(request.url);const userId=clean(request.headers.get('X-OTYA-User-ID'),120);const signedIn=request.headers.get('X-OTYA-Persist-Chat')==='1'&&Boolean(userId);if(request.method==='GET'){if(!signedIn)return json({error:'Sign in to load saved conversations'},401);const id=clean(url.searchParams.get('conversation_id'),80);if(!id)return json({error:'conversation_id is required'},400);const ownerKey=await hashIdentity(env,`user:${userId}`);const conversation=await readConversation(env,{ownerType:'client',ownerKey,conversationId:id,limit:100});return conversation?json({ok:true,conversation,persisted:true}):json({error:'Conversation not found'},404)}if(request.method!=='POST')return json({error:'Method not allowed'},405);const body=await request.json().catch(()=>({}));const message=clean(body.message,3000);if(!message)return json({error:'message is required'},400);const guest=clean(body.guest_id,120);const ip=request.headers.get('CF-Connecting-IP')||'unknown';const rateIdentity=signedIn?`user:${userId}`:`guest:${guest||ip}`;const rateKey=await hashIdentity(env,`${rateIdentity}:${ip}`);if(!(await rate(env,rateKey,signedIn?30:15,60)))return json({error:'Too many messages. Please wait a moment.'},429);try{if(signedIn)return json({ok:true,...await persistentReply(env,{userId,message,channel:'web',conversationId:clean(body.conversation_id,80)})});return json({ok:true,...await temporaryReply(env,{message,history:body.history})})}catch(e){console.error('[public-ai]',e?.message);return json({error:'OTYA AI is temporarily unavailable'},503)}}
