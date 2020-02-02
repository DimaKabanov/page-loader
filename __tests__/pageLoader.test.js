import _ from 'lodash/fp';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import assert from 'power-assert';
import nock from 'nock';
import pageLoader from '../src';

nock.disableNetConnect();

const getFixturePath = (name) => path.join(__dirname, '__fixtures__', name);

let outputDir;

beforeEach(async () => {
  outputDir = os.tmpdir();
  await fs.unlink(outputDir).catch(_.noop);
});

test('Correctly downloads the page at the specified address', async () => {
  const src = getFixturePath('index.html');
  const htmlData = await fs.readFile(src, 'utf-8');
  const outputFile = path.join(outputDir, 'hexlet-io-courses.html');
  const host = 'https://hexlet.io';
  const url = '/courses';
  nock(host).get(url).reply(200, htmlData);

  await pageLoader(`${host}${url}`, outputDir);

  const actualPage = await fs.readFile(outputFile, 'utf-8');
  const expectedPage = await fs.readFile(src, 'utf-8');
  assert.strictEqual(actualPage, expectedPage);
});
