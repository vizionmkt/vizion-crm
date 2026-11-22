'use strict';
/* Vizion CRM — camada de dados usando Supabase.
   Mantém as mesmas "rotas" que a versão local (ex.: GET /api/clients) para o resto do app não mudar.
   A segurança de verdade fica no banco (regras RLS no arquivo 1-estrutura.sql). */

const VIZION_CONFIGURED = /^https:\/\/.+/.test(window.VIZION_CONFIG?.supabaseUrl || '') && !/COLE_AQUI/.test(window.VIZION_CONFIG?.supabaseKey || 'COLE_AQUI');
if (!VIZION_CONFIGURED) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app').innerHTML = '<div style="max-width:520px;margin:80px auto;padding:24px;font-family:system-ui;border:1px solid #e3e5ee;border-radius:12px">'
      + '<h2>Vizion CRM ainda não está conectado</h2><p>Abra o arquivo <b>config.js</b> e cole a <b>Project URL</b> e a chave <b>anon public</b> do seu projeto no Supabase.</p></div>';
  });
  throw new Error('config.js não preenchido');
}
const sb = window.supabase.createClient(window.VIZION_CONFIG.supabaseUrl, window.VIZION_CONFIG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const Backend = (() => {
  const MODULES = ['leads', 'clientes', 'metricas', 'resultados', 'acessos', 'cobrancas', 'financeiro'];
  const SERVICES_DEFAULT = '[]';

  // ---------- utilidades ----------
  class AppError extends Error { constructor(msg, extra = {}) { super(msg); Object.assign(this, extra); } }
  const fail = (msg, extra) => { throw new AppError(msg, extra); };
  const str = (v, max = 2000) => (v == null ? '' : String(v).trim().slice(0, max));
  const num = v => { const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const int = v => Math.round(num(v));
  const isMonth = m => /^\d{4}-\d{2}$/.test(m || '');
  const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const lastDay = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const prevMonth = m => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

  function friendly(err) {
    const m = String(err?.message || err || '');
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(m)) return 'Este e-mail ainda não foi confirmado. Veja a caixa de entrada.';
    if (/row-level security|permission denied|violates row-level/i.test(m)) return 'Você não tem permissão para fazer isso.';
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet.';
    if (/rate limit|too many/i.test(m)) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
    if (/already registered|already been registered|User already/i.test(m)) return 'Já existe um usuário com esse e-mail.';
    if (/duplicate key/i.test(m)) return 'Esse registro já existe.';
    if (/JWT|not authenticated|session/i.test(m)) return 'Sua sessão expirou. Entre novamente.';
    return m || 'Erro inesperado.';
  }
  // executa uma consulta do Supabase e devolve os dados (ou erro amigável)
  async function run(promise) {
    const { data, error } = await promise;
    if (error) fail(friendly(error), { auth: /JWT|not authenticated/i.test(error.message || '') });
    return data;
  }
  const rpc = (fn, args) => run(sb.rpc(fn, args));

  // ---------- usuário logado ----------
  let me = null;
  async function loadMe() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) fail('Faça login para continuar.', { auth: true });
    const p = await run(sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle());
    if (!p) { await sb.auth.signOut(); fail('Seu acesso ainda não foi liberado. Fale com a administradora.', { auth: true }); }
    if (!p.active) { await sb.auth.signOut(); fail('Este acesso está desativado. Fale com a administradora.', { auth: true }); }
    me = { ...p, perms: p.perms || {}, client_scope: p.client_scope ?? 'all' };
    return me;
  }
  const isAdmin = () => me?.role === 'admin';
  const can = (mod, level = 'view') => isAdmin() || (level === 'view' ? (me?.perms?.[mod] || 'none') !== 'none' : me?.perms?.[mod] === 'edit');
  const seesAll = () => isAdmin() || me?.client_scope === 'all';
  const need = (mod, level, msg) => { if (!can(mod, level)) fail(msg || 'Sem permissão.'); };

  // ---------- clientes ----------
  const CLIENT_FIELDS = ['name', 'contractor_name', 'company', 'document', 'phone', 'email', 'birthday', 'instagram', 'address', 'segment', 'start_date', 'notes', 'end_date', 'end_reason'];
  const normClient = c => c && ({ ...c, active: c.active ? 1 : 0, contract_received: c.contract_received ? 1 : 0, services: Array.isArray(c.services) ? c.services : JSON.parse(c.services || SERVICES_DEFAULT) });
  function clientValues(b, old = {}) {
    const v = {};
    for (const f of CLIENT_FIELDS) v[f] = str(f in b ? b[f] : old[f]);
    if (!v.name) fail('Informe o nome do cliente/empresa.');
    if (!v.contractor_name) fail('Informe o nome completo do contratante.');
    if (v.start_date && !isDate(v.start_date)) fail('Data de início do contrato inválida.');
    if (v.end_date && !isDate(v.end_date)) fail('Data de finalização do contrato inválida.');
    if (v.birthday && !/^(\d{4}-)?(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v.birthday)) fail('Data de aniversário inválida.');
    v.due_day = Math.min(31, Math.max(1, int(b.due_day ?? old.due_day) || 10));
    v.monthly_fee = num(b.monthly_fee ?? old.monthly_fee);
    v.services = Array.isArray(b.services) ? b.services.map(s => str(s, 60)).filter(Boolean) : (old.services || []);
    v.contract_received = !!(b.contract_received ?? old.contract_received);
    v.active = b.active === false ? false : true;
    return v;
  }
  async function getClient(id) {
    const c = await run(sb.from('clients').select('*').eq('id', Number(id)).maybeSingle());
    if (!c) fail('Cliente não encontrado ou sem acesso.');
    return normClient(c);
  }

  // ---------- cobranças ----------
  const flatCharge = r => ({ ...r, client_name: r.clients?.name || '', client_phone: r.clients?.phone || '', client_email: r.clients?.email || '',
    overdue: r.status === 'pendente' && r.due_date < today() });
  const chargeSel = () => sb.from('charges').select('*, clients(name, phone, email)');

  // ---------- leads ----------
  const LEAD_SOURCES = ['trafego', 'impulsionamento', 'organico', 'indicacao', 'outro'];
  const LEAD_STATUS = ['novo', 'contato', 'reuniao', 'proposta', 'fechado', 'perdido'];
  const LEAD_TEXT = ['name', 'company', 'segment', 'phone', 'email', 'network', 'handle', 'campaign', 'notes', 'lost_reason'];
  function leadValues(b) {
    const v = {};
    for (const f of LEAD_TEXT) v[f] = str(b[f]);
    if (!v.name) fail('Informe o nome do lead.');
    const d = k => (isDate(b[k]) ? b[k] : '');
    let status = LEAD_STATUS.includes(b.status) ? b.status : 'novo';
    if (d('closed_date') && status !== 'perdido') status = 'fechado';
    else if (d('meeting_date') && ['novo', 'contato'].includes(status)) status = 'reuniao';
    let source = LEAD_SOURCES.includes(b.source) ? b.source : 'outro';
    if (v.campaign && !['trafego', 'impulsionamento'].includes(source)) source = 'trafego'; // campanha rodada = tráfego pago
    return { ...v, source, status, first_contact: d('first_contact'), meeting_date: d('meeting_date'), closed_date: d('closed_date'), deal_value: num(b.deal_value) };
  }
  function spendValues(b) {
    if (!isMonth(b.month)) fail('Informe o mês.');
    if (!str(b.network)) fail('Informe a rede social.');
    return { month: b.month, network: str(b.network, 100), source: b.source === 'impulsionamento' ? 'impulsionamento' : 'trafego', campaign: str(b.campaign, 200), amount: num(b.amount) };
  }

  // ---------- financeiro ----------
  function financeValues(b) {
    if (!isDate(b.date)) fail('Informe a data.');
    if (num(b.amount) <= 0) fail('Informe um valor maior que zero.');
    const clientId = b.client_id ? Number(b.client_id) : null;
    if (!clientId && !seesAll()) fail('Selecione um cliente.');
    return { date: b.date, type: b.type === 'saida' ? 'saida' : 'entrada', client_id: clientId, contact: str(b.contact, 200), method: str(b.method, 100), amount: num(b.amount), description: str(b.description, 500) };
  }

  // ---------- usuários ----------
  const cleanPerms = p => { const o = {}; for (const m of MODULES) o[m] = ['none', 'view', 'edit'].includes(p?.[m]) ? p[m] : 'none'; if (o.resultados === 'edit') o.resultados = 'view'; return o; };
  const cleanScope = s => (s === 'all' ? 'all' : Array.isArray(s) ? s.map(Number).filter(Boolean) : []);
  const signupClient = () => window.supabase.createClient(window.VIZION_CONFIG.supabaseUrl, window.VIZION_CONFIG.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'vizion-signup' },
  });
  const siteUrl = () => location.origin + location.pathname;

  // ---------- rotas ----------
  const routes = [];
  const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/?]+)') + '$'), fn });

  route('GET', '/api/me', async () => ({ user: await loadMe(), modules: MODULES }));
  route('POST', '/api/login', async ({ body }) => {
    const email = str(body.email, 200).toLowerCase();
    await run(sb.auth.signInWithPassword({ email, password: String(body.password || '') }));
    return { user: await loadMe() };
  });
  route('POST', '/api/logout', async () => { await sb.auth.signOut(); me = null; return { ok: true }; });
  route('POST', '/api/me/password', async ({ body }) => {
    if (String(body.password || '').length < 8) fail('A nova senha precisa ter pelo menos 8 caracteres.');
    const { error } = await sb.auth.signInWithPassword({ email: me.email, password: String(body.current || '') });
    if (error) fail('Senha atual incorreta.');
    await run(sb.auth.updateUser({ password: String(body.password) }));
    return { ok: true };
  });
  route('POST', '/api/forgot', async ({ body }) => {
    const email = str(body.email, 200).toLowerCase();
    if (!email.includes('@')) fail('Informe o seu e-mail.');
    await run(sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() }));
    return { ok: true };
  });
  route('POST', '/api/new-password', async ({ body }) => {
    if (String(body.password || '').length < 8) fail('A senha precisa ter pelo menos 8 caracteres.');
    await run(sb.auth.updateUser({ password: String(body.password) }));
    return { ok: true };
  });

  // usuários (somente admin)
  const adminOnly = () => { if (!isAdmin()) fail('Apenas a administradora pode fazer isso.'); };
  route('GET', '/api/users', async () => {
    adminOnly();
    const rows = await run(sb.from('profiles').select('*').order('role').order('name'));
    return rows.map(u => ({ ...u, perms: u.perms || {}, client_scope: u.client_scope ?? 'all' }));
  });
  route('POST', '/api/users', async ({ body }) => {
    adminOnly();
    const name = str(body.name, 120), email = str(body.email, 200).toLowerCase(), pw = String(body.password || '');
    if (!name || !email.includes('@')) fail('Informe nome e e-mail válidos.');
    if (pw.length < 8) fail('A senha precisa ter pelo menos 8 caracteres.');
    const exists = await run(sb.from('profiles').select('id').eq('email', email).maybeSingle());
    if (exists) fail('Já existe um usuário com esse e-mail.');
    const { data, error } = await signupClient().auth.signUp({ email, password: pw, options: { data: { name }, emailRedirectTo: siteUrl() } });
    if (error) fail(friendly(error));
    if (!data.user || (data.user.identities && data.user.identities.length === 0)) fail('Já existe um usuário com esse e-mail.');
    // o perfil é criado pelo banco no cadastro; aqui só aplicamos as permissões escolhidas
    let ok = false;
    for (let i = 0; i < 5 && !ok; i++) {
      const rows = await run(sb.from('profiles').update({ name, role: body.role === 'admin' ? 'admin' : 'user', perms: cleanPerms(body.perms), client_scope: cleanScope(body.client_scope), active: true })
        .eq('id', data.user.id).select('id'));
      ok = rows.length > 0;
      if (!ok) await new Promise(r => setTimeout(r, 600));
    }
    if (!ok) fail('Usuário criado, mas não consegui salvar as permissões. Abra o usuário e salve de novo.');
    return { id: data.user.id, needsConfirm: !data.session };
  });
  route('PUT', '/api/users/:id', async ({ params, body }) => {
    adminOnly();
    const self = params.id === me.id;
    await run(sb.from('profiles').update({
      name: str(body.name, 120), role: self ? 'admin' : (body.role === 'admin' ? 'admin' : 'user'),
      perms: cleanPerms(body.perms), client_scope: cleanScope(body.client_scope), active: self ? true : body.active !== false,
    }).eq('id', params.id));
    return { ok: true };
  });
  route('DELETE', '/api/users/:id', async ({ params }) => {
    adminOnly();
    if (params.id === me.id) fail('Você não pode remover o seu próprio acesso.');
    await run(sb.from('profiles').update({ active: false, perms: {}, client_scope: [] }).eq('id', params.id));
    return { ok: true };
  });
  route('POST', '/api/users/:id/reset', async ({ params }) => {
    adminOnly();
    const u = await run(sb.from('profiles').select('email').eq('id', params.id).single());
    await run(sb.auth.resetPasswordForEmail(u.email, { redirectTo: siteUrl() }));
    return { ok: true };
  });

  // configurações
  route('GET', '/api/settings', async () => {
    const rows = await run(sb.from('settings').select('key, value'));
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  });
  route('PUT', '/api/settings', async ({ body }) => {
    adminOnly();
    for (const k of ['company', 'pix', 'msg_reminder', 'msg_overdue', 'remind_days'])
      if (k in body) await run(sb.from('settings').update({ value: str(body[k], 4000) }).eq('key', k));
    const rows = await run(sb.from('settings').select('key, value'));
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  });

  // clientes
  route('GET', '/api/clients', async () => (await run(sb.from('clients').select('*').order('active', { ascending: false }).order('name'))).map(normClient));
  route('GET', '/api/clients/:id', async ({ params }) => getClient(params.id));
  route('POST', '/api/clients', async ({ body }) => {
    need('clientes', 'edit', 'Sem permissão para cadastrar clientes.');
    const r = await run(sb.from('clients').insert(clientValues(body)).select('id').single());
    if (!isAdmin() && Array.isArray(me.client_scope)) me.client_scope = [...me.client_scope, r.id];
    return { id: r.id };
  });
  route('PUT', '/api/clients/:id', async ({ params, body }) => {
    need('clientes', 'edit', 'Sem permissão para editar clientes.');
    const old = await getClient(params.id);
    await run(sb.from('clients').update(clientValues(body, old)).eq('id', old.id));
    return { ok: true };
  });
  route('DELETE', '/api/clients/:id', async ({ params }) => {
    adminOnly();
    const c = await getClient(params.id);
    if (c.contract_file) await sb.storage.from('contracts').remove([c.contract_file]);
    await run(sb.from('clients').delete().eq('id', c.id));
    return { ok: true };
  });

  // acessos do cliente
  route('GET', '/api/clients/:id/access', async ({ params }) => { need('acessos', 'view', 'Sem permissão para ver acessos.'); return rpc('list_access', { p_client: Number(params.id) }); });
  route('POST', '/api/clients/:id/access', async ({ params, body }) => ({ id: await rpc('save_access', { p_id: null, p_client: Number(params.id), p_platform: str(body.platform, 100), p_login: str(body.login, 300), p_password: str(body.password, 500), p_notes: str(body.notes) }) }));
  route('PUT', '/api/access/:id', async ({ params, body }) => { await rpc('save_access', { p_id: Number(params.id), p_client: null, p_platform: str(body.platform, 100), p_login: str(body.login, 300), p_password: str(body.password, 500), p_notes: str(body.notes) }); return { ok: true }; });
  route('DELETE', '/api/access/:id', async ({ params }) => { await rpc('delete_access', { p_id: Number(params.id) }); return { ok: true }; });

  // métricas
  route('GET', '/api/clients/:id/metrics', async ({ params }) => run(sb.from('metrics').select('*').eq('client_id', Number(params.id)).order('month', { ascending: false })));
  route('PUT', '/api/clients/:id/metrics/:month', async ({ params, body }) => {
    need('metricas', 'edit', 'Sem permissão para editar métricas.');
    if (!isMonth(params.month)) fail('Mês inválido.');
    await run(sb.from('metrics').upsert({
      client_id: Number(params.id), month: params.month, views: int(body.views), followers: int(body.followers), profile_visits: int(body.profile_visits),
      link_clicks: int(body.link_clicks), interactions: int(body.interactions), leads: int(body.leads), ad_results: int(body.ad_results),
      result_type: str(body.result_type, 60) || 'Leads', ad_spend: num(body.ad_spend), notes: str(body.notes),
    }, { onConflict: 'client_id,month' }));
    return { ok: true };
  });
  route('DELETE', '/api/metrics/:id', async ({ params }) => { need('metricas', 'edit'); await run(sb.from('metrics').delete().eq('id', Number(params.id))); return { ok: true }; });

  // resultados (soma dos meses que se sobrepõem ao período)
  route('GET', '/api/results', async ({ query }) => {
    need('resultados', 'view', 'Sem permissão para ver resultados.');
    const to = isDate(query.to) ? query.to : today();
    const from = isDate(query.from) ? query.from : to;
    if (from > to) fail('A data inicial precisa ser antes da final.');
    const m1 = from.slice(0, 7), m2 = to.slice(0, 7);
    let qy = sb.from('metrics').select('*, clients(name)').gte('month', m1).lte('month', m2).order('month');
    if (query.client) qy = qy.eq('client_id', Number(query.client));
    const rows = (await run(qy)).map(r => ({ ...r, client_name: r.clients?.name || '' }));
    // "followers" = novos seguidores ganhos no mês (é como a equipe lança), então soma como os outros
    const K = ['views', 'followers', 'interactions', 'ad_results', 'ad_spend', 'leads', 'profile_visits', 'link_clicks'];
    const by = {};
    for (const r of rows) {
      const c = by[r.client_id] ||= { client_id: r.client_id, client_name: r.client_name, types: new Set(), ...Object.fromEntries(K.map(k => [k, 0])) };
      for (const k of K) c[k] += Number(r[k]) || 0;
      if (r.ad_results) c.types.add(r.result_type || 'Leads');
    }
    const clients = Object.values(by).map(({ types, ...c }) => ({ ...c, new_followers: c.followers, result_types: [...types] }));
    const sum = k => clients.reduce((s, c) => s + c[k], 0);
    const months = {};
    const MK = ['views', 'followers', 'interactions', 'ad_results', 'ad_spend', 'leads'];
    for (const r of rows) { const m = months[r.month] ||= { month: r.month, ...Object.fromEntries(MK.map(k => [k, 0])) }; for (const k of MK) m[k] += Number(r[k]) || 0; }
    return {
      from, to, months_range: [m1, m2], clients, monthly: Object.values(months), rows,
      totals: Object.fromEntries([...K, 'new_followers'].map(k => [k, sum(k)])),
    };
  });

  // cobranças
  route('GET', '/api/charges', async ({ query }) => {
    need('cobrancas', 'view', 'Sem permissão para ver cobranças.');
    let qy = chargeSel().order('due_date');
    if (query.client) qy = qy.eq('client_id', Number(query.client));
    else if (query.open === '1') qy = qy.eq('status', 'pendente');
    else { const m = isMonth(query.month) ? query.month : today().slice(0, 7); qy = qy.or(`ref_month.eq.${m},and(status.eq.pendente,due_date.lt.${m}-01)`); }
    return (await run(qy)).map(flatCharge);
  });
  route('POST', '/api/charges/generate', async ({ body }) => { need('cobrancas', 'edit'); return { created: await rpc('generate_charges', { p_month: isMonth(body.month) ? body.month : today().slice(0, 7) }) }; });
  route('POST', '/api/charges', async ({ body }) => {
    need('cobrancas', 'edit');
    if (!body.client_id) fail('Selecione o cliente.');
    if (!isDate(body.due_date)) fail('Informe a data de vencimento.');
    if (num(body.amount) <= 0) fail('Informe o valor.');
    const r = await run(sb.from('charges').insert({ client_id: Number(body.client_id), ref_month: isMonth(body.ref_month) ? body.ref_month : body.due_date.slice(0, 7), due_date: body.due_date, amount: num(body.amount), description: str(body.description, 300) || 'Mensalidade' }).select('id').single());
    return { id: r.id };
  });
  route('PUT', '/api/charges/:id', async ({ params, body }) => {
    need('cobrancas', 'edit');
    if (!isDate(body.due_date)) fail('Data de vencimento inválida.');
    const upd = { due_date: body.due_date, amount: num(body.amount), description: str(body.description, 300) };
    if (isMonth(body.ref_month)) upd.ref_month = body.ref_month;
    await run(sb.from('charges').update(upd).eq('id', Number(params.id)));
    return { ok: true };
  });
  route('POST', '/api/charges/:id/pay', async ({ params, body }) => { await rpc('pay_charge', { p_id: Number(params.id), p_date: isDate(body.date) ? body.date : today(), p_amount: num(body.amount), p_method: str(body.method, 100) }); return { ok: true }; });
  route('POST', '/api/charges/:id/unpay', async ({ params }) => { await rpc('unpay_charge', { p_id: Number(params.id) }); return { ok: true }; });
  route('POST', '/api/charges/:id/notified', async ({ params }) => { await rpc('mark_notified', { p_id: Number(params.id) }); return { ok: true }; });
  route('DELETE', '/api/charges/:id', async ({ params }) => { await rpc('delete_charge', { p_id: Number(params.id) }); return { ok: true }; });

  // financeiro
  route('GET', '/api/finance', async ({ query }) => {
    need('financeiro', 'view', 'Sem permissão para ver o financeiro.');
    const month = isMonth(query.month) ? query.month : today().slice(0, 7);
    const rows = (await run(sb.from('finance').select('*, clients(name)').gte('date', `${month}-01`).lte('date', `${month}-31`).order('date', { ascending: false }).order('id', { ascending: false })))
      .map(r => ({ ...r, client_name: r.clients?.name || '' }));
    const all = await run(sb.from('finance').select('date, type, amount'));
    const hist = {};
    for (const r of all) { const m = r.date.slice(0, 7); const x = hist[m] ||= { month: m, entradas: 0, saidas: 0 }; x[r.type === 'saida' ? 'saidas' : 'entradas'] += Number(r.amount) || 0; }
    const history = Object.values(hist).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    return { month, rows, history };
  });
  route('POST', '/api/finance', async ({ body }) => { need('financeiro', 'edit'); const r = await run(sb.from('finance').insert(financeValues(body)).select('id').single()); return { id: r.id }; });
  route('PUT', '/api/finance/:id', async ({ params, body }) => {
    need('financeiro', 'edit');
    const v = financeValues(body);
    const old = await run(sb.from('finance').select('charge_id').eq('id', Number(params.id)).single());
    await run(sb.from('finance').update(v).eq('id', Number(params.id)));
    if (old.charge_id) await sb.from('charges').update({ paid_at: v.date, amount: v.amount, method: v.method }).eq('id', old.charge_id);
    return { ok: true };
  });
  route('DELETE', '/api/finance/:id', async ({ params }) => { await rpc('delete_finance', { p_id: Number(params.id) }); return { ok: true }; });

  // leads
  route('GET', '/api/leads', async () => {
    need('leads', 'view', 'Sem permissão para ver leads.');
    const [leads, spend] = await Promise.all([
      run(sb.from('leads').select('*').order('first_contact', { ascending: false }).order('id', { ascending: false })),
      run(sb.from('lead_spend').select('*').order('month', { ascending: false }).order('network')),
    ]);
    return { leads, spend };
  });
  route('POST', '/api/leads', async ({ body }) => { need('leads', 'edit'); const r = await run(sb.from('leads').insert(leadValues(body)).select('id').single()); return { id: r.id }; });
  route('PUT', '/api/leads/:id', async ({ params, body }) => { need('leads', 'edit'); await run(sb.from('leads').update(leadValues(body)).eq('id', Number(params.id))); return { ok: true }; });
  route('DELETE', '/api/leads/:id', async ({ params }) => { need('leads', 'edit'); await run(sb.from('leads').delete().eq('id', Number(params.id))); return { ok: true }; });
  route('POST', '/api/leads/:id/convert', async ({ params }) => {
    const cid = await rpc('convert_lead', { p_id: Number(params.id) });
    if (!isAdmin() && Array.isArray(me.client_scope)) me.client_scope = [...me.client_scope, cid];
    return { client_id: cid };
  });
  route('POST', '/api/lead-spend', async ({ body }) => { need('leads', 'edit'); const r = await run(sb.from('lead_spend').insert(spendValues(body)).select('id').single()); return { id: r.id }; });
  route('PUT', '/api/lead-spend/:id', async ({ params, body }) => { need('leads', 'edit'); await run(sb.from('lead_spend').update(spendValues(body)).eq('id', Number(params.id))); return { ok: true }; });
  route('DELETE', '/api/lead-spend/:id', async ({ params }) => { need('leads', 'edit'); await run(sb.from('lead_spend').delete().eq('id', Number(params.id))); return { ok: true }; });

  // painel
  route('GET', '/api/dashboard', async () => {
    const month = today().slice(0, 7), t = today();
    const out = { month };
    const anyMod = MODULES.some(m => can(m));
    const tasks = [];
    if (anyMod) tasks.push(run(sb.from('clients').select('id', { count: 'exact', head: false }).eq('active', true)).then(r => { out.clients = r.length; }));
    if (can('financeiro')) tasks.push(run(sb.from('finance').select('type, amount').gte('date', `${month}-01`).lte('date', `${month}-31`)).then(r => {
      out.finance = { entradas: r.filter(x => x.type === 'entrada').reduce((s, x) => s + Number(x.amount), 0), saidas: r.filter(x => x.type === 'saida').reduce((s, x) => s + Number(x.amount), 0) };
    }));
    if (can('cobrancas')) tasks.push((async () => {
      const s = await run(sb.from('settings').select('value').eq('key', 'remind_days').maybeSingle());
      const days = int(s?.value) || 3;
      const lim = new Date(Date.now() + days * 864e5); lim.setMinutes(lim.getMinutes() - lim.getTimezoneOffset());
      const limit = lim.toISOString().slice(0, 10);
      const open = (await run(chargeSel().eq('status', 'pendente').order('due_date'))).map(flatCharge);
      out.overdue = open.filter(r => r.overdue);
      out.upcoming = open.filter(r => !r.overdue && r.due_date <= limit);
      out.openTotal = open.reduce((s, r) => s + Number(r.amount), 0);
    })());
    if (can('metricas')) tasks.push(run(sb.from('metrics').select('leads, ad_spend, views').eq('month', month)).then(r => {
      out.metrics = { leads: r.reduce((s, x) => s + x.leads, 0), ad_spend: r.reduce((s, x) => s + Number(x.ad_spend), 0), views: r.reduce((s, x) => s + x.views, 0) };
    }));
    if (can('leads')) tasks.push(run(sb.from('leads').select('id, name, company, status, first_contact, meeting_date, closed_date, created_at')).then(r => {
      const fm = l => (l.first_contact || l.created_at || '').slice(0, 7);
      out.leads = {
        novos: r.filter(l => fm(l) === month).length, reunioes: r.filter(l => (l.meeting_date || '').slice(0, 7) === month).length,
        fechados: r.filter(l => (l.closed_date || '').slice(0, 7) === month && l.status === 'fechado').length,
      };
      out.nextMeetings = r.filter(l => l.meeting_date >= t && !['fechado', 'perdido'].includes(l.status)).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date)).slice(0, 5);
    }));
    await Promise.all(tasks);
    return out;
  });

  // ---------- contrato assinado (Storage) ----------
  async function uploadContract(clientId, file) {
    need('clientes', 'edit', 'Sem permissão para editar clientes.');
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) fail('Envie um arquivo PDF, JPG ou PNG.');
    if (file.size > 10 * 1024 * 1024) fail('Arquivo muito grande (máximo 10 MB).');
    const c = await getClient(clientId);
    const ext = file.name.split('.').pop().toLowerCase().replace('jpeg', 'jpg');
    const path = `${c.id}/${Date.now()}.${ext}`;
    const type = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg';
    await run(sb.storage.from('contracts').upload(path, file, { contentType: type, upsert: false }));
    await run(sb.from('clients').update({ contract_file: path, contract_name: file.name.slice(0, 200), contract_received: true }).eq('id', c.id));
    if (c.contract_file) await sb.storage.from('contracts').remove([c.contract_file]);
  }
  async function contractUrl(c, download = false) {
    if (!c.contract_file) fail('Nenhum contrato enviado.');
    const data = await run(sb.storage.from('contracts').createSignedUrl(c.contract_file, 300, download ? { download: c.contract_name || true } : undefined));
    return data.signedUrl;
  }

  // ---------- entrada única ----------
  async function request(method, url, body = {}) {
    const u = new URL(url, location.origin);
    const r = routes.find(x => x.method === method && x.re.test(u.pathname));
    if (!r) fail('Rota não encontrada: ' + u.pathname);
    const publicRoutes = ['/api/login', '/api/logout', '/api/forgot'];
    if (!publicRoutes.includes(u.pathname) && !me && u.pathname !== '/api/me') await loadMe();
    try {
      return await r.fn({ params: u.pathname.match(r.re).groups || {}, body: body || {}, query: Object.fromEntries(u.searchParams) });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(friendly(e));
    }
  }

  return { request, uploadContract, contractUrl, onAuth: cb => sb.auth.onAuthStateChange(cb) };
})();
