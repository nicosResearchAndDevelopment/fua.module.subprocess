const
    util          = require('./module.subprocess.util.js'),
    child_process = require('child_process');
//     EventEmitter  = require('events'),
//     {Readable}    = require('stream');

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @param {string} [encoding='buffer']
 * @returns {function(...any): Promise<string>}
 */
exports.ExecutionProcess = function (exe, {cwd = process.cwd(), verbose = false, encoding = 'utf-8'} = {}) {
    util.assert(util.isExecutable(exe), 'ExecutionProcess : expected exe to be an executable string', TypeError);
    util.assert(util.isString(cwd), 'ExecutionProcess : expected cwd to be a path string', TypeError);
    util.assert(util.isBoolean(verbose), 'ExecutionProcess : expected verbose to be a boolean', TypeError);
    util.assert(util.isString(encoding), 'ExecutionProcess : expected encoding to be a string', TypeError);

    /**
     * @param {...any} args
     * @returns {Promise<string | Buffer>}
     */
    async function launcher(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd});
        if (verbose) process.stdout.write('$ ' + cwd + '> ' + subprocess.spawnargs.join(' ') + '\n');
        const stdout = [], stderr = [];
        subprocess.stdout.on('data', (data) => {
            stdout.push(data);
            if (verbose) process.stdout.write(data);
        });
        subprocess.stderr.on('data', (data) => {
            stderr.push(data);
            if (verbose) process.stderr.write(data);
        });
        const exitCode = await new Promise((resolve) => subprocess.on('close', resolve));
        if (exitCode !== 0) {
            const errBuffer = Buffer.concat(stderr);
            throw new Error(errBuffer.toString());
        } else {
            const resultBuffer = Buffer.concat(stdout.length ? stdout : stderr);
            return util.decodeBuffer(resultBuffer, encoding);
        }
    } // launcher

    return launcher;
}; // ExecutionProcess

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @returns {function(...any): module:child_process.ChildProcess}
 */
exports.RunningProcess = function (exe, {cwd = process.cwd(), verbose = false} = {}) {
    util.assert(util.isExecutable(exe), 'RunningProcess : expected exe to be an executable string', TypeError);
    util.assert(util.isString(cwd), 'RunningProcess : expected cwd to be a path string', TypeError);
    util.assert(util.isBoolean(verbose), 'RunningProcess : expected verbose to be a boolean', TypeError);

    function launcher(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd});
        if (verbose) {
            process.stdout.write('$ ' + cwd + '> ' + subprocess.spawnargs.join(' ') + '\n');
            subprocess.stdout.on('data', (data) => process.stdout.write(data));
            subprocess.stderr.on('data', (data) => process.stderr.write(data));
        }
        return subprocess;
    } // launcher

    return launcher;
}; // RunningProcess
