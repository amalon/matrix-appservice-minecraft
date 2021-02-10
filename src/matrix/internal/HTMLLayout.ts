import { Node, HTMLElement, TextNode, NodeType } from 'node-html-parser';

/*
 * The Matrix subset of HTML tags permitted is:
 *   A B BLOCKQUOTE BR CAPTION CODE DEL DIV EM FONT H1 H2 H3 H4 H5 H6 HR I IMG
 *   LI OL P PRE SPAN STRIKE STRONG SUB SUP TABLE TBODY TD TH THEAD TR U UL
 */

type TagSet = { [x: string]: true };

// Phrasing content makes up HTML paragraphs
const phrasingContent: TagSet = {
  A: true, B: true, BR: true, CODE: true, DEL: true, EM: true, FONT: true,
  I: true, IMG: true, SPAN: true, STRIKE: true, STRONG: true, SUB: true,
  SUP: true, U: true
};

// These HTML elements are allowed to have no content
const allowEmptyElements: TagSet = {
  // These are empty elements (content model: nothing)
  IMG: true, HR: true,
  // These are shown even when empty
  LI: true,
};

// The matrix subset only allows normal and preformatted whitespace
// Nowrap, Prewrap and Preline aren't possible
enum WhiteSpace {
  Normal,   // collapse whitespace, break lines to fill
  Pre,      // don't collapse whitespace, break lines at newlines
}

/**
 * HTMLLayout is used to process paragraphs and whitespace in an HTML DOM.
 *
 * https://www.w3.org/TR/CSS21/text.html#white-space-model
 * For only Normal and Pre, which only differ at block level
 *
 * For each inline (phrasing) element:
 * normal: Collapse TAB, SPACE, CR, LF to single SPACE
 *         using style of *first* whitespace
 *
 * Paragraphs are made of runs of phrasing content:
 *  ignoring A DEL
 *  each run of sibling phrasing content
 *   uninterrupted by other types of content,
 *  in an element that accepts content other than phrasing as well as phrasing
 *  if run has at least 1 node neither embedded or inter-element whitespace
 *
 * In other words
 *  a paragraph separator (usually newline) is expected between paragraphs
 *  paragraphs starts on phrasing content
 *
 * Paragraphs are arranged in lines:
 * 1) normal: remove SPACE at beginning / end of line
 * 2) pre: TAB shifts to next 8*SPACE stop
 *
 * We leave it to the plugin to perform wrapping and TAB indentation, however
 * we can still treat the paragraph as a single line and strip whitespace on
 * either side of it.
 */
export class HTMLLayout {
  public constructor(public paragraphSeparator: string = '\n') {
  }

  // Is a paragraph in progress?
  private inParagraph: boolean = false;
  // If paragraphs been seen a separator is required before a new one
  private seenParagraph: boolean = false;
  // Is there trailing whitespace on the last seen text?
  private previousWhitespace: boolean = false;
  // For dropping final newline / whitespace before BR
  private lastText: TextNode | null = null;
  // For injecting newline in the right place when content is detected
  private phrasingStart: TextNode | null = null;
  // Depth of phrasingStart, for finding shallowest place for paragraph separator
  private phrasingStartDepth: number = 0;

  /**
   * Used internally to ensure a paragraph is started.
   * This takes care of:
   *  - Injecting a paragraph separator at phrasingStart (if shallower than
   *    node), or at the beginning of node
   *  - Updating layout state
   * @param {TextNode} node  The text encountered
   * @param {number}   depth Nesting depth (recursion)
   */
  private startParagraph(node: TextNode, depth: number) {
    // Inject paragraph separator
    if (!this.inParagraph && this.seenParagraph) {
      if (this.phrasingStart != null && this.phrasingStartDepth < depth)
        this.phrasingStart.rawText = this.paragraphSeparator;
      else
        node.rawText = `${this.paragraphSeparator}${node.text}`;
      this.phrasingStart = null;
    }
    // Start a new paragraph if necessary
    this.inParagraph = true;
    this.seenParagraph = true;
    this.previousWhitespace = /\s$/.test(node.text);
    this.lastText = node;
  }

  /**
   * Used internally to end any paragraph in progress.
   * This takes care of:
   *  - Dropping final newline of paragraph
   *  - Stripping trailing whitespace of paragraph (for normal whitespace)
   *  - Updating layout state
   * @param {WhiteSpace} whiteSpace Current whitespace mode of paragraph
   */
  private endParagraph(whiteSpace: WhiteSpace) {
    if (this.inParagraph) {
      if (this.lastText != null) {
        // Drop final newline
        this.lastText.rawText = this.lastText.text.replace(/\n$/, '');
        if (whiteSpace == WhiteSpace.Normal) {
          // And any whitespace at the end of the line
          this.lastText.rawText = this.lastText.text.replace(/ $/, '');
        }
      }
      this.inParagraph = false;
      this.previousWhitespace = true;
      this.lastText = null;
    }
  }

