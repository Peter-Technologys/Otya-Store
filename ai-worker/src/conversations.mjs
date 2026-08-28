const clean=(v,max=5000)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max)
const now=()=>new Date().toISOString()

export async function ensureConversationSchema(env){
  if(!env.DB?.prepare)throw new Error('Conversation database unavailable')
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    owner_type TEXT NOT NULL,
    owner_key TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New chat',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0
  )`).run()
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ai_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    channel TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
  )`).run()
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_ai_conv_owner ON ai_conversations(owner_type,owner_key,updated_at DESC)').run()
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id,id)').run()
}

export async function hashIdentity(env,value){
  const secret=env.INTERNAL_SECRET||'otya-ai-public-salt-v1'
  const bytes=new TextEncoder().encode(`${secret}:${String(value??'')}`)
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))
  return [...digest].map(x=>x.toString(16).padStart(2,'0')).join('')
}

export async function getOrCreateConversation(env,{ownerType,ownerKey,conversationId,title='New chat'}){
  await ensureConversationSchema(env)
  if(conversationId){
    const row=await env.DB.prepare('SELECT * FROM ai_conversations WHERE id=? AND owner_type=? AND owner_key=? AND archived=0').bind(conversationId,ownerType,ownerKey).first()
    if(row)return row
  }
  const latest=await env.DB.prepare('SELECT * FROM ai_conversations WHERE owner_type=? AND owner_key=? AND archived=0 ORDER BY updated_at DESC LIMIT 1').bind(ownerType,ownerKey).first()
  if(latest)return latest
  const id=crypto.randomUUID();const stamp=now()
  await env.DB.prepare('INSERT INTO ai_conversations(id,owner_type,owner_key,title,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,ownerType,ownerKey,clean(title,120)||'New chat',stamp,stamp).run()
  return {id,owner_type:ownerType,owner_key:ownerKey,title:clean(title,120)||'New chat',created_at:stamp,updated_at:stamp,archived:0}
}

export async function newConversation(env,{ownerType,ownerKey,title='New chat'}){
  await ensureConversationSchema(env);const id=crypto.randomUUID();const stamp=now()
  await env.DB.prepare('INSERT INTO ai_conversations(id,owner_type,owner_key,title,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(id,ownerType,ownerKey,clean(title,120)||'New chat',stamp,stamp).run()
  return {id,title:clean(title,120)||'New chat',created_at:stamp,updated_at:stamp}
}

export async function listConversations(env,{ownerType,ownerKey,limit=30}){
  await ensureConversationSchema(env);const n=Math.max(1,Math.min(Number(limit)||30,50))
  const {results=[]}=await env.DB.prepare('SELECT id,title,created_at,updated_at FROM ai_conversations WHERE owner_type=? AND owner_key=? AND archived=0 ORDER BY updated_at DESC LIMIT ?').bind(ownerType,ownerKey,n).all();return results
}

export async function readConversation(env,{ownerType,ownerKey,conversationId,limit=40}){
  await ensureConversationSchema(env)
  const conv=await env.DB.prepare('SELECT id,title,created_at,updated_at FROM ai_conversations WHERE id=? AND owner_type=? AND owner_key=? AND archived=0').bind(conversationId,ownerType,ownerKey).first()
  if(!conv)return null
  const n=Math.max(1,Math.min(Number(limit)||40,80));const {results=[]}=await env.DB.prepare('SELECT id,role,content,channel,created_at FROM ai_messages WHERE conversation_id=? ORDER BY id DESC LIMIT ?').bind(conversationId,n).all()
  return {...conv,messages:results.reverse()}
}

export async function appendMessage(env,{conversationId,role,content,channel}){
  await ensureConversationSchema(env);const stamp=now();const text=clean(content,12000);if(!text)return
  await env.DB.prepare('INSERT INTO ai_messages(conversation_id,role,content,channel,created_at) VALUES(?,?,?,?,?)').bind(conversationId,role==='assistant'?'assistant':'user',text,clean(channel,40)||'web',stamp).run()
  await env.DB.prepare('UPDATE ai_conversations SET updated_at=?, title=CASE WHEN title="New chat" AND ?="user" THEN substr(?,1,80) ELSE title END WHERE id=?').bind(stamp,role,text,conversationId).run()
}

export async function archiveConversation(env,{ownerType,ownerKey,conversationId}){
  await ensureConversationSchema(env);await env.DB.prepare('UPDATE ai_conversations SET archived=1,updated_at=? WHERE id=? AND owner_type=? AND owner_key=?').bind(now(),conversationId,ownerType,ownerKey).run()
}
