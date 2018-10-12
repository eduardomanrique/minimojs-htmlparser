const _ = require('underscore');
const ParserObserver = require('./parserObserver');
const HTMLDoc = require('../model/htmldoc');
const {
  _str
} = require('../util');

class HTMLParser {
  constructor(observer) {
    this._textNodes = [];
    this._doc = new HTMLDoc();
    this._currentText = [];
    this._currentIndex = 0;
    this._currentLine = [];
    this._observer = new ParserObserver(this._doc, observer);
  }
  parse(html) {
    this._charArray = (html + "\n");
    let doc = this._doc;
    while (this.hasMore()) {
      if (this._observer.elementName == 'script') {
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
    while (!this._observer.element._isClosed && this._observer.element != doc) {
      this._observer.element.setNotClosed();
      this._observer.up();
    }
    return doc;
  }
  closeCurrentText() {
    const textValue = _str(this._currentText);
    if (textValue.length > 0) {
      this._observer.onTextNode(textValue);
    }
    this._currentText = [];
  }
  advanceLine() {
    return this.readTill("\n").toLowerCase();
  }
  readScriptElementContent() {
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
        if (_str(valName).trim().toLowerCase() === 'script') {
          this._currentIndex = j + 2;
          this._observer.onTextNode(_str(sb));
          this.close();
          return;
        }
      }
      sb.push(this._charArray[j++]);
    }
  }
  inTag() {
    const name = this.readTill(" ", ">", "/>", "\n", "\t").toLowerCase();
    this._observer.onNewElement(name);
    //read attributes
    let currentAttributeValue = [];
    const checkEmptyAttribute = () => {
      if (_str(currentAttributeValue).trim().length > 0) {
        this.observer.onSetAttribute(_str(currentAttributeValue).trim(), null);
      }
      currentAttributeValue = [];
    };
    while (true) {
      if (this.discard(' ')) {
        checkEmptyAttribute();
      }
      if (this.nextIs("/>")) {
        //element without body
        this.advance();
        checkEmptyAttribute();
        this.closeElement();
        break;
      } else if (this.nextIs(">")) {
        //element with body
        this.advance();
        checkEmptyAttribute();
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
              this.observer.onSetAttribute(attName, val);
              currentAttributeValue = [];
              break;
            }
          }
        } else {
          this.observer.onSetAttribute(attName, null);
        }
      } else {
        currentAttributeValue.push(s);
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
  closeTag(tagName) {
    this._observer.closeTag(tagName);
    this._currentIndex++;
  }
  closeElement() {
    this._observer.closeCurrentElement();
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
    this._observer.onComment(_str(sb));
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
    this._observer.onTextNode(_str(sb));
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