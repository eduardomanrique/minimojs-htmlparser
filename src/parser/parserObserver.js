const Comment = require('../model/comment');
const Element = require('../model/element');
const Text = require('../model/text');

class ParserObserver {
    constructor(doc, observer) {
        this.current = doc;
        this.observer = observer || {};
    }
    get element(){
        return this.current;
    }
    get elementName(){
        return this.element && this.element.name ? this.element.name.toLowerCase() : null;
    }
    up(){
        this.current = this.current.parent;
    }
    onTextNode(val) {
        const parent = this.current;
        let obsResult;
        if (this.observer.onTextNode) {
            obsResult = this.observer.onTextNode(val, parent);
        }
        if (obsResult !== false) {
            if(!obsResult){
                parent.__addChild(new Text(parent, val));
            }else if (obsResult.constructor === Array) {
                obsResult.forEach(n => parent.__addChild(n));
            } else {
                parent.__addChild(obsResult);
            }
        }
    }
    onNewElement(name){
        const parent = this.current;
        let obsResult;
        if (this.observer.onNewElement){
            obsResult = this.observer.onNewElement(name, parent);
        }
        let element;
        if (obsResult !== false){
            element = obsResult;
        } else {
            if(!obsResult){
                element = new Element(name);
            }
            parent.__addChild(element);
        }
        this.current = element;
    }
    onSetAttribute(name, val){
        let obsResult;
        if(this.observer.onSetAttribute){
            obsResult = this.observer.onSetAttribute(this.current, name, val);
        }
        if(obsResult !== false){
            this.current.setAttribute(name, val);
        }
    }
    closeTag(tagName){
        let toClose = this.current;
        while (tagName != toClose.name) {
            if (!toClose._isClosed) {
                toClose.setNotClosed();
            }
            let prev = toClose;
            while (true) {
                prev = prev.getPrevious();
                if (!prev) {
                    toClose = toClose.parent;
                    break;
                } else if (prev instanceof Element && !prev._isClosed) {
                    toClose = prev;
                    break;
                }
            }
        }
        this.onClose(toClose);
    }
    closeCurrentElement(){
        this.onClose(this.current);
    }
    onClose(element){
        element.close();
        this.current = element.parent;
    }
    onComment(val){
        const comment = new Comment(val);
        this.current.__addChild(comment);
        comment.close();
    }
}

module.exports = ParserObserver;