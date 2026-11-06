<?php
// Optional deployment-local navigation. No links are enabled in the distributed app.
function render_toolkit(string $current): void
{
    $file = __DIR__ . '/local.php';
    if (!is_file($file)) return;
    $settings = require $file;
    $links = is_array($settings) ? ($settings['toolkit'] ?? []) : [];
    if (!is_array($links)) return;
    $safe = [];
    foreach ($links as $id => $link) {
        if (!is_array($link) || !is_string($link['label'] ?? null) || !is_string($link['url'] ?? null)) continue;
        $url = parse_url($link['url']);
        if (!$url || !in_array($url['scheme'] ?? '', ['http', 'https'], true) || empty($url['host']) || isset($url['user']) || isset($url['pass'])) continue;
        $safe[$id] = $link;
    }
    if (!$safe) return;
    $escape = fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<nav class="suite-nav" aria-label="THUGSred query tools"><span>THE TOOLKIT</span>';
    foreach ($safe as $id => $link) {
        echo '<a href="' . $escape($link['url']) . '"' . ($id === $current ? ' aria-current="page"' : '') . '>' . $escape($link['label']) . '</a>';
    }
    echo '</nav>';
}
