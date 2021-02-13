import { MsgProcessor } from '../../src/matrix/internal/MsgProcessor';
import { MatrixInterface } from "../../src/matrix/MatrixInterface";
import { Config } from "../../src/Config";
import { parse, HTMLElement, NodeType } from 'node-html-parser';

let matrix = {
  checkRoomNotifyPrivilege: async function (roomId: string, userId: string): Promise<boolean> {
    return userId == '@admin:example.com';
  },
  getUserProfile: async function (user: string, roomId: string): Promise<{}> {
    return {displayName: "Test"};
  },
  getPlayerUUID: function (user: string): string | undefined {
    if (user != '@_mc_bot:example.com') {
      let match = user.match(/^@_mc_([0-9a-f]+):/);
      if (match)
        return match[1];
    }
  }
};
let config = {
  appservice: {
    homeserverURL: "https://example.com"
  }
};
let msgProcessor: MsgProcessor = new MsgProcessor(matrix as MatrixInterface, config as Config);

// Take HTML, parse into a DOM, layout, simplify, and turn into JSON
async function convertHTML(html: string): Promise<any> {
  // Parse the HTML to get a DOM
}

// Tests
const colorTestCases: { [x: string]: number | null } = {
  '': null,
  'x': null,
  '0': null,
  '000000': null,
  '#0': null,
  '#000': 0x000000,
  '#abc': 0xaabbcc,
  '#fff': 0xffffff,
  '#000000': 0x000000,
  '#123456': 0x123456,
  '#ffffff': 0xffffff,
}

for (const [testCase, result] of Object.entries(colorTestCases)) {
  it(`HTML color ${JSON.stringify(testCase)} -> ${result !== null ? `0x${result.toString(16).padStart(6, '0')}` : result}`, async function () {
    let color = msgProcessor.htmlColorTo24bit(testCase);

    expect(color).toBe(result);
  });
};

