const
  { describe, test } = require('mocha'),
  expect = require('expect'),
  { ExecutionProcess, parseArgv } = require('../src/subprocess.js');

describe('module.subprocess', function () {

  describe('ExecutionProcess', function () {

    test('should ping google.com', async function () {
      const ping = ExecutionProcess('ping', { encoding: 'cp437' });
      await expect(ping()).rejects.toThrow();
      const result = await ping({ n: 1 }, 'google.com');
      expect(typeof result).toBe('string');
      // console.log(result);
      // console.log(await ping());
    });

    test('should fail marzipan', async function () {
      const marzipan = ExecutionProcess('marzipan');
      await expect(marzipan()).rejects.toThrow();
    });

  });

  test('should parseArgv', function () {
    const args = parseArgv(['node', 'script.js', '--test', 'lorem=ipsum', '--hello', 'world', '--answer', '42'])
    expect(args).toMatchObject({
      _: ['node', 'script.js'],
      test: true,
      lorem: 'ipsum',
      hello: 'world',
      answer: 42
    })
    // console.log(args);
  });

}); // describe
