'use strict';

var util = require('util');
var minimist = require('minimist');

function describe (optdef) {
    var desc = '    --' + optdef.name;
    if (optdef.alias) desc += ' (-' + optdef.alias + ')';
    if (optdef.describe) desc += ' ' + optdef.describe;
    if (optdef.default) desc += ' (default=' + optdef.default +')';
    return desc;
}

function print (s) {
    console.log(s);
}

function usage (options, usage) {
    console.log(usage || 'options:');
    options.map(describe).forEach(print);
}

function as_array (options) {
    var out = [];
    for (var o in options) {
        var definition = options[o];
        if (definition.alias) {
            if (definition.alias.length > o.length) {
                definition.name = definition.alias;
                definition.alias = o;
            } else {
                definition.name = o;
            }
        } else {
            definition.name = o;
        }
        out.push(definition);
    }
    return out;
}

function get_type(o) {
    if (typeof o == 'number' || o instanceof Number) {
        return 'number';
    } else if (util.isArray(o)) {
        return get_type(o[0]);
    } else {
        return 'string';
    }

}

function Options (options) {
    this.options = options;
    var minimist_opts = {
        'string': [],
        'number': [],
        'boolean': [],
        'alias': {},
        'default' : {}
    };
    this.options.forEach(function (definition) {
        if (definition.alias) {
            minimist_opts.alias[definition.name] = definition.alias;
        }
        if (definition.default !== undefined) {
            minimist_opts.default[definition.name] = definition.default;
        }
        if (definition.type === 'boolean') {
            minimist_opts.boolean.push(definition.name);
        } else if (definition.default !== undefined) {
            minimist_opts[get_type(definition.default)].push(definition.name);
        }
    });
    this.argv = minimist(process.argv.slice(2), minimist_opts);
}

Options.prototype.help = function (name) {
    var field = name || 'help';
    if (this.argv[name]) {
        usage(this.options, this.usage_text);
        process.exit(0);
    }
    return this;
}

Options.prototype.usage = function (usage) {
    this.usage_text = usage;
    return this;
}

module.exports = {
    options : function (options) {
        return new Options(as_array(options));
    }
};