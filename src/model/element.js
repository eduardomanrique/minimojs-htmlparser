const _ = require('underscore');
const options = require('minimojs-options');
const {_str, _clearObj, _getAllTextNodes, _isEmptyText, _eqIgnoreCase } = require('../util');

class Element extends Node {
    constructor(name, root) {
        super();
        this._children = [];
        this._attributes = {};
        this._tagText = null;
        this._name = name;
        this._notClosed = false;
        this._isClosed = false;
        this._isComponent = false;
        this._componentName = null;
        this._root = root;
    }
    set root(root) {
        this._root = root;
    }
    get attributes() {
        return _.values(this._attributes).map(a => {
            return {
                name: a.name,
                value: a.stringValue
            }
        });
    }
    getElementsByName(name) {
        return _.flatten(this.getElements()
            .filter(e => e instanceof Element)
            .map(e => {
                let list = [];
                if (_eqIgnoreCase(e.name, name)) {
                    list.push(e);
                }
                list.push(e.getElementsByName(name));
                return list;
            }));
    }
    getAllElements() {
        return _.flatten(this.getElements().map(e => {
            let list = [e];
            list.push(e.getAllElement());
            return list;
        }));
    }
    getAllTextNodes() {
        return _getAllTextNodes(this);
    }
    getElementsWithAttribute(name) {
        return _.flatten(this.getElements().filter(e => e instanceof Element)
            .map(e => {
                let list = [e.getElementsWithAttribute(name)];
                if (e.getAttribute(name) != null) {
                    list.push(e);
                }
                return list;
            }));
    }
    addElement(name) {
        let e = new Element(name, this._root);
        this.__addChild(e);
        return e;
    }
    addText(value) {
        let e = new Text(value);
        this.__addChild(e);
        return e;
    }
    __addChildList(list) {
        list.forEach(n => this.__addChild(n));
    }
    __addChild(node) {
        node.parent = this;
        this._children.push(node);
    }
    insertChild(node, index) {
        node.parent = this;
        this._children.splice(index, 0, node);
    }
    insertChildAfter(node, after) {
        this.insertChild(node, this._children.indexOf(after) + 1);
    }
    insertChildBefore(node, before) {
        this.insertChild(node, this._children.indexOf(before));
    }
    get children() {
        return this._children || [];
    }
    clearChildren() {
        this._children = [];
    }
    getElements() {
        return this.children.filter(e => e instanceof Element);
    }
    get innerText() {
        return _str(this.getAllTextNodes().map(e => e.text));
    }
    getTagText() {
        return this._tagText;
    }
    getAttributes() {
        return _.clone(this._attributes);
    }
    setAttribute(name, val) {
        let a = new Attribute(name, val);
        this._attributes[a.name] = a;
    }
    getAttribute(name) {
        return _.has(this._attributes, name) ? this._attributes[name].stringValue : null;
    }
    getAttributeJsonFormat(n) {
        return this._attributes[n];
    }
    get name() {
        return this._name;
    }
    renameAttribute(name, newName) {
        this._attributes[newName] = this._attributes[name];
        delete this._attributes[name];
    }
    close() {
        this._isClosed = true;
    }
    childrenToJson() {
        return this.children.filter(n => !_isEmptyText(n)).map(n => n.toJson()).filter(c => !_.isEmpty(c));
    }
    toJson() {
        return _clearObj({
            n: this._name,
            a: _.extend({}, ..._.values(this.getAttributes()).map(a => a.toJson())),
            c: this.childrenToJson(),
            h: this._hiddenAttributes
        });
    }
    setNotClosed() {
        if (this.parent) {
            this._notClosed = true;
            this.children.forEach(n => this.parent.__addChild(n));
            this.clearChildren();
        }
    }
    isClosed() {
        return this._isClosed;
    }
    remove() {
        super.remove();
    }
    replaceWith(node) {
        this.parent.insertChildAfter(node, this);
        this.remove();
    }
    removeAllChildren() {
        this._children = [];
    }
    addClass(c) {
        let classes = this.getAttribute("class");
        if (!classes || classes.trim() == "") {
            this.setAttribute("class", c);
        } else {
            this.setAttribute("class", classes + " " + c);
        }
    }
    removeAttributes(...attributeNames) {
        attributeNames.forEach(name => this._attributes.remove(name));
    }
    setHiddenAttributeOnChildren(attr, val) {
        this.children.forEach(node => {
            node.setHiddenAttribute(attr, val);
            if (node instanceof Element) {
                node.setHiddenAttributeOnChildren(attr, val);
            }
        });
    }
    findAllChildren(tagName) {
        return _.flatten(this.children
            .filter(c => c instanceof Element)
            .map(c => {
                const result = c.findAllChildren(tagName);
                if (c.name.toLowerCase() == tagName.toLowerCase()) {
                    result.push(c);
                }
                return result;
            }));
    }
    findDeepestChild(tagName) {
        return options.firstOption(this.getElementsByName(tagName)).map(e => e.findDeepestChild(tagName) || e);
    }
    findDeepestChildWithAttribute(attributeName) {
        return options.firstOption(this.getElementsWithAttribute(attributeName)).map(e => e.findDeepestChildWithAttribute(attributeName) || e);
    }
}
module.exports = Element;