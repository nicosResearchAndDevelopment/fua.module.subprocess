const
    _util = require('@nrd/fua.core.util'),
    util  = exports = module.exports = {
        ..._util,
        assert: _util.Assert('module.subprocess')
    };

util.isExecutable = util.StringValidator(/^[a-z][a-z0-9\-_]*$/i);

/**
 * @param {...(string | number | Array<string | number> | {[key: string | number]: boolean | string | number | Array<string | number> })} args
 * @returns {Array<string>}
 */
util.flattenArgs = function (args) {
    if (util.isArray(args)) {
        return args.map(util.flattenArgs).filter(val => val).flat(1);
    } else if (util.isObject(args)) {
        const result = [];
        for (let [key, value] of Object.entries(args)) {
            key = util.isNumber(key) ? '--' + key
                : key.startsWith('-') ? key
                    : key.length > 1 ? '--' + key
                        : '-' + key;
            if (util.isArray(value)) {
                for (let entry of value) {
                    if (util.isString(value)) {
                        result.push(key);
                        result.push(entry);
                    } else if (util.isNumber(value)) {
                        result.push(key);
                        result.push('' + entry);
                    }
                }
            } else if (util.isString(value)) {
                result.push(key);
                result.push(value);
            } else if (util.isNumber(value)) {
                result.push(key);
                result.push('' + value);
            } else if (value === true) {
                result.push(key);
            }
        }
        return result;
    } else if (util.isString(args)) {
        return [args];
    } else if (util.isNumber(args)) {
        return ['' + args];
    }
}; // flattenArgs

module.exports = util;
