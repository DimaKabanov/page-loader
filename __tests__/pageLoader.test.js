import _ from 'lodash/fp';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import debug from 'debug';
import assert from 'power-assert';
import nock from 'nock';
import pageLoader from '../src';

const log = debug('nock');

nock.disableNetConnect();

const getFixturePath = (name) => path.join(__dirname, '__fixtures__', name);

const host = 'https://hexlet.io';
const pageUrl = '/courses';
const scriptsUrl = '/assets/index.js';
const stylesUrl = '/assets/css/styles.css';
const imgUrl = '/card.png';

let outputDir;

let htmlBeforeData;
let scriptsData;
let stylesData;
let imgData;

beforeEach(async () => {
  outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  await fs.unlink(outputDir).catch(_.noop);

  const htmlBeforeSrc = getFixturePath('index-before.html');
  const scriptsSrc = getFixturePath('index.js');
  const stylesSrc = getFixturePath('styles.css');
  const imgSrc = getFixturePath('card.png');

  htmlBeforeData = await fs.readFile(htmlBeforeSrc, 'utf-8');
  scriptsData = await fs.readFile(scriptsSrc, 'utf-8');
  stylesData = await fs.readFile(stylesSrc, 'utf-8');
  imgData = await fs.readFile(imgSrc, 'utf-8');

  nock(host)
    .log(log)
    .get(pageUrl)
    .reply(200, htmlBeforeData)
    .get(scriptsUrl)
    .reply(200, scriptsData)
    .get(stylesUrl)
    .reply(200, stylesData)
    .get(imgUrl)
    .reply(200, imgData);
});

test('Correctly downloads index page', async () => {
  const htmlAfterSrc = getFixturePath('index-after.html');
  const htmlAfterData = await fs.readFile(htmlAfterSrc, 'utf-8');
  const outputHtmlFile = path.join(outputDir, 'hexlet-io-courses.html');

  await pageLoader(`${host}${pageUrl}`, outputDir);

  const actualPage = await fs.readFile(outputHtmlFile, 'utf-8');
  const expectedPage = htmlAfterData;
  assert.strictEqual(actualPage, expectedPage);
});

test('Correctly downloads local resourses', async () => {
  const outputScriptsFile = path.join(outputDir, 'hexlet-io-courses_files', 'assets-index.js');
  const outputStylesFile = path.join(outputDir, 'hexlet-io-courses_files', 'assets-css-styles.css');
  const outputImgFile = path.join(outputDir, 'hexlet-io-courses_files', 'card.png');

  await pageLoader(`${host}${pageUrl}`, outputDir);

  const actualScripts = await fs.readFile(outputScriptsFile, 'utf-8');
  const expectedScripts = scriptsData;
  assert.strictEqual(actualScripts, expectedScripts);

  const actualStyles = await fs.readFile(outputStylesFile, 'utf-8');
  const expectedStyles = stylesData;
  assert.strictEqual(actualStyles, expectedStyles);

  const actualImg = await fs.readFile(outputImgFile, 'utf-8');
  const expectedImg = imgData;
  assert.strictEqual(actualImg, expectedImg);
});

test('Correctly error message when wrong output path', async () => {
  const wrongOutputDir = 'wrong';
  const expecteErrorMessage = 'no such file or directory';
  await expect(pageLoader(`${host}${pageUrl}`, wrongOutputDir)).rejects.toThrow(expecteErrorMessage);
});
