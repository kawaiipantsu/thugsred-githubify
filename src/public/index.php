<?php
// THUGSred search tools. PHP renders reference content; query state stays in the browser.
$config = require __DIR__ . '/../lib/config.php';
require_once __DIR__ . '/../lib/toolkit.php';
$catalog = json_decode(file_get_contents(__DIR__ . '/../lib/catalog.json'), true, 512, JSON_THROW_ON_ERROR);
if (PHP_SAPI !== 'cli') {
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: DENY');
    header('X-Robots-Tag: noindex, nofollow');
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'");
}
$e = fn($value): string => htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$icon = fn(int $cp): string => '<i aria-hidden="true">&#x' . dechex($cp) . ';</i>';
$total = array_sum(array_map(fn($cat) => count($cat['templates']), $catalog['categories']));
$version = $config['version'];
$assetVersion = $version . '-' . substr(hash('sha256', implode('', array_map(fn($f) => hash_file('sha256', __DIR__ . '/assets/' . $f), ['app.css','app.js','query.js','mascot.svg']))), 0, 10);
$firstMode = array_key_first($config['modes']);
function field(array $f, string $prefix, callable $e): void {
    $id = $prefix . '-' . $f['key'];
    $type = $f['type'] ?? 'text';
    $modes = implode(' ', $f['modes'] ?? []);
?>
<label class="fld"<?= $modes ? ' data-modes="' . $e($modes) . '"' : '' ?>>
  <span><?= $e($f['label']) ?></span>
  <?php if ($type === 'select'): ?>
  <select id="<?= $e($id) ?>" data-<?= $e($prefix) ?>="<?= $e($f['key']) ?>">
    <?php foreach ($f['options'] as [$value, $label]): ?><option value="<?= $e($value) ?>"><?= $e($label) ?></option><?php endforeach; ?>
  </select>
  <?php else: ?>
  <input id="<?= $e($id) ?>" data-<?= $e($prefix) ?>="<?= $e($f['key']) ?>" type="<?= $e($type) ?>" value="<?= $e($f['value'] ?? '') ?>" placeholder="<?= $e($f['placeholder'] ?? '') ?>" autocomplete="off" autocapitalize="off" spellcheck="false"<?= isset($f['min']) ? ' min="' . $e($f['min']) . '"' : '' ?><?= isset($f['max']) ? ' max="' . $e($f['max']) . '"' : '' ?>>
  <?php endif; ?>
</label>
<?php } ?>
<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#080f17">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="description" content="<?= $e($config['description']) ?>">
<title><?= $e($config['name']) ?> | THUGSred</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/JetBrainsMonoNerdFontMono-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/fonts.css?v=<?= $e($assetVersion) ?>">
<link rel="stylesheet" href="assets/app.css?v=<?= $e($assetVersion) ?>">
</head>
<body data-service="<?= $e($config['slug']) ?>" data-name="<?= $e($config['name']) ?>" data-default-mode="<?= $e($firstMode) ?>" data-provider="<?= $e($config['service']) ?>">
<a class="skip-link" href="#builder">Skip to query builder</a>
<div class="wrap">
<nav class="crumbs" aria-label="Project">
  <span class="brand">THUGS<b>red</b> <span class="prod"><?= $e($config['name']) ?></span> <small>v<?= $e($version) ?></small></span>
  <span class="links"><a href="https://thugs.red" target="_blank" rel="noopener noreferrer">thugs.red</a><a href="<?= $e($config['repo']) ?>" target="_blank" rel="noopener noreferrer"><?= $icon(0xf09b) ?> GitHub</a></span>
</nav>
<header class="hero">
  <img class="mascot" src="assets/mascot.svg?v=<?= $e($assetVersion) ?>" width="260" height="240" alt="THUGSred mascot: a hooded nerd exploring search queries">
  <div class="hero-text">
    <div class="tag">THUGSred · <?= $e($config['service']) ?> query toolkit</div>
    <h1><?= $e(substr($config['name'], 0, -3)) ?><span class="ify">ify</span></h1>
    <p class="tagline"><?= $e($config['tagline']) ?></p>
    <div class="typer"><?= $icon($config['icon']) ?><span><?= $e($config['sample']) ?></span><span class="caret" aria-hidden="true"></span></div>
    <p class="sub"><?= $e($config['description']) ?> <?= $total ?> templates, a visual builder and a field guide in one place.</p>
    <ol class="flow"><li><b>1</b> Set your scope</li><li><b>2</b> Build or adapt a query</li><li><b>3</b> Open in <?= $e($config['service']) ?></li></ol>
  </div>
