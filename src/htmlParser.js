const _ = require('underscore');
const {_str, _eqIgnoreCase, _validateJS } = require('../util');

class HTMLParser {
  constructor(observer) {
    this._textNodes = [];
    this._doc = new HTMLDoc();
    this._currentParent = this._doc;
    this._currentText = [];
    this._current = null;
    this._currentIndex = 0;
    this._currentRequires = false;
    this._currentLine = [];
    this._observer = observer;
  }
  parse(html) {
    this._charArray = (html + "\n");
    let doc = this._doc;
    while (this.hasMore()) {
      if (this._currentParent.name && this._currentParent.name.toLowerCase() == 'script') {
        this.closeCurrentText();
        this.readScriptElementContent();
      } else if (this.nextIs("<!--")) {
        this.closeCurrentText();
        this.advance();
        this.inComment();
      } else if (this.nextIs("<![")) {
        this.closeCurrentText();
        this.advance();
        this.inCDATA();
      } else if (this.nextIs("</")) {
        this.closeCurrentText();
        this.advance();
        this.close();
      } else if (!this.nextIs("< ") && this.nextIs("<")) {
        this.closeCurrentText();
        this.advance();
        this.inTag();
      } else {
        const currentChar = this.read();
        this._currentText.push(currentChar);
      }
    }
    while (!this._currentParent._isClosed && this._currentParent != doc) {
      this._currentParent.setNotClosed();
      this._currentParent = this._currentParent.parent;
    }
    return doc;
  }
  closeCurrentText() {
    const textValue = _str(this._currentText);
    if (textValue.length > 0) {
      let nodes = [];
      if(this._observer.onTextNode){
        (this._observer.onTextNode(textValue) || []).forEach(node => nodes.push(node));
      }
      if(nodes.length == 0){
        nodes.push(new Text(this._currentParent, textValue));
      }
      nodes.forEach(n => this._currentParent.__addChild(n));
    }
    this._currentText = [];
  }
  advanceLine() {
    return this.readTill("\n").toLowerCase();
  }
  readScriptElementContent() {
    let tagName = this._currentParent.name;
    const sb = [];
    let j = this._currentIndex;
    while (true) {
      if (this._charArray[j] == '<' && this._charArray[j + 1] == '/') {
        let h = j + 2;
        let c;
        let valName = [];
        while (this._charArray.length > h && (c = this._charArray[h++]) != '>') {
          valName.push(c);
        }
        if (_str(valName).trim() == tagName) {
          this._currentIndex = j + 2;
          const text = new Text(_str(sb));
          this._textNodes.push(text);
          this._currentParent.__addChild(text);
          this.close();
          return;
        }
      }
      sb.push(this._charArray[j++]);
    }
  }
  inTag() {
    const name = this.readTill(" ", ">", "/>", "\n", "\t").toLowerCase();

    !!!!!!!!!!
    parei aqui. Fazer observer onNewElement -> se retornar alguma coisa substitui, se nao usa new Element



    let element = new Element(name, this._doc);
    let isRequiresTag = _eqIgnoreCase(name, "requires");
    if (isRequiresTag) {
      this._doc._requiredResourcesList.push(element);
      this._currentRequires = element;
    } else {
      this._currentParent.__addChild(element);
      this._currentParent = element;
      this._current = element;
    }
    //read attributes
    let currentAttributeValue = [];
    const checkEmptyAttribute = () => {
      if (_str(currentAttributeValue).trim().length > 0)
        element.setAttribute(_str(currentAttributeValue).trim(), null);
      currentAttributeValue = [];
    };
    let dynAttr = 0;
    while (true) {
      if (this.discard(' ')) {
        checkEmptyAttribute();
      }
      if (this.nextIs("/>")) {
        //element without body
        this.advance();
        checkEmptyAttribute();
        if (isRequiresTag) {
          this._currentRequires.close();
          this._currentRequires = null;
        } else {
          this.closeElement();
        }
        break;
      } else if (this.nextIs(">")) {
        //element with body
        this.advance();
        checkEmptyAttribute();
        this._current = null;
        break;
      }
      let s = this.read();
      if (s == '=') {
        let attName = _str(currentAttributeValue).trim();
        currentAttributeValue = [];
        let c = this._charArray[this._currentIndex];
        if (c == '\'' || c == '"' || c != ' ') {
          s = c;
          currentAttributeValue.push(this.read());
          let aspas = c == '\'' || c == '"';
          while (true) {
            c = this.read();
            currentAttributeValue.push(c);
            let endNoAspas = (!aspas && c == ' ') ||
              (!aspas && ((c == '/' && this._charArray[this._currentIndex + 1] == '>') || c == '>'));
            if (endNoAspas || (aspas && c == s && this.previous(2) != '\\')) {
              let val = _str(currentAttributeValue).substring(0, currentAttributeValue.length);
              if (endNoAspas) {
                this._currentIndex--;
                val = val.substring(0, val.length - 1);
              }
              element.setAttribute(attName, val);
              currentAttributeValue = [];
              break;
            }
          }
        } else {
          element.setAttribute(attName, null);
        }
      } else {
        currentAttributeValue.push(s);
      }
    }
    this.prepareElementsWithSource(element);
  }
  prepareElementsWithSource(element) {
    if (element.name.toUpperCase() == "SCRIPT") {
      let src = element.getAttribute("src");
      if (src && src.startsWith("/")) {
        element.setAttribute("src", `${src}`);
      }
    }
    if (element.name.toUpperCase() == "A") {
      let href = element.getAttribute("href");
      if (href && href.startsWith("/")) {
        element.setAttribute("href", `${href}`)
      }
    }
  }
  previous(t) {
    return this._charArray[this._currentIndex - t];
  }
  discard(c) {
    let j = this._currentIndex;
    let discarded = false;
    while (this._charArray[j] == c) {
      j++;
      discarded = true;
    }
    this._currentIndex = j;
    return discarded;
  }
  close() {
    let tagName = null;
    try {
      tagName = this.readTill(">").toLowerCase().trim();
      this.closeTag(tagName);
    } catch (e) {
      throw new Error(`Error closing tag ${(tagName != null ? tagName : "")}: ${e.message}`);
    }
  }
  closeTag(tagNameOrFilter) {
    const isString = _.isString(tagNameOrFilter);
    if (isString && _eqIgnoreCase(tagNameOrFilter, "requires")) {
      this._currentRequires.close();
      this._currentRequires = null;
    } else {
      const filter = e => isString ? tagNameOrFilter != e.name : !tagNameOrFilter(e);
      let toClose = this._current instanceof Element ? this._current : this._currentParent;
      while (filter(toClose)) {
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
      toClose.close();
      this._currentParent = toClose.parent;
      this._current = null;
    }
    this._currentIndex++;
  }
  closeElement() {
    this._currentParent = this._current.parent;
    this._current.close();
    this._current = null;
  }
  readTill(...s) {
    let sb = [];
    let j = this._currentIndex;
    main: while (true) {
      for (let z = 0; z < s.length; z++) {
        if (this.nextIs(s[z], j)) {
          break main;
        }
      }
      sb.push(this._charArray[j++]);
    }
    this.lastAdvance = j - this._currentIndex;
    this.advance();
    return _str(sb);
  }
  inComment() {
    const sb = [];
    while (true) {
      if (this.nextIs("-->")) {
        this.advance();
        break;
      }
      sb.push(this.read());
    }
    const comment = new Comment(_str(sb));
    this._currentParent.__addChild(comment);
    comment.close();
  }
  inCDATA() {
    const sb = [];
    while (true) {
      if (this.nextIs("]]>")) {
        this.advance();
        break;
      }
      sb.push(this.read());
    }
    this._currentParent.__addChild(new Text(_str(sb)));
  }
  advance() {
    this._currentIndex += this.lastAdvance;
  }
  nextIs(s, index) {
    const sb = [];
    this.lastAdvance = s.length;
    let usedIndex = index || this._currentIndex;
    let j = usedIndex;
    for (; j < s.length + usedIndex && j < this._charArray.length; j++) {
      sb.push(this._charArray[j]);
    }
    return _str(sb) == s;
  }
  hasMore() {
    return this._currentIndex < this._charArray.length;
  }
  read() {
    let c = this._charArray[this._currentIndex++];
    if (c == '\n') {
      //starting new line
      this._currentLine = [];
    }
    this._currentLine.push(c);
    return c;
  }
  get fullCurrentLine() {
    let localIndex = this._currentIndex;
    let line = [];
    let c;
    while (localIndex < this._charArray.length - 1 && (c = this._charArray[localIndex++]) != '\n') {
      line.push(c);
    }
    return _str(line);
  }
}

module.exports.parseHTML = (html, observer) => new HTMLParser(observer).parse(html);