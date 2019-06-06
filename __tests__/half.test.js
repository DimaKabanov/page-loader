import assert from 'power-assert';
import half from '../src';

test('half', () => {
  const actual = half(6);
  const expected = 3;
  assert.strictEqual(actual, expected);
});