</header>
<?php render_toolkit($config['slug']); ?>
<noscript><p class="notice">Enable JavaScript to build queries and fill template placeholders. The reference and how-to sections remain readable below.</p></noscript>
<div class="layout">
<nav class="toc" id="toc" aria-label="Contents">
  <div class="toc-group"><h4>Tools</h4>
    <a href="#builder" data-toc="builder"><?= $icon(0xf1de) ?><span>Query builder</span></a>
    <a href="#library" data-toc="library"><?= $icon(0xf02d) ?><span>Query library</span><small><?= $total ?></small></a>
    <a href="#operators" data-toc="operators"><?= $icon(0xf0ce) ?><span>Field reference</span></a>
    <a href="#patterns" data-toc="patterns"><?= $icon(0xf0eb) ?><span>Combining queries</span></a>
    <a href="#guide" data-toc="guide"><?= $icon(0xf05b) ?><span>How to investigate</span></a>
  </div>
  <div class="toc-group"><h4>Library categories</h4>
    <?php foreach ($catalog['categories'] as $cat): ?><a href="#cat-<?= $e($cat['id']) ?>" data-toc="cat-<?= $e($cat['id']) ?>" data-chip="<?= $e($cat['id']) ?>"><?= $icon($cat['icon']) ?><span><?= $e($cat['title']) ?></span><small><?= count($cat['templates']) ?></small></a><?php endforeach; ?>
  </div>
  <div class="toc-group"><h4>Good to know</h4><p class="toc-note">Queries stay in this browser until you open the service or share them.</p><a href="#privacy"><?= $icon(0xf132) ?><span>Privacy &amp; access</span></a></div>
</nav>
<main class="main">
<section class="scope" id="scope" aria-label="Search scope">
  <div class="scope-heading"><span><?= $icon(0xf05b) ?> YOUR SCOPE</span><button type="button" id="reset">Clear session</button></div>
  <form id="scope-form" class="scope-fields" autocomplete="off">
    <?php foreach ($config['scope'] as $f) field($f, 'scope', $e); ?>
  </form>
  <label class="global-toggle"><input type="checkbox" id="global-search"> <b>Search globally</b> <span>ignore target scope</span></label>
  <details class="global-help"><summary>Global &amp; wildcard searches</summary><p>Global ignores organisation, repository and the domain-mention field. Exact text and other selected criteria still apply.</p><p>Search across accessible indexed content with <code>path:*.yml</code> or <code>language:Python</code>. In code paths, <code>*</code> stays within a folder, <code>**</code> crosses folders and <code>?</code> matches one character; keep globs unquoted. Content patterns use <code>/regex/</code>. A bare <code>*</code> is not a universal search. Repository and issue modes have their own qualifiers.</p><p>Global mode hides templates that need a specific target. Other criteria remain editable. Results are limited by the service’s index and your account access.</p></details>
  <p class="scope-hint"><?= $e($config['scope_note']) ?></p>
  <label class="remember"><input type="checkbox" id="remember"> Remember this session on this browser <span id="storage-note"></span></label>