const testCases: [ string, any, { [x:string]: any }?][] = [
  // Simple whitespace collapse
  [ '', undefined ],

  // Basic style tags: B, STRONG, I, EM, U, DEL, STRIKE,
  // CODE, H1, H2, H3, H4, H5, H6
  [ '<b>1</b>',           {type:"style",bold:true,     content:"1"}, { comment: "B" } ],
  [ '<strong>1</strong>', {type:"style",bold:true,     content:"1"}, { comment: "STRONG" } ],
  [ '<i>1</i>',           {type:"style",italic:true,   content:"1"}, { comment: "I" } ],
  [ '<em>1</em>',         {type:"style",italic:true,   content:"1"}, { comment: "EM" } ],
  [ '<u>1</u>',           {type:"style",underline:true,content:"1"}, { comment: "U" } ],
  [ '<del>1</del>',       {type:"style",strike:true,   content:"1"}, { comment: "DEL" } ],
  [ '<strike>1</strike>', {type:"style",strike:true,   content:"1"}, { comment: "STRIKE" } ],
  [ '<code>1</code>',     {type:"style",code:true,     content:"1"}, { comment: "CODE" } ],
  [ '<h1>1</h1>',         {type:"style",heading:1,     content:"1"}, { comment: "H1" } ],
  [ '<h2>1</h2>',         {type:"style",heading:2,     content:"1"}, { comment: "H2" } ],
  [ '<h3>1</h3>',         {type:"style",heading:3,     content:"1"}, { comment: "H3" } ],
  [ '<h4>1</h4>',         {type:"style",heading:4,     content:"1"}, { comment: "H4" } ],
  [ '<h5>1</h5>',         {type:"style",heading:5,     content:"1"}, { comment: "H5" } ],
  [ '<h6>1</h6>',         {type:"style",heading:6,     content:"1"}, { comment: "H6" } ],

  // FONT/SPAN
  [ '<font>1</font>', "1", { comment: "FONT" } ],
  [ '<span>1</span>', "1", { comment: "SPAN" } ],
  [ '<font data-mx-color="#f00">1</font>',    {type:"style",color:0xff0000,content:"1"},
    { comment: "FONT data-mx-color 3 nibbles" } ],
  [ '<font data-mx-color="#ff0000">1</font>', {type:"style",color:0xff0000,content:"1"},
    { comment: "FONT data-mx-color 6 nibbles" } ],
  [ '<font color="#f00">1</font>',            {type:"style",color:0xff0000,content:"1"},
    { comment: "FONT color 3 nibbles" } ],
  [ '<font data-mx-spoiler>1</font>',         {type:"style",spoiler:true,  content:"1"},
    { comment: "FONT data-mx-spoiler" } ],

  // Lists: UL, OL, LI
  [ '<ul><li>1</li><li>2</li></ul>',
    [{type:"block",block:"bullet",    content:"1"},"\n",
     {type:"block",block:"bullet",    content:"2"}],
    { comment: "UL" } ],
  [ '<ol><li>1</li><li>2</li></ol>',
    [{type:"block",block:"bullet",n:1,content:"1"},"\n",
     {type:"block",block:"bullet",n:2,content:"2"}],
    { comment: "OL" } ],
  [ '<ol start="5"><li>1</li><li>2</li></ol>',
    [{type:"block",block:"bullet",n:5,content:"1"},"\n",
     {type:"block",block:"bullet",n:6,content:"2"}],
    { comment: "OL with start" } ],
  [ '<ol start="5"><li>1</li></ol><ul><li>2</li><li>3</li></ul>',
    [{type:"block",block:"bullet",n:5,content:"1"},"\n",
     {type:"block",block:"bullet",    content:"2"},"\n",
     {type:"block",block:"bullet",    content:"3"}],
    { comment: "OL with start, UL" } ],
  [ '<ol start="5"><li>1</li></ol><ol><li>2</li><li>3</li></ol>',
    [{type:"block",block:"bullet",n:5,content:"1"},"\n",
     {type:"block",block:"bullet",n:1,content:"2"},"\n",
     {type:"block",block:"bullet",n:2,content:"3"}],
    { comment: "OL with start, OL" } ],

  // HR
  [ '<hr>', {type:"horizontalRule"}, { comment: "HR" } ],

  // BLOCKQUOTE
  [ '<blockquote>1</blockquote>', {type:"block",block:"quote",content:"1"}, { comment: "BLOCKQUOTE" } ],

  // PRE
  [ '<pre>\n  1\t\n2\n</pre>', {type:"block",block:"preformat",content:"  1\t\n2"}, { comment: "PRE" } ],

  // Hyperlinks & user/player mentions: A
  [ '<a>1</a>', "1", { comment: "A without href" } ],
  [ '<a href="https://example.com">1</a>', {type:"link",href:"https://example.com",content:"1"},
    { comment: "A with href" } ],
  [ '<a href="https://matrix.to/#/@test:example.com">1</a>',
    {type:"mention",user:{mxid:"@test:example.com",displayName:"Test"},content:"1"},
    { comment: "A Mention user" } ],
  [ '<a href="https://matrix.to/#/@_mc_bot:example.com">1</a>',
    {type:"mention",user:{mxid:"@_mc_bot:example.com",displayName:"Test"},content:"1"},
    { comment: "A Mention bot" } ],
  [ '<a href="https://matrix.to/#/@_mc_0000:example.com">1</a>',
    {type:"mention",user:{mxid:"@_mc_0000:example.com",displayName:"Test"},bridge:"minecraft",player:{uuid:"0000"},content:"1"},
    { comment: "A Mention player" } ],

  // Images: IMG
  [ '<img>',           {type:"img"},           { comment: "IMG without attributes" } ],
  [ '<img alt="1">',   {type:"img",alt:"1"},   { comment: "IMG with alt" } ],
  [ '<img title="1">', {type:"img",title:"1"}, { comment: "IMG with title" } ],
  [ '<img src="mxc://example.com/1">',
    {type:"img",src:"https://example.com/_matrix/media/r0/download/example.com/1"},
    { comment: "IMG with src" } ],
  [ '<img src="mxc://example.com/1" alt="2" title="3">',
    {type:"img",src:"https://example.com/_matrix/media/r0/download/example.com/1",alt:"2",title:"3"},
    { comment: "IMG with src, alt, title" } ],

  // Matrix reply
  [ '<mx-reply><blockquote><a href="https://matrix.to/#/!test:example.com/$test?via=example.com">In reply to</a>'
    + ' <a href="https://matrix.to/#/@test:example.com">@test:example.com</a><br>'
    + '1</blockquote></mx-reply>'
    + '2',
    [{type:"block",block:"quote",content:[
      {type:"link",href:"https://matrix.to/#/!test:example.com/$test?via=example.com",content:"In reply to"},
       " ",{type:"mention",user:{mxid:"@test:example.com",displayName:"Test"},content:"@test:example.com"},
      "\n1"]},
     "\n2"],
    { comment: "MX-REPLY" } ],

  // @room mentions
  [ '@room', {type:"mention",room:true,content:"@room"},
    { sender: '@admin:example.com', comment: "Single @room mention" } ],
  [ '@room', "@room",
    { sender: '@user:example.com', comment: "Single @room mention"  } ],
  [ '@room', {type:"mention",room:true,content:"@room"},
    { sender: '@admin:example.com', html: false, comment: "Single @room mention" } ],
  [ '@room', undefined,
    { sender: '@user:example.com',  html: false, comment: "Single @room mention" } ],

  [ '1 @room 2 @rooms 3 @room',
    ["1 ",{type:"mention",room:true,content:"@room"}," 2 @rooms 3 ",{type:"mention",room:true,content:"@room"}],
    { sender: '@admin:example.com', comment: "Multiple @room mentions" } ],
  [ '1 @room 2 @rooms 3 @room', "1 @room 2 @rooms 3 @room",
    { sender: '@user:example.com', comment: "Multiple @room mentions"  } ],
  [ '1 @room 2 @rooms 3 @room',
    ["1 ",{type:"mention",room:true,content:"@room"}," 2 @rooms 3 ",{type:"mention",room:true,content:"@room"}],
    { sender: '@admin:example.com', html: false, comment: "Multiple @room mentions" } ],
  [ '1 @room 2 @rooms 3 @room', undefined,
    { sender: '@user:example.com', html: false, comment: "Multiple @room mentions" } ],
];

for (const [testCase, result, _params] of testCases) {
  let params: { [x:string]: any } = _params || {};
  let event: any = {
    content: {
      body: testCase,
    },
    sender: "@test:example.com",
    roomId: "#test:example.com",
  };
  let description = params.comment ? params.comment : JSON.stringify(testCase);
  if (params.sender) {
    event.sender = params.sender;
    description = `${params.sender.replace(/:.*$/,'').replace(/^@/,'')} ${description}`;
  }
  if (params.html !== false) {
    event.content.format = "org.matrix.custom.html";
    event.content.formatted_body = testCase;
    description = `HTML ${description}`; 
  } else {
    description = `Plain ${description}`; 
  }

  it(description, async function () {
    let out = await msgProcessor.formatMxMessage(event);

    expect(out[1]).toEqual(result);
  });
};
