install:
	npm install

build:
	rm -rf dist
	npm run build

test:
	DEBUG=page-loader npx jest

test-watch:
	DEBUG=page-loader,axios,nock npx jest --watch

lint:
	npx eslint .

publish:
	npm publish --dry-run

.PHONY: test
