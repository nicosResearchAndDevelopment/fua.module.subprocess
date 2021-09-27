const
    _util = require('@nrd/fua.core.util'),
    util  = exports = module.exports = {
        ..._util,
        assert: _util.Assert('module.subprocess')
    };

module.exports = util;
