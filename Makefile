install:
	npm install

build:
	rm -rf dist
	npm run build

test:
	npx jest

test-watch:
	npx jest --watch

lint:
	npx eslint .

publish:
	npm publish --dry-run

.PHONY: test
