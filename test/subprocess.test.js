const
    {describe, test}              = require('mocha'),
    expect                        = require('expect'),
    {ExecutionProcess, parseArgv} = require('../src/module.subprocess.js');

describe('module.subprocess', function () {

    describe('ExecutionProcess', function () {

        test('ping', async function () {
            const ping = ExecutionProcess('ping', {encoding: 'cp437'});
            console.log(await ping({n: 1}, 'google.com'));
        });

    });

    test('parseArgv', function () {
        console.log(parseArgv(['node', 'script.js', '--test', 'lorem=ipsum', '--hello', 'world']));
    });

}); // describe
