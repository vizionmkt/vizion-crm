'use strict';
/* Vizion CRM — interface */

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const h = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const n0 = v => Number(v || 0).toLocaleString('pt-BR');
const fmtDate = d => d ? d.split('-').reverse().join('/') : '';
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monthLabel = m => { if (!m) return ''; const [y, mm] = m.split('-'); return `${MONTHS[+mm - 1]}/${y}`; };
const monthShort = m => { const [y, mm] = m.split('-'); return `${MONTHS[+mm - 1].slice(0, 3)}/${y.slice(2)}`; };
const todayStr = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const thisMonth = () => todayStr().slice(0, 7);
const shiftMonth = (m, delta) => { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + delta, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const pct = (a, b) => (b ? ((a - b) / b) * 100 : null);

async function api(method, url, body) {
  try { return await Backend.request(method, url, body); }
  catch (e) {
    if (e.auth && url !== '/api/login' && url !== '/api/me') { state.me = null; renderAuth(); }
    throw e;
  }
}
function toast(msg, err = false) {
  const d = document.createElement('div'); d.textContent = msg; if (err) d.className = 'err';
  $('#toast').appendChild(d); setTimeout(() => d.remove(), 3200);
}
const fail = e => toast(e.message, true);

const state = { me: null, settings: null };
const isAdmin = () => state.me?.role === 'admin';
function can(mod, level = 'view') {
  if (isAdmin()) return true;
  const p = state.me?.perms?.[mod] || 'none';
  return level === 'view' ? p !== 'none' : p === 'edit';
}

const LOGO = `<span class="logo"><svg width="20" height="20" viewBox="0 0 32 32"><path d="M7 8l9 17 9-17" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
const BRAND = `<div class="brand">${LOGO}<span>Vizion <b>CRM</b></span></div>`;
const I = {
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 010 8M22 21c0-3-2-5-4-5.5"/></svg>',
  charge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/></svg>',
  lead: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>',
  menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  wa: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zM20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.4z"/></svg>',
  mail: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
};

// ---------- Modal ----------
function modal(title, bodyHtml, { wide = false, onMount, eyebrow = '' } = {}) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-bg"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">
    <div class="modal-head"><div>${eyebrow ? `<div class="eyebrow">${h(eyebrow)}</div>` : ''}<h2 class="${eyebrow ? 'big' : ''}">${h(title)}</h2></div><button class="btn ghost" data-close aria-label="Fechar">✕</button></div>
    <div class="modal-body">${bodyHtml}</div></div></div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  $$('[data-close]', root).forEach(b => b.onclick = close);
  $('.modal-bg', root).addEventListener('mousedown', e => { if (e.target.classList.contains('modal-bg')) close(); });
  const el = $('.modal', root);
  onMount?.(el, close);
  $('input, select, textarea', el)?.focus();
  return { el, close };
}
function confirmBox(text, okLabel = 'Excluir') {
  return new Promise(resolve => {
    const { el, close } = modal('Confirmar', `<p>${h(text)}</p><div class="modal-foot"><button class="btn secondary" data-close>Cancelar</button><button class="btn danger" id="cf-ok">${h(okLabel)}</button></div>`);
    $$('[data-close]', el).forEach(b => b.addEventListener('click', () => resolve(false)));
    $('#cf-ok', el).onclick = () => { close(); resolve(true); };
  });
}
function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
    else out[el.name] = el.value;
  }
  return out;
}
function onSubmit(form, fn) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button[type=submit]', form); if (btn) btn.disabled = true;
    const errBox = $('.error', form); if (errBox) errBox.remove();
    try { await fn(formData(form)); }
    catch (err) { form.insertAdjacentHTML('afterbegin', `<div class="error">${h(err.message)}</div>`); }
    finally { if (btn) btn.disabled = false; }
  });
}
const field = (name, label, value = '', type = 'text', extra = '') =>
  `<div class="field ${extra.includes('span2') ? 'span2' : ''}"><label for="f-${name}">${label}</label>${
    type === 'textarea' ? `<textarea id="f-${name}" name="${name}">${h(value)}</textarea>`
    : `<input id="f-${name}" name="${name}" type="${type}" value="${h(value)}" ${extra.replace('span2', '')}>`}</div>`;

// ---------- Autenticação ----------
async function boot() {
  // link de "redefinir senha" do e-mail: pede a nova senha
  Backend.onAuth(event => { if (event === 'PASSWORD_RECOVERY') setTimeout(askNewPassword, 300); });
  if (/type=recovery/.test(location.hash)) return; // aguarda o evento acima
  try {
    const { user } = await api('GET', '/api/me');
    state.me = user;
    startApp();
  } catch (e) { renderAuth(e.message && !/Faça login/.test(e.message) ? e.message : ''); }
}
function askNewPassword() {
  $('#app').innerHTML = `<div class="login-wrap"><div class="login-card">
    <div class="brand">${LOGO}<span>Vizion <b>CRM</b></span></div>
    <div class="sub">Crie a sua nova senha</div>
    <form id="np-form">${field('password', 'Nova senha (mín. 8 caracteres)', '', 'password', 'required minlength="8" autocomplete="new-password"')}
      <button class="btn block" type="submit">Salvar e entrar</button></form></div></div>`;
  onSubmit($('#np-form'), async d => {
    await api('POST', '/api/new-password', d);
    history.replaceState(null, '', location.pathname + '#/painel');
    toast('Senha alterada!');
    boot();
  });
}
async function renderAuth(msg = '') {
  $('#app').innerHTML = `<div class="login-wrap"><div class="login-card">
    <div class="brand">${LOGO}<span>Vizion <b>CRM</b></span></div>
    <div class="sub">Entre com seu e-mail e senha</div>
    <form id="auth-form" autocomplete="on">
      ${msg ? `<div class="error">${h(msg)}</div>` : ''}
      ${field('email', 'E-mail', '', 'email', 'required autocomplete="username"')}
      ${field('password', 'Senha', '', 'password', 'required autocomplete="current-password"')}
      <button class="btn block" type="submit">Entrar</button>
      <p style="text-align:center;margin:14px 0 0"><a href="#" id="forgot" class="small">Esqueci minha senha</a></p>
    </form></div></div>`;
  onSubmit($('#auth-form'), async d => {
    const { user } = await api('POST', '/api/login', d);
    state.me = user;
    location.hash = '#/painel';
    startApp();
  });
  $('#forgot').onclick = e => {
    e.preventDefault();
    const { el, close } = modal('Esqueci minha senha', `<form>${field('email', 'Seu e-mail de login', $('#f-email')?.value || '', 'email', 'required')}
      <p class="muted small">Vamos enviar um link para você criar uma nova senha.</p>
      <div class="modal-foot"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Enviar link</button></div></form>`);
    $$('[data-close]', el).forEach(b => b.onclick = close);
    onSubmit($('form', el), async x => { await api('POST', '/api/forgot', x); close(); toast('Pronto! Veja seu e-mail (e a caixa de spam).'); });
  };
}
async function logout() {
  await api('POST', '/api/logout').catch(() => {});
  state.me = null; location.hash = ''; renderAuth();
}

// ---------- Layout / roteamento ----------
function navItems() {
  const items = [['#/painel', 'Painel', I.dash]];
  if (can('leads')) items.push(['#/leads', 'Leads', I.lead]);
  if (['clientes', 'metricas', 'acessos'].some(m => can(m))) items.push(['#/clientes', 'Clientes', I.clients]);
  if (can('resultados')) items.push(['#/resultados', 'Resultados', I.chart]);
  if (can('cobrancas')) items.push(['#/cobrancas', 'Cobranças', I.charge]);
  if (can('financeiro')) items.push(['#/financeiro', 'Financeiro', I.money]);
  if (isAdmin()) items.push(['#/usuarios', 'Usuários e acessos', I.users], ['#/configuracoes', 'Configurações', I.cog]);
  return items;
}
function startApp() {
  $('#app').innerHTML = `
    <div class="topbar"><button id="menu-btn" aria-label="Menu">${I.menu}</button>${BRAND}</div>
    <div class="layout">
      <aside class="sidebar" id="sidebar">${BRAND}
        <nav class="nav">${navItems().map(([href, label, icon]) => `<a href="${href}">${icon}<span>${label}</span></a>`).join('')}</nav>
        <div class="side-foot"><div class="who">${h(state.me.name)}</div>
          <div class="small">${isAdmin() ? 'Administrador' : 'Colaborador'}</div>
          <div style="margin-top:10px;display:flex;gap:14px"><a id="my-pass">Minha senha</a><a id="logout">Sair</a></div></div>
      </aside>
      <div class="side-backdrop" id="side-backdrop"></div>
      <main class="main" id="view"></main>
    </div>`;
  $('#logout').onclick = logout;
  $('#my-pass').onclick = changeMyPassword;
  $('#menu-btn').onclick = () => $('#sidebar').classList.toggle('open');
  $('#side-backdrop').onclick = () => $('#sidebar').classList.remove('open');
  window.onhashchange = route;
  route();
}
function route() {
  if (!state.me) return;
  $('#sidebar')?.classList.remove('open');
  const hash = location.hash || '#/painel';
  $$('.nav a').forEach(a => a.classList.toggle('active', hash.startsWith(a.getAttribute('href'))));
  const view = $('#view');
  const parts = hash.slice(2).split('/');
  const routes = {
    painel: viewDashboard, leads: viewLeads, resultados: viewResults, clientes: parts[1] ? () => viewClient(parts[1], parts[2]) : viewClients,
    cobrancas: viewCharges, financeiro: viewFinance, usuarios: viewUsers, configuracoes: viewSettings,
  };
  (routes[parts[0]] || viewDashboard)(view).catch(e => { view.innerHTML = `<div class="card"><div class="error">${h(e.message)}</div></div>`; });
  window.scrollTo(0, 0);
}
function changeMyPassword() {
  const { el, close } = modal('Alterar minha senha', `<form>
    ${field('current', 'Senha atual', '', 'password', 'required autocomplete="current-password"')}
    ${field('password', 'Nova senha (mín. 8 caracteres)', '', 'password', 'required minlength="8" autocomplete="new-password"')}
    <div class="modal-foot"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  onSubmit($('form', el), async d => { await api('POST', '/api/me/password', d); close(); toast('Senha alterada!'); });
}

