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
        if (exitCode !== 0) throw new Error(stderr.join(''));
        return stdout.join('') || stderr.join('');
    } // processor

    return processor;
}; // ExecutionProcess

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @returns {function(...any): module:events.EventEmitter}
 */
exports.LongRunningProcess = function (exe, cwd = process.cwd(), verbose = false) {
    util.assert(util.isExecutable(exe), 'createProcessor : expected exe to be an executable string', TypeError);
    util.assert(util.isString(cwd), 'createProcessor : expected cwd to be a path string', TypeError);
    util.assert(util.isBoolean(verbose), 'createProcessor : expected verbose to be a boolean', TypeError);

    function processor(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd});
        if (verbose) process.stdout.write('$ ' + cwd + '> ' + subprocess.spawnargs.join(' ') + '\n');
        const emitter = new EventEmitter();
        let lastRow   = '';
        subprocess.stdout.on('data', (data) => {
            emitter.emit('stdout', data);
            const rows = data.toString().split(/\r?\n/g);
            rows[0]    = lastRow + rows[0];
            lastRow    = rows.pop();
            for (let row of rows) {
                emitter.emit('data', row);
            }
            if (verbose) process.stdout.write(data);
        });
        subprocess.stderr.on('data', (data) => {
            emitter.emit('stderr', data);
            if (verbose) process.stderr.write(data);
        });
        subprocess.on('close', (exitCode) => {
            if (lastRow) emitter.emit('data', lastRow);
            emitter.emit('end', exitCode);
        });
        emitter.on('close', (signal) => {
            subprocess.kill(signal);
        });
        return emitter;
    } // processor

    return processor;
}; // LongRunningProcess
