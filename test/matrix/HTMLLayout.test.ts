import { HTMLLayout } from '../../src/matrix/internal/HTMLLayout';
import { parse, HTMLElement, NodeType } from 'node-html-parser';

// Turn DOM element into super-short-and-sweet JSON
function domToJson(element: HTMLElement): any {
  let children: any[] = [];

  for (let child of element.childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      children.push(child.text);
    } else if (child.nodeType === NodeType.ELEMENT_NODE) {
      children.push(domToJson(child as HTMLElement));
    }
  }

  let content: any = (children.length == 1) ? children[0] : children;
  if (element.tagName) {
    return { [element.tagName]: content };
  } else {
    return content;
  }
}

// Tests
const testCases: { [x: string]: any } = {
  // Simple whitespace collapse
  "": [],
  " ": [],
  " 1": "1",
  "1 ": "1",
  " 1 ": "1",
  " 1  2 ": "1 2",
  // Other whitespace characters
  "\t\n\r ": [],
  "1\t\n\r 2": "1 2",
  // simple BR
  "<br>": "",
  "<br>1": "\n1",
  "<br><br>": "\n",
  "<br><br>1": "\n\n1",
  "1  <br>2": "1\n2",
  // 2nd whitespace ignored even across a tag
  "1<u> 2</u>": ["1",{U:" 2"}],
  "1 <u>2</u>": ["1 ",{U:"2"}],
  "1 <u> 2</u>": ["1 ",{U:"2"}],
  // A element spanning paragraphs
  "1<a>2<p>3</p></a>": ["1",{A:["2¶",{P:"3"}]}],
  // Simple paragraphs
  "1<p></p>": "1",
  "1<p><br></p>": ["1¶",{P:""}],
  "1<p>2</p>": ["1¶",{P:"2"}],
  "<p>1</p>2": [{P:"1"},"¶2"],
  "<p>1</p><p>2</p>": [{P:"1"},"¶",{P:"2"}],
  // Shallowest paragraph separator
  "<p>1</p><b><u><i>2</i></u></b>": [{P:"1"},"¶",{B:{U:{I:"2"}}}],
  "<p>1</p><p><b><u><i>2</i></u></b></p>": [{P:"1"},"¶",{P:{B:{U:{I:"2"}}}}],
  "1<p><b><u><i>2</i></u></b></p>": ["1¶",{P:{B:{U:{I:"2"}}}}],
  "<div><p>1</p></div><div><p>2</p></div>": [{DIV:{P:"1"}},"¶",{DIV:{P:"2"}}],
  // Paragraph separators in correct places in LI
  "1<ul><li>2</li><li>3</li></ul>": ["1¶",{UL:[{LI:"2"},"¶",{LI:"3"}]}],
  // PRE immediate newline trimmed
  "<pre>\n\n  </pre>": {PRE:"\n  "},
  "<pre>\r\n\n  </pre>": {PRE:"\n  "},
  "<pre>\r\r  </pre>": {PRE:"\n  "},
  "<pre><br>\n  </pre>": {PRE:"\n\n  "},
  // PRE final newlines
  "<pre>\n  \n  \n</pre>": {PRE:"  \n  "},
  "<pre>\n  \n  \r</pre>": {PRE:"  \n  "},
  "<pre>\n  \n  \r\n</pre>": {PRE:"  \n  "},
  "<pre>  \n\n</pre>": {PRE:"  \n"},
  "<pre>  \r\r</pre>": {PRE:"  \n"},
  "<pre>  \r\r\n</pre>": {PRE:"  \n"},
  // PRE Content preformatted
  "<pre>  </pre>": {PRE:"  "},
  "<pre> \n\r\t\r\n </pre>": {PRE:" \n\n\t\n "},
  // Empty block elements
  "1<div></div>2": "1¶2",
  "1<div>\n  </div>2": "1¶2",
  // Empty phrasing elements
  "1<b></b>2": "12",
  "1 <b>\n  </b>2": "1 2",
  "1<b>\n  </b> 2": ["1",{B:" "},"2"],
  // empty LI
  "<ul><li></li></ul>": {UL:{LI:[]}},
  // HR properly spaced
  "<hr>": {HR:[]},
  "1<hr>": ["1¶",{HR:[]}],
  "<hr>2": [{HR:[]},"¶2"],
  "1<hr>2": ["1¶",{HR:[]},"¶2"],
  // IMG properly spaced
  "<img>": {IMG:[]},
  "1<img>2": ["1",{IMG:[]},"2"],
  "1 <img>2": ["1 ",{IMG:[]},"2"],
  "1 <img> 2": ["1 ",{IMG:[]}," 2"],
  "1<img> 2": ["1",{IMG:[]}," 2"],
  "<p>1</p><img> 2": [{P:"1"},"¶",{IMG:[]}," 2"],
}

for (const [testCase, result] of Object.entries(testCases)) {
  it(`${JSON.stringify(testCase)} -> ${JSON.stringify(result)}`, async function () {
    // Parse the HTML to get a DOM
    let root: HTMLElement = parse(testCase, {
      comment: false,
      blockTextElements: {
        script: true,
        noscript: true,
        style: true
      }
    });
    // Process paragraphs & whitespace in the DOM in place
    let layout = new HTMLLayout('¶');
    layout.layoutHTML(root);
    HTMLLayout.simplifyHTML(root);
    // Convert to a JSON format that's more convenient to write
    let json = domToJson(root);

    expect(json).toEqual(result);
  });
};
