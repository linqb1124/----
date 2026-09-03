/* =========================================================
 * CRM 应用层：路由 + 五大模块视图
 * 依赖 data.js（Store / 字典 / 种子数据）
 * ========================================================= */

/* ---------------- 基础工具 ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function pad(n) { return String(n).padStart(2, '0'); }
function fmtDateObj(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayStr() { return fmtDateObj(new Date()); }
function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((t - d) / 86400000);
}
function weekdayCn(dateStr) {
  return '周' + '日一二三四五六'[new Date(dateStr + 'T00:00:00').getDay()];
}
const AVATAR_COLORS = ['#2f6bff', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
function userColor(uid) {
  const i = Store.data.users.findIndex(u => u.id === uid);
  return AVATAR_COLORS[(i < 0 ? 0 : i) % AVATAR_COLORS.length];
}
function avatarHtml(uid, cls = '') {
  const u = Store.user(uid);
  if (!u) return '<span class="avatar ' + cls + '" style="background:#9ca3af">?</span>';
  return `<span class="avatar ${cls}" style="background:${userColor(uid)};width:28px;height:28px;font-size:12px">${esc(u.name.slice(0, 1))}</span>`;
}
function ownerName(uid) { return uid ? (Store.user(uid) ? Store.user(uid).name : '—') : '未分配'; }

/* ---------------- 全局状态 ---------------- */
const state = {
  uid: localStorage.getItem(UID_KEY) || 'u1',
  leadF: { kw: '', source: '', status: '', owner: '', tag: '' },
  leadSel: new Set(),
  custTab: 'mine',
  profKw: '',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedDate: todayStr(),
  schedTab: 'mine',
  drawerTab: 'logs'
};
const currentUser = () => Store.user(state.uid);
const isAdmin = () => currentUser() && currentUser().role === 'admin';
const canEdit = ownerId => isAdmin() || ownerId === state.uid;

