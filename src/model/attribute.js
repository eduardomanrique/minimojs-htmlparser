const _ = require('underscore');
const {_str } = require('../util');

class Attribute {
    constructor(name, value) {
      this._name = name.toLowerCase().trim().replace(/\n/g, "");
      this.value = value;
    }
    get value() {
      return this._value;
    }
    get stringValue() {
      return _str((this._value || []).map(i => _.isString(i) ? i : `\${${i.s}}`));
    }
    set value(attributeValue) {
      let deliminitator = '"';
      let value = attributeValue;
      if (value) {
        value = value.trim();
        if (value.startsWith("\"") || value.startsWith("'")) {
          deliminitator = value.charAt(0);
          value = value.substring(1, value.length - 1);
        }
        value = deliminitator == '"' ? value.replace(/\\"/g, '"') : value.replace(/\\'/g, "'");
        //parse inner scripts
        this._value = [];
        let index = 0;
        let pattern = /\$\{(.*?)}/g;
        let m;
        while ((m = pattern.exec(value)) != null) {
          if (index != m.index) {
            this._value.push(value.substring(index, m.index));
          }
          //script
          this._value.push({
            s: m[1]
          });
          index = m.index + m[1].length + 3;
        }
        if (index < value.length) {
          this._value.push(value.substring(index, value.length));
        }
      }
    }
    get name() {
      return this._name;
    }
    set name(name) {
      this._name = name;
    }
    get deliminitator() {
      return this._deliminitator;
    }
    toJson() {
      const result = {};
      result[this.name] = !this._value ? '' : this._value.length == 1 && typeof (this._value[0]) == "string" ? this._value[0] : this._value;
      return result;
    }
  }

  module.exports = Attribute;