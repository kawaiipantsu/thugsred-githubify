PORT ?= 8080
.PHONY: help dev lint test static deploy build up down logs
help:
	@echo "make dev                  - serve with PHP on 127.0.0.1:$(PORT)"
	@echo "make deploy WEBROOT=...   - copy runtime files into an existing vhost"
	@echo "make lint                 - validate the catalog and PHP"
	@echo "make test                 - run query-builder tests (Node.js required)"
	@echo "make static               - export a static site to dist/"
	@echo "make up / down / logs     - optional Docker Compose deployment"
dev:
	php -S 127.0.0.1:$(PORT) -t src/public
lint:
	php scripts/lint-catalog.php
	php -l src/public/index.php
	php -l src/lib/config.php
test:
	node --test tests/query.test.js
static:
	sh scripts/build-static.sh
deploy:
	sh scripts/deploy-webroot.sh "$(WEBROOT)"
build:
	docker compose build
up:
	docker compose up -d --build
down:
	docker compose down
logs:
	docker compose logs -f