/* ---------------- Toast / Modal / Confirm ---------------- */
function toast(msg, type = 'success') {
  const icons = { success: '✓', error: '✕', warn: '!', info: 'i' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span style="font-weight:700">${icons[type] || '✓'}</span><span>${esc(msg)}</span>`;
  $('#toast-root').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 2400);
}
function openModal(html, lg) {
  $('#modal-root').innerHTML =
    `<div class="modal-mask"><div class="modal${lg ? ' modal-lg' : ''}">${html}</div></div>`;
  $('#modal-root .modal-mask').addEventListener('mousedown', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function modalHeader(title) {
  return `<div class="modal-header"><div class="modal-title">${esc(title)}</div>
    <button class="modal-close" onclick="closeModal()">×</button></div>`;
}
function confirmDlg(title, msg, onOk, okText = '确认', danger = true) {
  openModal(`
    ${modalHeader(title)}
    <div class="modal-body"><div style="color:#374151">${msg}</div></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="cf-ok">${esc(okText)}</button>
    </div>`);
  $('#cf-ok').onclick = () => { closeModal(); onOk(); };
}

/* ---------------- 导航与路由 ---------------- */
const VIEWS = [
  { hash: '#/leads', title: '线索池', ico: '🎯', fn: renderLeads },
  { hash: '#/customers', title: '客户池', ico: '👥', fn: renderCustomers },
  { hash: '#/profiles', title: '客户档案', ico: '📁', fn: renderProfiles },
  { hash: '#/opps', title: '商机管理', ico: '💼', fn: renderOpps },
  { hash: '#/schedule', title: '日程管理', ico: '📅', fn: renderSchedule }
];
function overdueTaskCount(scope) {
  const t = todayStr();
  return Store.data.tasks.filter(x =>
    !x.done && x.date < t && (scope === 'all' || x.ownerId === state.uid)).length;
}
function renderNav() {
  const recycle = Store.data.leads.filter(l => l.deletedAt).length;
  const overdue = overdueTaskCount(isAdmin() ? 'all' : 'mine');
  $('#nav').innerHTML = VIEWS.map(v => {
    let badge = '';
    if (v.hash === '#/leads' && recycle) badge = `<span class="nav-badge">${recycle}</span>`;
    if (v.hash === '#/schedule' && overdue) badge = `<span class="nav-badge">${overdue}</span>`;
    return `<div class="nav-item" data-hash="${v.hash}" onclick="location.hash='${v.hash}'">
      <span class="ico">${v.ico}</span><span>${v.title}</span>${badge}</div>`;
  }).join('');
}
function renderUserSwitch() {
  $('#user-switch').innerHTML = Store.data.users.map(u =>
    `<option value="${u.id}" ${u.id === state.uid ? 'selected' : ''}>${esc(u.name)}（${u.title}）</option>`).join('');
}
function renderDate() {
  const d = new Date();
  $('#page-date').textContent =
    `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`;
}
function route() {
  const h = location.hash || '#/leads';
  const v = VIEWS.find(x => x.hash === h) || VIEWS[0];
  $$('#nav .nav-item').forEach(el => el.classList.toggle('active', el.dataset.hash === v.hash));
  $('#page-title').textContent = v.title;
  v.fn();
  renderNav();
}
function init() {
  Store.init();
  renderNav(); renderUserSwitch(); renderDate();
  $('#user-switch').addEventListener('change', e => {
    state.uid = e.target.value;
    localStorage.setItem(UID_KEY, state.uid);
    state.custTab = 'mine'; state.schedTab = 'mine';
    route();
  });
  $('#btn-reset').addEventListener('click', () => {
    confirmDlg('重置演示数据', '将清空当前所有改动并恢复初始演示数据，确定继续吗？', () => {
      Store.reset(); toast('演示数据已重置'); route();
    }, '重置');
  });
  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/leads'; else route();
}

/* =========================================================
 * 模块一：线索池
 * ========================================================= */
function activeLeads() { return Store.data.leads.filter(l => !l.deletedAt); }
function allLeadTags() {
  const s = new Set();
  activeLeads().forEach(l => (l.tags || []).forEach(t => s.add(t)));
  return [...s];
}
function filteredLeads() {
  const f = state.leadF;
  return activeLeads().filter(l => {
    if (f.kw) {
      const s = (l.company + l.contact + l.phone + l.email + (l.remark || '')).toLowerCase();
      if (!s.includes(f.kw.toLowerCase())) return false;
    }
    if (f.source && l.source !== f.source) return false;
    if (f.status && l.status !== f.status) return false;
    if (f.owner === '__none' && l.ownerId) return false;
    if (f.owner && f.owner !== '__none' && l.ownerId !== f.owner) return false;
    if (f.tag && !(l.tags || []).includes(f.tag)) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function leadStatusBadge(st) {
  const map = {
    unassigned: 'badge-gray', assigned: 'badge-blue',
    converted: 'badge-green', discarded: 'badge-orange'
  };
  return `<span class="badge ${map[st] || 'badge-gray'}">${LEAD_STATUS[st] || st}</span>`;
}
function renderLeads() {
  const list = filteredLeads();
  const f = state.leadF;
  const tags = allLeadTags();
  $('#view').innerHTML = `
    <div class="card" style="padding:14px 16px;margin-bottom:14px">
      <div class="toolbar" style="margin-bottom:0">
        <input class="input" id="lf-kw" placeholder="搜索公司 / 联系人 / 电话 / 邮箱" style="width:240px" value="${esc(f.kw)}">
        <select class="select" id="lf-source" style="width:130px">
          <option value="">全部渠道</option>
          ${SOURCES.map(s => `<option ${f.source === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <select class="select" id="lf-status" style="width:120px">
          <option value="">全部状态</option>
          ${Object.entries(LEAD_STATUS).map(([k, v]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select class="select" id="lf-tag" style="width:130px">
          <option value="">全部标签</option>
          ${tags.map(t => `<option ${f.tag === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select>
        <select class="select" id="lf-owner" style="width:130px">
          <option value="">全部负责人</option>
          <option value="__none" ${f.owner === '__none' ? 'selected' : ''}>未分配</option>
          ${Store.data.users.map(u => `<option value="${u.id}" ${f.owner === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
        </select>
        <button class="btn btn-ghost btn-sm" onclick="resetLeadFilter()">重置</button>
        <div class="grow"></div>
        <button class="btn btn-primary" onclick="openLeadForm()">＋ 新建线索</button>
        ${isAdmin() ? `<button class="btn btn-ghost" onclick="openBatchAssign()" ${state.leadSel.size ? '' : 'disabled'}>批量分配</button>` : ''}
        <button class="btn btn-ghost" onclick="exportLeads()">⬇ 导出CSV</button>
        <button class="btn btn-ghost" onclick="openDupCheck()">🔍 智能查重</button>
        <button class="btn btn-ghost" onclick="openRecycleBin()">🗑 回收站</button>
      </div>
    </div>
    ${state.leadSel.size ? `
    <div class="batch-bar">
      已选择 <b>${state.leadSel.size}</b> 条线索
      <button class="btn btn-sm btn-ghost" onclick="clearLeadSel()">取消选择</button>
      <button class="btn btn-sm btn-primary" onclick="openBatchAssign()">分配负责人</button>
      <button class="btn btn-sm btn-ghost" onclick="exportSelectedLeads()">导出选中</button>
      <button class="btn btn-sm btn-danger" onclick="batchDeleteLeads()">删除</button>
    </div>` : ''}
    <div class="card table-wrap">
      <table class="tbl">
        <thead><tr>
          <th style="width:36px"><input type="checkbox" class="checkbox" id="check-all" ${list.length && list.every(l => state.leadSel.has(l.id)) ? 'checked' : ''}></th>
          <th>客户公司 / 联系人</th><th>联系方式</th><th>来源渠道</th><th>标签</th>
          <th>状态</th><th>负责人</th><th>创建时间</th><th></th>
        </tr></thead>
        <tbody>
          ${list.map(l => `
          <tr>
            <td><input type="checkbox" class="checkbox lf-check" data-id="${l.id}" ${state.leadSel.has(l.id) ? 'checked' : ''}></td>
            <td>
              <div class="main-cell">${esc(l.company)}</div>
              <div class="sub-cell">${esc(l.contact || '—')}${l.position ? ' · ' + esc(l.position) : ''}</div>
            </td>
            <td>
              <div>${esc(l.phone || '—')}</div>
              <div class="sub-cell">${esc(l.email || '')}</div>
            </td>
            <td><span class="badge badge-cyan">${esc(l.source)}</span></td>
            <td>${(l.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('') || '<span class="text-muted text-sm">—</span>'}</td>
            <td>${leadStatusBadge(l.status)}</td>
            <td>${l.ownerId ? avatarHtml(l.ownerId) + ' ' + esc(ownerName(l.ownerId)) : '<span class="badge badge-gray">未分配</span>'}</td>
            <td class="nowrap text-sm text-muted">${l.createdAt}</td>
            <td class="ops">
              ${l.status !== 'converted' ? `<button class="btn btn-xs btn-primary" onclick="convertLead('${l.id}')">转客户</button>` : ''}
              <button class="btn btn-xs btn-ghost" onclick="openLeadForm('${l.id}')">编辑</button>
              <button class="btn btn-xs btn-danger" onclick="deleteLead('${l.id}')">删除</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${!list.length ? '<div class="empty"><div class="empty-ico">📭</div>暂无符合条件的线索</div>' : ''}
    </div>
    <div class="text-muted text-sm" style="margin-top:8px">共 ${list.length} 条线索（线索池总计 ${activeLeads().length} 条，回收站 ${Store.data.leads.filter(l => l.deletedAt).length} 条）</div>`;

  /* 绑定筛选 */
  $('#lf-kw').oninput = e => { state.leadF.kw = e.target.value; };
  $('#lf-kw').onchange = renderLeads;
  $('#lf-source').onchange = e => { state.leadF.source = e.target.value; renderLeads(); };
  $('#lf-status').onchange = e => { state.leadF.status = e.target.value; renderLeads(); };
  $('#lf-tag').onchange = e => { state.leadF.tag = e.target.value; renderLeads(); };
  $('#lf-owner').onchange = e => { state.leadF.owner = e.target.value; renderLeads(); };
  $('#check-all').onchange = e => {
    list.forEach(l => e.target.checked ? state.leadSel.add(l.id) : state.leadSel.delete(l.id));
    renderLeads();
  };
  $$('.lf-check').forEach(cb => cb.onchange = () => {
    cb.checked ? state.leadSel.add(cb.dataset.id) : state.leadSel.delete(cb.dataset.id);
    renderLeads();
  });
}
function resetLeadFilter() {
  state.leadF = { kw: '', source: '', status: '', owner: '', tag: '' };
  renderLeads();
}
function clearLeadSel() { state.leadSel.clear(); renderLeads(); }

/* 新建 / 编辑线索 */
function openLeadForm(id) {
  const l = id ? Store.lead(id) : { company: '', contact: '', position: '', phone: '', email: '', source: SOURCES[0], tags: [], remark: '', ownerId: '' };
  openModal(`
    ${modalHeader(id ? '编辑线索' : '新建线索')}
    <div class="modal-body">
      <div class="form-row">
        <div class="field"><label class="field-label">客户公司<span class="req">*</span></label>
          <input class="input" id="ld-company" value="${esc(l.company)}" placeholder="如：深圳市华科电子有限公司"></div>
        <div class="field"><label class="field-label">联系人</label>
          <input class="input" id="ld-contact" value="${esc(l.contact)}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label class="field-label">职位</label>
          <input class="input" id="ld-position" value="${esc(l.position)}"></div>
        <div class="field"><label class="field-label">电话</label>
          <input class="input" id="ld-phone" value="${esc(l.phone)}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label class="field-label">邮箱</label>
          <input class="input" id="ld-email" value="${esc(l.email)}"></div>
        <div class="field"><label class="field-label">来源渠道</label>
          <select class="select" id="ld-source">${SOURCES.map(s => `<option ${l.source === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="field"><label class="field-label">标签（逗号分隔）</label>
          <input class="input" id="ld-tags" value="${esc((l.tags || []).join('，'))}" placeholder="如：高意向，大客户"></div>
        <div class="field"><label class="field-label">负责人</label>
          <select class="select" id="ld-owner">
            <option value="">未分配</option>
            ${Store.data.users.map(u => `<option value="${u.id}" ${l.ownerId === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
          </select></div>
      </div>
      <div class="field"><label class="field-label">备注</label>
        <textarea class="textarea" id="ld-remark" placeholder="线索需求、沟通要点等">${esc(l.remark || '')}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveLead('${id || ''}')">保存</button>
    </div>`);
}
function saveLead(id) {
  const v = k => $('#' + k).value.trim();
  const company = v('ld-company');
  if (!company) return toast('请填写客户公司名称', 'warn');
  const phone = v('ld-phone'), email = v('ld-email');
  const data = {
    company, contact: v('ld-contact'), position: v('ld-position'),
    phone, email, source: v('ld-source'),
    tags: v('ld-tags').split(/[,，]/).map(s => s.trim()).filter(Boolean),
    ownerId: v('ld-owner') || null, remark: v('ld-remark')
  };
  /* 保存时查重提示 */
  const dup = activeLeads().find(x => x.id !== id &&
    ((phone && x.phone === phone) || (email && x.email && x.email === email)));
  if (id) {
    Object.assign(Store.lead(id), data);
    Store.lead(id).status = data.ownerId ? 'assigned' : (Store.lead(id).status === 'assigned' ? 'unassigned' : Store.lead(id).status);
    toast('线索已更新' + (dup ? '，检测到疑似重复线索，建议使用智能查重' : ''), dup ? 'warn' : 'success');
  } else {
    Store.data.leads.push({
      id: uid('l'), ...data,
      status: data.ownerId ? 'assigned' : 'unassigned',
      createdAt: todayStr(), deletedAt: null
    });
    toast('线索已加入线索池' + (dup ? '，检测到疑似重复线索，建议使用智能查重' : ''), dup ? 'warn' : 'success');
  }
  Store.save(); closeModal(); renderLeads();
}
function deleteLead(id) {
  confirmDlg('删除线索', '线索将移入回收站，可在回收站还原或彻底删除。', () => {
    Store.lead(id).deletedAt = new Date().toISOString();
    state.leadSel.delete(id);
    Store.save(); renderLeads(); toast('已移入回收站');
  }, '移入回收站', false);
}
function batchDeleteLeads() {
  confirmDlg('批量删除', `将把选中的 ${state.leadSel.size} 条线索移入回收站，确定吗？`, () => {
    state.leadSel.forEach(id => { const l = Store.lead(id); if (l) l.deletedAt = new Date().toISOString(); });
    state.leadSel.clear();
    Store.save(); renderLeads(); toast('已移入回收站');
  }, '移入回收站', false);
}

/* 批量分配 */
function openBatchAssign() {
  const ids = [...state.leadSel];
  if (!ids.length) return toast('请先勾选线索', 'warn');
  openModal(`
    ${modalHeader('批量分配线索')}
    <div class="modal-body">
      <div class="field"><label class="field-label">分配给（${ids.length} 条线索）</label>
        <select class="select" id="ba-user">
          ${Store.data.users.map(u => `<option value="${u.id}">${esc(u.name)}（${u.title}）</option>`).join('')}
        </select></div>
      <div class="field-hint">分配后线索状态自动变为「已分配」，可在线索池继续筛选跟进。</div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="doBatchAssign()">确认分配</button>
    </div>`);
}
function doBatchAssign() {
  const uidv = $('#ba-user').value;
  state.leadSel.forEach(id => { const l = Store.lead(id); if (l) { l.ownerId = uidv; l.status = 'assigned'; } });
  Store.save(); closeModal(); state.leadSel.clear(); renderLeads();
  toast(`已分配 ${Store.user(uidv).name} ${state.leadSel.size || ''}条线索`);
}

/* 线索转客户 */
function convertLead(id) {
  const l = Store.lead(id);
  if (!l) return;
  confirmDlg('转化为客户', `将「${esc(l.company)}」转入客户池并建立客户档案，线索状态变为「已转化」。`, () => {
    const cid = uid('c');
    Store.data.customers.push({
      id: cid, company: l.company, contact: l.contact, position: l.position,
      phone: l.phone, email: l.email, source: l.source, level: 'B',
      tags: l.tags || [], ownerId: l.ownerId || state.uid,
      locked: true, inPublicSea: false, address: '',
      lastFollowAt: new Date().toISOString().slice(0, 16),
      createdAt: todayStr(), remark: l.remark || ''
    });
    if (l.contact) {
      Store.data.contacts.push({
        id: uid('ct'), customerId: cid, name: l.contact, position: l.position || '',
        phone: l.phone || '', email: l.email || '', note: '线索转化带入'
      });
    }
    Store.data.logs.push({
      id: uid('g'), customerId: cid, type: 'note',
      content: `客户由线索池转化建档（来源渠道：${l.source}）。${l.remark ? '线索备注：' + l.remark : ''}`,
      creatorId: state.uid, createdAt: new Date().toISOString().slice(0, 16)
    });
    l.status = 'converted';
    Store.save(); renderLeads(); toast('已转化为客户并建档');
  }, '确认转化', false);
}

/* 导出 CSV */
function leadsToCSV(list) {
  const header = ['客户公司', '联系人', '职位', '电话', '邮箱', '来源渠道', '标签', '状态', '负责人', '创建时间', '备注'];
  const rows = list.map(l => [l.company, l.contact, l.position, l.phone, l.email, l.source,
    (l.tags || []).join('/'), LEAD_STATUS[l.status] || '', ownerName(l.ownerId), l.createdAt, l.remark || '']);
  return [header, ...rows].map(r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}
function downloadCSV(csv, name) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); // ﻿ 为 Excel 识别的 BOM 头
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
function exportLeads() {
  const list = filteredLeads();
  if (!list.length) return toast('没有可导出的线索', 'warn');
  downloadCSV(leadsToCSV(list), `线索池导出_${todayStr()}.csv`);
  toast(`已导出 ${list.length} 条线索`);
}
function exportSelectedLeads() {
  const list = [...state.leadSel].map(id => Store.lead(id)).filter(Boolean);
  if (!list.length) return toast('请先勾选线索', 'warn');
  downloadCSV(leadsToCSV(list), `线索选中导出_${todayStr()}.csv`);
  toast(`已导出 ${list.length} 条线索`);
}

/* 智能查重 */
function findDupGroups() {
  const leads = activeLeads();
  const groups = [];
  const seen = new Set();
  const byKey = (key, val) => {
    if (!val) return;
    const items = leads.filter(l => (l[key] || '').replace(/[\s-]/g, '') === val.replace(/[\s-]/g, ''));
    if (items.length > 1) {
      const sig = key + ':' + val + ':' + items.map(i => i.id).sort().join(',');
      if (!seen.has(sig)) { seen.add(sig); groups.push({ type: key === 'phone' ? '相同电话' : '相同邮箱', key: val, items }); }
    }
  };
  leads.forEach(l => { byKey('phone', l.phone); byKey('email', l.email); });
  return groups;
}
function openDupCheck() {
  const groups = findDupGroups();
  openModal(`
    ${modalHeader('智能查重')}
    <div class="modal-body">
      ${groups.length ? groups.map((g, gi) => `
        <div class="dup-group">
          <div class="dup-group-head"><span class="dup-type">⚠ ${g.type}</span><span class="text-muted">${esc(g.key)}</span>
            <span class="text-muted">— ${g.items.length} 条重复</span></div>
          ${g.items.map(l => `
            <div class="dup-item">
              <div>
                <div class="dup-main">${esc(l.company)}</div>
                <div class="dup-sub">${esc(l.contact || '')} · ${esc(l.phone || '')} · ${esc(l.source)} · ${LEAD_STATUS[l.status]}</div>
              </div>
              ${l.status === 'converted' ? '<span class="badge badge-green">已转客户</span>' : ''}
            </div>`).join('')}
          <div class="flex-between" style="margin-top:4px">
            <span class="text-sm text-muted">合并将保留第 1 条为主线索，其余移入回收站</span>
            <button class="btn btn-sm btn-primary" onclick="mergeDupGroup(${gi})">合并为一条</button>
          </div>
        </div>`).join('')
      : '<div class="empty"><div class="empty-ico">✅</div>未发现重复线索<br><span class="text-sm">系统按「电话 / 邮箱」自动比对所有渠道汇入的线索</span></div>'}
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">关闭</button></div>`, true);
  window._dupGroups = groups;
}
function mergeDupGroup(gi) {
  const g = window._dupGroups[gi];
  const keep = g.items[0];
  g.items.slice(1).forEach(l => {
    l.deletedAt = new Date().toISOString();
    l.remark = (l.remark ? l.remark + '；' : '') + `查重合并至主线索「${keep.company}」`;
  });
  Store.save(); closeModal(); renderLeads();
  toast(`已合并，${g.items.length - 1} 条重复线索移入回收站`);
}

/* 回收站 */
function openRecycleBin() {
  const list = Store.data.leads.filter(l => l.deletedAt).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  openModal(`
    ${modalHeader(`线索回收站（${list.length}）`) }
    <div class="modal-body">
      ${list.length ? `
      <div class="flex-between mb-12">
        <span class="text-sm text-muted">回收站线索可还原回线索池，或彻底删除</span>
        <button class="btn btn-sm btn-danger" onclick="emptyRecycleBin()">清空回收站</button>
      </div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>客户公司</th><th>联系人</th><th>来源</th><th>删除时间</th><th></th></tr></thead>
        <tbody>
          ${list.map(l => `<tr>
            <td class="main-cell">${esc(l.company)}</td>
            <td>${esc(l.contact || '—')}</td>
            <td><span class="badge badge-cyan">${esc(l.source)}</span></td>
            <td class="text-sm text-muted nowrap">${(l.deletedAt || '').replace('T', ' ').slice(0, 16)}</td>
            <td class="ops">
              <button class="btn btn-xs btn-primary" onclick="restoreLead('${l.id}')">还原</button>
              <button class="btn btn-xs btn-danger" onclick="destroyLead('${l.id}')">彻底删除</button>
            </td></tr>`).join('')}
        </tbody></table></div>`
      : '<div class="empty"><div class="empty-ico">🗑</div>回收站为空</div>'}
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">关闭</button></div>`, true);
}
function restoreLead(id) {
  const l = Store.lead(id);
  l.deletedAt = null;
  if (l.status === 'discarded') l.status = l.ownerId ? 'assigned' : 'unassigned';
  Store.save(); openRecycleBin(); renderLeads(); toast('线索已还原至线索池');
}
function destroyLead(id) {
  confirmDlg('彻底删除', '彻底删除后数据无法恢复，确定吗？', () => {
    Store.data.leads = Store.data.leads.filter(l => l.id !== id);
    Store.save(); openRecycleBin(); renderLeads(); toast('已彻底删除');
  }, '彻底删除');
}
function emptyRecycleBin() {
  confirmDlg('清空回收站', '将永久删除回收站中的全部线索，确定吗？', () => {
    Store.data.leads = Store.data.leads.filter(l => !l.deletedAt);
    Store.save(); openRecycleBin(); renderLeads(); toast('回收站已清空');
  }, '清空');
}

/* =========================================================
 * 模块二：客户池（保护 / 移交 / 公海 / 时效提醒）
 * ========================================================= */
function followStatus(c) {
  if (c.inPublicSea) return { label: '公海待认领', cls: 'badge-cyan' };
  const d = daysSince(c.lastFollowAt);
  if (d === null) return { label: '未跟进', cls: 'badge-gray' };
  if (d > 30) return { label: `超期${d}天未跟进`, cls: 'badge-red' };
  if (d >= 7) return { label: `待跟进（${d}天）`, cls: 'badge-orange' };
  return { label: '跟进正常', cls: 'badge-green' };
}
function visibleCustomers() {
  if (isAdmin()) return Store.data.customers;
  return Store.data.customers.filter(c => c.ownerId === state.uid || c.inPublicSea);
}
function renderCustomers() {
  const all = visibleCustomers();
  const mine = all.filter(c => c.ownerId === state.uid && !c.inPublicSea);
  const sea = all.filter(c => c.inPublicSea || !c.ownerId);
  const stale = Store.data.customers.filter(c =>
    c.ownerId && !c.inPublicSea && daysSince(c.lastFollowAt) > 30);
  const soon = Store.data.customers.filter(c => {
    const d = daysSince(c.lastFollowAt);
    return c.ownerId && !c.inPublicSea && d >= 7 && d <= 30;
  });
  const tab = state.custTab;
  const list = tab === 'mine' ? mine : tab === 'sea' ? sea : Store.data.customers;

  $('#view').innerHTML = `
    ${stale.length ? `
    <div class="banner banner-danger">
      <span>⏰ <b>${stale.length}</b> 个客户已超过 30 天未跟进，按规则应回收至客户公海重新分配：${stale.slice(0, 3).map(c => esc(c.company)).join('、')}${stale.length > 3 ? ' 等' : ''}</span>
      ${isAdmin() ? `<button class="btn btn-sm btn-danger" onclick="recycleStaleCustomers()">一键回收至公海</button>` : '<span class="text-sm">（请通知销售经理处理）</span>'}
    </div>` : ''}
    ${soon.length ? `
    <div class="banner banner-warning">
      <span>🔔 <b>${soon.length}</b> 个客户跟进时效即将超期（7~30天未跟进），请及时安排回访。</span>
    </div>` : ''}
    <div class="tabs">
      <div class="tab ${tab === 'mine' ? 'active' : ''}" onclick="switchCustTab('mine')">我的客户<span class="tab-count">${mine.length}</span></div>
      <div class="tab ${tab === 'sea' ? 'active' : ''}" onclick="switchCustTab('sea')">客户公海<span class="tab-count">${sea.length}</span></div>
      ${isAdmin() ? `<div class="tab ${tab === 'all' ? 'active' : ''}" onclick="switchCustTab('all')">全部客户<span class="tab-count">${Store.data.customers.length}</span></div>` : ''}
      <div style="flex:1"></div>
      <button class="btn btn-primary" style="margin-bottom:6px" onclick="openCustomerForm()">＋ 新建客户</button>
    </div>
    <div class="card table-wrap">
      <table class="tbl">
        <thead><tr>
          <th>客户公司 / 联系人</th><th>等级</th><th>来源</th><th>标签</th>
          <th>负责人 / 保护状态</th><th>最近跟进</th><th>跟进时效</th><th></th>
        </tr></thead>
        <tbody>
          ${list.map(c => {
            const fs = followStatus(c);
            return `<tr>
              <td style="cursor:pointer" onclick="openCustomer('${c.id}')">
                <div class="main-cell" style="color:var(--primary)">${esc(c.company)}</div>
                <div class="sub-cell">${esc(c.contact || '—')}${c.position ? ' · ' + esc(c.position) : ''} · ${esc(c.phone || '')}</div>
              </td>
              <td><span class="badge ${c.level === 'A' ? 'badge-red' : c.level === 'B' ? 'badge-blue' : 'badge-gray'}">${esc(LEVELS[c.level] || c.level)}</span></td>
              <td><span class="badge badge-cyan">${esc(c.source)}</span></td>
              <td>${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('') || '<span class="text-muted text-sm">—</span>'}</td>
              <td>
                ${c.ownerId ? `${avatarHtml(c.ownerId)} ${esc(ownerName(c.ownerId))}` : '<span class="badge badge-cyan">公海客户</span>'}
                <div style="margin-top:3px">${c.locked ? '<span class="badge badge-green">🔒 已锁定保护</span>' : c.ownerId ? '<span class="badge badge-gray">未锁定</span>' : ''}</div>
              </td>
              <td class="nowrap text-sm">${c.lastFollowAt ? esc(c.lastFollowAt.replace('T', ' ').slice(0, 16)) : '—'}</td>
              <td><span class="badge ${fs.cls}">${fs.label}</span></td>
              <td class="ops">
                <button class="btn btn-xs btn-ghost" onclick="openCustomer('${c.id}')">档案</button>
                ${c.inPublicSea
                  ? `<button class="btn btn-xs btn-primary" onclick="claimCustomer('${c.id}')">认领</button>`
                  : `
                    ${canEdit(c.ownerId) ? `<button class="btn btn-xs btn-primary" onclick="openFollowModal('${c.id}')">跟进</button>` : ''}
                    ${canEdit(c.ownerId) ? `<button class="btn btn-xs btn-ghost" onclick="toggleLock('${c.id}')">${c.locked ? '解锁' : '锁定'}</button>` : ''}
                    ${isAdmin() ? `<button class="btn btn-xs btn-ghost" onclick="openTransferModal('${c.id}')">移交</button>` : ''}
                    ${canEdit(c.ownerId) ? `<button class="btn btn-xs btn-danger" onclick="moveToSea('${c.id}')">放入公海</button>` : ''}
                  `}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${!list.length ? '<div class="empty"><div class="empty-ico">🌊</div>' + (tab === 'sea' ? '公海暂无客户，长期未跟进的客户将回收到这里' : '暂无客户，可从线索池转化或新建') + '</div>' : ''}
    </div>
    <div class="text-muted text-sm" style="margin-top:8px">
      规则：客户锁定后他人不可重复跟进（防撞客）；超过 30 天未跟进的客户将被回收至公海，销售可自行认领；销售之间客户移交需由经理操作。
    </div>`;
}
function switchCustTab(t) { state.custTab = t; renderCustomers(); }

function addLog(customerId, type, content) {
  Store.data.logs.push({
    id: uid('g'), customerId, type, content,
    creatorId: state.uid, createdAt: new Date().toISOString().slice(0, 16)
  });
}
function toggleLock(id) {
  const c = Store.customer(id);
  c.locked = !c.locked;
  addLog(id, 'note', c.locked ? '客户已锁定保护，其他销售不可重复跟进。' : '客户已解除锁定。');
  Store.save(); renderCustomers(); toast(c.locked ? '客户已锁定，防止撞客' : '客户已解锁');
}
function moveToSea(id) {
  const c = Store.customer(id);
  confirmDlg('放入公海', `将「${esc(c.company)}」放入客户公海？放入后该客户将解除负责人，其他销售可认领。`, () => {
    const oldOwner = ownerName(c.ownerId);
    c.ownerId = null; c.locked = false; c.inPublicSea = true;
    addLog(id, 'note', `客户由${oldOwner}放入公海池，等待重新认领。`);
    Store.save(); renderCustomers(); toast('已放入客户公海');
  }, '放入公海', false);
}
function claimCustomer(id) {
  const c = Store.customer(id);
  c.ownerId = state.uid; c.locked = true; c.inPublicSea = false;
  c.lastFollowAt = new Date().toISOString().slice(0, 16);
  addLog(id, 'note', `${currentUser().name}从公海认领该客户，客户已锁定保护。`);
  Store.save(); renderCustomers(); toast('认领成功，客户已锁定到您名下');
}
function recycleStaleCustomers() {
  const stale = Store.data.customers.filter(c =>
    c.ownerId && !c.inPublicSea && daysSince(c.lastFollowAt) > 30);
  confirmDlg('回收超期客户', `将 ${stale.length} 个超 30 天未跟进的客户全部回收至公海？`, () => {
    stale.forEach(c => {
      addLog(c.id, 'note', `超 ${daysSince(c.lastFollowAt)} 天未跟进，系统回收至公海池。`);
      c.ownerId = null; c.locked = false; c.inPublicSea = true;
    });
    Store.save(); renderCustomers(); toast(`已回收 ${stale.length} 个客户至公海`);
  }, '一键回收', false);
}
function openTransferModal(id) {
  const c = Store.customer(id);
  openModal(`
    ${modalHeader('客户移交')}
    <div class="modal-body">
      <div class="banner banner-info" style="margin-bottom:14px">将客户「${esc(c.company)}」移交给其他销售，移交后客户自动锁定保护。</div>
      <div class="field"><label class="field-label">移交给</label>
        <select class="select" id="tr-user">
          ${Store.data.users.filter(u => u.id !== c.ownerId).map(u =>
            `<option value="${u.id}">${esc(u.name)}（${u.title}）</option>`).join('')}
        </select></div>
      <div class="field"><label class="field-label">移交备注</label>
        <textarea class="textarea" id="tr-note" placeholder="如：客户跟进进展、注意事项等"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="doTransfer('${id}')">确认移交</button>
    </div>`);
}
function doTransfer(id) {
  const c = Store.customer(id);
  const target = $('#tr-user').value;
  const note = $('#tr-note').value.trim();
  addLog(id, 'note', `客户由${ownerName(c.ownerId)}移交至${ownerName(target)}。${note ? '移交备注：' + note : ''}`);
  c.ownerId = target; c.locked = true; c.inPublicSea = false;
  Store.save(); closeModal(); renderCustomers(); toast(`已移交给 ${ownerName(target)}`);
}
function openFollowModal(id) {
  const c = Store.customer(id);
  openModal(`
    ${modalHeader('添加跟进记录 · ' + c.company)}
    <div class="modal-body">
      <div class="field"><label class="field-label">跟进方式</label>
        <select class="select" id="fl-type">
          ${Object.entries(LOG_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
        </select></div>
      <div class="field"><label class="field-label">跟进内容<span class="req">*</span></label>
        <textarea class="textarea" id="fl-content" style="min-height:110px" placeholder="记录本次沟通要点：客户反馈、意向、下一步计划等"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="doFollow('${id}')">保存跟进</button>
    </div>`);
}
function doFollow(id) {
  const content = $('#fl-content').value.trim();
  if (!content) return toast('请填写跟进内容', 'warn');
  addLog(id, $('#fl-type').value, content);
  const c = Store.customer(id);
  c.lastFollowAt = new Date().toISOString().slice(0, 16);
  Store.save(); closeModal();
  if ($('#drawer-root').innerHTML) renderDrawer(c);
  renderCustomers();
  toast('跟进记录已保存');
}

/* 新建 / 编辑客户 */
function openCustomerForm(id) {
  const c = id ? Store.customer(id) : { company: '', contact: '', position: '', phone: '', email: '', source: SOURCES[0], level: 'B', tags: [], address: '', remark: '' };
  openModal(`
    ${modalHeader(id ? '编辑客户' : '新建客户')}
    <div class="modal-body">
      <div class="form-row">
        <div class="field"><label class="field-label">客户公司<span class="req">*</span></label>
          <input class="input" id="cu-company" value="${esc(c.company)}"></div>
        <div class="field"><label class="field-label">客户等级</label>
          <select class="select" id="cu-level">
          ${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}" ${c.level === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="field"><label class="field-label">联系人</label>
          <input class="input" id="cu-contact" value="${esc(c.contact)}"></div>
        <div class="field"><label class="field-label">职位</label>
          <input class="input" id="cu-position" value="${esc(c.position)}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label class="field-label">电话</label>
          <input class="input" id="cu-phone" value="${esc(c.phone)}"></div>
        <div class="field"><label class="field-label">邮箱</label>
          <input class="input" id="cu-email" value="${esc(c.email)}"></div>
      </div>
      <div class="form-row">
        <div class="field"><label class="field-label">来源渠道</label>
          <select class="select" id="cu-source">${SOURCES.map(s => `<option ${c.source === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label class="field-label">标签（逗号分隔）</label>
          <input class="input" id="cu-tags" value="${esc((c.tags || []).join('，'))}"></div>
      </div>
      <div class="field"><label class="field-label">公司地址</label>
        <input class="input" id="cu-address" value="${esc(c.address || '')}"></div>
      <div class="field"><label class="field-label">备注</label>
        <textarea class="textarea" id="cu-remark">${esc(c.remark || '')}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveCustomer('${id || ''}')">保存</button>
    </div>`);
}
function saveCustomer(id) {
  const v = k => $('#' + k).value.trim();
  const company = v('cu-company');
  if (!company) return toast('请填写客户公司名称', 'warn');
  const data = {
    company, level: v('cu-level'), contact: v('cu-contact'), position: v('cu-position'),
    phone: v('cu-phone'), email: v('cu-email'), source: v('cu-source'),
    tags: v('cu-tags').split(/[,，]/).map(s => s.trim()).filter(Boolean),
    address: v('cu-address'), remark: v('cu-remark')
  };
  if (id) {
    Object.assign(Store.customer(id), data);
    toast('客户资料已更新');
  } else {
    const cid = uid('c');
    Store.data.customers.push({
      id: cid, ...data, ownerId: state.uid, locked: true, inPublicSea: false,
      lastFollowAt: new Date().toISOString().slice(0, 16), createdAt: todayStr()
    });
    addLog(cid, 'note', '客户建档。');
    if (data.contact) Store.data.contacts.push({
      id: uid('ct'), customerId: cid, name: data.contact, position: data.position,
      phone: data.phone, email: data.email, note: ''
    });
    toast('客户已建档并锁定保护');
  }
  Store.save(); closeModal();
  if (id && $('#drawer-root').innerHTML) renderDrawer(Store.customer(id));
  route();
}

/* =========================================================
 * 模块三：客户档案（抽屉：跟进时间线 / 资料 / 联系人 / 商机）
 * ========================================================= */
function renderProfiles() {
  const kw = state.profKw.toLowerCase();
  const list = visibleCustomers().filter(c =>
    !kw || (c.company + c.contact + c.phone + (c.remark || '')).toLowerCase().includes(kw));
  $('#view').innerHTML = `
    <div class="toolbar">
      <input class="input" id="pf-kw" placeholder="搜索客户公司 / 联系人 / 电话" style="width:280px" value="${esc(state.profKw)}">
      <div class="grow"></div>
      <button class="btn btn-primary" onclick="openCustomerForm()">＋ 新建客户档案</button>
    </div>
    <div class="cust-grid">
      ${list.map(c => {
        const fs = followStatus(c);
        const logCount = Store.customerLogs(c.id).length;
        const oppCount = Store.customerOpps(c.id).length;
        return `
        <div class="cust-card" onclick="openCustomer('${c.id}')">
          <div class="cc-head">
            <div>
              <div class="cc-name">${esc(c.company)}</div>
              <div class="cc-line">👤 ${esc(c.contact || '—')} ${c.position ? '· ' + esc(c.position) : ''}</div>
              <div class="cc-line">📞 ${esc(c.phone || '—')} ${c.email ? '· ✉ ' + esc(c.email) : ''}</div>
            </div>
            <span class="badge ${c.level === 'A' ? 'badge-red' : c.level === 'B' ? 'badge-blue' : 'badge-gray'}">${c.level}类</span>
          </div>
          <div class="cc-line">${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('') || '<span class="text-muted text-sm">无标签</span>'}</div>
          <div class="cc-foot">
            ${c.ownerId ? avatarHtml(c.ownerId) + `<span class="text-sm">${esc(ownerName(c.ownerId))}</span>` : '<span class="badge badge-cyan">公海</span>'}
            ${c.locked ? '<span class="badge badge-green">🔒 锁定</span>' : ''}
            <span class="badge ${fs.cls}">${fs.label}</span>
            <span style="flex:1"></span>
            <span class="text-sm text-muted">📝 ${logCount} 条跟进 · 💼 ${oppCount} 个商机</span>
          </div>
        </div>`;
      }).join('')}
    </div>
    ${!list.length ? '<div class="empty"><div class="empty-ico">📁</div>暂无客户档案</div>' : ''}`;
  $('#pf-kw').oninput = e => { state.profKw = e.target.value; renderProfiles(); };
}

const LOG_TYPE_STYLE = {
  call: { cls: 'badge-blue', name: '电话' }, email: { cls: 'badge-cyan', name: '邮件' },
  wechat: { cls: 'badge-green', name: '微信' }, visit: { cls: 'badge-purple', name: '上门拜访' },
  quote: { cls: 'badge-orange', name: '报价' }, note: { cls: 'badge-gray', name: '备注' }
};
function openCustomer(id) {
  const c = Store.customer(id);
  if (!c) return;
  state.drawerTab = 'logs';
  renderDrawer(c);
}
function closeDrawer() {
  $('#drawer-root').innerHTML = '';
  route();
}
function switchDrawerTab(tab, cid) { state.drawerTab = tab; renderDrawer(Store.customer(cid)); }
function renderDrawer(c) {
  const tab = state.drawerTab;
  const logs = Store.customerLogs(c.id);
  const contacts = Store.customerContacts(c.id);
  const opps = Store.customerOpps(c.id);
  const fs = followStatus(c);
  let body = '';
  if (tab === 'logs') {
    body = `
      <div class="card" style="padding:14px;margin-bottom:16px;box-shadow:none;background:#f9fafb">
        <div class="field-label">✍️ 新增跟进日志</div>
        <div class="form-row" style="margin-bottom:8px">
          <select class="select" id="dw-type" style="max-width:130px">
            ${Object.entries(LOG_TYPE_STYLE).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}
          </select>
        </div>
        <textarea class="textarea" id="dw-content" style="min-height:80px" placeholder="记录电话、邮件、微信沟通、上门拜访、报价等跟进内容…"></textarea>
        <div style="text-align:right;margin-top:8px">
          <button class="btn btn-primary btn-sm" onclick="doDrawerFollow('${c.id}')">保存跟进记录</button>
        </div>
      </div>
      <div class="timeline">
        ${logs.map(g => {
          const st = LOG_TYPE_STYLE[g.type] || LOG_TYPE_STYLE.note;
          return `<div class="tl-item">
            <div><span class="tl-type badge ${st.cls}">${st.name}</span><span class="tl-time">${esc((g.createdAt || '').replace('T', ' '))}</span></div>
            <div class="tl-content">${esc(g.content)}</div>
            <div class="tl-user">— ${esc(ownerName(g.creatorId))}</div>
          </div>`;
        }).join('')}
        ${!logs.length ? '<div class="empty"><div class="empty-ico">📝</div>暂无跟进记录，快来添加第一条吧</div>' : ''}
      </div>`;
  } else if (tab === 'info') {
    body = `
      <div class="info-grid">
        <div class="info-item"><div class="info-label">客户公司</div><div class="info-value">${esc(c.company)}</div></div>
        <div class="info-item"><div class="info-label">客户等级</div><div class="info-value">${esc(LEVELS[c.level] || c.level)}</div></div>
        <div class="info-item"><div class="info-label">联系人</div><div class="info-value">${esc(c.contact || '—')}</div></div>
        <div class="info-item"><div class="info-label">职位</div><div class="info-value">${esc(c.position || '—')}</div></div>
        <div class="info-item"><div class="info-label">电话</div><div class="info-value">${esc(c.phone || '—')}</div></div>
        <div class="info-item"><div class="info-label">邮箱</div><div class="info-value">${esc(c.email || '—')}</div></div>
        <div class="info-item"><div class="info-label">来源渠道</div><div class="info-value"><span class="badge badge-cyan">${esc(c.source)}</span></div></div>
        <div class="info-item"><div class="info-label">负责人</div><div class="info-value">${c.ownerId ? esc(ownerName(c.ownerId)) : '公海待认领'}</div></div>
        <div class="info-item" style="grid-column:1/3"><div class="info-label">公司地址</div><div class="info-value">${esc(c.address || '—')}</div></div>
        <div class="info-item" style="grid-column:1/3"><div class="info-label">备注</div><div class="info-value">${esc(c.remark || '—')}</div></div>
        <div class="info-item"><div class="info-label">建档时间</div><div class="info-value">${esc(c.createdAt)}</div></div>
        <div class="info-item"><div class="info-label">最近跟进</div><div class="info-value">${c.lastFollowAt ? esc(c.lastFollowAt.replace('T', ' ')) : '—'}</div></div>
      </div>
      <div style="margin-top:16px"><button class="btn btn-ghost" onclick="closeModal();openCustomerForm('${c.id}')">✏️ 编辑资料</button></div>`;
  } else if (tab === 'contacts') {
    body = `
      <div style="margin-bottom:14px">
        ${contacts.map(ct => `
          <div class="dup-item" style="cursor:default">
            <div style="flex:1">
              <div class="dup-main">${esc(ct.name)} <span class="text-muted text-sm" style="font-weight:400">${esc(ct.position || '')}</span></div>
              <div class="dup-sub">📞 ${esc(ct.phone || '—')} · ✉ ${esc(ct.email || '—')}${ct.note ? ' · ' + esc(ct.note) : ''}</div>
            </div>
            <button class="btn btn-xs btn-danger" onclick="deleteContact('${ct.id}','${c.id}')">删除</button>
          </div>`).join('')}
        ${!contacts.length ? '<div class="empty" style="padding:24px">暂无联系人</div>' : ''}
      </div>
      <div class="card" style="padding:14px;box-shadow:none;background:#f9fafb">
        <div class="field-label">➕ 添加联系人</div>
        <div class="form-row">
          <div class="field"><input class="input" id="ct-name" placeholder="姓名*"></div>
          <div class="field"><input class="input" id="ct-position" placeholder="职位"></div>
        </div>
        <div class="form-row">
          <div class="field"><input class="input" id="ct-phone" placeholder="电话"></div>
          <div class="field"><input class="input" id="ct-email" placeholder="邮箱"></div>
        </div>
        <div class="field" style="margin-bottom:8px"><input class="input" id="ct-note" placeholder="备注（决策角色、偏好等）"></div>
        <div style="text-align:right"><button class="btn btn-primary btn-sm" onclick="addContact('${c.id}')">保存联系人</button></div>
      </div>`;
  } else {
    body = `
      <div style="margin-bottom:14px">
        ${opps.map(o => {
          const st = OPP_STAGES.find(s => s.key === o.stage);
          const overdue = !['won', 'lost'].includes(o.stage) && o.expectedClose < todayStr();
          return `<div class="dup-item" style="cursor:default;display:block">
            <div class="flex-between">
              <div class="dup-main">${esc(o.name)}</div>
              <span class="badge" style="background:${st.color}18;color:${st.color}">${st.name}</span>
            </div>
            <div class="dup-sub" style="margin-top:4px">
              意向产品：${esc(o.products || '—')} · 预算：<b class="text-warning">¥${Number(o.budget || 0).toLocaleString()}</b>
              · 预计成交：${esc(o.expectedClose)} ${overdue ? '<span class="text-danger">（已到期）</span>' : ''}
            </div>
          </div>`;
        }).join('')}
        ${!opps.length ? '<div class="empty" style="padding:24px">暂无商机</div>' : ''}
      </div>
      <button class="btn btn-primary btn-sm" onclick="closeModal();openOppForm('','${c.id}')">＋ 为该客户新建商机</button>`;
  }

  $('#drawer-root').innerHTML = `
    <div class="drawer-mask" onclick="closeDrawer()"></div>
    <div class="drawer">
      <div class="drawer-header">
        <div class="flex-between">
          <div>
            <div style="font-size:17px;font-weight:700">${esc(c.company)}
              <span class="badge ${c.level === 'A' ? 'badge-red' : c.level === 'B' ? 'badge-blue' : 'badge-gray'}" style="vertical-align:2px">${c.level}类</span>
            </div>
            <div class="text-sm text-muted" style="margin-top:4px">
              ${esc(c.contact || '—')} · ${esc(c.phone || '—')} · 来源：${esc(c.source)}
              ${c.ownerId ? ' · 负责人：' + esc(ownerName(c.ownerId)) : ' · 公海客户'}
            </div>
            <div style="margin-top:6px">
              ${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
              ${c.locked ? '<span class="badge badge-green">🔒 锁定保护</span>' : ''}
              <span class="badge ${fs.cls}>${fs.label}</span>
            </div>
          </div>
          <button class="modal-close" onclick="closeDrawer()">×</button>
        </div>
        <div class="tabs" style="margin:14px 0 0">
          ${[['logs', '跟进记录'], ['info', '基础资料'], ['contacts', '联系人'], ['opps', '商机']].map(([k, n]) =>
            `<div class="tab ${tab === k ? 'active' : ''}" onclick="switchDrawerTab('${k}','${c.id}')">${n}</div>`).join('')}
        </div>
      </div>
      <div class="drawer-body">${body}</div>
      <div class="drawer-footer">
        <button class="btn btn-ghost" onclick="openFollowModal('${c.id}')">📝 快速跟进</button>
        <button class="btn btn-primary" onclick="closeDrawer()">关闭</button>
      </div>
    </div>`;
}
function doDrawerFollow(cid) {
  const content = $('#dw-content').value.trim();
  if (!content) return toast('请填写跟进内容', 'warn');
  addLog(cid, $('#dw-type').value, content);
  const c = Store.customer(cid);
  c.lastFollowAt = new Date().toISOString().slice(0, 16);
  Store.save(); renderDrawer(c); toast('跟进记录已沉淀至客户档案');
}
function addContact(cid) {
  const v = k => $('#' + k).value.trim();
  if (!v('ct-name')) return toast('请填写联系人姓名', 'warn');
  Store.data.contacts.push({
    id: uid('ct'), customerId: cid, name: v('ct-name'), position: v('ct-position'),
    phone: v('ct-phone'), email: v('ct-email'), note: v('ct-note')
  });
  Store.save(); renderDrawer(Store.customer(cid)); toast('联系人已添加');
}
function deleteContact(id, cid) {
  Store.data.contacts = Store.data.contacts.filter(x => x.id !== id);
  Store.save(); renderDrawer(Store.customer(cid)); toast('联系人已删除');
}

/* =========================================================
 * 模块四：商机管理（阶段看板 + 到期提醒）
 * ========================================================= */
function renderOpps() {
  const opps = Store.data.opportunities;
  const open = opps.filter(o => !['won', 'lost'].includes(o.stage));
  const won = opps.filter(o => o.stage === 'won');
  const overdue = open.filter(o => o.expectedClose < todayStr());
  const totalBudget = open.reduce((s, o) => s + Number(o.budget || 0), 0);

  $('#view').innerHTML = `
    <div class="stat-row">
      <div class="stat-card accent-blue"><div class="stat-label">进行中商机</div><div class="stat-value">${open.length}<small>个</small></div></div>
      <div class="stat-card accent-orange"><div class="stat-label">进行中商机预算</div><div class="stat-value">${(totalBudget / 10000).toFixed(1)}<small>万元</small></div></div>
      <div class="stat-card accent-green"><div class="stat-label">已成交</div><div class="stat-value">${won.length}<small>个</small></div></div>
      <div class="stat-card accent-red"><div class="stat-label">已到期未闭环</div><div class="stat-value">${overdue.length}<small>个</small></div></div>
    </div>
    ${overdue.length ? `<div class="banner banner-danger"><span>⏰ <b>${overdue.length}</b> 个商机已过预计成交日期但尚未成交/失败：${overdue.map(o => esc(o.name)).join('、')}，请尽快推进或更新阶段。</span></div>` : ''}
    <div class="toolbar">
      <span class="text-sm text-muted">💡 拖拽卡片可更新商机阶段，点击卡片查看/编辑详情</span>
      <div class="grow"></div>
      <button class="btn btn-primary" onclick="openOppForm()">＋ 新建商机</button>
    </div>
    <div class="kanban">
      ${OPP_STAGES.map(st => {
        const items = opps.filter(o => o.stage === st.key).sort((a, b) => a.expectedClose.localeCompare(b.expectedClose));
        return `
        <div class="kcol" data-stage="${st.key}">
          <div class="kcol-head">
            <span class="stage-dot" style="background:${st.color}"></span>${st.name}
            <span class="kcount">${items.length}</span>
          </div>
          ${items.map(o => {
            const c = Store.customer(o.customerId);
            const od = !['won', 'lost'].includes(o.stage) && o.expectedClose < todayStr();
            return `
            <div class="kcard" draggable="true" data-id="${o.id}" onclick="openOppForm('${o.id}')">
              <div class="kc-name">${esc(o.name)}${od ? ' <span class="badge badge-red" style="font-size:10px">已到期</span>' : ''}</div>
              <div class="kc-line">🏢 ${esc(c ? c.company : '—')}</div>
              <div class="kc-line">📦 ${esc(o.products || '—')}</div>
              <div class="kc-line">💰 <b class="text-warning">¥${Number(o.budget || 0).toLocaleString()}</b></div>
              <div class="kc-line">📅 ${esc(o.expectedClose)} ${od ? '<span class="text-danger">⚠ 到期</span>' : ''}</div>
              <div class="kc-tags">
                ${o.ownerId ? avatarHtml(o.ownerId) : ''}
                <span class="badge badge-gray">询盘</span>
              </div>
            </div>`;
          }).join('')}
        </div>`;
      }).join('')}
    </div>`;

  /* 拖拽切换阶段 */
  $$('.kcard').forEach(card => {
    card.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', card.dataset.id));
  });
  $$('.kcol').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const o = Store.opp(id);
      if (!o) return;
      const target = col.dataset.stage;
      if (o.stage === target) return;
      if (!canEdit(o.ownerId)) return toast('只能推进自己负责的商机', 'warn');
      const stName = OPP_STAGES.find(s => s.key === target).name;
      o.stage = target;
      Store.save(); renderOpps();
      toast(`商机已推进至「${stName}」阶段`);
    });
  });
}
function openOppForm(id, presetCid) {
  const o = id ? Store.opp(id) : {
    name: '', customerId: presetCid || '', products: '', budget: '',
    stage: 'initial', expectedClose: dayStr(14), inquiry: '', ownerId: state.uid
  };
  const customers = isAdmin() ? Store.data.customers : visibleCustomers();
  openModal(`
    ${modalHeader(id ? '编辑商机' : '新建商机')}
    <div class="modal-body">
      <div class="field"><label class="field-label">商机名称<span class="req">*</span></label>
        <input class="input" id="op-name" value="${esc(o.name)}" placeholder="如：华科电子-智能手表年度采购"></div>
      <div class="form-row">
        <div class="field"><label class="field-label">关联客户<span class="req">*</span></label>
          <select class="select" id="op-customer">
            <option value="">请选择客户</option>
            ${customers.map(c => `<option value="${c.id}" ${o.customerId === c.id ? 'selected' : ''}>${esc(c.company)}</option>`).join('')}
          </select></div>
        <div class="field"><label class="field-label">商机阶段</label>
          <select class="select" id="op-stage">
            ${OPP_STAGES.map(s => `<option value="${s.key}" ${o.stage === s.key ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select></div>
      </div>
      <div class="field"><label class="field-label">意向产品</label>
        <input class="input" id="op-products" value="${esc(o.products || '')}" placeholder="如：智能手表整机 / SaaS账号"></div>
      <div class="form-row">
        <div class="field"><label class="field-label">预算金额（元）</label>
          <input class="input" id="op-budget" type="number" value="${o.budget || ''}" placeholder="如：280000"></div>
        <div class="field"><label class="field-label">预计成交日期</label>
          <input class="input" id="op-close" type="date" value="${esc(o.expectedClose || '')}"></div>
      </div>
      <div class="field"><label class="field-label">客户询盘 / 需求描述</label>
        <textarea class="textarea" id="op-inquiry" placeholder="记录客户采购咨询内容、关注点、决策链等">${esc(o.inquiry || '')}</textarea></div>
    </div>
    <div class="modal-footer">
      ${id && canEdit(o.ownerId) ? '<button class="btn btn-danger" style="margin-right:auto" onclick="deleteOpp(\'' + id + '\')">删除商机</button>' : ''}
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveOpp('${id || ''}')">保存</button>
    </div>`);
}
function saveOpp(id) {
  const v = k => $('#' + k).value.trim();
  if (!v('op-name')) return toast('请填写商机名称', 'warn');
  if (!v('op-customer')) return toast('请选择关联客户', 'warn');
  const data = {
    name: v('op-name'), customerId: v('op-customer'), stage: v('op-stage'),
    products: v('op-products'), budget: Number(v('op-budget')) || 0,
    expectedClose: v('op-close') || dayStr(14), inquiry: v('op-inquiry')
  };
  if (id) {
    Object.assign(Store.opp(id), data);
    toast('商机已更新');
  } else {
    Store.data.opportunities.push({
      id: uid('o'), ...data, ownerId: state.uid, createdAt: todayStr()
    });
    addLog(data.customerId, 'note', `新建商机「${data.name}」，阶段：初步接触，预算 ¥${data.budget.toLocaleString()}。`);
    toast('商机已创建');
  }
  Store.save(); closeModal();
  if ($('#drawer-root').innerHTML) renderDrawer(Store.customer(data.customerId));
  route();
}
function deleteOpp(id) {
  const o = Store.opp(id);
  confirmDlg('删除商机', `确定删除商机「${esc(o.name)}」吗？`, () => {
    Store.data.opportunities = Store.data.opportunities.filter(x => x.id !== id);
    Store.save(); closeModal(); route(); toast('商机已删除');
  }, '删除');
}

/* =========================================================
 * 模块五：日程管理（日历待办 + 日报 + 团队概览）
 * ========================================================= */
function myTasks() { return Store.data.tasks.filter(t => t.ownerId === state.uid); }
function renderSchedule() {
  if (isAdmin() && state.schedTab === 'team') return renderTeamSchedule();

  const tasks = myTasks();
  const overdueMine = tasks.filter(t => !t.done && t.date < todayStr());
  const overdueTeam = Store.data.tasks.filter(t => !t.done && t.date < todayStr());
  const overdue = isAdmin() ? overdueTeam : overdueMine;
  const todayTasks = tasks.filter(t => t.date === state.selectedDate);
  const report = Store.data.reports.find(r => r.ownerId === state.uid && r.date === state.selectedDate);

  $('#view').innerHTML = `
    ${isAdmin() ? `
    <div class="tabs">
      <div class="tab ${state.schedTab === 'mine' ? 'active' : ''}" onclick="switchSchedTab('mine')">我的日程</div>
      <div class="tab ${state.schedTab === 'team' ? 'active' : ''}" onclick="switchSchedTab('team')">团队概览</div>
    </div>` : ''}
    ${overdue.length ? `
    <div class="banner banner-danger">
      <span>🔔 ${isAdmin() ? '团队' : '您'}有 <b>${overdue.length}</b> 项任务已逾期未完成：${overdue.slice(0, 2).map(t => esc(t.title)).join('、')}${overdue.length > 2 ? ' 等' : ''}，请${isAdmin() ? '督促负责人' : '及时'}处理。</span>
    </div>` : ''}
    <div class="sched-layout">
      <div class="cal">
        <div class="cal-head">
          <div class="cal-title">${state.calYear}年${state.calMonth + 1}月</div>
          <div class="cal-nav">
            <button class="btn btn-ghost btn-sm" onclick="moveCal(-1)">‹</button>
            <button class="btn btn-ghost btn-sm" onclick="backToday()">今天</button>
            <button class="btn btn-ghost btn-sm" onclick="moveCal(1)">›</button>
          </div>
        </div>
        <div class="cal-grid">
          ${['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="cal-week">周${w}</div>`).join('')}
          ${buildCalCells().map(cell => {
            const dayTasks = tasks.filter(t => t.date === cell.ds);
            return `<div class="cal-cell ${cell.inMonth ? '' : 'other'} ${cell.ds === todayStr() ? 'today' : ''} ${cell.ds === state.selectedDate ? 'selected' : ''}"
              onclick="selectDate('${cell.ds}')">
              <div class="cal-date"><span>${cell.date.getDate()}</span>${dayTasks.filter(t => !t.done).length ? `<span class="badge badge-red" style="font-size:10px;padding:0 6px">${dayTasks.filter(t => !t.done).length}</span>` : ''}</div>
              ${dayTasks.slice(0, 3).map(t => `<div class="cal-task ${t.done ? 'done' : ''} ${t.priority === 'high' && !t.done ? 'p-high' : t.priority === 'medium' && !t.done ? 'p-medium' : ''}" title="${esc(t.title)}">${t.priority === 'high' && !t.done ? '❗' : ''}${esc(t.title)}</div>`).join('')}
              ${dayTasks.length > 3 ? `<div class="cal-more">+${dayTasks.length - 3} 更多</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="side-panel">
        <div class="panel">
          <div class="panel-title">📋 ${state.selectedDate} ${weekdayCn(state.selectedDate)} 的待办
            <span class="badge badge-blue">${todayTasks.filter(t => !t.done).length} 待办 / ${todayTasks.length} 总</span>
          </div>
          ${todayTasks.length ? todayTasks.map(t => {
            const c = t.customerId ? Store.customer(t.customerId) : null;
            return `<div class="task-item">
              <input type="checkbox" class="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask('${t.id}')" style="margin-top:3px">
              <div style="flex:1">
                <div class="t-title ${t.done ? 'done' : ''}">${esc(t.title)}</div>
                <div class="t-meta">
                  ${t.time ? '🕐 ' + esc(t.time) : ''}
                  <span class="badge badge-purple">${esc(t.category)}</span>
                  <span class="badge ${t.priority === 'high' ? 'badge-red' : t.priority === 'medium' ? 'badge-orange' : 'badge-gray'}">${t.priority === 'high' ? '高优先级' : t.priority === 'medium' ? '中优先级' : '低优先级'}</span>
                  ${c ? `<span style="color:var(--primary)">🏢 ${esc(c.company)}</span>` : ''}
                </div>
              </div>
              <button class="t-del" onclick="deleteTask('${t.id}')" title="删除">×</button>
            </div>`;
          }).join('') : '<div class="text-muted text-sm" style="padding:8px 2px">当天暂无待办，可在下方创建</div>'}
          <div style="border-top:1px dashed var(--border);margin-top:10px;padding-top:12px">
            <div class="field-label">➕ 新建待办</div>
            <input class="input" id="tk-title" placeholder="待办事项*" style="margin-bottom:8px">
            <div class="form-row" style="gap:8px">
              <input class="input" id="tk-time" type="time" value="09:00" style="flex:1">
              <select class="select" id="tk-cat" style="flex:1">
                ${TASK_CATEGORIES.map(x => `<option>${x}</option>`).join('')}
              </select>
              <select class="select" id="tk-pri" style="flex:1">
                <option value="high">高</option><option value="medium" selected>中</option><option value="low">低</option>
              </select>
            </div>
            <select class="select" id="tk-cust" style="margin-top:8px">
              <option value="">关联客户（可选）</option>
              ${Store.data.customers.filter(c => c.ownerId === state.uid).map(c => `<option value="${c.id}">${esc(c.company)}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm btn-block" style="margin-top:10px" onclick="addTask()">创建待办（${state.selectedDate.slice(5).replace('-', '月')}日）</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">📝 工作日报 · ${state.selectedDate.slice(5).replace('-', '月')}日</div>
          ${report ? `
            <div class="field-label" style="color:var(--success)">✅ 今日完成</div>
            <div class="text-sm" style="margin-bottom:10px;white-space:pre-wrap">${esc(report.done)}</div>
            <div class="field-label">📌 明日计划</div>
            <div class="text-sm" style="margin-bottom:10px;white-space:pre-wrap">${esc(report.plan || '—')}</div>
            ${report.help ? `<div class="field-label" style="color:var(--danger)">🤝 需协调</div><div class="text-sm" style="margin-bottom:10px;white-space:pre-wrap">${esc(report.help)}</div>` : ''}
            <div class="text-sm text-muted" style="margin-bottom:10px">更新于 ${esc((report.updatedAt || '').replace('T', ' ').slice(0, 16))}</div>
            <button class="btn btn-ghost btn-sm" onclick="editReport('${report.id}')">编辑日报</button>
          ` : `
            <div class="field"><label class="field-label">今日完成<span class="req">*</span></label>
              <textarea class="textarea" id="rp-done" style="min-height:60px" placeholder="今天完成的拓客、跟进、报价等工作"></textarea></div>
            <div class="field"><label class="field-label">明日计划</label>
              <textarea class="textarea" id="rp-plan" style="min-height:50px" placeholder="明天的工作计划"></textarea></div>
            <div class="field"><label class="field-label">需协调事项</label>
              <textarea class="textarea" id="rp-help" style="min-height:44px" placeholder="需要经理或同事支持的事项"></textarea></div>
            <button class="btn btn-primary btn-sm btn-block" onclick="saveReport()">提交日报</button>
          `}
        </div>
      </div>
    </div>`;
}
function switchSchedTab(t) { state.schedTab = t; renderSchedule(); }
function buildCalCells() {
  const y = state.calYear, m = state.calMonth;
  const first = new Date(y, m, 1);
  const startWd = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m, 1 - startWd + i);
    cells.push({ date: d, ds: fmtDateObj(d), inMonth: d.getMonth() === m });
  }
  return cells;
}
function moveCal(dir) {
  let m = state.calMonth + dir, y = state.calYear;
  if (m < 0) { m = 11; y--; }
  if (m > 11) { m = 0; y++; }
  state.calMonth = m; state.calYear = y;
  renderSchedule();
}
function backToday() {
  const t = new Date();
  state.calYear = t.getFullYear(); state.calMonth = t.getMonth();
  state.selectedDate = todayStr();
  renderSchedule();
}
function selectDate(ds) { state.selectedDate = ds; renderSchedule(); }
function toggleTask(id) {
  const t = Store.data.tasks.find(x => x.id === id);
  t.done = !t.done;
  Store.save(); renderSchedule();
  if (t.done) toast('任务已完成 🎉');
}
function deleteTask(id) {
  Store.data.tasks = Store.data.tasks.filter(x => x.id !== id);
  Store.save(); renderSchedule(); toast('任务已删除');
}
function addTask() {
  const title = $('#tk-title').value.trim();
  if (!title) return toast('请填写待办事项', 'warn');
  Store.data.tasks.push({
    id: uid('t'), ownerId: state.uid, title,
    date: state.selectedDate, time: $('#tk-time').value,
    category: $('#tk-cat').value, priority: $('#tk-pri').value,
    customerId: $('#tk-cust').value || null, done: false,
    createdAt: new Date().toISOString().slice(0, 16)
  });
  Store.save(); renderSchedule(); toast('待办已创建，到期将提醒');
}
function saveReport() {
  const done = $('#rp-done').value.trim();
  if (!done) return toast('请填写「今日完成」', 'warn');
  Store.data.reports.push({
    id: uid('r'), ownerId: state.uid, date: state.selectedDate,
    done, plan: $('#rp-plan').value.trim(), help: $('#rp-help').value.trim(),
    updatedAt: new Date().toISOString().slice(0, 16)
  });
  Store.save(); renderSchedule(); toast('日报已提交，管理者可在团队概览查看');
}
function editReport(id) {
  const r = Store.data.reports.find(x => x.id === id);
  openModal(`
    ${modalHeader('编辑工作日报 · ' + r.date)}
    <div class="modal-body">
      <div class="field"><label class="field-label">今日完成</label>
        <textarea class="textarea" id="er-done" style="min-height:80px">${esc(r.done)}</textarea></div>
      <div class="field"><label class="field-label">明日计划</label>
        <textarea class="textarea" id="er-plan" style="min-height:64px">${esc(r.plan || '')}</textarea></div>
      <div class="field"><label class="field-label">需协调事项</label>
        <textarea class="textarea" id="er-help" style="min-height:56px">${esc(r.help || '')}</textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="updateReport('${id}')">保存</button>
    </div>`);
}
function updateReport(id) {
  const r = Store.data.reports.find(x => x.id === id);
  r.done = $('#er-done').value.trim();
  r.plan = $('#er-plan').value.trim();
  r.help = $('#er-help').value.trim();
  r.updatedAt = new Date().toISOString().slice(0, 16);
  Store.save(); closeModal(); renderSchedule(); toast('日报已更新');
}

/* 团队概览（管理者） */
function weekRange() {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const wd = (t.getDay() + 6) % 7;
  const start = new Date(t); start.setDate(t.getDate() - wd);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return [fmtDateObj(start), fmtDateObj(end)];
}
function renderTeamSchedule() {
  const [ws, we] = weekRange();
  const members = Store.data.users.filter(u => u.role === 'sales');
  const overdueAll = Store.data.tasks.filter(t => !t.done && t.date < todayStr());
  $('#view').innerHTML = `
    <div class="tabs">
      <div class="tab" onclick="switchSchedTab('mine')">我的日程</div>
      <div class="tab active">团队概览</div>
    </div>
    <div class="banner banner-info">
      <span>📊 本周（${ws} ~ ${we}）团队工作总览：${overdueAll.length} 项任务已逾期。点击成员可查看其日报与计划。</span>
    </div>
    <div class="card" style="padding:6px 16px">
      ${members.map(u => {
        const weekTasks = Store.data.tasks.filter(t => t.ownerId === u.id && t.date >= ws && t.date <= we);
        const done = weekTasks.filter(t => t.done).length;
        const od = Store.data.tasks.filter(t => t.ownerId === u.id && !t.done && t.date < todayStr()).length;
        const reports = Store.data.reports.filter(r => r.ownerId === u.id && r.date >= ws && r.date <= we)
          .sort((a, b) => b.date.localeCompare(a.date));
        const pct = weekTasks.length ? Math.round(done / weekTasks.length * 100) : 0;
        return `
        <div class="member-card" style="cursor:pointer" onclick="viewMember('${u.id}')">
          ${avatarHtml(u.id)}
          <div class="member-info">
            <div class="member-name">${esc(u.name)} <span class="text-muted text-sm" style="font-weight:400">${esc(u.title)}</span></div>
            <div class="member-stats">
              本周任务 ${done}/${weekTasks.length} 完成
              ${od ? `<span class="text-danger">· ${od} 项逾期</span>` : ''}
              · 日报 ${reports.length} 篇
              ${reports[0] ? '· 最新日报 ' + reports[0].date : ' · 本周未提交日报'}
            </div>
            <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
          </div>
          <button class="btn btn-xs btn-ghost">查看详情 →</button>
        </div>`;
      }).join('')}
    </div>`;
}
function viewMember(uidv) {
  const u = Store.user(uidv);
  const reports = Store.data.reports.filter(r => r.ownerId === uidv).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const tasks = Store.data.tasks.filter(t => t.ownerId === uidv && t.date >= todayStr())
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  openModal(`
    ${modalHeader(u.name + ' 的工作计划与日报')}
    <div class="modal-body">
      <div class="field-label">📌 未来待办计划（${tasks.length}）</div>
      ${tasks.length ? tasks.map(t => `<div class="dup-item" style="display:block;cursor:default">
        <div class="flex-between"><div class="dup-main">${esc(t.title)}</div>
          <span class="badge ${t.priority === 'high' ? 'badge-red' : 'badge-gray'}">${esc(t.date)}</span></div>
        <div class="dup-sub">🕐 ${esc(t.time || '全天')} · ${esc(t.category)} · ${t.done ? '已完成' : '未完成'}</div>
      </div>`).join('') : '<div class="text-muted text-sm" style="margin-bottom:14px">暂无未来待办</div>'}
      <div class="field-label" style="margin-top:16px">📝 最近工作日报（${reports.length}）</div>
      ${reports.length ? reports.map(r => `
        <div class="dup-group" style="margin-bottom:10px">
          <div class="dup-group-head"><b>${esc(r.date)}</b> ${weekdayCn(r.date)}
            <span class="text-muted">更新于 ${esc((r.updatedAt || '').replace('T', ' ').slice(0, 11))}</span></div>
          <div class="text-sm"><b class="text-success">今日完成：</b>${esc(r.done)}</div>
          ${r.plan ? `<div class="text-sm" style="margin-top:4px"><b>明日计划：</b>${esc(r.plan)}</div>` : ''}
          ${r.help ? `<div class="text-sm" style="margin-top:4px"><b class="text-danger">需协调：</b>${esc(r.help)}</div>` : ''}
        </div>`).join('') : '<div class="text-muted text-sm">暂无日报记录</div>'}
    </div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">关闭</button></div>`, true);
}

/* 启动 */
init();