  /**
   * Process paragraphs and whitespace in an HTML DOM, modifying the DOM in the
   * process.
   * This collapses whitespace and BR tags as appropriate, and inserts
   * paragraph separators between paragraphs.
   * @param {HTMLElement}      element    HTML element to process (required)
   * @param {HTMLElement|null} parentNode Parent HTML element (recursion)
   * @param {WhiteSpace}       whiteSpace Whitespace mode (recursion)
   * @param {number}           depth      Nesting depth (recursion)
   * @returns {boolean} Whether any content was found
   */
  public layoutHTML(element: HTMLElement, parentNode: HTMLElement | null = null,
                    whiteSpace: WhiteSpace = WhiteSpace.Normal,
                    depth: number = 0): boolean {
    const tag: string = element.tagName;
    let stripLeadingNewline: boolean = false;
    let nonPhrasing: boolean = !phrasingContent[tag];
    let hasContent: boolean = false;

    if (nonPhrasing)
      this.endParagraph(whiteSpace);

    switch (tag) {
      case 'BR':
        if (parentNode != null) {
          // drop trailing whitespace before BR
          if (whiteSpace == WhiteSpace.Normal && this.previousWhitespace &&
              this.lastText != null) {
            this.lastText.rawText = this.lastText.text.replace(/ $/, '');
          }
          // replace the element with a newline
          let text = new TextNode('\n');
          this.startParagraph(text, depth);
          parentNode.exchangeChild(element, text);
        }
        return true;

      case 'PRE':
        // switch to preformatted whitespace
        whiteSpace = WhiteSpace.Pre;
        // and strip immediately following newline
        stripLeadingNewline = true;
        break;
    }

    // Some elements are permitted to have no content
    if (allowEmptyElements[tag]) {
      this.startParagraph(new TextNode(''), depth);
      hasContent = true;
    }

    for (let i = 0; i < element.childNodes.length; ++i) {
      let child = element.childNodes[i];
      if (child.nodeType === NodeType.TEXT_NODE) {
        this.layoutText(child as TextNode, stripLeadingNewline, whiteSpace, depth + 1);
        // Drop empty text nodes
        if (!child.text) {
          element.childNodes.splice(i, 1);
          --i;
        } else {
          hasContent = true;
        }
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        let childElement: HTMLElement = child as HTMLElement;
        const childTag: string = childElement.tagName;

        // prepare a paragraph separator text node before new phrasing content
        if (this.seenParagraph &&
            (this.phrasingStart == null || this.phrasingStartDepth > depth) &&
            (!phrasingContent[childTag] || !this.inParagraph)) {
          let separatorNode = new TextNode('');
          element.childNodes.splice(i, 0, separatorNode);
          ++i;
          this.phrasingStart = separatorNode;
          this.phrasingStartDepth = depth;
        }

        if (this.layoutHTML(childElement, element, whiteSpace, depth + 1)) {
          hasContent = true;
        } else {
          // Drop nodes without content
          element.childNodes.splice(i, 1);
          --i;
        }
      }
      stripLeadingNewline = false;
    }

    if (nonPhrasing)
      this.endParagraph(whiteSpace);

    return hasContent;
  }

  /**
   * Used internally to process whitespace in a TextNode.
   * @param {TextNode}   node                DOM text node to process
   * @param {boolean}    stripLeadingNewline Whether to strip leading newline
   * @param {WhiteSpace} whiteSpace          Whitespace mode
   * @param {number}   depth Nesting depth (recursion)
   */
  private layoutText(node: TextNode, stripLeadingNewline: boolean,
                     whiteSpace: WhiteSpace, depth: number) {
    // Normalize newlines
    node.rawText = node.text.replace(/\r\n?/g, '\n');

    // Strip newline immediately following PRE start tag
    if (stripLeadingNewline)
      node.rawText = node.text.replace(/^\n/, '');

    if (whiteSpace == WhiteSpace.Normal) {
      // Collapse whitespace
      node.rawText = node.text.replace(/\s+/g, ' ');
      // Strip continuing whitespace
      if (!this.inParagraph || this.previousWhitespace)
        node.rawText = node.text.replace(/^ /, '');
    }

    // Ensure paragraph started
    if (node.text)
      this.startParagraph(node, depth);
  }

  /// Merge adjacent text nodes together
  public static simplifyHTML(element: HTMLElement) {
    for (let i = 0; i < element.childNodes.length; ++i) {
      let child = element.childNodes[i];

      if (child.nodeType === NodeType.ELEMENT_NODE) {
        HTMLLayout.simplifyHTML(child as HTMLElement);
      } else if (child.nodeType === NodeType.TEXT_NODE && i >= 1) {
        let prevChild = element.childNodes[i - 1];

        if (prevChild.nodeType === NodeType.TEXT_NODE) {
          prevChild.rawText = `${prevChild.text}${child.text}`;
          element.childNodes.splice(i, 1);
          --i;
        }
      }
    }
  }
}
