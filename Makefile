install:
	npm install

build:
	rm -rf dist
	npm run build

test:
	npm test

test-watch:
	npm run test:watch

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
