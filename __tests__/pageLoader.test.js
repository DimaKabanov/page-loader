import 'regenerator-runtime/runtime';
import { promises as fs } from 'fs';
import os from 'os';
import assert from 'power-assert';
import nock from 'nock';
import pageLoader from '../src';

test('Correctly downloads the page at the specified address', async () => {
  const testInputDataPath = '__tests__/__fixtures__/input.html';
  const testOutputDataPath = '__tests__/__fixtures__/output.html';
  const htmlData = await fs.readFile(testInputDataPath, { encoding: 'utf8' });
  const host = 'https://hexlet.io/';
  const url = 'courses';
  nock(host)
    .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
    .get(`/${url}`)
    .reply(200, htmlData);

  const tmpdir = `${os.tmpdir()}/test`;
  await pageLoader(`${host}${url}`, tmpdir);
  const actual = await fs.readFile(tmpdir, 'utf-8');
  const expected = await fs.readFile(testOutputDataPath, 'utf-8');
  assert.strictEqual(actual, expected);
});