</section>
<section class="panel" id="builder">
  <div class="section-heading"><h2><?= $icon(0xf1de) ?> Query builder</h2><span class="eyebrow">BUILD · UNDERSTAND · SEARCH</span></div>
  <p class="lead">Choose your filters, then copy the query or open it in <?= $e($config['service']) ?>. You can also edit the result directly.</p>
  <fieldset class="mode-picker"<?= count($config['modes']) === 1 ? ' hidden' : '' ?>><legend>Search mode</legend>
    <?php foreach ($config['modes'] as $mode=>$label): ?><label><input type="radio" name="mode" value="<?= $e($mode) ?>"<?= $mode === $firstMode ? ' checked' : '' ?>><span><?= $e($label) ?></span></label><?php endforeach; ?>
  </fieldset>
  <form class="bgrid" id="builder-form" autocomplete="off">
    <?php foreach ($config['fields'] as $f) field($f, 'filter', $e); ?>
  </form>
  <p class="validation" id="validation" role="status" aria-live="polite"></p>
  <div class="qbox">
    <div class="query-label"><label for="query">YOUR QUERY</label><span id="query-source">From builder</span></div>
    <textarea id="query" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Set a scope or choose a library template to begin"></textarea>
    <div id="highlight" class="qhl hl" aria-hidden="true"></div>
    <div class="qbar"><span class="qmeta" id="query-meta">Set your scope to begin</span><span class="qacts">
      <button type="button" id="rebuild" title="Replace the edited query with the current form values"><?= $icon(0xf021) ?> rebuild</button>
      <button type="button" id="copy-query"><?= $icon(0xf0c5) ?> copy</button>
      <a class="btn" id="search" target="_blank" rel="noopener noreferrer" aria-disabled="true"><?= $icon(0xf002) ?> <span>open <?= $e($config['service']) ?></span></a>
    </span></div>
    <div class="query-foot"><button type="button" id="share"><?= $icon(0xf0c1) ?> copy session link</button><span>Links include your scope and query. Only share what you intend to disclose.</span></div>
  </div>
  <p class="access-note"><?= $icon(0xf05a) ?> <?= $e($config['access_note']) ?></p>
</section>
<section id="library" aria-labelledby="library-title">
  <div class="library-heading"><div><span class="eyebrow">START WITH A QUESTION</span><h2 id="library-title">Query library</h2></div><span class="library-count"><b id="shown"><?= $total ?></b> / <?= $total ?> templates · <b id="ready">0</b> ready</span></div>
  <div class="library-tools">
    <label class="fld grow"><span>Find a template</span><input type="search" id="filter" placeholder="certificates, domains, configuration…" autocomplete="off"></label>
    <label class="fld"><span>Category</span><select id="category"><option value="">All categories</option><?php foreach ($catalog['categories'] as $cat): ?><option value="<?= $e($cat['id']) ?>"><?= $e($cat['title']) ?></option><?php endforeach; ?></select></label>
    <div class="export-actions"><button type="button" id="copy-all"><?= $icon(0xf0c5) ?> copy ready</button><button type="button" id="export"><?= $icon(0xf019) ?> .txt</button></div>
  </div>
  <p class="library-hint">Templates use the placeholders shown in each query. Fill those fields above to enable search and copy.<?= count($config['modes']) > 1 ? ' The library follows the selected search mode.' : '' ?></p>
  <p id="empty" class="notice" hidden>No templates match. Try another category, search term or mode.</p>
  <?php foreach ($catalog['categories'] as $cat): ?>
  <section class="panel cat" id="cat-<?= $e($cat['id']) ?>" data-category="<?= $e($cat['id']) ?>">
    <h2><?= $icon($cat['icon']) ?> <?= $e($cat['title']) ?> <small class="cat-count"><?= count($cat['templates']) ?></small></h2><p class="lead"><?= $e($cat['lead']) ?></p>
    <div class="templates">
      <?php foreach ($cat['templates'] as $t): ?>
      <article class="template" data-template="<?= $e($t['query']) ?>" data-global="<?= $e($t['global_query'] ?? '') ?>" data-mode="<?= $e($t['mode'] ?? $firstMode) ?>" data-text="<?= $e(mb_strtolower($t['title'] . ' ' . $t['query'] . ' ' . $t['note'] . ' ' . $t['tip'])) ?>">
        <div class="template-body"><h3><?= $e($t['title']) ?></h3><code class="template-query hl"><?= $e($t['query']) ?></code><p class="note"><?= $e($t['note']) ?></p><?php if ($t['tip']): ?><p class="tip"><?= $icon(0xf0eb) ?> <?= $e($t['tip']) ?></p><?php endif; ?><span class="template-status">Set scope</span></div>
        <div class="acts"><a class="btn template-go" target="_blank" rel="noopener noreferrer" aria-disabled="true"><?= $icon(0xf002) ?> search</a><button type="button" class="template-copy"><?= $icon(0xf0c5) ?> copy</button><button type="button" class="template-edit"><?= $icon(0xf040) ?> edit</button></div>
      </article>
      <?php endforeach; ?>
    </div>
  </section>
  <?php endforeach; ?>
