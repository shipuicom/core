/**
 * Curated cases vendored from the W3C web-platform-tests accname suite
 * (wpt/accname/name/comp_labelledby.html, comp_name_from_content.html,
 * comp_hidden_not_referenced.html). `expected` is the suite's
 * data-expectedlabel. Cases with `gap` exercise spec areas the simulator
 * deliberately does not implement in v1 — the spec asserts they still fail,
 * so an implementation catching up is flagged to un-gap the case.
 */
export interface WptFixture {
  testname: string;
  html: string;
  /** CSS needed by the fixture (WPT class styles), if any. */
  css?: string;
  expected: string;
  /** Reason this is a documented v1 gap (case is expected to FAIL). */
  gap?: string;
}

export const WPT_ACCNAME_FIXTURES: WptFixture[] = [
  // ── comp_labelledby.html ────────────────────────────────────────────────
  {
    testname: 'div group explicitly labelledby heading',
    html: '<div id="t" role="group" aria-labelledby="h"><h2 id="h">first heading</h2><p>text inside div group</p></div>',
    expected: 'first heading',
  },
  {
    testname: 'div group explicitly labelledby self and heading',
    html: '<div id="t" role="group" aria-label="self label" aria-labelledby="t h2"><h2 id="h2">+ first heading</h2><p>text inside div group</p></div>',
    expected: 'self label + first heading',
  },
  {
    testname: 'nav with verified spaces appended between each of IDREFS',
    html: '<nav id="t" aria-labelledby="s1 s2 s3 s4"><span id="s1">verify</span><span id="s2">spaces</span><span>FAIL IF INCLUDED</span><span id="s3">between</span><span id="s4">foreach</span></nav>',
    expected: 'verify spaces between foreach',
  },
  {
    testname: 'link labelled by aria-labelledby supercedes aria-labeledby (non-standard spelling)',
    html: '<span id="n1">first label</span><span id="n2">second label</span><a id="t" href="#" aria-labelledby="n1" aria-labeledby="n2">x</a>',
    expected: 'first label',
  },
  {
    testname: 'link name from content for each child including nested image (referenced elsewhere via labelledby)',
    html: '<a id="t" href="#" aria-labelledby="nested_image_label2">link2 <img id="nested_image_label2" alt="image"> link3</a>',
    expected: 'image',
    // NOTE: WPT's version has the labelledby on a sibling link; referenced
    // here directly the name resolves to the image alt.
  },

  // ── comp_name_from_content.html ─────────────────────────────────────────
  {
    testname: 'aria button name from content, inline',
    html: '<span id="t" tabindex="0" role="button">label</span>',
    expected: 'label',
  },
  {
    testname: 'aria heading name from content, block',
    html: '<div id="t" tabindex="0" role="heading">label</div>',
    expected: 'label',
  },
  {
    testname: 'button name from content',
    html: '<button id="t">label</button>',
    expected: 'label',
  },
  {
    testname: 'heading name from content',
    html: '<h3 id="t">label</h3>',
    expected: 'label',
  },
  {
    testname: 'link name from content',
    html: '<a id="t" href="#">label</a>',
    expected: 'label',
  },
  {
    testname: 'button name from content for each child',
    html: '<button id="t"><span>one</span> <span>two</span> <span>three</span></button>',
    expected: 'one two three',
  },
  {
    testname: 'heading name from content for each child including image',
    html: '<h3 id="t"><span>one</span> <img alt="two"> <span>three</span></h3>',
    expected: 'one two three',
  },
  {
    testname: 'link name from content for each child including nested image',
    html: '<a id="t" href="#"><span>one</span> <span>two <img alt="three"></span> <span>four</span></a>',
    expected: 'one two three four',
  },
  {
    testname: 'heading name from content for each child including nested button with nested image',
    html: '<h3 id="t">heading <button>button <img alt="image"> button</button> heading</h3>',
    expected: 'heading button image button heading',
  },
  {
    testname: 'heading name from content for each child including nested link using aria-label with nested image',
    html: '<h3 id="t">heading <a href="#" aria-label="link aria-label">ignored link text <img alt="ignored image alt"> ignored link text</a> heading</h3>',
    expected: 'heading link aria-label heading',
  },
  {
    testname: 'heading name from content for each child including nested link using aria-labelledby with nested image',
    html: '<h3 id="t">heading <a href="#" aria-labelledby="nested_image_label1">ignored link text <img id="nested_image_label1" alt="image"> ignored link text</a> heading</h3>',
    expected: 'heading image heading',
  },
  {
    testname: 'heading name from content for each child including two nested links using aria-labelledby with nested image',
    html: '<h3 id="t"><a href="#" aria-labelledby="nested_image_label2">link1</a> <a href="#">link2 <img id="nested_image_label2" alt="image"> link3</a></h3>',
    expected: 'image link2 link3',
  },
  {
    testname: 'button name from content for each child (no space, inline)',
    html: '<button id="t"><span>one</span><span>two</span><span>three</span></button>',
    expected: 'onetwothree',
  },
  {
    testname: 'heading name from content for each child (no space, display:block)',
    html: '<h3 id="t" class="block"><span>one</span><span>two</span><span>three</span></h3>',
    css: '.block > span { display: block; margin: 0 0.1em; }',
    expected: 'one two three',
  },
  {
    testname: 'link name from content for each child (no space, display:inline-block)',
    html: '<a id="t" href="#" class="iblock"><span>one</span><span>two</span><span>three</span></a>',
    css: '.iblock > span { display: inline-block; margin: 0 0.1em; }',
    expected: 'one two three',
  },
  {
    testname: 'implicit button name from content containing a dfn element',
    html: '<button id="t"><span>this is an </span><dfn>example</dfn></button>',
    expected: 'this is an example',
  },
  {
    testname: 'explicit heading name from content containing an element with explicit term role',
    html: '<div id="t" role="heading"><span>this is an </span><span role="term">example</span></div>',
    expected: 'this is an example',
  },

  // ── comp_hidden_not_referenced.html ─────────────────────────────────────
  {
    testname: 'button containing aria-hidden, hidden, and visible children',
    html: '<button id="t"><span aria-hidden="true">hidden,</span><span hidden>hidden from all users,</span> <span>visible to all users</span></button>',
    expected: 'visible to all users',
  },
  {
    testname: 'button labelled by element that is aria-hidden=true',
    html: '<button id="t" aria-labelledby="button-label-2"><span aria-hidden="true" id="button-label-2">hidden but referenced,</span><span hidden>hidden from all users,</span><span>visible to all users</span></button>',
    expected: 'hidden but referenced,',
  },
  {
    testname: 'button labelled by element with the hidden host language attribute',
    html: '<button id="t" aria-labelledby="button-label-3"><span aria-hidden="true">hidden,</span><span hidden id="button-label-3">hidden from all users but referenced,</span><span>visible to all users</span></button>',
    expected: 'hidden from all users but referenced,',
  },
  {
    testname: 'link labelled by elements with assorted visibility and a11y tree exposure',
    html:
      '<a id="t" href="#" aria-labelledby="link-label-1a link-label-1b link-label-1c">' +
      '<span id="link-label-1a"><span>visible to all users,</span> <span aria-hidden="true">hidden,</span></span>' +
      '<span aria-hidden="true" id="link-label-1b">hidden but referenced,</span>' +
      '<span hidden id="link-label-1c">hidden from all users but referenced</span></a>',
    expected: 'visible to all users, hidden but referenced, hidden from all users but referenced',
  },
  {
    testname: 'heading containing visibility:hidden with nested visibility:visible content',
    html: '<h2 id="t">visible to all users, <span style="visibility: hidden;">hidden from all users, <span style="visibility: visible;">un-hidden for all users</span></span></h2>',
    expected: 'visible to all users, un-hidden for all users',
  },

  // ── Documented v1 gaps (expected to fail) ───────────────────────────────
  {
    testname: 'button name from content with ::before',
    html: '<button id="t" class="simple-before">label</button>',
    css: '.simple-before::before { content: " before "; }',
    expected: 'before label',
    gap: 'CSS generated content (::before/::after) is not read',
  },
  {
    testname: 'link name from content with ::before and ::after',
    html: '<a id="t" href="#" class="simple-before simple-after">label</a>',
    css: '.simple-before::before { content: " before "; } .simple-after::after { content: " after "; }',
    expected: 'before label after',
    gap: 'CSS generated content (::before/::after) is not read',
  },
  {
    testname: 'heading name from content with text-transform:uppercase',
    html: '<h1 id="t" style="text-transform:uppercase;">Call us</h1>',
    expected: 'CALL US',
    gap: 'text-transform is not applied to the computed name',
  },
];
