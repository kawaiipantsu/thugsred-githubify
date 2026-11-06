<?php
// Validate the reference library before publication or a static export.
$config = require __DIR__ . '/../src/lib/config.php';
$catalog = json_decode(file_get_contents(__DIR__ . '/../src/lib/catalog.json'), true, 512, JSON_THROW_ON_ERROR);
$fields = array_column(array_merge($config['scope'], $config['fields']), 'key');
$modes = array_keys($config['modes']);
$errors = []; $titles = []; $ids = []; $count = 0;
foreach (['categories','operators','patterns','guide','references'] as $key) {
    if (empty($catalog[$key]) || !is_array($catalog[$key])) $errors[] = "Missing catalog section: $key";
}
foreach ($catalog['categories'] as $category) {
    if (!preg_match('/^[a-z][a-z0-9-]*$/', $category['id']) || isset($ids[$category['id']])) $errors[] = 'Invalid or duplicate category ID';
    $ids[$category['id']] = true;
    foreach ($category['templates'] as $template) {
        $count++;
        foreach (['title','query','note'] as $key) if (empty($template[$key])) $errors[] = "Empty $key in template";
        if (isset($titles[$template['title']])) $errors[] = 'Duplicate template: ' . $template['title'];
        $titles[$template['title']] = true;
        if (!in_array($template['mode'] ?? $modes[0], $modes, true)) $errors[] = 'Unknown search mode';
        preg_match_all('/\{([a-z_]+)\}/', $template['query'], $matches);
        foreach ($matches[1] as $field) if (!in_array($field, $fields, true)) $errors[] = "Unknown placeholder: $field";
        if (count($matches[1]) === 0) $errors[] = 'Template needs an explicit scope placeholder: ' . $template['title'];
        if (substr_count($template['query'], '"') % 2) $errors[] = 'Unbalanced quotes: ' . $template['title'];
        if ($config['slug'] === 'githubify' && ($template['mode'] ?? '') !== 'code' && preg_match('/\b(content|path|symbol):/', $template['query'])) $errors[] = 'Code-only qualifier in another search mode';
    }
}
foreach ($catalog['references'] as $reference) {
    $url = parse_url($reference['url']);
    if (($url['scheme'] ?? '') !== 'https' || empty($url['host'])) $errors[] = 'Reference must be an HTTPS URL';
}
foreach ($errors as $error) fwrite(STDERR, "ERROR: $error\n");
printf("%s: %d templates, %d categories, %d field references; %d errors\n", $config['name'], $count, count($catalog['categories']), count($catalog['operators']), count($errors));
exit($errors ? 1 : 0);
