// Minimal backend adapter to talk to the WordPress agent plugin
// Keeps payloads simple and tolerant to the plugin's response shapes.

// Prefer REST base localized by WordPress when available (GERO_CONFIG_UNITEC or GERO_CONFIG).
// Fallback to same-origin /wp-json/gero/v1 when not present.
const CONFIG = (typeof window !== 'undefined' && ((window as any).GERO_CONFIG_UNITEC || (window as any).GERO_CONFIG))
  ? ((window as any).GERO_CONFIG_UNITEC || (window as any).GERO_CONFIG)
  : {};

const BASE = (CONFIG && CONFIG.rest_base)
  ? CONFIG.rest_base.replace(/\/$/, '')
  : (typeof window !== 'undefined' ? window.location.origin : '');
const API_PREFIX = `${BASE}/wp-json/gero/v1`.replace(/([^:])\/\//g, '$1/');

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text || '{}');
  } catch (e) {
    return { text };
  }
}

export async function validateMatricula(matricula: string, url_origen = '') {
  const params = new URLSearchParams();
  params.set('matricula', matricula);
  if (url_origen) params.set('url_origen', url_origen);

  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/validar-matricula?${params.toString()}`
    : `${API_PREFIX}/validar-matricula?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'same-origin'
  });
  const json = await safeJson(res);
  
  // DEBUG: Loguear respuesta completa
  console.log('validateMatricula response:', { json, nombre: json.nombre, body_nombre: json.body?.nombre });
  
  // Normalize likely keys
  return {
    ok: res.ok,
    status: res.status,
    body: json,
    userId: json.id || json.user_id || json.userId || 0,
    nombre: json.nombre || json.body?.nombre || '',
    carrera: json.carrera || json.career || json.body?.carrera || null,
    riesgos: json.riesgos_detectados || json.riesgos || json.riesgos_detectados_lista || [],
    message: json.message || json.msg || ''
  };
}

export async function getLastConversation(value_validador: string) {
  const params = new URLSearchParams();
  params.set('value_validador', value_validador);
  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/last-conversation?${params.toString()}`
    : `${API_PREFIX}/last-conversation?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'same-origin'
  });
  const json = await safeJson(res);
  return { ok: res.ok, status: res.status, body: json, conversation: json.conversation_string || json.conversation || '' };
}

export async function sendChatMessage(payload: {
  userId?: number;
  matricula?: string;
  message: string;
  riesgos_detectados?: string[];
}) {
  // Build system prompt by requesting the template and substituting placeholders
  let nombre = '';
  let carrera = '';
  if (payload.userId) {
    try {
      const ures = await fetch(`${API_PREFIX}/usuarios-habilitados?id=${payload.userId}`, { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
      const ujson = await safeJson(ures);
      nombre = ujson.nombre || '';
      carrera = ujson.carrera || '';
    } catch (e) {
      // ignore
    }
  }

  // fetch prompt template
  let systemPrompt = '';
  try {
    const sp = await fetch(`${API_PREFIX}/system-prompt-agente`, { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
    const spJson = await safeJson(sp);
    systemPrompt = spJson.prompt || spJson[0]?.prompt || '';
  } catch (e) {
    // ignore
  }

  // replace placeholders if present
  const riesgosLista = (payload.riesgos_detectados || []).join(', ');
  if (systemPrompt) {
    systemPrompt = systemPrompt.replace('${nombre}', nombre || '')
                             .replace('${carrera}', carrera || '')
                             .replace('${matricula}', payload.matricula || '')
                             .replace('${riesgos_detectados_lista}', riesgosLista || '');
  }

  type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: string };
  const messages: OpenAIMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  // user message
  messages.push({ role: 'user', content: payload.message });

  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/chat-openai-agente`
    : `${API_PREFIX}/chat-openai-agente`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ messages })
  });

  const json = await safeJson(res);
  // The plugin returns OpenAI's response structure. Extract assistant message content in a type-safe way.
  let reply = '';
  if (json && typeof json === 'object') {
    const j = json as Record<string, unknown>;
    const choices = j['choices'];
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const msg = first['message'];
      if (msg && typeof msg === 'object') {
        const content = (msg as Record<string, unknown>)['content'];
        if (typeof content === 'string') reply = content;
      }
      if (!reply) {
        const text = first['text'];
        if (typeof text === 'string') reply = text;
      }
    }
    if (!reply) {
      const alt = j['message'];
      if (typeof alt === 'string') reply = alt;
    }
    if (!reply) reply = JSON.stringify(json);
  }
  return { ok: res.ok, status: res.status, body: json, reply };
}

export async function saveConversation(userId: number, conversationString: string) {
  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/guardar-conversacion-agente`
    : `${API_PREFIX}/guardar-conversacion-agente`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ id: userId, conversacion: conversationString })
  });
  const json = await safeJson(res);
  return { ok: res.ok, status: res.status, body: json };
}

export async function saveHypotheses(userId: number, hypotheses: string[], matricula?: string) {
  // The plugin expects 'matricula', 'user_id' and 'hipotesis' params
  const body: Record<string, unknown> = { hipotesis: hypotheses };
  if (typeof userId === 'number') body.user_id = userId;
  if (matricula) body.matricula = matricula;

  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/guardar-hipotesis-agente`
    : `${API_PREFIX}/guardar-hipotesis-agente`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body)
  });
  const json = await safeJson(res);
  return { ok: res.ok, status: res.status, body: json };
}

export async function classifyCaseAuto(payload: { userId?: number; matricula?: string; texto?: string }) {
  const url = (CONFIG && CONFIG.rest_base)
    ? `${CONFIG.rest_base.replace(/\/$/, '')}/clasificar-caso-agente`
    : `${API_PREFIX}/clasificar-caso-agente`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  });
  const json = await safeJson(res);
  return { ok: res.ok, status: res.status, body: json };
}

export default {
  validateMatricula,
  getLastConversation,
  sendChatMessage,
  saveConversation,
  saveHypotheses,
  classifyCaseAuto
};