</section>
<section class="panel" id="operators">
  <div class="section-heading"><h2><?= $icon(0xf0ce) ?> Field reference</h2><span class="eyebrow">THE SYNTAX, EXPLAINED</span></div>
  <p class="lead">Examples use illustrative values. Check the official documentation for current service limits and field availability.</p>
  <div class="reference-list">
  <?php foreach ($catalog['operators'] as $op): ?><article class="reference-row"<?= isset($op['mode']) ? ' data-modes="' . $e($op['mode']) . '"' : '' ?>><code class="operator-name"><?= $e($op['operator']) ?></code><div><p><?= $e($op['description']) ?></p><code class="hl reference-example"><?= $e($op['example']) ?></code><?php if ($op['note']): ?><small><?= $e($op['note']) ?></small><?php endif; ?></div></article><?php endforeach; ?>
  </div>
</section>
<section class="panel" id="patterns">
  <h2><?= $icon(0xf0eb) ?> Combining queries</h2><p class="lead">Small patterns that make the relationship between your search terms explicit.</p>
  <div class="patterns"><?php foreach ($catalog['patterns'] as $pattern): ?><article class="pat"<?= isset($pattern['mode']) ? ' data-modes="' . $e($pattern['mode']) . '"' : '' ?>><h3><?= $e($pattern['title']) ?></h3><p><?= $e($pattern['description']) ?></p><code class="hl"><?= $e($pattern['query']) ?></code></article><?php endforeach; ?></div>
</section>
<section class="panel" id="guide">
  <h2><?= $icon(0xf05b) ?> How to investigate</h2><p class="lead">Use search results as observations. Check context before drawing conclusions.</p>
  <ol class="steps"><?php foreach ($catalog['guide'] as $step): ?><li><h3><?= $e($step['title']) ?></h3><p><?= $e($step['text']) ?></p></li><?php endforeach; ?></ol>
</section>
<section class="panel" id="privacy">
  <h2><?= $icon(0xf132) ?> Privacy &amp; access</h2>
  <p class="lead">No API keys, accounts or background searches in this app. Nothing is submitted to <?= $e($config['service']) ?> until you follow a search link. <?= $config['slug'] === 'urlscanify' ? 'This tool never submits URLs for scanning.' : '' ?></p>
  <div class="privacy-grid"><div><h3>Your browser, your session</h3><p>Values stay in memory unless you choose to remember the session. Shared links put the session in the URL fragment; exports include the queries you selected. Clear session removes remembered app data.</p></div><div><h3>Your service access</h3><p><?= $e($config['access_note']) ?> This community tool is independent of <?= $e($config['service']) ?> and does not bypass its access controls.</p></div></div>
  <div class="source-links"><?php foreach ($catalog['references'] as $ref): ?><a href="<?= $e($ref['url']) ?>" target="_blank" rel="noopener noreferrer"><?= $e($ref['label']) ?> ↗</a><?php endforeach; ?></div>
</section>
</main>
</div>
<footer><p>Made by <a href="https://thugs.red" target="_blank" rel="noopener noreferrer">THUGSred</a>, the Danish hacking community.</p><p><?= $e($config['name']) ?> v<?= $e($version) ?> · <?= $e($config['tagline']) ?> · <a href="<?= $e($config['repo']) ?>" target="_blank" rel="noopener noreferrer">source code</a></p><p>Use these tools for learning and investigations you are authorised to perform.</p></footer>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="assets/query.js?v=<?= $e($assetVersion) ?>"></script>
<script src="assets/app.js?v=<?= $e($assetVersion) ?>"></script>
</body>
</html>