// ---------- Notificação de pagamento ----------
async function loadSettings() { if (!state.settings) state.settings = await api('GET', '/api/settings'); return state.settings; }
function buildMessage(ch, s) {
  const tpl = ch.overdue ? s.msg_overdue : s.msg_reminder;
  const first = (ch.client_name || '').split(' ')[0];
  return tpl.replaceAll('{nome}', first).replaceAll('{nome_completo}', ch.client_name || '').replaceAll('{mes}', monthLabel(ch.ref_month))
    .replaceAll('{valor}', brl(ch.amount)).replaceAll('{vencimento}', fmtDate(ch.due_date)).replaceAll('{pix}', s.pix || '-').replaceAll('{empresa}', s.company || '');
}
function waNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length <= 11) d = '55' + d;
  return d;
}
async function notifyCharge(ch, after) {
  const s = await loadSettings();
  const text = buildMessage(ch, s);
  const wa = waNumber(ch.client_phone);
  const { el, close } = modal(`Notificar ${ch.client_name}`, `
    <p class="muted small">${ch.overdue ? '<span class="badge bad">Em atraso</span>' : '<span class="badge warn">Lembrete</span>'} · ${brl(ch.amount)} · vence ${fmtDate(ch.due_date)}</p>
    <label>Mensagem (pode editar antes de enviar)</label>
    <textarea id="msg" style="min-height:170px">${h(text)}</textarea>
    ${!wa ? '<div class="hint" style="margin-top:10px">Este cliente não tem WhatsApp/telefone cadastrado.</div>' : ''}
    ${!ch.client_email ? '<p class="muted small">Sem e-mail cadastrado.</p>' : ''}
    <div class="modal-foot">
      <button class="btn secondary" id="n-copy">${I.copy} Copiar</button>
      ${ch.client_email ? `<button class="btn secondary" id="n-mail">${I.mail} E-mail</button>` : ''}
      ${wa ? `<button class="btn wa" id="n-wa">${I.wa} Enviar no WhatsApp</button>` : ''}
    </div>`);
  const mark = async () => { await api('POST', `/api/charges/${ch.id}/notified`).catch(() => {}); close(); after?.(); };
  $('#n-copy', el).onclick = async () => { await navigator.clipboard.writeText($('#msg', el).value); toast('Mensagem copiada!'); mark(); };
  $('#n-wa', el)?.addEventListener('click', () => { window.open(`https://wa.me/${wa}?text=${encodeURIComponent($('#msg', el).value)}`, '_blank', 'noopener'); mark(); });
  $('#n-mail', el)?.addEventListener('click', () => {
    const subject = `${ch.overdue ? 'Pagamento em aberto' : 'Lembrete de pagamento'} – ${monthLabel(ch.ref_month)}`;
    location.href = `mailto:${encodeURIComponent(ch.client_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent($('#msg', el).value)}`;
    mark();
  });
}
function payCharge(ch, after) {
  const { el, close } = modal('Registrar pagamento', `<form>
    <p class="muted">${h(ch.client_name)} · ${monthLabel(ch.ref_month)}</p>
    <div class="grid g2">
      ${field('date', 'Data do recebimento', todayStr(), 'date', 'required')}
      ${field('amount', 'Valor recebido (R$)', ch.amount, 'number', 'step="0.01" min="0" required')}
      <div class="field span2"><label>Onde recebeu</label><input name="method" list="methods" placeholder="Ex.: Pix Nubank, Itaú, dinheiro…" required></div>
    </div>
    ${methodsDatalist()}
    <p class="muted small">O valor entra automaticamente no Financeiro.</p>
    <div class="modal-foot"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Confirmar pagamento</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  onSubmit($('form', el), async d => { await api('POST', `/api/charges/${ch.id}/pay`, d); close(); toast('Pagamento registrado!'); after?.(); });
}
const methodsDatalist = () => `<datalist id="methods"><option>Pix</option><option>Transferência</option><option>Boleto</option><option>Cartão de crédito</option><option>Dinheiro</option></datalist>`;
function chargeStatus(ch) {
  if (ch.status === 'pago') return `<span class="badge ok">Pago ${fmtDate(ch.paid_at)}</span>`;
  if (ch.overdue) return '<span class="badge bad">Atrasado</span>';
  return '<span class="badge warn">Pendente</span>';
}
function chargeActions(ch, reload) {
  const div = document.createElement('div'); div.className = 'row-actions';
  if (ch.status !== 'pago') {
    const n = document.createElement('button'); n.className = 'btn wa sm'; n.innerHTML = `${I.wa} Notificar`; n.onclick = e => { e.stopPropagation(); notifyCharge(ch, reload); };
    div.append(n);
    if (can('cobrancas', 'edit')) {
      const p = document.createElement('button'); p.className = 'btn sm'; p.textContent = 'Recebido'; p.onclick = e => { e.stopPropagation(); payCharge(ch, reload); };
      div.append(p);
    }
  } else if (can('cobrancas', 'edit')) {
    const u = document.createElement('button'); u.className = 'btn ghost sm'; u.textContent = 'Desfazer';
    u.onclick = async () => { if (await confirmBox('Voltar esta cobrança para pendente? O lançamento no financeiro será removido.', 'Desfazer')) { await api('POST', `/api/charges/${ch.id}/unpay`).catch(fail); reload(); } };
    div.append(u);
  }
  if (can('cobrancas', 'edit')) {
    const e = document.createElement('button'); e.className = 'btn ghost sm'; e.textContent = 'Editar'; e.onclick = () => editCharge(ch, reload);
    div.append(e);
  }
  return div;
}
async function editCharge(ch, reload, presetClient) {
  const clients = ch ? [] : await api('GET', '/api/clients');
  const { el, close } = modal(ch ? 'Editar cobrança' : 'Nova cobrança', `<form><div class="grid g2">
      ${ch ? `<div class="field span2"><label>Cliente</label><input value="${h(ch.client_name)}" disabled></div>`
      : `<div class="field span2"><label>Cliente</label><select name="client_id" required>${clients.filter(c => c.active).map(c => `<option value="${c.id}" data-fee="${c.monthly_fee || ''}" ${presetClient == c.id ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select></div>`}
      ${field('amount', 'Valor (R$)', ch?.amount ?? '', 'number', 'step="0.01" min="0" required')}
      ${field('due_date', 'Vencimento', ch?.due_date ?? '', 'date', 'required')}
      ${field('ref_month', 'Mês de referência', ch?.ref_month ?? thisMonth(), 'month')}
      ${field('description', 'Descrição', ch?.description ?? 'Mensalidade')}
    </div>
    <div class="modal-foot">${ch ? '<button type="button" class="btn ghost" id="ch-del" style="margin-right:auto;color:var(--bad)">Excluir</button>' : ''}
      <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  const sel = $('select[name=client_id]', el);
  const fillFee = () => { const o = sel?.selectedOptions[0]; if (o?.dataset.fee && !$('[name=amount]', el).value) $('[name=amount]', el).value = o.dataset.fee; };
  sel?.addEventListener('change', () => { $('[name=amount]', el).value = ''; fillFee(); }); fillFee();
  $('#ch-del', el)?.addEventListener('click', async () => {
    if (await confirmBox('Excluir esta cobrança?')) { await api('DELETE', `/api/charges/${ch.id}`).catch(fail); close(); reload(); }
  });
  onSubmit($('form', el), async d => {
    if (ch) await api('PUT', `/api/charges/${ch.id}`, d); else await api('POST', '/api/charges', d);
    close(); toast('Cobrança salva!'); reload();
  });
}
function chargesTable(rows, reload, { showClient = true } = {}) {
  const wrap = document.createElement('div'); wrap.className = 'table-wrap';
  if (!rows.length) { wrap.innerHTML = '<div class="empty">Nenhuma cobrança.</div>'; return wrap; }
  wrap.innerHTML = `<table><thead><tr>${showClient ? '<th>Cliente</th>' : ''}<th>Referência</th><th>Vencimento</th><th class="r">Valor</th><th>Status</th><th>Notificado</th><th></th></tr></thead><tbody></tbody></table>`;
  const tb = $('tbody', wrap);
  for (const ch of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `${showClient ? `<td><a href="#/clientes/${ch.client_id}">${h(ch.client_name)}</a></td>` : ''}
      <td>${monthLabel(ch.ref_month)}<div class="muted small">${h(ch.description)}</div></td><td>${fmtDate(ch.due_date)}</td>
      <td class="r num">${brl(ch.amount)}</td><td>${chargeStatus(ch)}${ch.method ? `<div class="muted small">${h(ch.method)}</div>` : ''}</td>
      <td class="small muted">${ch.notified_at ? `${fmtDate(ch.notified_at)} (${ch.notify_count}x)` : '—'}</td><td></td>`;
    tr.lastElementChild.append(chargeActions(ch, reload));
    tb.append(tr);
  }
  return wrap;
}

// ---------- Painel ----------
async function viewDashboard(view) {
  const d = await api('GET', '/api/dashboard');
  const f = d.finance;
  view.innerHTML = `<div class="page-head"><div><h1>Olá, ${h(state.me.name.split(' ')[0])}!</h1><div class="muted">Resumo de ${monthLabel(d.month)}</div></div></div>
    <div class="stats">
      ${d.clients != null ? `<div class="stat"><div class="k">Clientes ativos</div><div class="v">${d.clients}</div></div>` : ''}
      ${f ? `<div class="stat"><div class="k">Recebido no mês</div><div class="v up">${brl(f.entradas)}</div></div>
             <div class="stat"><div class="k">Saídas no mês</div><div class="v down">${brl(f.saidas)}</div></div>
             <div class="stat"><div class="k">Saldo do mês</div><div class="v">${brl(f.entradas - f.saidas)}</div></div>` : ''}
      ${d.openTotal != null ? `<div class="stat"><div class="k">A receber (em aberto)</div><div class="v">${brl(d.openTotal)}</div></div>` : ''}
      ${d.leads ? `<div class="stat"><div class="k">Novos leads (Vizion)</div><div class="v">${n0(d.leads.novos)}</div><div class="d muted">${n0(d.leads.reunioes)} reunião(ões) · ${n0(d.leads.fechados)} fechado(s)</div></div>` : ''}
      ${d.metrics ? `<div class="stat"><div class="k">Leads dos clientes</div><div class="v">${n0(d.metrics.leads)}</div><div class="d muted">Tráfego: ${brl(d.metrics.ad_spend)}</div></div>` : ''}
    </div>
    ${d.nextMeetings?.length ? `<div class="card" style="margin-bottom:18px"><div class="card-head"><h2>Próximas reuniões</h2><a href="#/leads">Ver leads →</a></div>
      ${d.nextMeetings.map(l => `<div class="alert-row"><span><b>${h(l.name)}</b> <span class="muted small">${h(l.company || '')}</span></span><span class="badge accent">${fmtDate(l.meeting_date)}</span></div>`).join('')}</div>` : ''}
    ${d.overdue ? `<div class="two-col">
      <div class="card"><div class="card-head"><h2>Pagamentos atrasados</h2><span class="badge bad">${d.overdue.length}</span></div><div id="ov"></div></div>
      <div class="card"><div class="card-head"><h2>Vencendo nos próximos dias</h2><span class="badge warn">${d.upcoming.length}</span></div><div id="up"></div></div>
    </div>` : ''}
    ${!d.overdue && !f && !d.metrics ? '<div class="card"><p class="muted">Use o menu ao lado para acessar as áreas liberadas para você.</p></div>' : ''}`;
  const reload = () => viewDashboard(view);
  const list = (rows, el, empty) => {
    if (!rows.length) { el.innerHTML = `<div class="empty">${empty}</div>`; return; }
    for (const ch of rows) {
      const r = document.createElement('div'); r.className = 'alert-row';
      r.innerHTML = `<div><a href="#/clientes/${ch.client_id}"><b>${h(ch.client_name)}</b></a><div class="muted small">${brl(ch.amount)} · vence ${fmtDate(ch.due_date)}${ch.notified_at ? ` · avisado ${fmtDate(ch.notified_at)}` : ''}</div></div>`;
      r.append(chargeActions(ch, reload)); el.append(r);
    }
  };
  if (d.overdue) { list(d.overdue, $('#ov'), 'Nenhum pagamento atrasado 🎉'); list(d.upcoming, $('#up'), 'Nada vencendo nos próximos dias.'); }
}

// ---------- Clientes ----------
async function viewClients(view) {
  const clients = await api('GET', '/api/clients');
  const full = can('clientes');
  view.innerHTML = `<div class="page-head"><h1>Clientes</h1><div class="actions">
      <input class="search" id="q" placeholder="Buscar cliente…">
      <select id="flt" style="width:auto"><option value="1">Ativos</option><option value="0">Contrato finalizado</option><option value="">Todos</option></select>
      ${can('clientes', 'edit') ? '<button class="btn" id="new">+ Novo cliente</button>' : ''}</div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Cliente</th>${full ? '<th class="hide-sm">Contato</th><th class="hide-sm">Instagram</th><th class="r">Mensalidade</th>' : ''}<th>Status</th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
  const draw = () => {
    const q = $('#q').value.toLowerCase(), flt = $('#flt').value;
    const rows = clients.filter(c => (flt === '' || String(c.active) === flt) && (`${c.name} ${c.contractor_name || ''} ${c.segment || ''}`.toLowerCase().includes(q)));
    $('#tb').innerHTML = rows.length ? rows.map(c => `<tr class="click" data-id="${c.id}"><td><b>${h(c.name)}</b><div class="muted small">${h(c.contractor_name || c.segment || '')}</div></td>
      ${full ? `<td class="hide-sm">${h(c.phone || '')}<div class="muted small">${h(c.email || '')}</div></td><td class="hide-sm">${h(c.instagram || '')}</td><td class="r num">${c.monthly_fee ? brl(c.monthly_fee) : '—'}</td>` : ''}
      <td>${c.active ? '<span class="badge ok">Ativo</span>' : `<span class="badge neutral">Finalizado${c.end_date ? ' ' + fmtDate(c.end_date) : ''}</span>`}</td></tr>`).join('')
      : `<tr><td colspan="5" class="empty">${clients.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</td></tr>`;
    $$('#tb tr[data-id]').forEach(tr => tr.onclick = () => location.hash = `#/clientes/${tr.dataset.id}`);
  };
  $('#q').oninput = draw; $('#flt').onchange = draw; draw();
  $('#new')?.addEventListener('click', () => editClient(null, id => location.hash = `#/clientes/${id}`));
}
const SERVICES = ['OLX', 'Tráfego pago', 'TikTok', 'Instagram', 'Facebook'];
const parseServices = s => { try { return Array.isArray(s) ? s : JSON.parse(s || '[]'); } catch { return []; } };
const MAX_FILE = 10 * 1024 * 1024;
async function uploadContract(id, file) { await Backend.uploadContract(id, file); }
// abre a janela já no clique (para o navegador não bloquear) e depois carrega o link seguro
async function openContract(c, download = false) {
  const w = window.open('', '_blank');
  try { const url = await Backend.contractUrl(c, download); if (w) w.location = url; else location.href = url; }
  catch (e) { w?.close(); fail(e); }
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-contract]'); if (!a) return;
  e.preventDefault();
  const w = window.open('', '_blank');
  api('GET', `/api/clients/${a.dataset.contract}`)
    .then(c => Backend.contractUrl(c, a.dataset.download === '1'))
    .then(url => { if (w) w.location = url; else location.href = url; })
    .catch(err => { w?.close(); fail(err); });
});
function editClient(c, after) {
  c = c || { due_day: 10, active: 1 };
  const services = parseServices(c.services);
  const allServices = [...SERVICES, ...services.filter(s => !SERVICES.includes(s))];
  const { el, close } = modal(c.id ? 'Editar cliente' : 'Novo cliente', `<form><div class="grid g2">
      ${field('name', 'Nome do cliente/empresa *', c.name, 'text', 'required placeholder="Ex.: Luz Imóveis"')}
      ${field('segment', 'Segmento', c.segment, 'text', 'placeholder="Ex.: Imobiliário"')}
      ${field('contractor_name', 'Nome completo do contratante *', c.contractor_name, 'text', 'required placeholder="Nome de quem assinou o contrato"')}
      ${field('phone', 'Telefone / WhatsApp', c.phone, 'tel', 'placeholder="(27) 99999-9999"')}
      ${field('email', 'E-mail do contratante', c.email, 'email', 'placeholder="cliente@email.com"')}
      <div class="field"><label for="f-bday-d">Data de aniversário</label><div style="display:flex;gap:8px">
        <select id="f-bday-d" name="bday_d" aria-label="Dia do aniversário"><option value="">Dia</option>${Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => `<option value="${d}" ${(c.birthday || '').slice(-2) === d ? 'selected' : ''}>${+d}</option>`).join('')}</select>
        <select name="bday_m" aria-label="Mês do aniversário"><option value="">Mês</option>${MONTHS.map((m, i) => { const v = String(i + 1).padStart(2, '0'); return `<option value="${v}" ${(c.birthday || '').slice(-5, -3) === v ? 'selected' : ''}>${m}</option>`; }).join('')}</select>
      </div></div>
      ${field('start_date', 'Início do contrato', c.start_date, 'date')}
      <div class="field"><label for="f-due_day">Dia de vencimento mensal</label><select id="f-due_day" name="due_day">
        ${Array.from({ length: 31 }, (_, i) => i + 1).map(d => `<option value="${d}" ${+c.due_day === d ? 'selected' : ''}>Dia ${d}</option>`).join('')}</select></div>
      ${field('monthly_fee', 'Valor mensal (R$)', c.monthly_fee || '', 'number', 'step="0.01" min="0" placeholder="0,00"')}
      <div></div>
      <div class="span2">${field('instagram', 'Instagram / perfil principal', c.instagram, 'text', 'placeholder="@usuario ou link do perfil"')}</div>
    </div>
    <div class="field" style="margin-top:14px"><label>Plataformas e serviços contratados</label>
    <div class="chips">${allServices.map(s => `<label><input type="checkbox" name="svc" value="${h(s)}" ${services.includes(s) ? 'checked' : ''}> ${h(s)}</label>`).join('')}</div></div>
    <div class="field"><label for="f-contract">Contrato assinado (PDF, JPG ou PNG)</label>
      ${c.contract_file ? `<div class="file-current">📄 <a href="#" data-contract="${c.id}">${h(c.contract_name || 'Contrato')}</a> <span class="muted small">— envie outro arquivo para substituir</span></div>` : ''}
      <input id="f-contract" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png">
      <p class="muted small" style="margin:6px 0 0">Máximo 10 MB. Só quem tem acesso aos dados do cliente consegue abrir.</p></div>
    <label class="radio"><input type="checkbox" name="contract_received" ${c.contract_received ? 'checked' : ''}> Contrato assinado recebido</label>
    ${c.id ? `<h3 style="margin:18px 0 10px">Status do contrato</h3><div class="grid g3">
      <div class="field"><label for="f-cstatus">Status</label><select id="f-cstatus" name="cstatus">
        <option value="ativo" ${c.active ? 'selected' : ''}>Ativo</option><option value="finalizado" ${!c.active ? 'selected' : ''}>Contrato finalizado</option></select></div>
      <div class="end-f" ${c.active ? 'style="display:none"' : ''}>${field('end_date', 'Finalizado em', c.end_date || '', 'date')}</div>
      <div class="end-f" ${c.active ? 'style="display:none"' : ''}>${field('end_reason', 'Motivo da finalização', c.end_reason || '', 'text', 'placeholder="Ex.: fim do prazo, cortou custos…"')}</div>
    </div>` : ''}
    <div class="modal-foot"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`, { wide: true });
  $$('[data-close]', el).forEach(b => b.onclick = close);
  const cst = $('[name=cstatus]', el);
  cst?.addEventListener('change', () => {
    $$('.end-f', el).forEach(x => x.style.display = cst.value === 'finalizado' ? '' : 'none');
    if (cst.value === 'finalizado' && !$('[name=end_date]', el).value) $('[name=end_date]', el).value = todayStr();
  });
  const fileInput = $('#f-contract', el);
  fileInput.onchange = () => {
    const f = fileInput.files[0]; if (!f) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) { toast('Envie um arquivo PDF, JPG ou PNG.', true); fileInput.value = ''; }
    else if (f.size > MAX_FILE) { toast('Arquivo muito grande (máximo 10 MB).', true); fileInput.value = ''; }
    else $('[name=contract_received]', el).checked = true;
  };
  onSubmit($('form', el), async d => {
    d.services = $$('[name=svc]:checked', el).map(i => i.value);
    if (!!d.bday_d !== !!d.bday_m) throw new Error('Escolha o dia e o mês do aniversário.');
    d.birthday = d.bday_d ? `${d.bday_m}-${d.bday_d}` : '';
    d.active = !c.id || d.cstatus !== 'finalizado';
    if (d.active) { d.end_date = ''; d.end_reason = ''; }
    else if (!d.end_date) d.end_date = todayStr();
    const r = c.id ? await api('PUT', `/api/clients/${c.id}`, d) : await api('POST', '/api/clients', d);
    const id = c.id || r.id;
    const file = fileInput.files[0];
    if (file) {
      try { await uploadContract(id, file); }
      catch (e) { close(); toast(`Cliente salvo, mas o contrato não foi enviado: ${e.message}`, true); return after?.(id); }
    }
    close(); toast('Cliente salvo!'); after?.(id);
  });
}

