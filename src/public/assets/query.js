// THUGSred query builders. Pure functions shared by the UI and syntax tests.
(function (root) {
  'use strict';
  const text = value => String(value ?? '').trim();
  const quoted = value => `"${text(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  const integer = (value, min, max) => /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;
  function domain(value) {
    value = text(value);
    if (!value) return '';
    const url = new URL(/^[a-z]+:\/\//i.test(value) ? value : 'https://' + value.replace(/^\*\./, ''));
    if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) throw new Error('Use a domain or a plain HTTP(S) URL without credentials.');
    const result = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(result) || result.includes('..') || result.split('.').some(x => !x || x.length > 63 || x.startsWith('-') || x.endsWith('-'))) throw new Error('Enter a valid hostname.');
    return result;
  }
  function ip(value) {
    if (/^\d+(?:\.\d+){3}$/.test(value) && value.split('.').every(x => /^(0|[1-9]\d{0,2})$/.test(x) && Number(x) < 256)) return value;
    if (/^[0-9a-f:]+$/i.test(value) && value.includes(':')) {
      try { return new URL(`http://[${value}]/`).hostname.slice(1, -1); } catch (_) { /* invalid IPv6 */ }
    }
    throw new Error('Enter a valid IPv4 or IPv6 address.');
  }
  function network(value) {
    const parts = value.split('/');
    if (parts.length !== 2) throw new Error('Use a network in CIDR notation.');
    const address = ip(parts[0]);
    if (!integer(parts[1], 0, address.includes(':') ? 128 : 32)) throw new Error('Check the CIDR prefix length.');
    return `${address}/${Number(parts[1])}`;
  }
  function context(service, scope, filters = {}) {
    const values = {}, errors = {};
    const fields = { ...scope, ...filters };
    for (const [key, raw] of Object.entries(fields)) {
      const value = text(raw);
      values[key] = value;
      if (!value) continue;
      try {
        if (['domain', 'hostname', 'exclude_domain', 'cert_name'].includes(key)) values[key] = domain(value);
        if (key === 'ip') values[key] = ip(value);
        if (key === 'net') values[key] = network(value);
        if (key === 'asn') {
          const n = value.replace(/^AS/i, '');
          if (!integer(n, 1, 4294967295)) throw new Error('Use an ASN such as AS64496.');
          values[key] = `AS${Number(n)}`;
        }
        if (key === 'org' && service === 'githubify' && !/^[a-z0-9](?:[a-z0-9-]{0,38})$/i.test(value)) throw new Error('Use the GitHub organisation handle, without spaces.');
        if (key === 'repo' && !/^[a-z0-9][a-z0-9-]{0,38}\/[a-z0-9_.-]+$/i.test(value)) throw new Error('Use owner/repository.');
        if (key === 'topic' && !/^[a-z0-9-]{1,50}$/i.test(value)) throw new Error('Use one repository topic, such as osint.');
        if (key === 'path' && /[\"\\():]/.test(value)) throw new Error('Use a plain file path or glob here. Enter advanced expressions directly in the query.');
        if (key === 'port' && !integer(value, 1, 65535)) throw new Error('Port must be between 1 and 65535.');
        if (key === 'days' && !integer(value, 1, 3650)) throw new Error('Choose between 1 and 3650 days.');
        if (key === 'stars' && !integer(value, 0, 1000000000)) throw new Error('Stars must be a non-negative integer.');
        if (key === 'country') {
          if (!/^[a-z]{2}$/i.test(value)) throw new Error('Use a two-letter country code.');
          values[key] = value.toUpperCase();
        }
        if (key === 'hash' && !/^[a-f0-9]{64}$/i.test(value)) throw new Error('A SHA-256 hash needs 64 hexadecimal characters.');
        if (key === 'favicon' && (!/^-?\d+$/.test(value) || Number(value) < -2147483648 || Number(value) > 2147483647)) throw new Error('Use a signed 32-bit favicon hash.');
        if (key === 'after' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a date in YYYY-MM-DD format.');
      } catch (e) { errors[key] = e.message; values[key] = ''; }
    }
    return { values, errors };
  }
  function build(service, scope, filters = {}, mode = 'search') {
    const global = filters.global === true;
    if (global) {
      scope = { ...scope };
      for (const key of {shodanify:['hostname','net','org','asn'],githubify:['org','repo','domain'],urlscanify:['domain','ip','asn']}[service] || []) delete scope[key];
    }
    const { values: v, errors } = context(service, scope, filters);
    const parts = [];
    const add = (field, value, quote = false) => { if (value) parts.push(`${field}:${quote ? quoted(value) : value}`); };
    if (service === 'shodanify') {
      add('hostname', v.hostname); add('net', v.net); add('org', v.org, true); add('asn', v.asn);
      add('port', v.port); add('product', v.product, true); add('country', v.country);
      if (v.banner) parts.push(quoted(v.banner));
      add('http.title', v.http_title, true); add('ssl.cert.subject.cn', v.cert_name, true);
      add('has_ssl', v.tls); add('ssl.cert.expired', v.expired); add('http.favicon.hash', v.favicon); add('http.status', v.status);
    } else if (service === 'githubify') {
      if (!['code', 'repositories', 'issues'].includes(mode)) return {query:'', errors:{mode:'Choose a supported search mode.'}};
      add('org', v.org); add('repo', v.repo);
      for (const value of [v.domain, v.term]) if (value) parts.push(mode === 'code' ? `content:${quoted(value)}` : quoted(value));
      if (['code', 'repositories'].includes(mode)) add('language', v.language, true);
      if (mode === 'code') {
        add('path', v.path, /\s/.test(v.path || ''));
        if (v.exclude_path) parts.push(`NOT path:${quoted(v.exclude_path)}`);
        add('symbol', v.symbol, true);
        if (v.forks === 'exclude') parts.push('NOT is:fork');
        if (v.forks === 'only') parts.push('is:fork');
        if (v.archived === 'exclude') parts.push('NOT is:archived');
        if (v.archived === 'only') parts.push('is:archived');
      } else if (mode === 'repositories') {
        if (v.forks) add('fork', {include:'true',only:'only'}[v.forks]);
        if (v.archived) add('archived', v.archived === 'only' ? 'true' : 'false');
        add('topic', v.topic); if (v.stars) parts.push(`stars:>=${v.stars}`);
        if (v.repo_in && (v.domain || v.term)) add('in', v.repo_in);
      } else {
        add('is', v.kind); add('is', v.state); add('label', v.label, true);
      }
      if (mode !== 'code' && v.after) parts.push(`created:>=${v.after}`);
    } else if (service === 'urlscanify') {
      if (v.domain) {
        const key = {page:'page.domain',task:'task.domain',contact:'domain',thirdparty:'domain'}[v.domain_mode || 'page'];
        add(key || 'page.domain', v.domain);
        if (v.domain_mode === 'thirdparty') parts.push(`NOT page.domain:${v.domain}`);
      }
      add('page.ip', v.ip, true); add('page.asn', v.asn); add('page.title', v.title, true);
      add('page.country', v.country); add('page.status', v.status); add('page.redirected', v.redirect, true);
      add('page.tlsIssuer', v.tls_issuer, true); add('page.server', v.server, true);
      add('filename', v.resource, true); add('hash', v.hash?.toLowerCase());
      if (v.exclude_domain) parts.push(`NOT page.domain:${v.exclude_domain}`);
      // A time range alone is not a useful starting scope for the builder.
      if ((parts.length || global) && v.days) parts.push(`date:>now-${v.days}d`);
    }
    return {query: parts.join(service === 'urlscanify' ? ' AND ' : ' '), errors};
  }
  function resolve(service, template, scope, filters = {}) {
    const { values, errors } = context(service, scope, filters);
    const missing = [];
    const query = template.replace(/\{([a-z_]+)\}/g, (_, key) => {
      if (!values[key] || errors[key]) { missing.push(key); return `‹${key}›`; }
      let value = values[key].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      if (service === 'urlscanify' && key === 'ip') value = value.replace(/:/g, '\\:');
      return value;
    });
    return {query, missing: [...new Set(missing)]};
  }
  function searchUrl(service, query, mode = 'search') {
    if (service === 'shodanify') return 'https://www.shodan.io/search?query=' + encodeURIComponent(query);
    if (service === 'githubify') return 'https://github.com/search?type=' + (['code','repositories','issues'].includes(mode) ? mode : 'code') + '&q=' + encodeURIComponent(query);
    if (service === 'urlscanify') return 'https://urlscan.io/search/#' + encodeURIComponent(query);
    throw new Error('Unknown search service.');
  }
  const api = { build, resolve, context, searchUrl, domain, quoted };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QueryBuilder = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
