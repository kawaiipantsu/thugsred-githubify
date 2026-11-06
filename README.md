<p align="center">
  <a href="https://thugs.red"><img src="src/public/assets/mascot.svg" width="230" alt="THUGSred Githubify mascot"></a>
</p>
<h1 align="center">THUGSred Githubify</h1>
<p align="center"><strong>Follow the code. Connect the clues.</strong></p>
<p align="center">A small, self-hosted query builder and OSINT reference for GitHub code, repositories, issues and pull requests.<br>Made by the Danish hacking community <a href="https://thugs.red">THUGSred</a>.</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=flat-square&amp;logo=php&amp;logoColor=white" alt="PHP 8.1 or newer">
  <img src="https://img.shields.io/badge/Apache-ready-D22128?style=flat-square&amp;logo=apache&amp;logoColor=white" alt="Apache ready">
  <img src="https://img.shields.io/badge/Docker-optional-2496ED?style=flat-square&amp;logo=docker&amp;logoColor=white" alt="Docker optional">
  <img src="https://img.shields.io/badge/templates-36-7de0ca?style=flat-square" alt="36 query templates">
  <a href="https://thugs.red"><img src="https://img.shields.io/badge/made_by-THUGSred-b83c4b?style=flat-square" alt="Made by THUGSred"></a>
</p>
<p align="center"><a href="https://githubify.thugs.red/">Hosted instance</a> · <a href="#run-with-php">Run with PHP</a> · <a href="#existing-apache-vhost">Apache deployment</a> · <a href="#optional-docker-deployment">Docker</a> · <a href="#global--wildcard-searches">Global searches</a></p>

---

**Set a scope. Build a query. Understand what it means.**

Githubify gives you a visual builder, 36 annotated templates in 6 categories,
a searchable library and an operator reference in one page. Open the result
in GitHub or copy it into your own workflow.

No API credentials, database, Composer dependencies or frontend build step.
PHP renders the page; JavaScript handles scope, query construction and
exports in the browser. Fonts, icons and artwork are bundled locally.

## Take a look

![Githubify scope controls and visual query builder](docs/screenshots/overview.png)

<details>
<summary><strong>Explore the query library</strong> — ready-to-use searches, explanations and useful pivots</summary>

![Githubify query library with illustrative search criteria](docs/screenshots/library.png)

</details>

*Screenshots are from the hosted instance, using example data. Its optional
THE TOOLKIT navigation is local configuration; standalone installs do not
show links to sibling tools by default.*

## What's inside

| Feature | What it does |
| --- | --- |
| **Three search modes** | Separate modern code, repository, and issue/PR searches so qualifiers stay valid. |
| **Project footprint** | Explore domain mentions, build workflows, deployment files, dependencies and project documentation. |
| **GitHub syntax** | Use path globs, exact content, languages, topics, stars, issue labels and other mode-specific filters. |
| **Global search** | Drop target restrictions and use 31 compatible global template variants. Keep useful search criteria. |
| **Learn as you build** | Browse 24 field/operator notes, combining patterns and investigation guidance. |
| **Copy, edit & export** | Adapt a template, copy a query or export the visible ready queries as text. |
| **Optional session memory** | Remember a session only when you opt in. Share it explicitly through a URL fragment. |

Example query:

```text
org:example-org content:"example.com" path:*.yml
```

GitHub code search requires sign-in and has indexing and result limits. It uses modern website syntax, not the legacy REST code-search syntax. Repositories and issues have different qualifiers; pull requests use issue search with `is:pr`.

## Run with PHP

Requires PHP **8.1+** with **mbstring**. Node.js is only needed for the optional
query-builder tests.

```sh
git clone https://github.com/kawaiipantsu/thugsred-githubify.git
cd thugsred-githubify
php -S 127.0.0.1:8080 -t src/public
```

