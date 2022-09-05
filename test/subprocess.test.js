const
    {describe, test}              = require('mocha'),
    expect                        = require('expect'),
    {ExecutionProcess, parseArgv} = require('../src/module.subprocess.js');

describe('module.subprocess', function () {

    describe('ExecutionProcess', function () {

        test('ping', async function () {
            const ping = ExecutionProcess('ping', {encoding: 'cp437'});
            await expect(ping()).rejects.toThrow();
            const result = await ping({n: 1}, 'google.com');
            expect(typeof result).toBe('string');
            console.log(result);
            // console.log(await ping());
        });

        test('marzipan', async function () {
            const marzipan = ExecutionProcess('marzipan');
            await expect(marzipan()).rejects.toThrow();
        });

    });

    test('parseArgv', function () {
        console.log(parseArgv(['node', 'script.js', '--test', 'lorem=ipsum', '--hello', 'world', '--answer', '42']));
    });

}); // describe
