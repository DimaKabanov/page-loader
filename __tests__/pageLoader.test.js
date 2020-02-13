import _ from 'lodash/fp';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import assert from 'power-assert';
import nock from 'nock';
import pageLoader from '../src';

nock.disableNetConnect();

const getFixturePath = (name) => path.join(__dirname, '__fixtures__', name);

const host = 'https://hexlet.io';
const pageUrl = '/courses';
const scriptsUrl = '/courses/assets/index.js';
const stylesUrl = '/courses/assets/css/styles.css';

let outputDir;

beforeEach(async () => {
  outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  await fs.unlink(outputDir).catch(_.noop);
});

test('Correctly downloads the page at the specified address', async () => {
  const htmlBeforeSrc = getFixturePath('index-before.html');
  const htmlAfterSrc = getFixturePath('index-after.html');

  const htmlBeforeData = await fs.readFile(htmlBeforeSrc, 'utf-8');
  const htmlAfterData = await fs.readFile(htmlAfterSrc, 'utf-8');

  const outputHtmlFile = path.join(outputDir, 'hexlet-io-courses.html');
  nock(host).get(pageUrl).reply(200, htmlBeforeData);
  await pageLoader(`${host}${pageUrl}`, outputDir);

  const actualPage = await fs.readFile(outputHtmlFile, 'utf-8');
  const expectedPage = htmlAfterData;
  assert.strictEqual(actualPage, expectedPage);
});

test('Correctly downloads the local resourses', async () => {
  const htmlBeforeSrc = getFixturePath('index-before.html');
  const scriptsSrc = getFixturePath('index.js');
  const stylesSrc = getFixturePath('styles.css');

  const htmlBeforeData = await fs.readFile(htmlBeforeSrc, 'utf-8');
  const scriptsData = await fs.readFile(scriptsSrc, 'utf-8');
  const stylesData = await fs.readFile(stylesSrc, 'utf-8');

  const outputScriptsFile = path.join(outputDir, 'hexlet-io-courses_files', 'assets-index.js');
  const outputStylesFile = path.join(outputDir, 'hexlet-io-courses_files', 'assets-css-styles.css');

  nock(host).get(pageUrl).reply(200, htmlBeforeData);
  nock(host).get(scriptsUrl).reply(200, scriptsData);
  nock(host).get(stylesUrl).reply(200, stylesData);

  await pageLoader(`${host}${pageUrl}`, outputDir);

  const actualScripts = await fs.readFile(outputScriptsFile, 'utf-8');
  const expectedScripts = scriptsData;
  assert.strictEqual(actualScripts, expectedScripts);

  const actualStyles = await fs.readFile(outputStylesFile, 'utf-8');
  const expectedStyles = stylesData;
  assert.strictEqual(actualStyles, expectedStyles);
});
