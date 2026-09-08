// Newsroom items, newest first. Kept out of the pages because two of them
// render this same list: the homepage shows the most recent few, and
// /news/ shows all of it. Plain ESM to match src/data/unit-7.js.
//
// Nothing here says which item is the lead. That is a fact about the
// homepage's layout rather than about a news item, so index.astro decides it
// by position -- add a newer entry at the top and it becomes the lead on its
// own, with no flag to remember to move.
//
// An item may carry a photo: `image` plus its intrinsic `imageWidth` and
// `imageHeight`, `imageAlt`, `caption`, and the `photo*` pair the credit line
// renders. The dimensions live here rather than in the template because the
// two photos are not the same shape -- a single hard-coded width and height
// in the markup would hand the browser the wrong aspect ratio for one of
// them. The homepage shows the photo on its lead item only; /news/ shows
// every photo it finds.
export const news = [
  {
    datetime: '2026-09-07',
    date: 'September 7, 2026',
    tag: 'R&D',
    title: 'Autonomous Extraction lab comes online in October',
    body:
      'The new R&D facility is finished and powering up: a glass-walled cut ' +
      'into the working face, with console banks on both sides and the north ' +
      'face itself visible through the wall. It is a bench for the ' +
      'Autonomous Extraction programme \u2014 somewhere to work on the ' +
      'units\u2019 control software and put a build through its tests ' +
      'without spending a shift to find out.',
    image: '/img/rnd-facility.webp',
    imageWidth: 1455,
    imageHeight: 893,
    imageAlt:
      'A player character in a purple and gold hat and robe standing between ' +
      'two banks of computer terminals in a glass-walled room cut into layers ' +
      'of soil and stone',
    caption:
      'Erin, Director of Engineering, at the extraction consoles in the new ' +
      'R&D facility.',
    photoDatetime: '2026-09-07',
    photoDate: 'September 7, 2026',
  },
  {
    datetime: '2026-09-06',
    date: 'September 6, 2026',
    tag: 'Company',
    title: 'SipsCo to unveil third blending plant in October',
    body:
      'The new yard comes online next month, adding a fourth blending line, a ' +
      'second on-site lab, and enough covered storage to hold winter stock ' +
      'without tarping it. Tours for wholesale partners open the week after ' +
      'commissioning.',
    image: '/img/sjin-factory-tour.webp',
    imageWidth: 1052,
    imageHeight: 551,
    imageAlt:
      'A player character labelled Sjin standing on a walkway above the new ' +
      'plant, orange gantries and a settling pond behind, in heavy rain',
    caption:
      'CEO Sjin on site at the new plant, ahead of October commissioning.',
    photoDatetime: '2026-09-02',
    photoDate: 'September 2, 2026',
  },
  {
    datetime: '2026-08-18',
    date: 'August 18, 2026',
    tag: 'Operations',
    title: 'Standard lead time drops to 48 hours',
    body:
      'Second shift at the main yard cuts the typical order-to-delivery window ' +
      'from four days to two across all standard blends.',
  },
  {
    datetime: '2026-07-02',
    date: 'July 2, 2026',
    tag: 'Product',
    title: 'Coarse Blend No. 7 returns to the catalogue',
    body:
      'Back by request from the drainage crowd, with the same particle spec as ' +
      'the original run and a fresh lab panel on every batch.',
  },
];

// How many the homepage teaser shows before handing off to /news/.
export const HOMEPAGE_NEWS_COUNT = 3;
