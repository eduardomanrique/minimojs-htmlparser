const _ = require('underscore');
const {_str} = require('../util');

class Node {
  constructor() {
    this._buffer = [];
    this._hiddenAttributes = {};
    this._tempAttributes = {};
  }
  getNext() {
    let index = this.parent.children.indexOf(this);
    if (index == this.parent.children.length - 1) {
      return null;
    }
    return this.parent.children[index + 1];
  }
  getPrevious() {
    let index = this.parent.children.indexOf(this);
    if (index == 0) {
      return null;
    }
    return this.parent.children[index - 1];
  }
  addAfter(node) {
    let index = this.parent.children.indexOf(this);
    if (index == this.parent.children.length - 1) {
      this.parent.__addChild(node);
    } else {
      this.parent.insertChild(node, index + 1);
    }
  }
  addBefore(node) {
    let index = this.parent.children.indexOf(this);
    if (index == 0) {
      this.parent.insertChild(node, 0);
    } else {
      this.parent.insertChild(node, index);
    }
  }
  get parent() {
    return this._parent;
  }
  set parent(parent) {
    this._parent = parent;
  }
  addChar(c) {
    this._buffer.push(c);
  }
  addString(s) {
    this._buffer.push(s);
  }
  toString() {
    return _str(this._buffer);
  }
  remove() {
    let index = this.parent.children.indexOf(this);
    this.parent.children.splice(index, 1);
    this._parent = null;
  }
  setHiddenAttribute(attrName, val) {
    if (!this._hiddenAttributes[attrName]) {
      this._hiddenAttributes[attrName] = val;
    }
  }
  getHiddenAttribute(attrName) {
    return this._hiddenAttributes[attrName];
  }
  hasHiddenAttributes() {
    return _.keys(this._hiddenAttributes).length > 0;
  }
  getTempAttribute(name) {
    return this._tempAttributes[name];
  }
  setTempAttribute(name, value) {
    this._tempAttributes[name] = value;
  }
}

module.exports = Node;