import { MatrixInterface } from '../../src/matrix/MatrixInterface';
import type { MCEvents } from "../../src/minecraft";

// Tests
const testCases: { [x: string]: string[] } = {
  '': [''],
  '1': ['1'],
  // Escaping
  "\u00a7l1<>&\"'": ["1<>&\"'", '<b>1&lt;&gt;&amp;&quot;&#x27;</b>'],
  // Colour codes
  '1\u00a702': ['12', '1<font color="#000000">2</font>'],
  '1\u00a712': ['12', '1<font color="#0000aa">2</font>'],
  '1\u00a722': ['12', '1<font color="#00aa00">2</font>'],
  '1\u00a732': ['12', '1<font color="#00aaaa">2</font>'],
  '1\u00a742': ['12', '1<font color="#aa0000">2</font>'],
  '1\u00a752': ['12', '1<font color="#aa00aa">2</font>'],
  '1\u00a762': ['12', '1<font color="#ffaa00">2</font>'],
  '1\u00a772': ['12', '1<font color="#aaaaaa">2</font>'],
  '1\u00a782': ['12', '1<font color="#555555">2</font>'],
  '1\u00a792': ['12', '1<font color="#5555ff">2</font>'],
  '1\u00a7a2': ['12', '1<font color="#55ff55">2</font>'],
  '1\u00a7A2': ['12', '1<font color="#55ff55">2</font>'],
  '1\u00a7b2': ['12', '1<font color="#55ffff">2</font>'],
  '1\u00a7B2': ['12', '1<font color="#55ffff">2</font>'],
  '1\u00a7c2': ['12', '1<font color="#ff5555">2</font>'],
  '1\u00a7C2': ['12', '1<font color="#ff5555">2</font>'],
  '1\u00a7d2': ['12', '1<font color="#ff55ff">2</font>'],
  '1\u00a7D2': ['12', '1<font color="#ff55ff">2</font>'],
  '1\u00a7e2': ['12', '1<font color="#ffff55">2</font>'],
  '1\u00a7E2': ['12', '1<font color="#ffff55">2</font>'],
  '1\u00a7f2': ['12', '1<font color="#ffffff">2</font>'],
  '1\u00a7F2': ['12', '1<font color="#ffffff">2</font>'],
  // Formatting codes
  '1\u00a7k2': ['12'],  // obfuscated
  '1\u00a7K2': ['12'],  // obfuscated
  '1\u00a7l2': ['12', '1<b>2</b>'],
  '1\u00a7L2': ['12', '1<b>2</b>'],
  '1\u00a7m2': ['12', '1<strike>2</strike>'],
  '1\u00a7M2': ['12', '1<strike>2</strike>'],
  '1\u00a7n2': ['12', '1<u>2</u>'],
  '1\u00a7N2': ['12', '1<u>2</u>'],
  '1\u00a7o2': ['12', '1<i>2</i>'],
  '1\u00a7O2': ['12', '1<i>2</i>'],
  // Unrecognised codes
  '1\u00a7z2': ['12'],
  // Reset
  '\u00a71\u00a7k\u00a7l\u00a7m\u00a7n\u00a7o\u00a7r1': ['1'],
  // Colour codes reset
  '\u00a7k\u00a7l\u00a7m\u00a7n\u00a7o\u00a711':
    ['1', '<font color="#0000aa">1</font>'],
  '\u00a7k\u00a7l\u00a7m\u00a7n\u00a7o1\u00a712': 
    ['12', '<b><strike><u><i>1</i></u></strike></b><font color="#0000aa">2</font>'],
  // Multicolour
  '\u00a74r\u00a76a\u00a7ei\u00a72n\u00a71b\u00a75o\u00a7dw':
    ['rainbow', '<font color="#aa0000">r</font>' +
                '<font color="#ffaa00">a</font>' +
                '<font color="#ffff55">i</font>' +
                '<font color="#00aa00">n</font>' +
                '<font color="#0000aa">b</font>' +
                '<font color="#aa00aa">o</font>' +
                '<font color="#ff55ff">w</font>'],
  // Build up
  '1\u00a712\u00a7k3\u00a7l4\u00a7m5\u00a7n6\u00a7o7':
    ['1234567', '1<font color="#0000aa">23<b>4<strike>5<u>6<i>7</i></u></strike></b></font>'],
  // Redundant codes
  // We don't handle these well, but lets at least make sure they remain valid
  // This would be better:   '1<b>2</b>'
  '1\u00a7l\u00a7l2': ['12', '1<b><b>2</b></b>'],
  // This would be better:     '1<b>23</b>' would be better
  '1\u00a7l2\u00a7l3': ['123', '1<b>2<b>3</b></b>'],
  // This would be better:     '1<font color="#0000aa">23</font>' would be better
  '1\u00a712\u00a713': ['123', '1<font color="#0000aa">2</font><font color=\"#0000aa\">3</font>'],
}

for (const [testCase, result] of Object.entries(testCases)) {
  it(`${JSON.stringify(testCase)} -> ${JSON.stringify(result)}`, function () {
    let mcEvent = {
      message: testCase,
    };
    let mxEvent = MatrixInterface.formatMcMessage(mcEvent as MCEvents.Message);

    expect(mxEvent.body).toEqual(result[0]);
    expect(mxEvent.formatted_body).toEqual(result[1]);
  });
};
