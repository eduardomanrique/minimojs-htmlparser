const _ = require('underscore');
const {_str} = require('../util');
const Node = require('./node');

class Text extends Node {
  constructor(text) {
    super();
    this._text = text;
  }
  get text() {
    return !this._text || this._text.trim() == "" ? _str(this._buffer) : this._text;
  }
  _getNonNullText(fn) {
    let text = this.text;
    if (!text || text.trim() == '') {
      return '';
    }
    return (fn || ((f) => f))(text);
  }
  toString() {
    return this._getNonNullText();
  }
  toJson() {
    return this._getNonNullText();
  }
  isEmpty() {
    let txt = this._getNonNullText();
    return txt == null || txt == '';
  }
  close() {}
}

module.exports = Text