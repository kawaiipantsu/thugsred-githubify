// THUGSred — browser-only scope, query editing, reference filtering and exports.
(() => {
  'use strict';
  const $ = (selector, element = document) => element.querySelector(selector);
  const $$ = (selector, element = document) => [...element.querySelectorAll(selector)];
  const service = document.body.dataset.service, name = document.body.dataset.name, provider = document.body.dataset.provider;
  const scopeFields = $$('[data-scope]'), filterFields = $$('[data-filter]');
  const query = $('#query'), search = $('#search'), remember = $('#remember'), globalSearch = $('#global-search');
  const targetFields = {shodanify:['hostname','net','org','asn'],githubify:['org','repo','domain'],urlscanify:['domain','ip','asn']}[service];
  const storageKey = `thugsred.${service}.session.v1`;
  const templates = $$('.template'), categories = $$('.cat');
  const allowedModes = $$('[name="mode"]').map(el => el.value);
  let manual = false, sourceTemplate = '', timer;
  const mode = () => $('[name="mode"]:checked').value;
  const read = fields => Object.fromEntries(fields.filter(el => !el.disabled).map(el => [el.dataset.scope || el.dataset.filter, el.value]));
  const scope = () => read(scopeFields), filters = () => ({...read(filterFields), global:globalSearch.checked});
  function applyGlobal() {
    scopeFields.forEach(el => { el.disabled = globalSearch.checked && targetFields.includes(el.dataset.scope); });
    const relation = $('#filter-domain_mode');
    if (relation) relation.disabled = globalSearch.checked;
  }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function highlight(value) {
    const tokens = /("(?:\\.|[^"\\])*")|(\b(?:AND|OR|NOT)\b)|([a-zA-Z_][a-zA-Z0-9_.-]*:)|([()])|(‹[^›]+›)/g;
    let html = '', end = 0;
    for (const match of value.matchAll(tokens)) {
      html += esc(value.slice(end, match.index));
      const cls = match[1] ? 't-str' : match[2] ? 't-or' : match[3] ? 't-op' : match[4] ? 't-paren' : 't-ph';
      html += `<span class="${cls}">${esc(match[0])}</span>`;
      end = match.index + match[0].length;
    }
    return html + esc(value.slice(end));
  }
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => $('#toast').classList.remove('show'), 2400);
  }
  async function copy(value, message = 'Copied') {
    try {
      if (window.isSecureContext && navigator.clipboard) await navigator.clipboard.writeText(value);
      else {
        const helper = document.createElement('textarea');
        helper.value = value; helper.className = 'clipboard-helper';
        helper.setAttribute('readonly', ''); document.body.appendChild(helper); helper.select();
        let copied;
        try { copied = document.execCommand('copy'); } finally { helper.remove(); }
        if (!copied) throw new Error('Clipboard unavailable');
      }
      toast(message);
    } catch (_) { toast('Clipboard unavailable. Select the query and copy it manually.'); }
  }
  function setLink(anchor, value, linkMode, valid) {
    if (valid) { anchor.href = QueryBuilder.searchUrl(service, value, linkMode); anchor.removeAttribute('aria-disabled'); }
    else { anchor.removeAttribute('href'); anchor.setAttribute('aria-disabled', 'true'); }
  }
  function state() {
    return {v:1, global:globalSearch.checked, mode:mode(), scope:scope(), filters:read(filterFields.filter(el => !el.closest('[hidden]'))), manual, query:manual ? query.value : '', template:sourceTemplate};
  }
  function save() {
    try {
      if (remember.checked) localStorage.setItem(storageKey, JSON.stringify(state()));
      else localStorage.removeItem(storageKey);
      $('#storage-note').textContent = '';
    } catch (_) { $('#storage-note').textContent = '(storage unavailable)'; }
  }
  function switchMode() {
    const current = mode();
    $$('[data-modes]').forEach(el => {
      el.hidden = !el.dataset.modes.split(' ').includes(current);
      $$('input, select', el).forEach(input => { input.disabled = el.hidden; });
    });
    // GitHub's code search includes forks by default; there is no fork:true qualifier.
    const fork = $('#filter-forks');
    if (fork) {
      const include = $('option[value="include"]', fork);
      include.disabled = current === 'code';
      if (current === 'code' && fork.value === 'include') fork.value = '';
    }
  }
  function renderQuery() {
    const value = query.value.trim();
    const result = QueryBuilder.build(service, scope(), filters(), mode());
    const errors = manual ? {} : result.errors;
    [...scopeFields, ...filterFields].forEach(el => {
      const issue = errors[el.dataset.scope || el.dataset.filter];
      if (issue) { el.setAttribute('aria-invalid', 'true'); el.title = issue; }
      else { el.removeAttribute('aria-invalid'); el.removeAttribute('title'); }
    });
    const incomplete = /‹[^›]*›|\{(?:hostname|net|org|asn|port|product|domain|repo|term|language|ip|title|hash|days)\}/.test(value);
    const tooLong = service === 'githubify' && mode() === 'code' && value.length > 1000;
    const valid = Boolean(value) && !incomplete && !tooLong && !Object.keys(errors).length;
    $('#highlight').innerHTML = highlight(value);
    $('#query-meta').textContent = !value ? (globalSearch.checked ? 'Add a search term or filter' : 'Set your scope to begin') : incomplete ? 'Fill the missing scope fields' : tooLong ? 'Code search allows up to 1,000 characters' : `${value.length} characters · ${mode() === 'search' ? provider : mode()}`;
    $('#query-source').textContent = sourceTemplate ? 'From library · scope stays linked' : manual ? 'Edited query · rebuild to use form' : 'From builder';
    $('#validation').textContent = Object.values(errors).join(' ');
    $('#copy-query').disabled = !valid;
    setLink(search, value, mode(), valid);
  }
  function renderTemplates() {
    for (const item of templates) {
      const template = globalSearch.checked ? item.dataset.global : item.dataset.template;
      item._globalAvailable = Boolean(item.dataset.global);
      const result = QueryBuilder.resolve(service, template || item.dataset.template, scope(), filters());
      item._query = result.query;
      item._ready = result.missing.length === 0;
      $('.template-query', item).innerHTML = highlight(result.query);
      $('.template-status', item).textContent = item._ready ? 'READY TO SEARCH' : `NEEDS ${result.missing.join(' · ').toUpperCase()}`;
      item.classList.toggle('is-ready', item._ready);
      $('.template-copy', item).disabled = !item._ready;
      setLink($('.template-go', item), result.query, item.dataset.mode, item._ready);
    }
    applyFilter();
  }
  function applyFilter() {
    const terms = $('#filter').value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const selected = $('#category').value;
    let shown = 0, ready = 0;
    for (const item of templates) {
      const matches = (!globalSearch.checked || item._globalAvailable) && item.dataset.mode === mode() && (!selected || item.closest('.cat').dataset.category === selected) && terms.every(term => (item.dataset.text + ' ' + item._query).toLowerCase().includes(term));
      item.hidden = !matches;
      if (matches) { shown++; if (item._ready) ready++; }
    }
    for (const cat of categories) {
      const count = $$('.template:not([hidden])', cat).length;
      cat.hidden = count === 0;
      $('.cat-count', cat).textContent = count;
      const link = $(`[data-chip="${cat.dataset.category}"]`);
      link.classList.toggle('dim', !count); $('small', link).textContent = count;
    }
    $('#shown').textContent = shown; $('#ready').textContent = ready; $('#empty').hidden = shown !== 0;
    $('#copy-all').disabled = ready === 0; $('#export').disabled = ready === 0;
  }
  function update() {
    if (sourceTemplate) query.value = QueryBuilder.resolve(service, sourceTemplate, scope(), filters()).query;
    else if (!manual) query.value = QueryBuilder.build(service, scope(), filters(), mode()).query;
    renderQuery(); renderTemplates(); save();
  }
  function rebuild() { manual = false; sourceTemplate = ''; update(); }
  function restore(data) {
    if (!data || data.v !== 1 || !allowedModes.includes(data.mode)) return false;
    $(`[name="mode"][value="${data.mode}"]`).checked = true;
    globalSearch.checked = data.global === true;
    for (const [fields, key] of [[scopeFields, 'scope'], [filterFields, 'filters']]) {
      for (const el of fields) {
        const value = data[key]?.[el.dataset[key === 'scope' ? 'scope' : 'filter']];
        if (typeof value === 'string' && value.length <= 4000) el.value = value;
      }
    }
    manual = data.manual === true && typeof data.query === 'string' && data.query.length <= 16000;
    query.value = manual ? data.query : '';
    sourceTemplate = manual && typeof data.template === 'string' && data.template.length <= 4000 ? data.template : '';
    return true;
  }
  $('#scope-form').addEventListener('submit', event => event.preventDefault());
  $('#builder-form').addEventListener('submit', event => event.preventDefault());
  scopeFields.forEach(el => el.addEventListener('input', update));
  filterFields.forEach(el => {
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', rebuild);
  });
  $$('[name="mode"]').forEach(el => el.addEventListener('change', () => {
    switchMode(); applyGlobal(); $('#category').value = ''; rebuild();
  }));
  query.addEventListener('input', () => { manual = true; sourceTemplate = ''; renderQuery(); save(); });
  query.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && search.hasAttribute('href')) { event.preventDefault(); search.click(); }
  });
  $('#rebuild').addEventListener('click', rebuild);
  $('#copy-query').addEventListener('click', () => copy(query.value.trim(), 'Query copied'));
  remember.addEventListener('change', save);
  globalSearch.addEventListener('change', () => { applyGlobal(); rebuild(); });
  $('#filter').addEventListener('input', applyFilter); $('#category').addEventListener('change', applyFilter);
  $('#reset').addEventListener('click', () => {
    $('#scope-form').reset(); $('#builder-form').reset();
    $(`[name="mode"][value="${document.body.dataset.defaultMode}"]`).checked = true;
    remember.checked = false; globalSearch.checked = false; $('#filter').value = ''; $('#category').value = '';
    history.replaceState(null, '', location.pathname);
    switchMode(); applyGlobal(); rebuild(); toast('Session cleared'); scopeFields[0].focus();
  });
  $('#share').addEventListener('click', () => {
    const url = new URL(location.href); url.search = ''; url.hash = 'session=' + encodeURIComponent(JSON.stringify(state()));
    if (url.href.length > 20000) return toast('Session is too long for a practical share link. Copy the query instead.');
    copy(url.href, 'Session link copied — includes scope and query');
  });
  $('#library').addEventListener('click', event => {
    const item = event.target.closest('.template');
    if (!item) return;
    if (event.target.closest('.template-copy') && item._ready) copy(item._query, 'Query copied');
    if (event.target.closest('.template-edit')) {
      $(`[name="mode"][value="${item.dataset.mode}"]`).checked = true; switchMode();
      manual = true; sourceTemplate = globalSearch.checked ? item.dataset.global : item.dataset.template; query.value = item._query;
      update(); $('#builder').scrollIntoView({block:'start'}); query.focus({preventScroll:true});
    }
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[aria-disabled="true"]');
    if (link) { event.preventDefault(); toast('Fill in the required fields before searching.'); }
  });
  function exportText() {
    const rows = templates.filter(item => !item.hidden && item._ready);
    return [`# THUGSred ${name} · ${mode()} · ${new Date().toISOString().slice(0,10)}`, '# Contains the scope values in these queries. Review before sharing.', '', ...rows.flatMap(item => [`## ${$('h3', item).textContent}`, item._query, ''])].join('\n');
  }
  $('#copy-all').addEventListener('click', () => copy(exportText(), `${$('#ready').textContent} queries copied`));
  $('#export').addEventListener('click', () => {
    const href = URL.createObjectURL(new Blob([exportText()], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = href; link.download = `${service}-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  });
  $$('.hl').forEach(el => { if (!el.closest('.template')) el.innerHTML = highlight(el.textContent); });
  let restored = false;
  if (location.hash.startsWith('#session=') && location.hash.length < 40000) {
    try { restored = restore(JSON.parse(decodeURIComponent(location.hash.slice(9)))); } catch (_) { /* leave the blank form */ }
    if (!restored) toast('That session link is invalid. Starting with a blank session.');
  }
  if (!restored) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) remember.checked = restore(JSON.parse(stored));
    } catch (_) { /* storage is optional */ }
  }
  switchMode(); applyGlobal(); update();
  const links = $$('[data-toc]');
  if ('IntersectionObserver' in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id));
      const first = links.find(link => visible.has(link.dataset.toc));
      if (first) links.forEach(link => link.classList.toggle('active', link === first));
    }, {rootMargin:'-10% 0px -65% 0px'});
    links.forEach(link => { const el = document.getElementById(link.dataset.toc); if (el) observer.observe(el); });
  }
})();
