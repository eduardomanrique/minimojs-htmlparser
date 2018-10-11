const _ = require('underscore');
const esprima = require('esprima');

module.exports = {
    _str: (sb) => sb.join(''),
    _clearObj: obj => _.omit(obj, v => _.isNull(v) || _.isEmpty(v)),
    _getAllTextNodes: (element) => _.flatten(element.children.map(e => {
        let list = [];
        if (e instanceof Element) {
            list.push(_getAllTextNodes(e));
        } else if (e instanceof Text) {
            list.push(e);
        }
        return list;
    })),
    _isEmptyText: (node) => node instanceof Text && !(node instanceof Comment) && node.isEmpty(),
    _eqIgnoreCase: (s1, s2) => s1.toUpperCase() == s2.toUpperCase(),
    _validateJS: (js) => {
        try {
            esprima.parse(js);
            return true;
        } catch (e) {
            throw new Error(`Invalid script on htmx '${js}': ${e.message}`);
        }
    }
}