async function viewClient(id, tab) {
  const view = $('#view');
  const c = await api('GET', `/api/clients/${id}`);
  const tabs = [];
  if (can('clientes')) tabs.push(['dados', 'Dados do cliente']);
  if (can('metricas')) tabs.push(['metricas', 'Métricas mensais']);
  if (can('acessos')) tabs.push(['acessos', 'Acessos']);
  if (can('cobrancas')) tabs.push(['cobrancas', 'Cobranças']);
  tab = tabs.find(t => t[0] === tab) ? tab : tabs[0]?.[0];
  view.innerHTML = `<div class="page-head"><div><a href="#/clientes" class="small">← Clientes</a><h1>${h(c.name)}</h1>
      ${c.company ? `<div class="muted">${h(c.company)}</div>` : ''}</div>
      <div class="actions">${can('clientes', 'edit') && tab === 'dados' ? '<button class="btn secondary" id="edit">Editar dados</button>' : ''}
      ${isAdmin() && tab === 'dados' ? '<button class="btn ghost" id="del" style="color:var(--bad)">Excluir</button>' : ''}</div></div>
    <div class="tabs">${tabs.map(([k, l]) => `<a href="#/clientes/${id}/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`).join('')}</div>
    <div id="tab"></div>`;
  $('#edit')?.addEventListener('click', () => editClient(c, () => viewClient(id, tab)));
  $('#del')?.addEventListener('click', async () => {
    if (await confirmBox(`Excluir ${c.name}? Métricas, acessos e cobranças deste cliente serão apagados.`)) {
      await api('DELETE', `/api/clients/${id}`).catch(fail); location.hash = '#/clientes';
    }
  });
  const box = $('#tab');
  if (tab === 'dados') tabData(box, c);
  else if (tab === 'metricas') await tabMetrics(box, c);
  else if (tab === 'acessos') await tabAccess(box, c);
  else if (tab === 'cobrancas') await tabCharges(box, c);
}
function tabData(box, c) {
  const item = (k, v) => `<div><div class="k">${k}</div><div class="v">${v || '<span class="muted">—</span>'}</div></div>`;
  const wa = waNumber(c.phone);
  const services = parseServices(c.services);
  const ig = c.instagram || '';
  const igUrl = /^https?:\/\//i.test(ig) ? ig : `https://instagram.com/${ig.replace(/^@/, '')}`;
  box.innerHTML = `<div class="card"><div class="info-list">
    ${item('Cliente / empresa', h(c.name))}${item('Segmento', h(c.segment))}
    ${item('Contratante', h(c.contractor_name))}
    ${item('Telefone / WhatsApp', c.phone ? `${h(c.phone)}${wa ? ` · <a href="https://wa.me/${wa}" target="_blank" rel="noopener">abrir</a>` : ''}` : '')}
    ${item('E-mail do contratante', c.email ? `<a href="mailto:${h(c.email)}">${h(c.email)}</a>` : '')}
    ${item('Aniversário', c.birthday ? `${+c.birthday.slice(-2)} de ${MONTHS[+c.birthday.slice(-5, -3) - 1]}` + (c.birthday.slice(-5, -3) === todayStr().slice(5, 7) ? ' 🎂 este mês' : '') : '')}
    ${item('Início do contrato', fmtDate(c.start_date))}
    ${item('Valor mensal', c.monthly_fee ? brl(c.monthly_fee) : '')}${item('Vencimento', c.due_day ? `Todo dia ${c.due_day}` : '')}
    ${item('Instagram / perfil', ig ? `<a href="${h(igUrl)}" target="_blank" rel="noopener">${h(ig)}</a>` : '')}
    ${item('Serviços contratados', services.map(s => `<span class="badge accent">${h(s)}</span>`).join(' '))}
    ${item('Contrato assinado', (c.contract_received ? '<span class="badge ok">Recebido</span>' : '<span class="badge warn">Pendente</span>')
      + (c.contract_file ? ` <a href="#" data-contract="${c.id}">abrir</a> · <a href="#" data-contract="${c.id}" data-download="1">baixar</a>` : ''))}
    ${c.company ? item('Empresa / marca', h(c.company)) : ''}${c.document ? item('CPF / CNPJ', h(c.document)) : ''}${c.address ? item('Endereço', h(c.address)) : ''}
    ${item('Status do contrato', c.active ? '<span class="badge ok">Ativo</span>'
      : `<span class="badge neutral">Contrato finalizado${c.end_date ? ' em ' + fmtDate(c.end_date) : ''}</span>${c.end_reason ? `<div class="muted small">Motivo: ${h(c.end_reason)}</div>` : ''}`)}
  </div>${c.notes ? `<div style="margin-top:18px"><div class="muted small" style="font-weight:600">Observações</div><div style="white-space:pre-wrap">${h(c.notes)}</div></div>` : ''}</div>`;
}

