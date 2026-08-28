import aiWorker from './index.mjs'
import { handleSupportEmailAdmin } from './support-email.mjs'
import { handleConsoleAdmin } from './console-tools.mjs'
import { handleGmailConnector } from './gmail-connector.mjs'
import { handlePublicChat, handleSharedTelegram } from './client-chat.mjs'
const MODEL='@cf/meta/llama-3.1-8b-instruct-fast'
const output=r=>typeof r?.response==='string'?r.response.trim():''
const parse=s=>{try{const m=String(s||'').match(/\{[\s\S]*\}/);return m?JSON.parse(m[0]):null}catch{return null}}
async function email(env,subject,text){if(!env.RESEND_API_KEY)throw new Error('RESEND_API_KEY missing on otya-ai');const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:'OTYA Player <noreply@petersmartlink.com>',to:[env.ADMIN_REPORT_EMAIL||'petersmartlink@gmail.com'],reply_to:'support@petersmartlink.com',subject,text})});if(!r.ok)throw new Error(`Resend HTTP ${r.status}`)}
async function weekly(env){const [total,week,active,feedback]=await Promise.all([env.DB.prepare('SELECT COUNT(*) count FROM downloads').first(),env.DB.prepare("SELECT COUNT(*) count FROM downloads WHERE created_at>=datetime('now','-7 days')").first(),env.DB.prepare("SELECT COUNT(*) count FROM devices WHERE last_seen_at>=datetime('now','-30 days')").first(),env.DB.prepare("SELECT category,description FROM feedback WHERE created_at>=datetime('now','-7 days') ORDER BY created_at DESC LIMIT 30").all()]);let summary='No feedback this week.';const items=feedback?.results||[];if(items.length){const r=await env.AI.run(env.OTYA_AI_MODEL||MODEL,{messages:[{role:'system',content:'Summarize OTYA Player feedback into concise themes and actionable issues. Do not invent facts.'},{role:'user',content:items.map((x,i)=>`${i+1}. [${x.category||'other'}] ${String(x.description||'').slice(0,600)}`).join('\n')}]});summary=output(r)||summary}await email(env,`[OTYA] Weekly AI digest — ${new Date().toDateString()}`,[`Total downloads: ${total?.count||0}`,`Downloads last 7d: ${week?.count||0}`,`Active devices 30d: ${active?.count||0}`,'','AI feedback summary:',summary,'',`Generated: ${new Date().toISOString()}`].join('\n'))}
async function churn(env){const {results=[]}=await env.DB.prepare("SELECT DISTINCT user_id FROM devices WHERE user_id IS NOT NULL AND last_seen_at>=datetime('now','-14 days') AND last_seen_at<datetime('now','-7 days') LIMIT 500").all();for(const row of results){const id=row.user_id;if(!id)continue;const d=await env.DB.prepare('SELECT last_seen_at FROM devices WHERE user_id=? ORDER BY last_seen_at DESC LIMIT 1').bind(id).first();const days=Math.max(0,Math.floor((Date.now()-new Date(d?.last_seen_at||0).getTime())/86400000));const r=await env.AI.run(env.OTYA_AI_MODEL||MODEL,{messages:[{role:'system',content:'Estimate churn risk from supplied activity only. JSON only: {"risk":"low|medium|high","reason":"brief"}.'},{role:'user',content:`Days since last seen: ${days}`}]});const risk=parse(output(r))||{};await env.KV.put(`ai:churn:${id}`,JSON.stringify({risk:risk.risk||'unknown',reason:String(risk.reason||'').slice(0,300),updated_at:new Date().toISOString()}),{expirationTtl:604800});if(risk.risk==='high'&&env.PUSH_QUEUE?.send)await env.PUSH_QUEUE.send({title:'Your music is ready',body:'Open OTYA Player and continue listening.',user_id:id})}}
export default {
  ...aiWorker,
  async fetch(request,env,ctx){
    const url=new URL(request.url)
    if(url.pathname.startsWith('/api/admin/ai/support/')) return handleSupportEmailAdmin(request,env)
    if(url.pathname.startsWith('/api/admin/ai/console/')) return handleConsoleAdmin(request,env)
    if(url.pathname.startsWith('/api/admin/ai/connectors/gmail/')||url.pathname==='/api/ai/oauth/google/callback') return handleGmailConnector(request,env)
    if(url.pathname==='/api/ai/chat') return handlePublicChat(request,env)
    if(url.pathname.startsWith('/api/telegram/')){const shared=await handleSharedTelegram(request,env);if(shared)return shared}
    return aiWorker.fetch(request,env,ctx)
  },
  async scheduled(event,env,ctx){const task=event.cron==='0 6 * * 1'?weekly(env):event.cron==='0 9 * * *'?churn(env):Promise.resolve();ctx.waitUntil(task)}
}
