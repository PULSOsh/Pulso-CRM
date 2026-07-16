.PHONY: install dev lint typecheck test build check
install:
	npm ci
dev:
	npm run dev
lint:
	npm run lint
typecheck:
	npm run typecheck
test:
	npm run test
build:
	npm run build
check:
	npm run check
