/**
 * Verificação do e-mail de aluno (usada pelo pop-up "Já sou aluno" da página /black-friday).
 *
 * A página faz POST /api/verificar-aluno com { "email": "..." } e espera { "aluno": true | false }.
 *
 * Esta função repassa o e-mail para o webhook de verificação (Make, n8n, Apps Script…),
 * configurado na Vercel em Settings > Environment Variables:
 *
 *   VERIFICACAO_ALUNO_URL = https://hook.us2.make.com/....
 *
 * O webhook recebe um POST em JSON: { "email": "fulano@email.com" }
 * e deve responder com uma destas formas (qualquer uma serve):
 *   { "aluno": true }   { "aluno": false }
 *   true / false / "sim" / "nao"
 *   { "status": "aluno" } / { "status": "nao_aluno" }
 *
 * Passar pela função (em vez de chamar o webhook direto do navegador) evita problema de CORS
 * e não expõe a URL do webhook no código da página.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIMEOUT_MS = 10000;
const KEYS = ['aluno', 'is_aluno', 'isAluno', 'eh_aluno', 'student', 'is_student', 'isStudent',
  'encontrado', 'found', 'valido', 'valid', 'resultado', 'result', 'status'];
const YES = ['true', 'sim', 'yes', 's', 'y', '1', 'aluno', 'valido', 'válido', 'encontrado', 'found', 'ativo', 'active'];

function isYes(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v > 0;
  if (Array.isArray(v)) return v.length > 0 && isYes(v[0]);
  if (typeof v === 'object') {
    for (const k of KEYS) if (Object.prototype.hasOwnProperty.call(v, k)) return isYes(v[k]);
    return false;
  }
  return YES.includes(String(v).trim().toLowerCase());
}

function interpret(text) {
  const t = String(text || '').trim();
  try { return isYes(JSON.parse(t)); } catch (e) { return isYes(t); }
}

function readEmail(body) {
  let b = body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = Object.fromEntries(new URLSearchParams(b)); }
  }
  return String((b && b.email) || '').trim().toLowerCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'metodo_nao_permitido' });
  }

  const email = readEmail(req.body);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ erro: 'email_invalido' });
  }

  const webhook = process.env.VERIFICACAO_ALUNO_URL;
  if (!webhook) {
    console.error('[verificar-aluno] VERIFICACAO_ALUNO_URL não configurada na Vercel.');
    return res.status(503).json({ erro: 'verificacao_nao_configurada' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*' },
      body: JSON.stringify({ email }),
      signal: ctrl.signal
    });
    const text = await r.text();
    if (!r.ok) {
      console.error('[verificar-aluno] Webhook respondeu', r.status, text.slice(0, 200));
      return res.status(502).json({ erro: 'verificacao_falhou' });
    }
    return res.status(200).json({ aluno: interpret(text) });
  } catch (err) {
    console.error('[verificar-aluno] Falha ao chamar o webhook:', err && err.message);
    return res.status(504).json({ erro: 'verificacao_indisponivel' });
  } finally {
    clearTimeout(timer);
  }
};
