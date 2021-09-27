const
    util          = require('./module.subprocess.util.js'),
    child_process = require('child_process'),
    EventEmitter  = require('events');

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @returns {function(...any): Promise<string>}
 */
exports.ExecutionProcess = function (exe, cwd = process.cwd(), verbose = false) {
    util.assert(util.isExecutable(exe), 'createProcessor : expected exe to be an executable string', TypeError);
    util.assert(util.isString(cwd), 'createProcessor : expected cwd to be a path string', TypeError);
    util.assert(util.isBoolean(verbose), 'createProcessor : expected verbose to be a boolean', TypeError);

    /**
     * @param {...any} args
     * @returns {Promise<string>}
     */
    async function processor(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd});
        if (verbose) process.stdout.write('$ ' + cwd + '> ' + subprocess.spawnargs.join(' ') + '\n');
        const _out = [], _err = [];
        subprocess.stdout.on('data', (data) => {
            _out.push(data);
            if (verbose) process.stdout.write(data);
        });
        subprocess.stderr.on('data', (data) => {
            _err.push(data);
            if (verbose) process.stderr.write(data);
        });
        const exitCode = await new Promise((resolve) => subprocess.on('close', resolve));
        if (exitCode !== 0) throw new Error(_err.join(''));
        return _out.join('') || _err.join('');
    } // processor

    return processor;
}; // ExecutionProcess

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @returns {function(...any): EventEmitter}
 */
exports.LongRunningProcess = function (exe, cwd = process.cwd(), verbose = false) {
    util.assert(util.isExecutable(exe), 'createProcessor : expected exe to be an executable string', TypeError);
    util.assert(util.isString(cwd), 'createProcessor : expected cwd to be a path string', TypeError);
    util.assert(util.isBoolean(verbose), 'createProcessor : expected verbose to be a boolean', TypeError);

    function processor(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd});
        if (verbose) process.stdout.write('$ ' + cwd + '> ' + subprocess.spawnargs.join(' ') + '\n');
        // TODO
    } // processor

    return processor;
}; // LongRunningProcess
