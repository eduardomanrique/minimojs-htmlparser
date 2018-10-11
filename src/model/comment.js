const _ = require('underscore');
const Text = require('./text');

class Comment extends Text {
  constructor(text) {
    super(text);
  }
  close() {}
  toJson() {
    return "";
  }
}

module.exports = Comment;