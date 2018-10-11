const _ = require('underscore');
const { _clearObj } = require('../util');
const Node = require('./node');

class TextScript extends Node {
    constructor(script) {
        super();
        this._script = script;
    }
    get script() {
        return this._script;
    }
    toJson() {
        return _clearObj({
            x: this._script,
            h: this._hiddenAttributes
        });
    }
}

module.exports = TextScript;