// The document's checkable content, kept out of the page so that
// tools/check-source-drift.mjs can import the exact same values the page
// renders. Plain ESM rather than TypeScript so a bare Node script can read it
// without a build step.
//
// Everything in this file is a claim about a real program. Re-read the source
// before changing any of it; CI checks these against the Lua on every run.

// Document furniture. The revision letter tracks this page's own history:
// Rev. A was the report alone, Rev. B added Appendix A.
export const DOC_ID = 'SIPSCO-RND-FR-007';
export const DOC_REV = 'Rev. B';
export const DOC_ISSUED = 'September 2026';

// Appendix figures. Every value is the shipped default read out of the real
// scripts, and `ident` is the actual constant name that carries it -- which is
// the point of printing the column. Re-read the source before changing any of
// these; CI cannot catch drift here.
export const specs = [
  {
    id: 'a1',
    heading: 'A.1  Extraction unit',
    source: 'turtles/flattener.lua',
    rows: [
      ['Working area', '15 \u00d7 15 cells', 'WIDTH \u00d7 LENGTH'],
      ['Vertical ceiling', '32 layers above the floor', 'MAX_HEIGHT'],
      ['Unconditional sweep depth', '4 layers', 'SCAN_MIN'],
      ['Re-cuts per block', '8', 'DIG_RETRY'],
      ['Move attempts before a cell is abandoned', '6', 'MAX_STUCK'],
      ['Refuelling threshold', '200 blocks of travel', 'FUEL_MIN'],
      ['Reserve held over the trip home', '16 blocks of travel', 'FUEL_MARGIN'],
      ['Onboard capacity', '16 slots', '\u2014'],
      ['Accepted fuel', 'Coal, charcoal, coal block, blaze rod', 'FUEL_ITEMS'],
    ],
  },
  {
    id: 'a2',
    heading: 'A.2  Collection unit',
    source: 'turtles/sweeper.lua',
    rows: [
      ['Working area', '10 \u00d7 10 cells', 'WIDTH \u00d7 LENGTH'],
      ['Cruise altitude', '1 block above the litter layer', 'SWEEP_ALT'],
      ['Interval between passes', '3,600 s (one hour)', 'PATROL_DELAY'],
      ['Recovery attempts per cell', '64', 'SUCK_LIMIT'],
      ['Climb allowance', '3 blocks', 'CLIMB_LIMIT'],
      ['Move attempts before a cell is abandoned', '3', 'MAX_STUCK'],
      ['Refuelling threshold', '200 blocks of travel', 'FUEL_MIN'],
      ['Reserve held over the trip home', '16 blocks of travel', 'FUEL_MARGIN'],
    ],
  },
];

// Every test name in both harnesses, verbatim and in source order. Section 7
// claims these ARE the guarantees, so they must stay literal -- copy them
// from the source, never paraphrase, and never print a subset without
// saying so.
export const suites = [
  {
    id: 'suite-flattener',
    label: 'Extraction unit',
    source: 'test/flattener_test.lua',
    names: [
      'clears every block at and above the start layer inside the 15x15',
      'leaves the layer it started on intact',
      'never aims a dig below the start layer',
      'leaves blocks outside the 15x15 alone',
      'does not mine the chest',
      'clears an overhang floating above empty air',
      'delivers the dirt and the stone to the chest',
      'never scatters items on the ground',
      'comes home to the start cell facing the way it started',
      'empties into the chest partway through a big job',
      'halts instead of spinning when the chest fills up',
      'holds its haul rather than scattering it when no chest is there',
      'mines nothing on ground that is already flat',
    ],
  },
  {
    id: 'suite-sweeper',
    label: 'Collection unit',
    source: 'test/sweeper_test.lua',
    names: [
      'picks up every loose stack inside the 10x10',
      'delivers the haul to the chest',
      'leaves litter outside the 10x10 alone',
      'never scatters items on the ground',
      'never digs anything',
      'empties into the chest partway through and resumes the pass',
      'halts instead of spinning when the chest fills up',
      'holds its haul rather than scattering it when no chest is there',
      'keeps its fuel instead of posting it into the chest',
      'comes home to the start cell facing the way it started',
      'warns and keeps sweeping when there is no headroom',
      'finishes a pass on a yard with nothing lying about',
    ],
  },
];

// Counted rather than written out, so the prose cannot drift from the list.
export const testCount = suites.reduce((n, s) => n + s.names.length, 0);

// Verbatim from turtles/flattener.lua -- the stop condition section 3 spends
// three paragraphs describing. Dedented from its position inside the layer
// loop; otherwise untouched, comment included.
export const stopCondition = `-- Stop once this layer came up empty AND nothing was spotted overhead,
-- but never before SCAN_MIN layers have actually been walked.
if z + 1 >= SCAN_MIN and layerDigs == 0 and not sawAbove then
  print("Nothing left up here. Done.")
  break
end`;
