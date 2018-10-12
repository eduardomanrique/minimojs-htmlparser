require('chai').should();
const expect = require('chai').expect;
const HTMLDoc = require('../src/model/htmldoc');
const Text = require('../src/model/text');
const Comment = require('../src/model/text');

describe('Test html dom', function () {

  it('Test dom', () => {
    let doc = new HTMLDoc();
    let htmlEl = doc.addElement('html');
    let script = new Text('console.log("1");');
    htmlEl.addElement('head').addElement('script').__addChild(script);
    let body = htmlEl.addElement('body');
    let comment = new Comment('Comment');
    body.__addChild(comment);
    let div = body.addElement('div');
    div.setAttribute("id", "1234");
    div.setAttribute("att", "val");
    let divText = new Text('Div of id 1234');
    div.__addChild(divText);
    let bodyText = new Text('Text 1234 "aa"');
    body.__addChild(bodyText);

    let jsonDoc = doc.toJson();

    expect(jsonDoc.n).is.eq('DOCUMENT');
    let jsonHtml = jsonDoc.c[0];
    expect(jsonHtml.n).is.eq('html');
    expect(jsonHtml.c).to.have.lengthOf(2);
    let jsonHead = jsonHtml.c[0];
    expect(jsonHead.n).is.eq('head');
    expect(jsonHead.c[0].n).is.eq('script');
    expect(jsonHead.c[0].c[0]).is.eq('console.log("1");');
    let jsonBody = jsonHtml.c[1];
    expect(jsonBody.n).is.eq('body');
    expect(jsonBody.c[0].n).is.eq('div');
    expect(jsonBody.c[0].c[0]).is.eq('Div of id 1234');
    expect(jsonBody.c[1]).is.eq('Text 1234 "aa"');

    //expect(doc.toHTML()).is.eq('<html><head><script>console.log("1");</script></head><body><!--Comment--><div id="1234" att="val">Div of id 1234</div>Text 1234 "aa"</body></html>');
  });

});