const METRIC_FIELDS = [
  ['views', 'Visualizações'], ['followers', 'Seguidores'], ['profile_visits', 'Visitas ao perfil'],
  ['link_clicks', 'Toques no link da bio'], ['interactions', 'Interações'], ['leads', 'Leads'],
  ['ad_results', 'Resultados de anúncios'], ['ad_spend', 'Investido em tráfego'],
];
const RESULT_TYPES = ['Leads', 'Mensagens', 'Cliques no link', 'Conversões', 'Visitas ao perfil', 'Alcance', 'Outro'];
async function tabMetrics(box, c) {
  const rows = await api('GET', `/api/clients/${c.id}/metrics`);
  const edit = can('metricas', 'edit');
  const last = rows[0], prev = rows[1];
  const fmt = (k, v) => (k === 'ad_spend' ? brl(v) : n0(v));
  const delta = k => {
    if (!last || !prev || prev.month !== shiftMonth(last.month, -1)) return '';
    const p = pct(last[k], prev[k]); if (p == null) return '';
    const good = k === 'ad_spend' ? null : p >= 0;
    return `<div class="d ${good == null ? 'muted' : good ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(1).replace('.', ',')}% vs mês anterior</div>`;
  };
  box.innerHTML = `
    ${last ? `<div class="muted" style="margin-bottom:10px">Último mês lançado: <b>${monthLabel(last.month)}</b></div>
    <div class="stats">${METRIC_FIELDS.map(([k, l]) => `<div class="stat"><div class="k">${l}</div><div class="v">${fmt(k, last[k])}</div>${delta(k)}</div>`).join('')}
      <div class="stat"><div class="k">Custo por lead</div><div class="v">${last.leads ? brl(last.ad_spend / last.leads) : '—'}</div></div></div>` : ''}
    <div class="card"><div class="card-head"><h2>Evolução</h2>
      <select id="chart-k" style="width:auto">${METRIC_FIELDS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div id="chart">${rows.length ? '' : '<div class="empty">Lance o primeiro mês para ver o gráfico.</div>'}</div></div>
    <div class="card"><div class="card-head"><h2>Histórico mensal</h2>${edit ? '<button class="btn" id="add">+ Lançar mês</button>' : ''}</div>
      <div class="table-wrap"><table><thead><tr><th>Mês</th>${METRIC_FIELDS.map(([, l]) => `<th class="r">${l}</th>`).join('')}<th class="r">Custo/lead</th>${edit ? '<th></th>' : ''}</tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr><td><b>${monthLabel(r.month)}</b>${r.notes ? `<div class="muted small">${h(r.notes)}</div>` : ''}</td>
        ${METRIC_FIELDS.map(([k]) => `<td class="r num">${fmt(k, r[k])}</td>`).join('')}<td class="r num">${r.leads ? brl(r.ad_spend / r.leads) : '—'}</td>
        ${edit ? `<td class="r"><button class="btn ghost sm" data-edit="${r.month}">Editar</button></td>` : ''}</tr>`).join('')
        : `<tr><td colspan="12" class="empty">Nenhum mês lançado.</td></tr>`}</tbody></table></div></div>`;
  const reload = () => tabMetrics(box, c);
  $('#add')?.addEventListener('click', () => editMetrics(c, null, rows, reload));
  $$('[data-edit]', box).forEach(b => b.onclick = () => editMetrics(c, rows.find(r => r.month === b.dataset.edit), rows, reload));
  if (rows.length) {
    const draw = () => { $('#chart').innerHTML = barChart([...rows].reverse().slice(-12), $('#chart-k').value); };
    $('#chart-k').onchange = draw; draw();
  }
}
function barChart(rows, key) {
  const W = 760, H = 220, pad = { l: 8, r: 8, t: 22, b: 26 };
  const max = Math.max(1, ...rows.map(r => r[key]));
  const bw = (W - pad.l - pad.r) / rows.length;
  const bar = Math.min(48, bw * 0.6);
  const fmt = v => key === 'ad_spend' ? brl(v).replace(',00', '') : n0(v);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}" stroke="var(--border)"/>
    ${rows.map((r, i) => {
      const x = pad.l + i * bw + (bw - bar) / 2;
      const bh = ((H - pad.t - pad.b) * r[key]) / max;
      const y = H - pad.b - bh;
      return `<rect x="${x}" y="${y}" width="${bar}" height="${Math.max(bh, 1)}" rx="5" fill="var(--accent)" opacity="${i === rows.length - 1 ? 1 : 0.55}"><title>${monthLabel(r.month)}: ${fmt(r[key])}</title></rect>
        <text x="${x + bar / 2}" y="${y - 6}" text-anchor="middle">${fmt(r[key])}</text>
        <text x="${x + bar / 2}" y="${H - 8}" text-anchor="middle">${monthShort(r.month)}</text>`;
    }).join('')}</svg>`;
}
function editMetrics(c, r, rows, reload) {
  const month = r?.month || (rows[0] ? shiftMonth(rows[0].month, 1) : thisMonth());
  const { el, close } = modal(r ? `Métricas de ${monthLabel(r.month)}` : 'Lançar métricas do mês', `<form>
    <div class="grid g2">
      ${field('month', 'Mês', month, 'month', `required ${r ? 'readonly' : ''}`)}<div></div>
      ${METRIC_FIELDS.map(([k, l]) => field(k, k === 'ad_spend' ? 'Investido em impulsionamento/tráfego (R$)' : k === 'followers' ? 'Seguidores (total no fim do mês)' : k === 'leads' ? 'Leads que o cliente recebeu no mês' : l, r?.[k] ?? '', 'number', `min="0" step="${k === 'ad_spend' ? '0.01' : '1'}"`)).join('')}
      <div class="field"><label>Tipo de resultado dos anúncios</label><select name="result_type">${RESULT_TYPES.map(t => `<option ${(r?.result_type || 'Leads') === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      ${field('notes', 'Observações do mês', r?.notes ?? '', 'textarea', 'span2')}
    </div>
    ${!r ? '<p class="muted small">Se o mês já existir, os valores serão atualizados.</p>' : ''}
    <div class="modal-foot">${r ? '<button type="button" class="btn ghost" id="m-del" style="margin-right:auto;color:var(--bad)">Excluir mês</button>' : ''}
      <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  $('#m-del', el)?.addEventListener('click', async () => {
    if (await confirmBox(`Excluir as métricas de ${monthLabel(r.month)}?`)) { await api('DELETE', `/api/metrics/${r.id}`).catch(fail); close(); reload(); }
  });
  onSubmit($('form', el), async d => { await api('PUT', `/api/clients/${c.id}/metrics/${d.month}`, d); close(); toast('Métricas salvas!'); reload(); });
}

async function tabAccess(box, c) {
  const rows = await api('GET', `/api/clients/${c.id}/access`);
  const edit = can('acessos', 'edit');
  box.innerHTML = `<div class="card"><div class="card-head"><div><h2>Acessos do cliente</h2><div class="muted small">Senhas guardadas com criptografia. Só quem tem permissão de "Acessos" consegue ver.</div></div>
    ${edit ? '<button class="btn" id="add">+ Novo acesso</button>' : ''}</div>
    <div class="table-wrap"><table><thead><tr><th>Plataforma</th><th>Login</th><th>Senha</th><th>Observações</th>${edit ? '<th></th>' : ''}</tr></thead><tbody>
    ${rows.length ? rows.map(a => `<tr><td><b>${h(a.platform)}</b></td>
      <td>${h(a.login)} ${a.login ? `<button class="btn ghost sm" data-copy="${h(a.login)}" title="Copiar">${I.copy}</button>` : ''}</td>
      <td><span class="secret" data-secret="${h(a.password)}">${a.password ? '••••••••' : '—'}</span>
        ${a.password ? `<button class="btn ghost sm" data-show title="Mostrar">${I.eye}</button><button class="btn ghost sm" data-copy="${h(a.password)}" title="Copiar">${I.copy}</button>` : ''}</td>
      <td class="small">${h(a.notes)}</td>${edit ? `<td class="r"><button class="btn ghost sm" data-edit="${a.id}">Editar</button></td>` : ''}</tr>`).join('')
      : `<tr><td colspan="5" class="empty">Nenhum acesso cadastrado.</td></tr>`}</tbody></table></div></div>`;
  const reload = () => tabAccess(box, c);
  $$('[data-show]', box).forEach(b => b.onclick = () => { const s = b.previousElementSibling; s.textContent = s.textContent.startsWith('•') ? s.dataset.secret : '••••••••'; });
  $$('[data-copy]', box).forEach(b => b.onclick = async () => { await navigator.clipboard.writeText(b.dataset.copy); toast('Copiado!'); });
  $('#add')?.addEventListener('click', () => editAccess(c, null, reload));
  $$('[data-edit]', box).forEach(b => b.onclick = () => editAccess(c, rows.find(a => a.id == b.dataset.edit), reload));
}
function editAccess(c, a, reload) {
  const { el, close } = modal(a ? 'Editar acesso' : 'Novo acesso', `<form><div class="grid g2">
    <div class="field"><label>Plataforma *</label><input name="platform" list="plats" value="${h(a?.platform)}" required placeholder="Instagram, Facebook Ads…"></div>
    ${field('login', 'Login / usuário / e-mail', a?.login)}
    ${field('password', 'Senha', a?.password, 'text', 'autocomplete="off"')}
    ${field('notes', 'Observações (2FA, quem recebe o código…)', a?.notes)}
    </div><datalist id="plats"><option>Instagram</option><option>Facebook</option><option>Meta Business / Gerenciador de Anúncios</option><option>TikTok</option><option>Google Ads</option><option>Google Meu Negócio</option><option>YouTube</option><option>Site / Hospedagem</option><option>E-mail</option></datalist>
    <div class="modal-foot">${a ? '<button type="button" class="btn ghost" id="a-del" style="margin-right:auto;color:var(--bad)">Excluir</button>' : ''}
    <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  $('#a-del', el)?.addEventListener('click', async () => { if (await confirmBox('Excluir este acesso?')) { await api('DELETE', `/api/access/${a.id}`).catch(fail); close(); reload(); } });
  onSubmit($('form', el), async d => {
    if (a) await api('PUT', `/api/access/${a.id}`, d); else await api('POST', `/api/clients/${c.id}/access`, d);
    close(); toast('Acesso salvo!'); reload();
  });
}
async function tabCharges(box, c) {
  const rows = await api('GET', `/api/charges?client=${c.id}`);
  const reload = () => tabCharges(box, c);
  box.innerHTML = `<div class="card"><div class="card-head"><h2>Cobranças</h2>${can('cobrancas', 'edit') ? '<button class="btn" id="add">+ Nova cobrança</button>' : ''}</div><div id="tbl"></div></div>`;
  $('#tbl').append(chargesTable([...rows].reverse(), reload, { showClient: false }));
  $('#add')?.addEventListener('click', () => editCharge(null, reload, c.id));
}

// ---------- Cobranças ----------
async function viewCharges(view, month) {
  month = month || view.dataset.month || thisMonth();
  view.dataset.month = month;
  const rows = await api('GET', `/api/charges?month=${month}`);
  const reload = () => viewCharges(view, month);
  const open = rows.filter(r => r.status !== 'pago'), paid = rows.filter(r => r.status === 'pago');
  const sum = a => a.reduce((s, r) => s + r.amount, 0);
  view.innerHTML = `<div class="page-head"><div><h1>Cobranças</h1><div class="muted">Controle de mensalidades e avisos de pagamento</div></div>
    <div class="actions"><button class="btn secondary sm" id="prev">‹</button><input type="month" id="m" value="${month}" style="width:auto"><button class="btn secondary sm" id="next">›</button>
    ${can('cobrancas', 'edit') ? `<button class="btn secondary" id="gen">Gerar mensalidades de ${monthLabel(month)}</button><button class="btn" id="add">+ Nova cobrança</button>` : ''}</div></div>
    <div class="stats">
      <div class="stat"><div class="k">Previsto</div><div class="v">${brl(sum(rows.filter(r => r.ref_month === month)))}</div></div>
      <div class="stat"><div class="k">Recebido</div><div class="v up">${brl(sum(paid))}</div><div class="d muted">${paid.length} pagamento(s)</div></div>
      <div class="stat"><div class="k">Em aberto</div><div class="v">${brl(sum(open))}</div><div class="d muted">${open.length} cobrança(s)</div></div>
      <div class="stat"><div class="k">Atrasado</div><div class="v down">${brl(sum(open.filter(r => r.overdue)))}</div></div>
    </div>
    <div class="hint">💬 Clique em <b>Notificar</b> para enviar o lembrete pronto pelo WhatsApp ou e-mail. O texto é configurado em <b>Configurações</b>. Atrasos de meses anteriores também aparecem aqui.</div>
    <div class="card" id="tbl"></div>`;
  $('#tbl').append(chargesTable(rows, reload));
  $('#m').onchange = e => viewCharges(view, e.target.value);
  $('#prev').onclick = () => viewCharges(view, shiftMonth(month, -1));
  $('#next').onclick = () => viewCharges(view, shiftMonth(month, 1));
  $('#add')?.addEventListener('click', () => editCharge(null, reload));
  $('#gen')?.addEventListener('click', async () => {
    try { const r = await api('POST', '/api/charges/generate', { month }); toast(r.created ? `${r.created} cobrança(s) criada(s)!` : 'Nenhuma nova cobrança: todas já existem ou os clientes não têm mensalidade cadastrada.'); reload(); } catch (e) { fail(e); }
  });
}

// ---------- Financeiro ----------
async function viewFinance(view, month) {
  month = month || view.dataset.fmonth || thisMonth();
  view.dataset.fmonth = month;
  const { rows, history } = await api('GET', `/api/finance?month=${month}`);
  const edit = can('financeiro', 'edit');
  const ent = rows.filter(r => r.type === 'entrada').reduce((s, r) => s + r.amount, 0);
  const sai = rows.filter(r => r.type === 'saida').reduce((s, r) => s + r.amount, 0);
  const byMethod = {};
  rows.filter(r => r.type === 'entrada').forEach(r => { const k = r.method || 'Não informado'; byMethod[k] = (byMethod[k] || 0) + r.amount; });
  view.innerHTML = `<div class="page-head"><div><h1>Financeiro</h1><div class="muted">Balanço de ${monthLabel(month)}</div></div>
    <div class="actions"><button class="btn secondary sm" id="prev">‹</button><input type="month" id="m" value="${month}" style="width:auto"><button class="btn secondary sm" id="next">›</button>
    ${edit ? '<button class="btn secondary" id="out">+ Saída</button><button class="btn" id="in">+ Recebimento</button>' : ''}</div></div>
    <div class="stats">
      <div class="stat"><div class="k">Entradas</div><div class="v up">${brl(ent)}</div></div>
      <div class="stat"><div class="k">Saídas</div><div class="v down">${brl(sai)}</div></div>
      <div class="stat"><div class="k">Saldo</div><div class="v">${brl(ent - sai)}</div></div>
    </div>
    <div class="two-col" style="margin-bottom:18px">
      <div class="card"><h2 style="margin-bottom:12px">Onde recebi</h2>${Object.keys(byMethod).length ? Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
        `<div class="alert-row"><span>${h(k)}</span><b class="num">${brl(v)}</b></div>`).join('') : '<div class="empty">Sem recebimentos no mês.</div>'}</div>
      <div class="card"><h2 style="margin-bottom:12px">Últimos meses</h2>${history.length ? `<div class="table-wrap"><table><thead><tr><th>Mês</th><th class="r">Entradas</th><th class="r">Saídas</th><th class="r">Saldo</th></tr></thead><tbody>
        ${history.slice().reverse().map(m => `<tr><td>${monthLabel(m.month)}</td><td class="r num up">${brl(m.entradas)}</td><td class="r num down">${brl(m.saidas)}</td><td class="r num"><b>${brl(m.entradas - m.saidas)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sem histórico.</div>'}</div>
    </div>
    <div class="card"><div class="card-head"><h2>Lançamentos</h2></div><div class="table-wrap"><table><thead><tr><th>Data</th><th>Contato / cliente</th><th>Onde</th><th>Descrição</th><th class="r">Valor</th>${edit ? '<th></th>' : ''}</tr></thead><tbody>
      ${rows.length ? rows.map(r => `<tr><td>${fmtDate(r.date)}</td><td>${r.client_id ? `<a href="#/clientes/${r.client_id}">${h(r.client_name || r.contact)}</a>` : h(r.contact)}</td>
        <td>${h(r.method)}</td><td class="small">${h(r.description)}${r.charge_id ? ' <span class="badge accent">cobrança</span>' : ''}</td>
        <td class="r num ${r.type === 'entrada' ? 'up' : 'down'}"><b>${r.type === 'entrada' ? '+' : '−'} ${brl(r.amount)}</b></td>
        ${edit ? `<td class="r"><button class="btn ghost sm" data-edit="${r.id}">Editar</button></td>` : ''}</tr>`).join('')
        : `<tr><td colspan="6" class="empty">Nenhum lançamento em ${monthLabel(month)}.</td></tr>`}</tbody></table></div></div>`;
  const reload = () => viewFinance(view, month);
  $('#m').onchange = e => viewFinance(view, e.target.value);
  $('#prev').onclick = () => viewFinance(view, shiftMonth(month, -1));
  $('#next').onclick = () => viewFinance(view, shiftMonth(month, 1));
  $('#in')?.addEventListener('click', () => editFinance({ type: 'entrada' }, reload));
  $('#out')?.addEventListener('click', () => editFinance({ type: 'saida' }, reload));
  $$('[data-edit]', view).forEach(b => b.onclick = () => editFinance(rows.find(r => r.id == b.dataset.edit), reload));
}
async function editFinance(f, reload) {
  const clients = await api('GET', '/api/clients').catch(() => []);
  const isIn = f.type === 'entrada';
  const { el, close } = modal(f.id ? 'Editar lançamento' : isIn ? 'Novo recebimento' : 'Nova saída', `<form><div class="grid g2">
    <div class="field span2"><label class="radio"><input type="radio" name="type" value="entrada" ${isIn ? 'checked' : ''}> Entrada (recebi)</label>
      <label class="radio"><input type="radio" name="type" value="saida" ${!isIn ? 'checked' : ''}> Saída (paguei)</label></div>
    ${field('date', 'Data', f.date || todayStr(), 'date', 'required')}
    ${field('amount', 'Valor (R$)', f.amount ?? '', 'number', 'step="0.01" min="0" required')}
    <div class="field"><label>Cliente (opcional)</label><select name="client_id"><option value="">— Nenhum —</option>
      ${clients.map(c => `<option value="${c.id}" ${f.client_id == c.id ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select></div>
    ${field('contact', 'Contato / de quem / para quem', f.contact)}
    <div class="field"><label>Onde recebeu / pagou</label><input name="method" list="methods" value="${h(f.method)}" placeholder="Pix Nubank, Itaú…"></div>
    ${field('description', 'Descrição', f.description)}
    </div>${methodsDatalist()}
    <div class="modal-foot">${f.id ? '<button type="button" class="btn ghost" id="f-del" style="margin-right:auto;color:var(--bad)">Excluir</button>' : ''}
    <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  const sel = $('[name=client_id]', el), contact = $('[name=contact]', el);
  sel.onchange = () => { if (sel.value && !contact.value) contact.value = sel.selectedOptions[0].textContent; };
  $('#f-del', el)?.addEventListener('click', async () => {
    if (await confirmBox(f.charge_id ? 'Excluir este lançamento? A cobrança ligada a ele voltará para "pendente".' : 'Excluir este lançamento?')) { await api('DELETE', `/api/finance/${f.id}`).catch(fail); close(); reload(); }
  });
  onSubmit($('form', el), async d => {
    if (f.id) await api('PUT', `/api/finance/${f.id}`, d); else await api('POST', '/api/finance', d);
    close(); toast('Lançamento salvo!'); reload();
  });
}

// ---------- Resultados ----------
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const monthBounds = m => [`${m}-01`, `${m}-${String(new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate()).padStart(2, '0')}`];
const costPer = (spend, n) => (spend && n ? brl(spend / n) : '—');

async function viewResults(view) {
  const clients = await api('GET', '/api/clients');
  const st = view._rs || (view._rs = { preset: 30, client: '', from: addDays(todayStr(), -29), to: todayStr() });
  if (st.preset) { st.to = todayStr(); st.from = addDays(st.to, -(st.preset - 1)); }
  const q = new URLSearchParams({ from: st.from, to: st.to, ...(st.client ? { client: st.client } : {}) });
  const r = await api('GET', `/api/results?${q}`);
  const t = r.totals;
  const resultTypes = [...new Set(r.clients.flatMap(c => c.result_types))];
  const resultLabel = resultTypes.length === 1 ? resultTypes[0].toLowerCase() : 'resultado';
  view.innerHTML = `<div class="page-head"><div><h1>Desempenho e investimento</h1><div class="muted">Informe resultados manualmente e filtre por período.</div></div>
    <div class="actions"><select id="r-client" style="width:auto"><option value="">Todas as contas</option>${clients.map(c => `<option value="${c.id}" ${st.client == c.id ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select>
    ${can('metricas', 'edit') ? '<button class="btn" id="r-add">+ Lançar resultados</button>' : ''}
    <button class="btn secondary" id="r-pdf">⇩ Gerar relatório PDF do mês</button></div></div>
    <div class="card"><h2>Período de análise</h2><div class="muted" style="margin-bottom:12px">Filtre os registros pela data ou mês informado.</div>
      <div class="toolbar">${[30, 60, 90].map(n => `<button class="btn ${st.preset === n ? '' : 'secondary'}" data-preset="${n}">${n} dias</button>`).join('')}
        <button class="btn ${st.preset ? 'secondary' : ''}" data-preset="0">Personalizado</button>
        ${!st.preset ? `<input type="date" id="r-from" value="${st.from}"><span class="muted">até</span><input type="date" id="r-to" value="${st.to}"><button class="btn sm" id="r-apply">Aplicar</button>` : ''}</div></div>
    <p class="muted small" style="margin:14px 0">Período: ${fmtDate(r.from)} a ${fmtDate(r.to)} · Os relatórios são registros por mês, então o filtro considera os meses que se sobrepõem ao intervalo (${monthLabel(r.months_range[0])}${r.months_range[0] !== r.months_range[1] ? ' a ' + monthLabel(r.months_range[1]) : ''}).</p>
    <div class="stats">
      <div class="stat"><div class="stat-ico">◉</div><div class="k">Visualizações</div><div class="v">${n0(t.views)}</div><div class="d muted">Dados lançados manualmente</div></div>
      <div class="stat"><div class="stat-ico">↗</div><div class="k">Novos seguidores</div><div class="v ${t.new_followers < 0 ? 'down' : ''}">${t.new_followers > 0 ? '+' : ''}${n0(t.new_followers)}</div><div class="d muted">Variação dos relatórios</div></div>
      <div class="stat"><div class="stat-ico">♡</div><div class="k">Interações</div><div class="v">${n0(t.interactions)}</div><div class="d muted">Interações registradas</div></div>
      <div class="stat"><div class="stat-ico">✉</div><div class="k">Leads recebidos</div><div class="v">${n0(t.leads)}</div><div class="d muted">Custo por lead: ${costPer(t.ad_spend, t.leads)}</div></div>
      <div class="stat"><div class="stat-ico">R$</div><div class="k">Valor investido</div><div class="v">${brl(t.ad_spend)}</div><div class="d muted">Custo por resultado: ${costPer(t.ad_spend, t.ad_results)}</div></div>
    </div>
    <div class="card"><h2>Resultados de anúncios</h2><div class="muted" style="margin-bottom:10px">Leads, mensagens, cliques ou outro resultado escolhido.</div>
      <div class="alert-row"><div><b>Total de resultados recebidos</b><div class="muted small">Somatório das campanhas do período${resultTypes.length ? ' · ' + resultTypes.map(h).join(', ') : ''}</div></div><b class="num" style="font-size:18px">${n0(t.ad_results)}</b></div>
      <div class="alert-row"><div><b>Custo por ${h(resultLabel)}</b><div class="muted small">Valor investido ÷ resultados</div></div><b class="num">${costPer(t.ad_spend, t.ad_results)}</b></div>
      <div class="alert-row"><div><b>Leads</b><div class="muted small">Leads que os clientes receberam no período · custo por lead ${costPer(t.ad_spend, t.leads)}</div></div><b class="num">${n0(t.leads)}</b></div>
      <div class="alert-row"><div><b>Visitas ao perfil · toques no link da bio</b></div><b class="num">${n0(t.profile_visits)} · ${n0(t.link_clicks)}</b></div></div>
    <div class="two-col" style="margin-top:18px">
      <div class="card"><div class="card-head"><h2>Evolução mensal</h2><select id="r-k" style="width:auto">${[['views', 'Visualizações'], ['interactions', 'Interações'], ['ad_results', 'Resultados'], ['ad_spend', 'Investimento'], ['leads', 'Leads']].map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
        <div id="r-chart">${r.monthly.length ? '' : '<div class="empty">Nenhum relatório lançado nesse período.</div>'}</div></div>
      <div class="card"><h2 style="margin-bottom:10px">Por conta</h2>${r.clients.length ? `<div class="table-wrap"><table><thead><tr><th>Conta</th><th class="r">Visualiz.</th><th class="r">Seguidores</th><th class="r">Resultados</th><th class="r">Investido</th><th class="r">Custo/res.</th></tr></thead><tbody>
        ${r.clients.map(c => `<tr><td><a href="#/clientes/${c.client_id}/metricas">${h(c.client_name)}</a></td><td class="r num">${n0(c.views)}</td><td class="r num">${c.new_followers > 0 ? '+' : ''}${n0(c.new_followers)}</td><td class="r num">${n0(c.ad_results)}</td><td class="r num">${brl(c.ad_spend)}</td><td class="r num">${costPer(c.ad_spend, c.ad_results)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Sem dados no período.</div>'}</div>
    </div>
    <div class="card" style="margin-top:18px"><div class="card-head"><h2>Lançamentos do período</h2>${can('metricas', 'edit') ? '<button class="btn secondary sm" id="r-add2">+ Lançar resultados</button>' : ''}</div>
      ${r.rows.length ? `<div class="table-wrap"><table><thead><tr><th>Conta</th><th>Mês</th><th class="r">Visualiz.</th><th class="r">Seguidores</th><th class="r">Interações</th><th class="r">Resultados</th><th class="r">Investido</th>${can('metricas', 'edit') ? '<th></th>' : ''}</tr></thead><tbody>
        ${r.rows.slice().reverse().map(m => `<tr><td>${h(m.client_name)}</td><td>${monthLabel(m.month)}</td><td class="r num">${n0(m.views)}</td><td class="r num">${n0(m.followers)}</td><td class="r num">${n0(m.interactions)}</td>
          <td class="r num">${n0(m.ad_results)}${m.ad_results ? ` <span class="muted small">${h(m.result_type)}</span>` : ''}</td><td class="r num">${brl(m.ad_spend)}</td>
          ${can('metricas', 'edit') ? `<td class="r"><button class="btn ghost sm" data-redit="${m.id}">Editar</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`
        : '<div class="empty">Nenhum resultado lançado nesse período. Clique em <b>+ Lançar resultados</b> para informar os números do mês.</div>'}</div>`;
  const reload = () => viewResults(view);
  ['#r-add', '#r-add2'].forEach(id => $(id)?.addEventListener('click', () => launchResults(clients, st.client, null, reload)));
  $$('[data-redit]', view).forEach(b => b.onclick = () => launchResults(clients, null, r.rows.find(m => m.id == b.dataset.redit), reload));
  $$('[data-preset]', view).forEach(b => b.onclick = () => { st.preset = +b.dataset.preset; reload(); });
  $('#r-apply')?.addEventListener('click', () => { st.from = $('#r-from').value; st.to = $('#r-to').value; reload(); });
  $('#r-client').onchange = e => { st.client = e.target.value; reload(); };
  $('#r-pdf').onclick = () => pickReport(clients, st.client);
  if (r.monthly.length) { const draw = () => { $('#r-chart').innerHTML = barChart(r.monthly, $('#r-k').value); }; $('#r-k').onchange = draw; draw(); }
}
// Lançar/editar os números de um cliente num mês, direto da página Resultados
function launchResults(clients, preClient, existing, reload) {
  const active = clients.filter(c => c.active || c.id == existing?.client_id);
  if (!active.length) return toast('Cadastre um cliente primeiro.', true);
  const label = k => METRIC_FIELDS.find(f => f[0] === k)[1];
  const numField = k => field(k, k === 'ad_spend' ? 'Valor investido em tráfego/impulsionamento (R$)' : k === 'followers' ? 'Seguidores (total no fim do mês)' : k === 'leads' ? 'Leads que o cliente recebeu no mês' : label(k), existing?.[k] ?? '', 'number', `min="0" step="${k === 'ad_spend' ? '0.01' : '1'}" placeholder="0"`);
  const { el, close } = modal(existing ? `Resultados de ${existing.client_name} — ${monthLabel(existing.month)}` : 'Lançar resultados', `<form><div class="grid g2">
      <div class="field"><label>Conta *</label><select name="client_id" required ${existing ? 'disabled' : ''}>${active.map(c => `<option value="${c.id}" ${(existing?.client_id ?? preClient) == c.id ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select></div>
      ${field('month', 'Mês *', existing?.month || thisMonth(), 'month', `required ${existing ? 'readonly' : ''}`)}
    </div>
    <p class="muted small" id="lr-status" style="margin:4px 0 0"></p>
    <h3 style="margin:16px 0 10px">Leads</h3>
    <div class="grid g2">${numField('leads')}<div></div></div>
    <h3 style="margin:16px 0 10px">Orgânico (perfil)</h3>
    <div class="grid g2">${['views', 'followers', 'interactions', 'profile_visits', 'link_clicks'].map(numField).join('')}</div>
    <h3 style="margin:16px 0 10px">Anúncios (tráfego / impulsionamento)</h3>
    <div class="grid g2">
      ${numField('ad_spend')}
      ${numField('ad_results')}
      <div class="field"><label>Tipo de resultado</label><select name="result_type">${RESULT_TYPES.map(t => `<option ${(existing?.result_type || 'Leads') === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    </div>
    <div style="margin-top:14px">${field('notes', 'Observações do mês', existing?.notes ?? '', 'textarea')}</div>
    <div class="modal-foot">${existing ? '<button type="button" class="btn ghost" id="lr-del" style="margin-right:auto;color:var(--bad)">Excluir</button>' : ''}
      <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`, { wide: true });
  $$('[data-close]', el).forEach(b => b.onclick = close);
  const form = $('form', el);
  // ao escolher conta + mês já lançados, carrega os números para editar
  const loadExisting = async () => {
    if (existing) return;
    const cid = form.client_id.value, m = form.month.value;
    if (!cid || !m) return;
    const rows = await api('GET', `/api/clients/${cid}/metrics`).catch(() => []);
    const row = rows.find(x => x.month === m);
    for (const [k] of METRIC_FIELDS) form[k].value = row ? row[k] : '';
    form.result_type.value = row?.result_type || 'Leads';
    form.notes.value = row?.notes || '';
    $('#lr-status', el).innerHTML = row ? `⚠️ ${monthLabel(m)} já tem resultados lançados para esta conta — você está <b>editando</b>.` : '';
  };
  form.client_id.onchange = loadExisting; form.month.onchange = loadExisting; loadExisting();
  $('#lr-del', el)?.addEventListener('click', async () => {
    if (await confirmBox(`Excluir os resultados de ${existing.client_name} em ${monthLabel(existing.month)}?`)) { await api('DELETE', `/api/metrics/${existing.id}`).catch(fail); close(); reload(); }
  });
  onSubmit(form, async d => {
    const cid = existing ? existing.client_id : d.client_id;
    await api('PUT', `/api/clients/${cid}/metrics/${d.month}`, d);
    close(); toast('Resultados salvos!'); reload();
  });
}
function pickReport(clients, client) {
  const { el, close } = modal('Relatório PDF do mês', `<form><div class="grid g2">
    ${field('month', 'Mês do relatório', thisMonth(), 'month', 'required')}
    <div class="field"><label>Conta</label><select name="client"><option value="">Todas as contas</option>${clients.map(c => `<option value="${c.id}" ${client == c.id ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select></div></div>
    <p class="muted small">O relatório abre numa nova aba. Na janela de impressão, escolha <b>Salvar como PDF</b>.</p>
    <div class="modal-foot"><button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Gerar relatório</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  onSubmit($('form', el), async d => {
    const win = window.open('', '_blank'); // abre já no clique para o navegador não bloquear
    if (!win) throw new Error('O navegador bloqueou a nova aba. Permita pop-ups para este site.');
    try { win.document.write(await buildReport(d.month, d.client, clients)); win.document.close(); close(); }
    catch (e) { win.close(); throw e; }
  });
}
async function buildReport(month, client, clients) {
  const get = m => { const [from, to] = monthBounds(m); return api('GET', `/api/results?${new URLSearchParams({ from, to, ...(client ? { client } : {}) })}`); };
  const [cur, prev] = await Promise.all([get(month), get(shiftMonth(month, -1))]);
  const c = clients.find(x => x.id == client);
  const t = cur.totals, p = prev.totals;
  const cmp = k => { const v = pct(t[k], p[k]); return v == null || !p[k] ? '' : `<div class="cmp ${v >= 0 ? 'up' : 'down'}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(1).replace('.', ',')}% vs ${monthLabel(shiftMonth(month, -1))}</div>`; };
  const card = (label, value, k) => `<div class="card"><div class="k">${label}</div><div class="v">${value}</div>${k ? cmp(k) : ''}</div>`;
  const notes = cur.rows.filter(r => r.notes).map(r => `<p><b>${h(r.client_name)}:</b> ${h(r.notes)}</p>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ${h(c ? c.name : 'Todas as contas')} — ${monthLabel(month)}</title>
  <style>
    *{box-sizing:border-box} body{font:13px/1.5 Inter,system-ui,"Segoe UI",sans-serif;color:#171a2b;margin:0;padding:36px 40px}
    .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #6d4aff;padding-bottom:14px;margin-bottom:22px}
    .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7086;font-weight:700} h1{margin:2px 0 0;font-size:24px}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
    .card{border:1px solid #e3e5ee;border-radius:10px;padding:12px 14px;break-inside:avoid}
    .k{font-size:11px;color:#6b7086;text-transform:uppercase;letter-spacing:.04em;font-weight:600} .v{font-size:20px;font-weight:700;margin-top:2px}
    .cmp{font-size:11px;margin-top:2px} .up{color:#0f9d6b} .down{color:#d63a4a}
    h2{font-size:15px;margin:22px 0 8px} table{width:100%;border-collapse:collapse} th,td{padding:7px 8px;border-bottom:1px solid #e3e5ee;text-align:left}
    th{font-size:11px;color:#6b7086;text-transform:uppercase} td.r,th.r{text-align:right}
    .foot{margin-top:30px;color:#6b7086;font-size:11px} .noprint{margin-bottom:20px}
    .noprint button{font:inherit;font-weight:600;background:#6d4aff;color:#fff;border:0;border-radius:8px;padding:9px 16px;cursor:pointer}
    @media print{body{padding:0}.noprint{display:none} @page{margin:16mm}}
  </style></head><body>
  <div class="noprint"><button onclick="print()">Salvar como PDF / Imprimir</button></div>
  <div class="top"><div><div class="eyebrow">Vizion Comunicação · Relatório mensal</div><h1>${h(c ? c.name : 'Todas as contas')}</h1></div><div style="text-align:right"><b>${monthLabel(month)}</b><div style="color:#6b7086">${fmtDate(cur.from)} a ${fmtDate(cur.to)}</div></div></div>
  ${cur.rows.length ? `
  <div class="grid">
    ${card('Visualizações', n0(t.views), 'views')}${card('Novos seguidores', (t.new_followers > 0 ? '+' : '') + n0(t.new_followers))}
    ${card('Interações', n0(t.interactions), 'interactions')}${card('Visitas ao perfil', n0(t.profile_visits), 'profile_visits')}
    ${card('Toques no link da bio', n0(t.link_clicks), 'link_clicks')}${card('Leads', n0(t.leads), 'leads')}
    ${card('Resultados de anúncios', n0(t.ad_results), 'ad_results')}${card('Valor investido', brl(t.ad_spend), 'ad_spend')}
  </div>
  <h2>Investimento e custo</h2>
  <table><tbody><tr><td>Valor investido em tráfego/impulsionamento</td><td class="r"><b>${brl(t.ad_spend)}</b></td></tr>
    <tr><td>Custo por resultado</td><td class="r"><b>${costPer(t.ad_spend, t.ad_results)}</b></td></tr>
    <tr><td>Custo por lead</td><td class="r"><b>${costPer(t.ad_spend, t.leads)}</b></td></tr></tbody></table>
  ${cur.clients.length > 1 ? `<h2>Por conta</h2><table><thead><tr><th>Conta</th><th class="r">Visualizações</th><th class="r">Novos seg.</th><th class="r">Interações</th><th class="r">Resultados</th><th class="r">Investido</th></tr></thead><tbody>
    ${cur.clients.map(x => `<tr><td>${h(x.client_name)}</td><td class="r">${n0(x.views)}</td><td class="r">${n0(x.new_followers)}</td><td class="r">${n0(x.interactions)}</td><td class="r">${n0(x.ad_results)}</td><td class="r">${brl(x.ad_spend)}</td></tr>`).join('')}</tbody></table>` : ''}
  ${notes ? `<h2>Observações</h2>${notes}` : ''}`
  : `<p>Nenhum relatório foi lançado para ${monthLabel(month)}.</p>`}
  <div class="foot">Gerado pelo Vizion CRM em ${fmtDate(todayStr())}.</div>
  <script>setTimeout(()=>print(),400)<\/script></body></html>`;
}

// ---------- Leads ----------
const SOURCES = { trafego: 'Tráfego pago', indicacao: 'Indicação', organico: 'Orgânico', impulsionamento: 'Impulsionamento', outro: 'Outro' };
const SOURCE_HINT = { trafego: 'Tráfego pago (campanha/anúncio)', indicacao: 'Indicação', organico: 'Orgânico (sem anúncio)', impulsionamento: 'Impulsionamento (post impulsionado)', outro: 'Outro' };
const SOURCE_BADGE = { trafego: 'accent', impulsionamento: 'warn', organico: 'ok', indicacao: 'neutral', outro: 'neutral' };
const STATUS = { novo: 'Novo', contato: 'Em contato', reuniao: 'Reunião agendada', proposta: 'Proposta enviada', fechado: 'Contrato fechado', perdido: 'Perdido' };
const STATUS_BADGE = { novo: 'neutral', contato: 'warn', reuniao: 'accent', proposta: 'warn', fechado: 'ok', perdido: 'bad' };
const NETWORKS = ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'LinkedIn', 'Google Meu Negócio'];
const leadMonth = l => (l.first_contact || l.created_at || '').slice(0, 7);

async function viewLeads(view) {
  const { leads, spend } = await api('GET', '/api/leads');
  const clients = await api('GET', '/api/clients').catch(() => []);
  const edit = can('leads', 'edit');
  const f = view._lf || (view._lf = { month: '', status: '', source: '', network: '', q: '', owner: '' });
  const networks = [...new Set([...NETWORKS, ...leads.map(l => l.network), ...spend.map(s => s.network)].filter(Boolean))];
  view.innerHTML = `<div class="page-head"><div><h1>Leads da Vizion</h1><div class="muted">Seus potenciais clientes: do primeiro contato ao contrato fechado, com a origem de cada um</div></div>
    <div class="actions">${edit ? '<button class="btn secondary" id="add-spend">+ Investimento</button><button class="btn" id="add">+ Novo lead</button>' : ''}</div></div>
    <div class="card" style="margin-bottom:18px"><div class="toolbar">
      <input class="search" id="lq" placeholder="Buscar nome, empresa, @…" value="${h(f.q)}">
      <input type="month" id="lm" value="${f.month}" title="Mês do primeiro contato">
      <select id="ls"><option value="">Todos os status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="lo"><option value="">Todas as origens</option>${Object.entries(SOURCES).map(([k, v]) => `<option value="${k}" ${f.source === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select id="ln"><option value="">Todas as redes</option>${networks.map(n => `<option ${f.network === n ? 'selected' : ''}>${h(n)}</option>`).join('')}</select>
      <button class="btn ghost sm" id="lclear">Limpar filtros</button>
    </div></div>
    <div class="stats" id="lstats"></div>
    <div class="card"><div class="card-head"><h2>Lista de leads</h2><span class="muted small" id="lcount"></span></div><div class="table-wrap" id="ltable"></div></div>
    <div class="card"><div class="card-head"><div><h2>Desempenho por rede social e origem</h2><div class="muted small">Cruza os leads com o valor investido em tráfego/impulsionamento em cada rede</div></div></div><div class="table-wrap" id="lperf"></div></div>
    <div class="card"><div class="card-head"><h2>Investimentos em tráfego e impulsionamento</h2>${edit ? '<button class="btn secondary sm" id="add-spend2">+ Investimento</button>' : ''}</div><div class="table-wrap" id="lspend"></div></div>`;

  const reload = () => viewLeads(view);
  const draw = () => {
    const q = f.q.toLowerCase();
    const rows = leads.filter(l => (!f.month || leadMonth(l) === f.month) && (!f.status || l.status === f.status) && (!f.source || l.source === f.source)
      && (!f.network || l.network === f.network) && `${l.name} ${l.company} ${l.handle} ${l.segment} ${l.campaign}`.toLowerCase().includes(q));
    const sp = spend.filter(s => (!f.month || s.month === f.month) && (!f.network || s.network === f.network) && (!f.source || s.source === f.source));
    const meet = rows.filter(l => l.meeting_date).length, won = rows.filter(l => l.status === 'fechado'), lost = rows.filter(l => l.status === 'perdido');
    const invest = sp.reduce((a, s) => a + s.amount, 0);
    const paidLeads = rows.filter(l => l.source === 'trafego' || l.source === 'impulsionamento').length;
    $('#lstats').innerHTML = `
      <div class="stat"><div class="k">Leads</div><div class="v">${n0(rows.length)}</div><div class="d muted">${n0(paidLeads)} de tráfego/impulsionamento</div></div>
      <div class="stat"><div class="k">Reuniões agendadas</div><div class="v">${n0(meet)}</div><div class="d muted">${rows.length ? Math.round(meet / rows.length * 100) : 0}% dos leads</div></div>
      <div class="stat"><div class="k">Contratos fechados</div><div class="v up">${n0(won.length)}</div><div class="d muted">Conversão ${rows.length ? (won.length / rows.length * 100).toFixed(1).replace('.', ',') : 0}%</div></div>
      <div class="stat"><div class="k">Perdidos</div><div class="v down">${n0(lost.length)}</div><div class="d muted">${rows.length ? (lost.length / rows.length * 100).toFixed(1).replace('.', ',') : 0}% dos leads</div></div>
      <div class="stat"><div class="k">Valor fechado</div><div class="v">${brl(won.reduce((a, l) => a + l.deal_value, 0))}</div></div>
      <div class="stat"><div class="k">Investido</div><div class="v">${brl(invest)}</div><div class="d muted">Custo/lead pago: ${paidLeads ? brl(invest / paidLeads) : '—'}</div></div>`;
    $('#lcount').textContent = `${rows.length} de ${leads.length}`;
    $('#ltable').innerHTML = rows.length ? `<table><thead><tr><th>Lead</th><th>Segmento</th><th>Rede social</th><th>Origem</th><th>1º contato</th><th>Reunião</th><th>Fechamento</th><th>Status</th></tr></thead><tbody>
      ${rows.map(l => `<tr class="click" data-id="${l.id}"><td><b>${h(l.name)}</b><div class="muted small">${h(l.company)}</div></td>
        <td>${h(l.segment)}</td><td>${h(l.network)}<div class="muted small">${h(l.handle)}</div></td>
        <td><span class="badge ${SOURCE_BADGE[l.source]}">${SOURCES[l.source] || ''}</span>${l.campaign ? `<div class="muted small">${h(l.campaign)}</div>` : ''}</td>
        <td>${fmtDate(l.first_contact) || '—'}</td><td>${fmtDate(l.meeting_date) || '—'}</td><td>${fmtDate(l.closed_date) || '—'}${l.deal_value ? `<div class="muted small">${brl(l.deal_value)}</div>` : ''}</td>
        <td><span class="badge ${STATUS_BADGE[l.status]}">${STATUS[l.status]}</span>${l.status === 'perdido' && l.lost_reason ? `<div class="muted small">${h(l.lost_reason)}</div>` : ''}${l.converted_client_id ? '<div class="small"><a href="#/clientes/' + l.converted_client_id + '">ver cliente →</a></div>' : ''}</td></tr>`).join('')}</tbody></table>`
      : `<div class="empty">${leads.length ? 'Nenhum lead com esses filtros.' : 'Nenhum lead cadastrado ainda.'}</div>`;
    $$('#ltable tr[data-id]').forEach(tr => tr.onclick = e => { if (e.target.closest('a')) return; editLead(leads.find(l => l.id == tr.dataset.id), clients, reload); });

    // desempenho por rede + origem
    const groups = {};
    const key = (n, s) => `${n || 'Sem rede'}|${s}`;
    rows.forEach(l => { const g = groups[key(l.network, l.source)] ||= { network: l.network || 'Sem rede', source: l.source, leads: 0, meet: 0, won: 0, value: 0, spend: 0 }; g.leads++; if (l.meeting_date) g.meet++; if (l.status === 'fechado') { g.won++; g.value += l.deal_value; } });
    sp.forEach(s => { const g = groups[key(s.network, s.source)] ||= { network: s.network, source: s.source, leads: 0, meet: 0, won: 0, value: 0, spend: 0 }; g.spend += s.amount; });
    const gl = Object.values(groups).sort((a, b) => b.leads - a.leads);
    $('#lperf').innerHTML = gl.length ? `<table><thead><tr><th>Rede social</th><th>Origem</th><th class="r">Leads</th><th class="r">Reuniões</th><th class="r">Fechados</th><th class="r">Investido</th><th class="r">Custo/lead</th><th class="r">Custo/contrato</th><th class="r">Valor fechado</th></tr></thead><tbody>
      ${gl.map(g => `<tr><td><b>${h(g.network)}</b></td><td><span class="badge ${SOURCE_BADGE[g.source]}">${SOURCES[g.source]}</span></td><td class="r num">${g.leads}</td><td class="r num">${g.meet}</td><td class="r num">${g.won}</td>
        <td class="r num">${g.spend ? brl(g.spend) : '—'}</td><td class="r num">${g.spend && g.leads ? brl(g.spend / g.leads) : '—'}</td><td class="r num">${g.spend && g.won ? brl(g.spend / g.won) : '—'}</td><td class="r num">${g.value ? brl(g.value) : '—'}</td></tr>`).join('')}</tbody></table>`
      : '<div class="empty">Sem dados para esse filtro.</div>';
    $('#lspend').innerHTML = sp.length ? `<table><thead><tr><th>Mês</th><th>Rede social</th><th>Tipo</th><th>Campanha</th><th class="r">Valor</th>${edit ? '<th></th>' : ''}</tr></thead><tbody>
      ${sp.map(s => `<tr><td>${monthLabel(s.month)}</td><td>${h(s.network)}</td><td><span class="badge ${SOURCE_BADGE[s.source]}">${SOURCES[s.source]}</span></td><td>${h(s.campaign)}</td>
        <td class="r num">${brl(s.amount)}</td>${edit ? `<td class="r"><button class="btn ghost sm" data-sp="${s.id}">Editar</button></td>` : ''}</tr>`).join('')}</tbody></table>`
      : '<div class="empty">Nenhum investimento lançado. Lance quanto foi gasto em cada rede para ver o custo por lead.</div>';
    $$('[data-sp]', view).forEach(b => b.onclick = () => editSpend(spend.find(s => s.id == b.dataset.sp), clients, networks, reload));
  };
  const bind = (id, k, ev = 'change') => $(id)?.addEventListener(ev, e => { f[k] = e.target.value; draw(); });
  bind('#lq', 'q', 'input'); bind('#lm', 'month'); bind('#ls', 'status'); bind('#lo', 'source'); bind('#ln', 'network');
  $('#lclear').onclick = () => { view._lf = null; reload(); };
  $('#add')?.addEventListener('click', () => editLead(null, clients, reload));
  ['#add-spend', '#add-spend2'].forEach(id => $(id)?.addEventListener('click', () => editSpend(null, clients, networks, reload)));
  draw();
}
// Lista de redes sociais; "Outra" abre um campo para digitar qual
function networkInput(val) {
  const other = val && !NETWORKS.includes(val);
  return `<select name="network">${[...NETWORKS, 'Outra'].map(n => `<option ${(other ? 'Outra' : val || 'Instagram') === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <input name="network_other" placeholder="Qual rede?" value="${other && val !== 'Outra' ? h(val) : ''}" style="margin-top:6px;${other ? '' : 'display:none'}">`;
}
function wireNetwork(el) {
  const sel = $('[name=network]', el), other = $('[name=network_other]', el);
  sel.addEventListener('change', () => { other.style.display = sel.value === 'Outra' ? '' : 'none'; if (sel.value === 'Outra') other.focus(); });
}
const networkValue = d => (d.network === 'Outra' && d.network_other?.trim() ? d.network_other.trim() : d.network);
const clientSelect = (clients, val, label) => clients.length ? `<div class="field"><label>${label}</label><select name="client_id">
  ${isAdmin() || state.me.client_scope === 'all' ? '<option value="">Vizion (minha empresa)</option>' : ''}${clients.map(c => `<option value="${c.id}" ${val == c.id ? 'selected' : ''}>${h(c.name)}</option>`).join('')}</select></div>` : '';

function editLead(l, clients, reload) {
  const isNew = !l; l = l || { source: 'trafego', status: 'novo', first_contact: todayStr(), network: 'Instagram' };
  const edit = can('leads', 'edit');
  const { el, close } = modal(isNew ? 'Novo lead' : l.name, `<form><fieldset style="border:0;padding:0;margin:0" ${edit ? '' : 'disabled'}><div class="grid g3">
      ${field('name', 'Nome *', l.name, 'text', 'required')}
      ${field('company', 'Empresa / marca', l.company)}
      ${field('segment', 'Segmento', l.segment, 'text', 'placeholder="Ex.: estética, restaurante…"')}
      ${field('phone', 'WhatsApp', l.phone, 'tel')}
      ${field('email', 'E-mail', l.email, 'email')}
    </div>
    <h3 style="margin:18px 0 10px">Origem</h3>
    <div class="grid g4">
      <div class="field"><label>Por onde ele veio</label><select name="source">${Object.entries(SOURCE_HINT).map(([k, v]) => `<option value="${k}" ${l.source === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Rede social</label>${networkInput(l.network)}</div>
      ${field('handle', 'Perfil (@)', l.handle, 'text', 'placeholder="@perfil"')}
      ${field('campaign', 'Campanha rodada', l.campaign, 'text', 'placeholder="Nome da campanha/anúncio"')}
    </div>
    <p class="muted small" id="camp-hint" style="margin-top:-4px">Se veio de uma campanha rodada, preencha o nome dela: o lead conta como <b>Tráfego pago</b>.</p>
    <h3 style="margin:18px 0 10px">Andamento</h3>
    <div class="grid g4">
      ${field('first_contact', 'Primeiro contato', l.first_contact, 'date')}
      ${field('meeting_date', 'Reunião agendada para', l.meeting_date, 'date')}
      ${field('closed_date', 'Contrato fechado em', l.closed_date, 'date')}
      ${field('deal_value', 'Valor do contrato (R$)', l.deal_value || '', 'number', 'step="0.01" min="0"')}
      <div class="field"><label>Status</label><select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="span3" id="lost-box" ${l.status === 'perdido' ? '' : 'style="display:none"'}><div class="field"><label for="f-lost_reason">Motivo da perda</label>
        <input id="f-lost_reason" name="lost_reason" list="lost-reasons" value="${h(l.lost_reason)}" placeholder="Por que não fechou?">
        <datalist id="lost-reasons"><option>Achou caro / sem orçamento</option><option>Fechou com outra agência</option><option>Parou de responder</option><option>Não era o momento</option><option>Não tinha perfil</option></datalist></div></div>
      <div class="span3">${field('notes', 'Observações', l.notes, 'textarea')}</div>
    </div></fieldset>
    <p class="muted small">Dica: ao preencher a data da reunião ou do fechamento, o status é atualizado automaticamente.</p>
    <div class="modal-foot">
      ${!isNew && edit ? '<button type="button" class="btn ghost" id="l-del" style="color:var(--bad)">Excluir</button>' : ''}
      ${!isNew && edit && can('clientes', 'edit') && !l.converted_client_id && !l.client_id ? '<button type="button" class="btn secondary" id="l-conv" style="margin-right:auto">Transformar em cliente</button>' : '<span style="margin-right:auto"></span>'}
      <button type="button" class="btn secondary" data-close>${edit ? 'Cancelar' : 'Fechar'}</button>${edit ? '<button class="btn" type="submit">Salvar</button>' : ''}</div></form>`, { wide: true });
  $$('[data-close]', el).forEach(b => b.onclick = close);
  wireNetwork(el);
  const stSel = $('[name=status]', el);
  stSel.addEventListener('change', () => { $('#lost-box', el).style.display = stSel.value === 'perdido' ? '' : 'none'; if (stSel.value === 'perdido') $('[name=lost_reason]', el).focus(); });
  // campanha rodada => tráfego pago (impulsionamento também é campanha, então é mantido)
  const srcSel = $('[name=source]', el);
  $('[name=campaign]', el).addEventListener('input', e => {
    if (e.target.value.trim() && !['trafego', 'impulsionamento'].includes(srcSel.value)) { srcSel.value = 'trafego'; toast('Origem ajustada para Tráfego pago'); }
  });
  $('#l-del', el)?.addEventListener('click', async () => { if (await confirmBox(`Excluir o lead ${l.name}?`)) { await api('DELETE', `/api/leads/${l.id}`).catch(fail); close(); reload(); } });
  $('#l-conv', el)?.addEventListener('click', async () => {
    if (!await confirmBox(`Criar o cliente "${l.name}" com os dados deste lead e marcar o contrato como fechado?`, 'Criar cliente')) return;
    try { const r = await api('POST', `/api/leads/${l.id}/convert`, {}); toast('Cliente criado!'); location.hash = `#/clientes/${r.client_id}`; } catch (e) { fail(e); }
  });
  if (edit) onSubmit($('form', el), async d => {
    d.network = networkValue(d);
    if (isNew) await api('POST', '/api/leads', d); else await api('PUT', `/api/leads/${l.id}`, d);
    close(); toast('Lead salvo!'); reload();
  });
}
function editSpend(s, clients, networks, reload) {
  const isNew = !s; s = s || { month: thisMonth(), source: 'trafego', network: 'Instagram' };
  const { el, close } = modal(isNew ? 'Lançar investimento' : 'Editar investimento', `<form><div class="grid g2">
      ${field('month', 'Mês', s.month, 'month', 'required')}
      <div class="field"><label>Tipo</label><select name="source"><option value="trafego" ${s.source === 'trafego' ? 'selected' : ''}>Tráfego pago (anúncios)</option><option value="impulsionamento" ${s.source === 'impulsionamento' ? 'selected' : ''}>Impulsionamento</option></select></div>
      <div class="field"><label>Rede social *</label>${networkInput(s.network)}</div>
      ${field('amount', 'Valor investido (R$)', s.amount ?? '', 'number', 'step="0.01" min="0" required')}
      ${field('campaign', 'Campanha (opcional)', s.campaign)}
    </div>
    <p class="muted small">Os leads com a mesma rede social e origem são ligados a este valor para calcular o custo por lead e por contrato.</p>
    <div class="modal-foot">${!isNew ? '<button type="button" class="btn ghost" id="s-del" style="margin-right:auto;color:var(--bad)">Excluir</button>' : ''}
      <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`);
  $$('[data-close]', el).forEach(b => b.onclick = close);
  $('#s-del', el)?.addEventListener('click', async () => { if (await confirmBox('Excluir este investimento?')) { await api('DELETE', `/api/lead-spend/${s.id}`).catch(fail); close(); reload(); } });
  wireNetwork(el);
  onSubmit($('form', el), async d => {
    d.network = networkValue(d);
    if (isNew) await api('POST', '/api/lead-spend', d); else await api('PUT', `/api/lead-spend/${s.id}`, d);
    close(); toast('Investimento salvo!'); reload();
  });
}

// ---------- Usuários e permissões (admin) ----------
const MOD_LABELS = { leads: 'Leads', clientes: 'Dados dos clientes e contratos', metricas: 'Métricas mensais (lançar números)', resultados: 'Resultados e relatório PDF', acessos: 'Acessos (logins e senhas)', cobrancas: 'Cobranças e notificações', financeiro: 'Financeiro' };
async function viewUsers(view) {
  const users = await api('GET', '/api/users');
  const clients = await api('GET', '/api/clients');
  const permSummary = u => u.role === 'admin' ? '<span class="badge accent">Acesso total</span>'
    : Object.entries(u.perms).filter(([, v]) => v !== 'none').map(([k, v]) => `<span class="badge ${v === 'edit' ? 'ok' : 'neutral'}">${MOD_LABELS[k].split(' (')[0]}${v === 'edit' ? ' ✎' : ''}</span>`).join(' ') || '<span class="muted small">Nenhum acesso</span>';
  view.innerHTML = `<div class="page-head"><div><h1>Usuários e acessos</h1><div class="muted">Você decide o que cada pessoa pode ver e editar.</div></div>
    <div class="actions"><button class="btn" id="add">+ Novo usuário</button></div></div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Pode acessar</th><th>Clientes</th><th>Status</th><th></th></tr></thead><tbody>
    ${users.map(u => `<tr><td><b>${h(u.name)}</b>${u.id === state.me.id ? ' <span class="muted small">(você)</span>' : ''}</td><td>${h(u.email)}</td>
      <td style="max-width:340px">${permSummary(u)}</td>
      <td class="small">${u.role === 'admin' || u.client_scope === 'all' ? 'Todos' : `${u.client_scope.length} selecionado(s)`}</td>
      <td>${u.active ? '<span class="badge ok">Ativo</span>' : '<span class="badge neutral">Desativado</span>'}</td>
      <td class="r"><button class="btn ghost sm" data-edit="${u.id}">Editar</button></td></tr>`).join('')}</tbody></table></div></div>
    <p class="muted small" style="margin-top:12px">✎ = pode editar. Sem o ✎, a pessoa apenas visualiza.</p>`;
  const reload = () => viewUsers(view);
  $('#add').onclick = () => editUser(null, clients, reload);
  $$('[data-edit]', view).forEach(b => b.onclick = () => editUser(users.find(u => u.id == b.dataset.edit), clients, reload));
}
function editUser(u, clients, reload) {
  const isNew = !u;
  u = u || { role: 'user', perms: {}, client_scope: 'all', active: true };
  const self = u.id === state.me.id;
  const scopeAll = u.client_scope === 'all';
  const { el, close } = modal(isNew ? 'Novo usuário' : `Editar ${u.name}`, `<form><div class="grid g2">
      ${field('name', 'Nome *', u.name, 'text', 'required')}
      ${field('email', 'E-mail de login *', u.email, 'email', `required autocomplete="off" ${isNew ? '' : 'readonly'}`)}
      ${isNew ? field('password', 'Senha inicial * (mín. 8)', '', 'text', 'required minlength="8" autocomplete="new-password"')
        : `<div class="field"><label>Senha</label><button type="button" class="btn secondary" id="u-reset" style="width:100%;justify-content:center">Enviar e-mail para criar nova senha</button></div>`}
      <div class="field"><label>Tipo de acesso</label><select name="role" ${self ? 'disabled' : ''}>
        <option value="user" ${u.role !== 'admin' ? 'selected' : ''}>Colaborador (acesso limitado)</option>
        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador (acesso total)</option></select></div>
    </div>
    <div id="perm-box" style="margin-top:16px">
      <h3 style="margin-bottom:8px">O que essa pessoa pode acessar</h3>
      <table class="perm-table"><thead><tr><th>Área</th><th>Sem acesso</th><th>Ver</th><th>Ver e editar</th></tr></thead><tbody>
      ${Object.entries(MOD_LABELS).map(([k, l]) => `<tr><td>${l}</td>${['none', 'view', 'edit'].map(v => k === 'resultados' && v === 'edit' ? '<td class="muted small">—</td>' : `<td><input type="radio" name="perm_${k}" value="${v}" ${(u.perms[k] || 'none') === v ? 'checked' : ''} aria-label="${l}: ${v}"></td>`).join('')}</tr>`).join('')}
      </tbody></table>
      <h3 style="margin:16px 0 8px">Quais clientes ela pode ver</h3>
      <label class="radio"><input type="radio" name="scope" value="all" ${scopeAll ? 'checked' : ''}> Todos os clientes</label>
      <label class="radio"><input type="radio" name="scope" value="some" ${!scopeAll ? 'checked' : ''}> Somente os selecionados</label>
      <div class="chips" id="chips" style="margin-top:8px;${scopeAll ? 'display:none' : ''}">${clients.length ? clients.map(c => `<label><input type="checkbox" value="${c.id}" ${!scopeAll && u.client_scope.includes(c.id) ? 'checked' : ''}> ${h(c.name)}</label>`).join('') : '<span class="muted small">Nenhum cliente cadastrado.</span>'}</div>
    </div>
    ${!isNew && !self ? `<div class="field" style="margin-top:16px"><label class="radio"><input type="checkbox" name="active" ${u.active ? 'checked' : ''}> Acesso ativo (desmarque para bloquear o login)</label></div>` : ''}
    <div class="modal-foot">${!isNew && !self ? '<button type="button" class="btn ghost" id="u-del" style="margin-right:auto;color:var(--bad)">Remover acesso</button>' : ''}
      <button type="button" class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`, { wide: true });
  $$('[data-close]', el).forEach(b => b.onclick = close);
  const roleSel = $('[name=role]', el);
  const syncRole = () => { $('#perm-box', el).style.display = roleSel.value === 'admin' ? 'none' : ''; };
  roleSel.onchange = syncRole; syncRole();
  $$('[name=scope]', el).forEach(r => r.onchange = () => { $('#chips', el).style.display = $('[name=scope]:checked', el).value === 'all' ? 'none' : ''; });
  $('#u-del', el)?.addEventListener('click', async () => { if (await confirmBox(`Remover o acesso de ${u.name}? A pessoa não vai mais conseguir entrar.`, 'Remover acesso')) { await api('DELETE', `/api/users/${u.id}`).catch(fail); close(); reload(); } });
  $('#u-reset', el)?.addEventListener('click', async () => { try { await api('POST', `/api/users/${u.id}/reset`); toast(`E-mail enviado para ${u.email}`); } catch (e) { fail(e); } });
  onSubmit($('form', el), async d => {
    const perms = {}; for (const k of Object.keys(MOD_LABELS)) perms[k] = d['perm_' + k] || 'none';
    const body = {
      name: d.name, email: d.email, password: d.password || undefined, role: self ? 'admin' : d.role, perms,
      client_scope: d.scope === 'all' ? 'all' : $$('#chips input:checked', el).map(i => Number(i.value)),
      active: isNew || self ? true : !!d.active,
    };
    if (isNew) {
      const r = await api('POST', '/api/users', body);
      close(); toast(r.needsConfirm ? 'Usuário criado! Ele precisa confirmar pelo e-mail antes de entrar.' : 'Usuário criado! Já pode entrar com o e-mail e a senha.'); reload();
    } else { await api('PUT', `/api/users/${u.id}`, body); close(); toast('Usuário salvo!'); reload(); }
  });
}

// ---------- Configurações (admin) ----------
async function viewSettings(view) {
  const s = await api('GET', '/api/settings');
  view.innerHTML = `<div class="page-head"><div><h1>Configurações</h1><div class="muted">Dados usados nas mensagens de cobrança</div></div></div>
    <form class="card" id="sf"><div class="grid g3">
      ${field('company', 'Nome da empresa (assinatura)', s.company)}
      ${field('pix', 'Chave Pix', s.pix)}
      ${field('remind_days', 'Avisar no painel com quantos dias de antecedência', s.remind_days, 'number', 'min="0" max="30"')}
    </div>
    <div class="grid g2" style="margin-top:14px">
      ${field('msg_reminder', 'Mensagem de lembrete (antes do vencimento)', s.msg_reminder, 'textarea')}
      ${field('msg_overdue', 'Mensagem de cobrança (pagamento atrasado)', s.msg_overdue, 'textarea')}
    </div>
    <p class="muted small">Variáveis: <code>{nome}</code> primeiro nome · <code>{nome_completo}</code> · <code>{mes}</code> · <code>{valor}</code> · <code>{vencimento}</code> · <code>{pix}</code> · <code>{empresa}</code></p>
    <div style="display:flex;justify-content:flex-end"><button class="btn" type="submit">Salvar configurações</button></div></form>`;
  $$('#sf textarea').forEach(t => t.style.minHeight = '170px');
  onSubmit($('#sf'), async d => { state.settings = await api('PUT', '/api/settings', d); toast('Configurações salvas!'); });
}

if (typeof Backend !== "undefined") boot();
