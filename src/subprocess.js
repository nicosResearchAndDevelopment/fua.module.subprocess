const
    assert        = require('@nrd/fua.core.assert'),
    is            = require('@nrd/fua.core.is'),
    util          = require('./util.js'),
    child_process = require('child_process');

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @param {string} [encoding='buffer']
 * @param {boolean} [shell=false]
 * @returns {function(...any): Promise<string>}
 */
exports.ExecutionProcess = function (exe, {
    cwd = process.cwd(),
    verbose = false,
    encoding = 'utf-8',
    shell = false
} = {}) {
    assert(util.isExecutable(exe), 'expected exe to be an executable string', TypeError);
    assert(is.string(cwd), 'expected cwd to be a path string', TypeError);
    assert(is.boolean(verbose), 'expected verbose to be a boolean', TypeError);
    assert(is.string(encoding), 'expected encoding to be a string', TypeError);
    assert(is.boolean(shell), 'expected shell to be a boolean', TypeError);

    /**
     * @param {...any} args
     * @returns {Promise<string | Buffer>}
     */
    async function launcher(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd, shell});
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

    Object.defineProperties(launcher, {
        cwd:      {
            get() {
                return cwd;
            },
            set(value) {
                assert(is.string(value), 'expected cwd to be a path string', TypeError);
                cwd = value;
            }
        },
        verbose:  {
            get() {
                return verbose;
            },
            set(value) {
                assert(is.boolean(value), 'expected verbose to be a boolean', TypeError);
                verbose = value;
            }
        },
        encoding: {
            get() {
                return encoding;
            },
            set(value) {
                assert(is.string(value), 'expected encoding to be a string', TypeError);
                encoding = value;
            }
        },
        shell:    {
            get() {
                return shell;
            }
        }
    });

    return launcher;
}; // ExecutionProcess

/**
 * @param {string} exe
 * @param {string} [cwd=process.cwd()]
 * @param {boolean} [verbose=false]
 * @param {boolean} [shell=false]
 * @returns {function(...any): module:child_process.ChildProcess}
 */
exports.RunningProcess = function (exe, {
    cwd = process.cwd(),
    verbose = false,
    shell = false
} = {}) {
    assert(util.isExecutable(exe), 'expected exe to be an executable string', TypeError);
    assert(is.string(cwd), 'expected cwd to be a path string', TypeError);
    assert(is.boolean(verbose), 'expected verbose to be a boolean', TypeError);
    assert(is.boolean(shell), 'expected shell to be a boolean', TypeError);

    function launcher(...args) {
        const subprocess = child_process.spawn(exe, util.flattenArgs(args), {cwd, shell});
        if (verbose) {
            process.stdout.write('$ ' + cwd + '> ' + subprocess.spawnargs.join(' ') + '\n');
            subprocess.stdout.on('data', (data) => process.stdout.write(data));
            subprocess.stderr.on('data', (data) => process.stderr.write(data));
        }
        return subprocess;
    } // launcher

    Object.defineProperties(launcher, {
        cwd:     {
            get() {
                return cwd;
            },
            set(value) {
                assert(is.string(value), 'expected cwd to be a path string', TypeError);
                cwd = value;
            }
        },
        verbose: {
            get() {
                return verbose;
            },
            set(value) {
                assert(is.boolean(value), 'expected verbose to be a boolean', TypeError);
                verbose = value;
            }
        },
        shell:   {
            get() {
                return shell;
            }
        }
    });

    return launcher;
}; // RunningProcess

/**
 * @param {Array<string>} [argv=process.argv]
 * @returns {{_: Array<string>, [key: string]: boolean | string | Array<string>}}
 */
exports.parseArgv = function (argv = process.argv) {
    assert(is.array.strings(argv), 'expected argv to be a string array', TypeError);

    const
        tmp_args     = [],
        param        = {_: []},
        RE_match_arg = /^(--?)?([0-9a-z\-_.?$]+)(?:(=)(.*))?$/i;

    for (let arg of argv) {
        const res = RE_match_arg.exec(arg);
        if (res) {
            if (res[3]) {
                tmp_args.push({type: 'key', value: res[2]});
                tmp_args.push({type: 'val', value: util.parseEscapedString(res[4])});
            } else if (res[1]) {
                tmp_args.push({type: 'key', value: res[2]});
            } else {
                tmp_args.push({type: 'val', value: util.parseString(arg)});
            }
        } else {
            tmp_args.push({type: 'val', value: util.parseString(arg)});
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
            } else if (!is.array(param[key])) {
                param[key] = [param[key], value];
            } else {
                param[key].push(value);
            }
        } else {
            param._.push(tmp_args[index].value);
        }
    }

    return param;
}; // parseArgv

// /**
//  * @param {Array<string>} [argv]
//  * @returns {{[key: string]: boolean | number | string | Array<boolean | number | string>}}
//  */
// exports.parseArgv = function (argv = process.argv) {
//     const result = {_: []};
//     // let index    = 2;
//     // const result = {_: argv.slice(0, 2)};
//     let index = 0;
//     while (index < argv.length) {
//         const
//             isBlank = !argv[index].startsWith('-'),
//             isTag   = !isBlank && (!argv[index + 1] || argv[index + 1].startsWith('-')),
//             key     = isBlank ? '_' : argv[index].replace(/^--?/, ''),
//             value   = isBlank ? util.parseString(argv[index]) : isTag ? true : util.parseString(argv[index + 1]);
//         index += isBlank || isTag ? 1 : 2;
//         if (!(key in result)) result[key] = value;
//         else if (Array.isArray(result[key])) result[key].push(value);
//         else result[key] = [result[key], value];
//     }
//     return result;
// }; // parseArgv
