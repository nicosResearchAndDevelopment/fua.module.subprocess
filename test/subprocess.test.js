const
    {describe, test}                       = require('mocha'),
    expect                                 = require('expect'),
    {ExecutionProcess, LongRunningProcess} = require('../src/module.subprocess.js');

describe('module.subprocess', function () {

    describe('ExecutionProcess', function () {

        test('ping', async function () {
            const ping = ExecutionProcess('ping');
            console.log(await ping({n: 1}, 'google.com'));
        });

    });

    describe('LongRunningProcess', function () {

        test('ping', async function () {
            const ping = LongRunningProcess('ping');
            await new Promise((resolve) => {
                ping({n: 1}, 'google.com')
                    .on('data', console.log)
                    .on('end', resolve);
            });
        });

    });

}); // describe
