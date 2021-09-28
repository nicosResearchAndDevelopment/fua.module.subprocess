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
        let error    = null;
        subprocess.stdout.on('data', (data) => {
            stdout.push(data);
            if (verbose) process.stdout.write(data);
        });
        subprocess.stderr.on('data', (data) => {
            stderr.push(data);
            if (verbose) process.stderr.write(data);
        });
        subprocess.on('error', (err) => (error = err));
        const exitCode = await new Promise((resolve) => subprocess.on('close', resolve));
        if (exitCode !== 0) {
            if (!error) {
                const errBuffer = Buffer.concat(stderr.length ? stderr : stdout);
                error           = new Error(util.decodeBuffer(errBuffer, encoding).toString().trim());
            }
            error.code = exitCode;
            Error.captureStackTrace(error, launcher);
            throw error;
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

/**
 * @param argv
 * @returns {{args: Array<string>, param: {Object}}}
 */
exports.parseArgv = function (argv = process.argv) {
    util.assert(util.isStringArray(argv), 'parseArgv : expected argv to be a string array', TypeError);

    const
        tmp_args     = [],
        args         = [],
        param        = {},
        RE_match_arg = /^(--?)?([0-9a-z\-_.?$]+)(?:(=)(.*))?$/i,
        cleanupValue = (val) => val.substring((val.startsWith('"') ? 1 : 0), val.length - (val.endsWith('"') ? 1 : 0));

    for (let arg of argv) {
        const res = RE_match_arg.exec(arg);
        if (res) {
            if (res[3]) {
                tmp_args.push({type: 'key', value: res[2]});
                tmp_args.push({type: 'val', value: cleanupValue(res[4])});
            } else if (res[1]) {
                tmp_args.push({type: 'key', value: res[2]});
            } else {
                tmp_args.push({type: 'val', value: cleanupValue(arg)});
            }
        } else {
            tmp_args.push({type: 'val', value: cleanupValue(arg)});
        }
    }

    for (let index = 0, max = tmp_args.length - 1; index <= max; index++) {
        if (tmp_args[index].type === 'key') {
            const
                key   = tmp_args[index].value,
                value = (index === max || tmp_args[index + 1].type !== 'val')
                    ? true : tmp_args[++index].value;
            if (!(key in param)) {
                param[key] = value;
            } else if (!util.isArray(param[key])) {
                param[key] = [param[key], value];
            } else {
                param[key].push(value);
            }
        } else {
            args.push(tmp_args[index].value);
        }
    }

    return {param, args};
}; // parseArgv
