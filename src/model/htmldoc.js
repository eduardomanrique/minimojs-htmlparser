const _ = require('underscore');
const {_eqIgnoreCase} = require('../util');

class HTMLDoc extends Element {
    constructor() {
        super("DOCUMENT", null);
        this.root = this;
        this._requiredResourcesList = [];
    }
    _prepareHTMLElement() {
        if (!_.isEmpty(this._requiredResourcesList)) {
            if (this._htmlElement) {
                this._bodyElement = _.find(this._htmlElement.getElements(), ce => _eqIgnoreCase(ce.name, "body"));
                this._headElement = _.find(this._htmlElement.getElements(), ce => _eqIgnoreCase(ce.name, "head"));
                if (!this._headElement) {
                    this._headElement = new Element("head", this);
                    this._htmlElement.insertChild(this._headElement, 0);
                }
                this._requiredResourcesList.forEach(e => {
                    const source = e.getAttribute("src").trim();
                    if (source.toLowerCase().endsWith(".js")) {
                        let scriptEl;
                        if (this._bodyElement) {
                            scriptEl = this._bodyElement.addElement("script");
                        } else {
                            scriptEl = this._headElement.addElement("script");
                        }
                        scriptEl.setAttribute("src", `/res/${source}`);
                        scriptEl.setAttribute("type", "text/javascript");
                    } else if (source.toLowerCase().endsWith("css") && this._headElement) {
                        const linkEl = this._headElement.addElement("link");
                        linkEl.setAttribute("href", `/res/${source}`);
                        if (e.getAttribute("rel")) {
                            linkEl.setAttribute("rel", e.getAttribute("rel"));
                        }
                        if (e.getAttribute("media")) {
                            linkEl.setAttribute("media", e.getAttribute("media"));
                        }
                    }
                });
            }
        }
    }
    __addChild(node) {
        if (node instanceof Element && _eqIgnoreCase(node.name, "html")) {
            this._htmlElement = node;
        }
        super.__addChild(node);
    }
    get requiredResourcesList() {
        return this._requiredResourcesList;
    }
    replaceAllTexts(replacer) {
        this.getAllTextNodes().forEach(e => e.text = replacer.replace(e.text));
    }
    renameAllAttributesWithName(name, newName) {
        this.getAllElements().forEach(e => e.renameAttribute(this._name, newName));
    }
    get htmlElement() {
        return this._htmlElement;
    }
    createElement(name) {
        return new Element(name, this._root);
    }
}

module.exports = HTMLDoc;