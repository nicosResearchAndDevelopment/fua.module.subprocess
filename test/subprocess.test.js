const
    {describe, test}   = require('mocha'),
    expect             = require('expect'),
    {ExecutionProcess} = require('../src/module.subprocess.js');

describe('module.subprocess', function () {

    describe('ExecutionProcess', function () {

        test('ping', async function () {
            const ping = ExecutionProcess('ping', {encoding: 'cp437'});
            console.log(await ping({n: 1}, 'google.com'));
        });

    });

}); // describe