Open **[http://127.0.0.1:8080](http://127.0.0.1:8080)**. The same command is
available as `make dev`; use `make dev PORT=8090` to choose another port.
The built-in PHP server is for local development. An existing Apache/PHP
installation can serve the app directly.

## Existing Apache vhost

For a dedicated vhost with an existing `html/` document root:

```sh
make deploy WEBROOT=/var/www/example/html
```

The directory must already exist. The deployment helper requires PHP and
rsync, validates the catalog and copies **runtime files only**:

```text
your-vhost/
├── html/                # existing document root
│   ├── index.php
│   ├── assets/
│   ├── fonts/
│   ├── favicon.svg
│   └── robots.txt
└── lib/                 # outside the document root
    ├── config.php
    ├── catalog.json
    └── toolkit.php
```

Each app needs its own vhost directory and sibling `lib/`. The helper does
not change Apache, PHP handlers, proxy settings, ownership of the existing
vhost, or middleware files. It preserves deployment-local `lib/local.php`.
The web-server user must be able to read the deployed files.

Alternatively, point a new PHP-enabled web server directly at `src/public/`.
Do not serve the repository root. PHP sends the page's security headers;
no application-specific `.htaccess` file is required.

### Optional local toolkit navigation

Standalone and Docker installations have **no sibling-tool navigation** by
default. If you operate several tools, create a `lib/local.php` beside the
**deployed** `lib/config.php`, outside the document root:

```php
<?php
return ['toolkit' => [
    'githubify' => [
        'label' => 'Githubify',
        'url' => 'https://search.example.com/',
    ],
    'another-tool' => [
        'label' => 'Another tool',
        'url' => 'https://tools.example.com/',
    ],
]];
```

Include only services you actually host. `src/lib/local.php` is ignored by
Git and excluded from Docker builds. The deployment helper never copies or
replaces local settings. Docker users who deliberately want navigation can
mount a read-only local file at `/var/www/githubify/lib/local.php`.

## Optional Docker deployment

```sh
cp .env.example .env        # optional: edit bind address or port
docker compose up -d --build
```

Open **http://127.0.0.1:8080**. The image builds locally from `php:8.4-apache`;
there is no prebuilt image registry to configure.

| Variable | Default | Purpose |
| --- | --- | --- |
| `GITHUBIFY_BIND` | `127.0.0.1` | Host interface. Use `0.0.0.0` if you intend to expose the port on other interfaces. |
| `GITHUBIFY_PORT` | `8080` | Published host port. Change it when another service already uses that port. |

```sh
docker compose logs -f
docker compose down
```

The container runs as `www-data`, with a read-only filesystem, dropped
capabilities and `no-new-privileges`. There is no built-in authentication;
use your existing access controls if the page should be restricted.

## Global & wildcard searches

Enable **Search globally** above the builder. Global mode ignores organisation, repository and the generated domain-mention clause. Exact text and mode-specific filters remain. Code path globs use `*` within a directory, `**` across directories and `?` for one character; keep globs unquoted. Content patterns use `/regex/`. A bare `*` is not a universal search. With no criteria, add a term or qualifier before searching.

```text
path:*.py language:"Python"
```

Global mode hides templates that have no useful target-free variant.
Switching modes rebuilds the query from the form; a manually edited query
can always be entered directly. Global describes the lack of a target
restriction, not complete access to every record the provider holds.

## Privacy

- Searches open directly in GitHub; the app makes no background service requests.
- Scope and query values remain in memory unless **Remember this session** is enabled.
- **Clear session** removes remembered app state and resets the controls.
- Session links contain scope and query data in the URL fragment. Fragments are not sent in the HTTP request, but are visible to anyone holding the link.
- Exports contain your selected queries. Review both exports and links before sharing.
- The app does not store visitor IP addresses or interpret proxy forwarding headers.

## Development

```sh
make lint                  # catalog structure and PHP syntax
make test                  # Node.js built-in test runner; no npm install
make static                # static HTML and assets in ignored dist/
make help
```

Static exports work without PHP. Configure security headers on the static
host; the PHP response headers and Docker Apache configuration do not run
when serving `index.html`.

| Path | Contents |
| --- | --- |
| [`src/lib/config.php`](src/lib/config.php) | Branding, scope and builder fields. |
| [`src/lib/catalog.json`](src/lib/catalog.json) | Templates, global variants, reference, patterns, guides and official sources. |
| [`src/lib/toolkit.php`](src/lib/toolkit.php) | Optional navigation renderer; no deployment links are bundled. |
| [`src/public/assets/query.js`](src/public/assets/query.js) | Query construction, escaping, validation and service URLs. |
| [`src/public/assets/app.js`](src/public/assets/app.js) | Browser interaction, session state, filtering and export. |
| [`tests/query.test.js`](tests/query.test.js) | Query syntax, global scope, escaping and catalog regression tests. |
| [`docker/`](docker/) | Optional container configuration. |
| [`licenses/`](licenses/) | Notices for bundled fonts. |

Keep local configuration, credentials, exports, browser state and generated
output out of commits. The Git and Docker ignore rules cover common cases;
always review staged files before publishing.

## Official references

[GitHub Code Search syntax](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax) · [Code Search access and limitations](https://docs.github.com/en/search-github/github-code-search/about-github-code-search) · [Repository search qualifiers](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories) · [Issue and pull-request search](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) · [Website search and the legacy code API](https://docs.github.com/en/search-github/searching-on-github/searching-code)

## Community & credits

Made by **[THUGSred](https://thugs.red)**, the Danish hacking community.
Use for learning and investigations you are authorised to perform.
This is an independent community project, not an official GitHub product.

Code, mascot and logo: THUGSred. No project-wide license has been selected.
JetBrains Mono and Nerd Fonts retain their upstream notices in
[`licenses/`](licenses/).
