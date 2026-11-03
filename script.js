'use strict';

/* =====================================================================
 * B.L.A.D.E. dice - game logic
 *
 *  1. Constants
 *  2. Game data (Classic dice texts, Custom mode grinds and spin values)
 *  3. Combination logic (Custom mode)
 *  4. DOM references and application state
 *  5. Dice rendering (3D cube, face texts)
 *  6. Rolling
 *  7. Touch interaction (tremble, pull and fall back)
 *  8. Visual effects (X Grind and Hot Dog pictures)
 *  9. Navigation, result text and rules language
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * 1. Constants
 * ------------------------------------------------------------------- */

const FACE_NUMBERS = [1, 2, 3, 4, 5, 6];

/** Rotation in degrees [aroundX, aroundZ] that brings each face number to the top of a die. */
const TOP_FACE_ROTATION = { 1: [90, 0], 2: [0, 0], 3: [0, -90], 4: [0, 90], 5: [180, 0], 6: [-90, 0] };

/** Outward normal of each face in the die's own coordinates (x right, y down, z toward the viewer). */
const FACE_NORMALS = { 1: [0, 0, 1], 6: [0, 0, -1], 3: [1, 0, 0], 4: [-1, 0, 0], 2: [0, -1, 0], 5: [0, 1, 0] };

/** Timing of the roll animation, in milliseconds. */
const ROLL_TIMING = { fall: 1400, tumble: 1150, stagger: 160, settleBuffer: 60 };

/** Custom mode dice are turned to a corner-forward angle so that two side faces are visible. */
const CUSTOM_DIE_YAW_DEG = 45;
const CUSTOM_DIE_YAW_JITTER_DEG = 20;

/** Longest line (in characters) before a face text is wrapped to the next line. */
const MAX_CHARS_PER_LINE = 11;

const SHADOW_BASE_TRANSFORM = 'translateY(calc(var(--s)/2)) rotateX(90deg)';
const EASE_FALL = 'cubic-bezier(.5,0,1,.7)';
const EASE_BOUNCE = 'cubic-bezier(0,.6,.5,1)';

/* ---------------------------------------------------------------------
 * 2. Game data
 * ------------------------------------------------------------------- */

/**
 * Classic mode: two real six-sided dice with one fixed text per side.
 * A "/" splits a text into two lines.
 */
const CLASSIC_DICE_TEXTS = [
  ['Soul/Acid', 'Royale/Frontside', 'Miszou/P-star', 'Topside', 'Torque/Makio', 'Air Spin/Grab'],
  ['Regular', 'Switch', 'Fakie', 'Alley-Oop', 'Truespin', 'Out'],
];

/** Custom mode: Soul style grinds (Grind dice). */
const SOUL_GRINDS = [
  'Acid', 'Citric Acid', 'Hot Dog', 'Makio', 'Mistrial', 'Mizou', 'P-Star', 'Sidewalk', 'Soul',
  'Stub Soul', 'Tea Kettle', 'Torque Soul', 'X Grind', 'Makio Christ', 'Makio Antichrist',
  'Negative Tea Kettle', 'Negative Mizou', 'Negative Mistral', 'Negative P-star', 'Negative Soul',
  'Negative Acid', 'Negative Makio', 'switch Acid', 'switch Citric Acid', 'switch Makio',
  'switch Mistrial', 'switch Mizou', 'switch P-Star', 'switch Sidewalk', 'switch Soul',
  'switch Stub Soul', 'switch Tea Kettle', 'switch Torque Soul', 'switch X Grind',
  'switch Makio Christ', 'switch Makio Antichrist', 'switch Negative Tea Kettle',
  'switch Negative Mizou', 'switch Negative Mistral', 'switch Negative P-star',
  'switch Negative Soul', 'switch Negative Acid', 'switch Negative Makio', 'Topside P-Star',
  'Topside Makio', 'Topside Mizou', 'Topside Mistrial', 'Topside Torque Soul', 'Topside P-Star',
  'Topside Soul', 'Topside Acid', 'switch Topside P-Star', 'switch Topside Makio',
  'switch Topside Mizou', 'switch Topside Mistrial', 'switch Topside Torque Soul',
  'switch Topside Soul', 'switch Topside Acid',
];

/** Custom mode: Groove style grinds (Grind dice). */
const GROOVE_GRINDS = [
  'Backside', 'Backside Backslide', 'Backside Cab driver', 'Backside Darkslide',
  'Backside Fastslide', 'Backside Full Torque', 'Backside Pudslide', 'Backside Royale',
  'Backside Tabernacle', 'Backside Torque', 'Backside Unity', 'Backside Wheelbarrow',
  'Backside Savannah', 'Backslide', 'Cab driver', 'Darkslide', 'Fastslide', 'Frontside',
  'Full Torque', 'Pudslide', 'Royale', 'Tabernacle', 'Torque', 'Unity', 'Wheelbarrow', 'Savannah',
  'switch Backside', 'switch Backside Backslide', 'switch Backside Cab driver',
  'switch Backside Darkslide', 'switch Backside Fastslide', 'switch Backside Full Torque',
  'switch Backside Pudslide', 'switch Backside Royale', 'switch Backside Tabernacle',
  'switch Backside Torque', 'switch Backside Unity', 'switch Backside Wheelbarrow',
  'switch Backslide', 'switch Cab driver', 'switch Darkslide', 'switch Fastslide',
  'switch Frontside', 'switch Full Torque', 'switch Pudslide', 'switch Royale',
  'switch Tabernacle', 'switch Torque', 'switch Unity', 'switch Wheelbarrow',
];

/**
 * Grind categories (Grind dice checkboxes "Basic" and "Exotic"). A grind with modifiers
 * (switch, negative, topside) belongs to the category of its base name.
 */
const BASIC_GRINDS = [
  'Acid', 'Makio', 'Mistrial', 'Mizou', 'P-Star', 'Soul', 'Torque Soul', 'Backside',
  'Backside Royale', 'Backside Unity', 'Backside Savannah', 'Backside Full Torque', 'Frontside',
  'Full Torque', 'Royale', 'Torque', 'Unity', 'Savannah',
];

/** Exotic grinds (see BASIC_GRINDS). */
const EXOTIC_GRINDS = [
  'Citric Acid', 'Hot Dog', 'Sidewalk', 'Stub Soul', 'Tea Kettle', 'X Grind', 'Makio Christ',
  'Makio Antichrist', 'Backside Backslide', 'Backside Cab driver', 'Backside Darkslide',
  'Backside Fastslide', 'Backside Pudslide', 'Backside Tabernacle', 'Backside Wheelbarrow',
  'Backslide', 'Cab driver', 'Darkslide', 'Fastslide', 'Pudslide', 'Tabernacle', 'Wheelbarrow',
];

/** Easter egg: the only grind available while no Grind checkbox is checked (or none matches). */
const EASTER_EGG_GRIND_NAME = 'Hot Dog';

/**
 * Value groups of the Before (dice 1) and After (dice 3) checkboxes. Every checkbox adds its values.
 * A value can have these conditions (no condition = always allowed):
 *  - grindGroups:   grind groups it can be used with ('soul' and / or 'groove').
 *  - needsBackside: true -> only for grinds with "backside" in the name,
 *                   false -> only for grinds without it.
 *  - soulStall:     'front' | 'back' -> for Soul grinds the value is only used when the Before value
 *                   is a face front stall / a face back stall (see the stall lists below).
 */
const BEFORE_VALUE_GROUPS = [
  { key: 'basic', label: 'Basic', values: [{ text: 'Forward' }, { text: 'Zero spin' }] },
  { key: 'spin180', label: '180', values: [
    { text: 'Alleyoop', grindGroups: ['soul'] }, { text: 'Truspin', grindGroups: ['soul'] },
    { text: 'Inspin 180', grindGroups: ['soul'] }, { text: 'Outspin 180', grindGroups: ['soul'] },
  ] },
  { key: 'spin270', label: '270', values: [
    { text: '270', grindGroups: ['groove'], needsBackside: true },
    { text: 'Truspin 270', grindGroups: ['groove'], needsBackside: false },
    { text: 'Inspin 270', grindGroups: ['groove'], needsBackside: true },
    { text: 'Outspin 270', grindGroups: ['groove'], needsBackside: false },
  ] },
  { key: 'spin360', label: '360', values: [
    { text: '360 inspin', grindGroups: ['soul'] }, { text: '360 outspin', grindGroups: ['soul'] },
    { text: 'Truspin 360', grindGroups: ['soul'] }, { text: 'Alleyoop 360', grindGroups: ['soul'] },
  ] },
  { key: 'darksideDisaster', label: 'D&D', values: [{ text: 'Darkside' }, { text: 'Disaster' }] },
];

const AFTER_VALUE_GROUPS = [
  { key: 'basic', label: 'Basic', values: [
    { text: 'Forward', soulStall: 'front' }, { text: 'Backward', soulStall: 'back' },
  ] },
  { key: 'spin180', label: '180', values: [
    { text: '180', grindGroups: ['soul'] }, { text: '180 rewind', grindGroups: ['soul'] },
  ] },
  { key: 'spin270', label: '270', values: [
    { text: '270', grindGroups: ['groove'] }, { text: '270 rewind', grindGroups: ['groove'] },
  ] },
  { key: 'spin360', label: '360', values: [
    { text: '360', grindGroups: ['soul'] }, { text: '360 rewind', grindGroups: ['soul'] },
  ] },
  { key: 'spin450', label: '450', values: [
    { text: '450', grindGroups: ['groove'] }, { text: '450 rewind', grindGroups: ['groove'] },
  ] },
  { key: 'spin540', label: '540', values: [
    { text: '540', grindGroups: ['soul'] }, { text: '540 rewind', grindGroups: ['soul'] },
  ] },
];

/** Used when no checkbox of the dice is checked, or the checked ones give no value for the grind. */
const BEFORE_FALLBACK_VALUES = ['Forward'];
const AFTER_FALLBACK_VALUES = ['Forward'];

/**
 * Soul grinds: the After value depends on the Before value. A Before value is either a
 * "face front stall" (the grind is left forward) or a "face back stall" (left backward).
 */
const SOUL_FRONT_STALL_BEFORE_VALUES = [
  'Forward', '360 inspin', '360 outspin', 'Inspin 180', 'Outspin 180', 'Darkside', 'Disaster',
];
const SOUL_BACK_STALL_BEFORE_VALUES = ['Alleyoop', 'Truspin', 'Zero spin', 'Truspin 360', 'Alleyoop 360'];

/* ---------------------------------------------------------------------
 * 3. Combination logic (Custom mode)
 * ------------------------------------------------------------------- */

const SWITCH_PATTERN = /^switch\b/i;
const NEGATIVE_PATTERN = /\bnegative\b/i;
const TOPSIDE_PATTERN = /\btopside\b/i;
const BACKSIDE_PATTERN = /\bbackside\b/i;

/** Upper-cases the first letter: "switch Acid" -> "Switch Acid". */
const capitalizeFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Key for case-insensitive comparison and de-duplication. */
const toKey = (text) => text.trim().toLowerCase();

/** Lower-case keys of the Before values that are a face front stall / a face back stall (Soul grinds). */
const SOUL_FRONT_STALL_KEYS = new Set(SOUL_FRONT_STALL_BEFORE_VALUES.map(toKey));
const SOUL_BACK_STALL_KEYS = new Set(SOUL_BACK_STALL_BEFORE_VALUES.map(toKey));

const BASIC_GRIND_KEYS = new Set(BASIC_GRINDS.map(toKey));
const EXOTIC_GRIND_KEYS = new Set(EXOTIC_GRINDS.map(toKey));
const GRIND_MODIFIER_PATTERN = /\b(switch|negative|topside)\b/gi;

/**
 * Category of a grind, taken from its base name (modifiers removed, case-insensitive).
 * A grind that is in neither list is treated as basic.
 */
function getGrindCategory(rawName) {
  const baseKey = toKey(rawName.replace(GRIND_MODIFIER_PATTERN, ' ').replace(/\s+/g, ' '));
  if (EXOTIC_GRIND_KEYS.has(baseKey)) return 'exotic';
  if (BASIC_GRIND_KEYS.has(baseKey)) return 'basic';
  return 'basic';
}

/** Random integer from 0 to count - 1. */
const randomIndex = (count) => Math.floor(Math.random() * count);

/** Cleans a list of values for display (trimmed, first letter capitalized). */
const formatValues = (values) => values.map((value) => capitalizeFirst(value.trim()));

/**
 * Builds the catalog of all grinds with their group and modifiers.
 * Names are matched case-insensitively and duplicates are removed.
 * @returns {{key:string,name:string,group:'soul'|'groove',category:'basic'|'exotic',hasBackside:boolean,
 *            isSwitch:boolean,isNegative:boolean,isTopside:boolean}[]}
 */
function buildGrindCatalog() {
  const catalog = [];
  const seenKeys = new Set();
  const sources = [['soul', SOUL_GRINDS], ['groove', GROOVE_GRINDS]];

  sources.forEach(([group, names]) => {
    names.forEach((rawName) => {
      const key = toKey(rawName);
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      catalog.push({
        key,
        name: capitalizeFirst(rawName.trim()),
        group,
        category: getGrindCategory(rawName),
        hasBackside: BACKSIDE_PATTERN.test(rawName),
        isSwitch: SWITCH_PATTERN.test(rawName),
        isNegative: NEGATIVE_PATTERN.test(rawName),
        isTopside: TOPSIDE_PATTERN.test(rawName),
      });
    });
  });
  return catalog;
}

const GRIND_CATALOG = buildGrindCatalog();

/**
 * Grinds that can currently be rolled.
 *
 * Main checkboxes: Basic, Exotic, Topside (any of them can be checked together).
 * Additional checkboxes: Switch, Negative.
 *  - Main checkboxes give the regular grinds of the checked groups (no switch / negative variants).
 *  - Switch adds the switch variants, Negative adds the negative variants, and both together
 *    also add the switch + negative variants of the checked groups.
 *  - Nothing checked (or no grind matches): only the Easter egg grind (Hot Dog).
 */
function selectGrindsByGrindOptions(options) {
  const matches = GRIND_CATALOG.filter((grind) => {
    const groupChecked = grind.isTopside
      ? options.topside
      : (grind.category === 'basic' && options.basic) || (grind.category === 'exotic' && options.exotic);
    const variantAllowed = (!grind.isSwitch || options.switch) && (!grind.isNegative || options.negative);
    return groupChecked && variantAllowed;
  });

  if (matches.length > 0) return matches;
  return GRIND_CATALOG.filter((grind) => grind.key === toKey(EASTER_EGG_GRIND_NAME));
}

/** True when at least one checkbox of an options object (Before, After, ...) is checked. */
const hasCheckedOption = (options) => Object.values(options).some(Boolean);

/**
 * Stall type of a Before value for Soul grinds: 'front', 'back', or null when it is unknown
 * (or not given). The stall type decides whether Forward or Backward can follow.
 */
function getSoulStallType(beforeValue) {
  const key = beforeValue ? toKey(beforeValue) : '';
  if (SOUL_FRONT_STALL_KEYS.has(key)) return 'front';
  if (SOUL_BACK_STALL_KEYS.has(key)) return 'back';
  return null;
}

/** True when every value of a checkbox group is only used with Groove grinds. */
const isGrooveOnlyGroup = (valueGroup) => valueGroup.values.every((value) =>
  value.grindGroups && value.grindGroups.length === 1 && value.grindGroups[0] === 'groove');

/**
 * Keys of the Before / After checkboxes whose values exist only for Groove grinds
 * (Before 270, After 270 and 450). Topside grinds are Soul grinds, so they cannot use them.
 */
const GROOVE_ONLY_BEFORE_KEYS = new Set(BEFORE_VALUE_GROUPS.filter(isGrooveOnlyGroup).map((group) => group.key));
const GROOVE_ONLY_AFTER_KEYS = new Set(AFTER_VALUE_GROUPS.filter(isGrooveOnlyGroup).map((group) => group.key));

/**
 * Collects the values of the checked checkboxes that fit a grind.
 * @param valueGroups   BEFORE_VALUE_GROUPS or AFTER_VALUE_GROUPS
 * @param checkedOptions object such as { basic: true, spin180: false, ... }
 * @param grind         the rolled grind (its group and "backside" decide which values fit)
 * @param soulStallType 'front' | 'back' | null - the stall type of the Before value (After dice only)
 * @returns {string[]} display texts; empty when nothing fits
 */
function collectValues(valueGroups, checkedOptions, grind, soulStallType) {
  const values = [];
  valueGroups.forEach((valueGroup) => {
    if (!checkedOptions[valueGroup.key]) return;
    valueGroup.values.forEach((value) => {
      const fitsGrindGroup = !value.grindGroups || value.grindGroups.includes(grind.group);
      const fitsBackside = value.needsBackside === undefined || value.needsBackside === grind.hasBackside;
      const fitsStall = !value.soulStall || grind.group !== 'soul' || !soulStallType || value.soulStall === soulStallType;
      if (fitsGrindGroup && fitsBackside && fitsStall) values.push(value.text);
    });
  });
  return formatValues(values);
}

/**
 * Values the Before dice can show for the given grind (the list can be empty, for example when
 * only "270" is checked and the grind is a Soul grind).
 */
const getBeforeValues = (grind, beforeOptions) =>
  collectValues(BEFORE_VALUE_GROUPS, beforeOptions, grind, null);

/**
 * Values the After dice can show for the given grind. For Soul grinds Forward / Backward also
 * depend on the Before value; without a Before value that condition is ignored.
 */
const getAfterValues = (grind, afterOptions, beforeValue) =>
  collectValues(AFTER_VALUE_GROUPS, afterOptions, grind, getSoulStallType(beforeValue));

/**
 * Grinds the next roll can use: the grinds chosen by the Grind checkboxes, limited to the ones
 * that have at least one value for the checked Before and After checkboxes (for example with only
 * "270" checked in Before, Soul grinds are left out). A group without a checked checkbox does not
 * limit the grinds. If no grind fits, the Grind selection is used as it is and the dice fall back
 * to Forward.
 * @param settings { grind, before, after } - the checkbox options of the three groups
 */
function getAvailableGrinds(settings) {
  const grinds = selectGrindsByGrindOptions(settings.grind);
  const isBeforeChecked = hasCheckedOption(settings.before);
  const isAfterChecked = hasCheckedOption(settings.after);

  const eligibleGrinds = grinds.filter((grind) =>
    (!isBeforeChecked || getBeforeValues(grind, settings.before).length > 0) &&
    (!isAfterChecked || getAfterValues(grind, settings.after).length > 0));
  return eligibleGrinds.length > 0 ? eligibleGrinds : grinds;
}

/**
 * Creates a full combination. The grind is chosen first, then the Before value from the values
 * that fit that grind, and last the After value (which can depend on the Before value).
 * Each face set holds the values around a die and the index of the one on top.
 * @param availableGrinds   grinds the roll can use (see getAvailableGrinds)
 * @param previousGrindKey  key of the grind shown before; it is not chosen again
 * @param settings          { grind, before, after } - the checkbox options
 * @returns {{grind:object, faceSets:{values:string[],topIndex:number}[]}} order: Before, Grind, After
 */
function generateCombination(availableGrinds, previousGrindKey, settings) {
  // The same grind never comes up twice in a row (unless it is the only one available).
  const candidates = availableGrinds.length > 1
    ? availableGrinds.filter((item) => item.key !== previousGrindKey)
    : availableGrinds;
  const grind = candidates[randomIndex(candidates.length)];
  const grindIndex = availableGrinds.indexOf(grind);

  let beforeValues = getBeforeValues(grind, settings.before);
  if (beforeValues.length === 0) beforeValues = formatValues(BEFORE_FALLBACK_VALUES);
  const beforeIndex = randomIndex(beforeValues.length);

  let afterValues = getAfterValues(grind, settings.after, beforeValues[beforeIndex]);
  if (afterValues.length === 0) afterValues = formatValues(AFTER_FALLBACK_VALUES);

  return {
    grind,
    faceSets: [
      { values: beforeValues, topIndex: beforeIndex },
      { values: availableGrinds.map((item) => item.name), topIndex: grindIndex },
      { values: afterValues, topIndex: randomIndex(afterValues.length) },
    ],
  };
}

/** Texts on the top side of each die. */
const getTopTexts = (faceSets) => faceSets.map((set) => set.values[set.topIndex]);

/* ---------------------------------------------------------------------
 * 4. DOM references and application state
 * ------------------------------------------------------------------- */

const gameView = document.getElementById('game');
const stageElement = document.getElementById('stage');
const rollButton = document.getElementById('btn');
const resultText = document.getElementById('out');
const resultBox = document.getElementById('outBox');
const optionsPanel = document.getElementById('opts');
const rulesView = document.getElementById('rules');
const navigation = document.querySelector('nav');
const tabButtons = document.querySelectorAll('.tab');

const GAME_MODES = {
  classic: { type: 'classic', diceCount: 2, hasGrindOptions: false },
  custom: { type: 'custom', diceCount: 3, hasGrindOptions: true },
};

const state = {
  mode: null,            // current entry of GAME_MODES
  dice: [],              // dice objects (see createDie)
  isRolling: false,
  generation: 0,         // increases on every mode start, used to ignore stale timers
  combination: null,     // current Custom mode combination
  grindOptions: { basic: false, exotic: false, switch: false, negative: false, topside: false },
  beforeOptions: { basic: false, spin180: false, spin270: false, spin360: false, darksideDisaster: false },
  afterOptions: { basic: false, spin180: false, spin270: false, spin360: false, spin450: false, spin540: false },
};

/** The checkbox options of the three groups, in the form the combination functions use. */
const getSettings = () => ({ grind: state.grindOptions, before: state.beforeOptions, after: state.afterOptions });

/* ---------------------------------------------------------------------
 * 5. Dice rendering
 * ------------------------------------------------------------------- */

/** Solid inner faces that hide the opposite side through rounded corners. */
const CORE_FACES_HTML = FACE_NUMBERS.map((n) => `<div class="core c${n}"></div>`).join('');

const randomFace = () => 1 + randomIndex(6);
const randomYaw = () => Math.random() * 360 - 180;

/** Splits a text into lines: "/" is a manual break, otherwise words are wrapped. */
function splitIntoLines(text) {
  if (text.includes('/')) return text.split('/').map((part) => part.trim());

  const wrapWords = (value) => {
    const lines = [];
    let current = '';
    value.split(/\s+/).forEach((word) => {
      if (current && `${current} ${word}`.length > MAX_CHARS_PER_LINE) {
        lines.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    });
    if (current) lines.push(current);
    return lines;
  };

  // Keep a trailing "(...)" part on its own line(s).
  const bracketIndex = text.indexOf(' (');
  if (bracketIndex > 0) {
    return wrapWords(text.slice(0, bracketIndex)).concat(wrapWords(text.slice(bracketIndex + 1)));
  }
  return wrapWords(text);
}

/** HTML for one face text; the font size shrinks for long or multi-line texts. */
function buildFaceTextHtml(text) {
  const lines = splitIntoLines(text);
  const longestLine = Math.max(...lines.map((line) => line.length));
  const fontScale = Math.min(0.145, 0.85 / (longestLine * 0.6), 0.8 / (lines.length * 1.2));
  return `<b class="word" style="font-size:calc(var(--s)*${fontScale.toFixed(3)})">${lines.join('<br>')}</b>`;
}

/** Creates a die (DOM and state) and adds it to the stage. */
function createDie(initialTexts, fixedTexts) {
  const slot = document.createElement('div');
  slot.className = 'slot';
  const faces = FACE_NUMBERS
    .map((n) => `<div class="face w f${n}">${buildFaceTextHtml(initialTexts[n - 1])}</div>`)
    .join('');
  slot.innerHTML =
    `<div class="shadow"></div><div class="drop"><div class="cube">${faces}${CORE_FACES_HTML}</div></div>`;
  stageElement.appendChild(slot);

  return {
    shadow: slot.querySelector('.shadow'),
    drop: slot.querySelector('.drop'),
    cube: slot.querySelector('.cube'),
    fixedTexts,            // Classic mode: text of each face (null in Custom mode)
    topFace: 1,            // face number currently on top
    yawDeg: 0,             // turn around the vertical axis
    // touch interaction state
    isPressed: false, isPulling: false, startX: 0, startY: 0,
    liftPx: 0, shiftPx: 0, restBounds: null,
    trembleAnimation: null, fallAnimation: null, shadowFallAnimation: null,
  };
}

/** CSS transform that shows `topFace` on top, turned by `yawDeg`. */
function getRestingTransform(topFace, yawDeg) {
  const [rotateX, rotateZ] = TOP_FACE_ROTATION[topFace];
  return `rotateY(${yawDeg}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`;
}

/** Highlights the face that is on top. */
function highlightTopFace(die) {
  die.cube.querySelectorAll('.face').forEach((face) => {
    face.classList.toggle('hit', face.classList.contains(`f${die.topFace}`));
  });
}

function setFaceText(die, faceNumber, text) {
  die.cube.querySelector(`.face.f${faceNumber}`).innerHTML = buildFaceTextHtml(text);
}

/** Where each face points after the die is turned (used to find the visible faces). */
function computeFaceNormals(topFace, yawDeg) {
  const [angleX, angleZ] = TOP_FACE_ROTATION[topFace];
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const [cosX, sinX] = [Math.cos(toRadians(angleX)), Math.sin(toRadians(angleX))];
  const [cosZ, sinZ] = [Math.cos(toRadians(angleZ)), Math.sin(toRadians(angleZ))];
  const [cosY, sinY] = [Math.cos(toRadians(yawDeg)), Math.sin(toRadians(yawDeg))];
  const normals = {};

  FACE_NUMBERS.forEach((face) => {
    let [x, y, z] = FACE_NORMALS[face];
    [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];
    [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
    [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];
    normals[face] = { x, y, z };
  });
  return normals;
}

/**
 * Writes a face set onto a die: the chosen value goes on the top face, the previous and next
 * values on the two visible side faces (left and right), and neighbouring values on the
 * hidden faces. The list wraps around.
 */
function applyFaceSet(die, faceSet) {
  const { values, topIndex } = faceSet;
  const valueAt = (offset) => values[(((topIndex + offset) % values.length) + values.length) % values.length];

  const normals = computeFaceNormals(die.topFace, die.yawDeg);
  const sideFaces = FACE_NUMBERS.filter((f) => f !== die.topFace && Math.abs(normals[f].y) < 0.5);
  const byScreenX = (a, b) => normals[a].x - normals[b].x;
  const frontFaces = sideFaces.filter((f) => normals[f].z > 0).sort(byScreenX);   // [left, right]
  const backFaces = sideFaces.filter((f) => normals[f].z <= 0).sort(byScreenX);
  const bottomFace = FACE_NUMBERS.find((f) => normals[f].y > 0.5);

  const offsetByFace = {
    [die.topFace]: 0,
    [frontFaces[0]]: -1,
    [frontFaces[1]]: 1,
    [backFaces[0]]: -2,
    [backFaces[1]]: 2,
    [bottomFace]: 5,
  };
  Object.entries(offsetByFace).forEach(([face, offset]) => setFaceText(die, face, valueAt(offset)));
}

/** Writes the whole Custom combination onto the three dice. */
function applyCombinationToDice(combination) {
  state.dice.forEach((die, index) => applyFaceSet(die, combination.faceSets[index]));
}

/** Gives a die a random resting position (used when a mode starts). */
function placeDieAtRandom(die, yawDeg) {
  die.topFace = randomFace();
  die.yawDeg = yawDeg;
  highlightTopFace(die);
  die.cube.style.transform = getRestingTransform(die.topFace, die.yawDeg);
}

/** Builds the dice of a mode and shows them at rest. */
function startGameMode(modeKey) {
  const mode = GAME_MODES[modeKey];
  state.generation += 1;
  hideEffects();
  state.isRolling = false;
  rollButton.disabled = false;
  state.mode = mode;
  state.combination = null;

  rulesView.dataset.mode = modeKey;
  optionsPanel.hidden = !mode.hasGrindOptions;
  gameView.dataset.n = mode.diceCount;
  resultText.textContent = '';
  stageElement.innerHTML = '';
  state.dice = [];

  if (mode.type === 'classic') {
    CLASSIC_DICE_TEXTS.forEach((texts) => {
      const die = createDie(texts, texts);
      state.dice.push(die);
      placeDieAtRandom(die, randomYaw());
    });
    return;
  }

  // Custom mode: faces are filled from the combination.
  for (let i = 0; i < mode.diceCount; i += 1) {
    const die = createDie(Array(6).fill('-'), null);
    state.dice.push(die);
    placeDieAtRandom(die, CUSTOM_DIE_YAW_DEG);
  }
  const settings = getSettings();
  state.combination = generateCombination(getAvailableGrinds(settings), undefined, settings);
  applyCombinationToDice(state.combination);
}

/* ---------------------------------------------------------------------
 * 6. Rolling
 * ------------------------------------------------------------------- */

/** Fall, bounce and tumble animation of one die and its shadow. */
function animateRoll(die, delayMs) {
  const randomSpin = () => 360 * (1 + randomIndex(2)) * (Math.random() < 0.5 ? 1 : -1);
  const [rotateX, rotateZ] = TOP_FACE_ROTATION[die.topFace];
  const endTransform = getRestingTransform(die.topFace, die.yawDeg);
  const startTransform =
    `rotateY(${die.yawDeg + randomSpin()}deg) rotateX(${rotateX + randomSpin()}deg) rotateZ(${rotateZ + randomSpin()}deg)`;
  const timing = { duration: ROLL_TIMING.fall, delay: delayMs, fill: 'backwards' };

  die.cube.style.transform = endTransform;
  die.cube.animate(
    [{ transform: startTransform }, { transform: endTransform }],
    { duration: ROLL_TIMING.tumble, delay: delayMs, easing: 'cubic-bezier(.25,.6,.35,1)', fill: 'backwards' });

  die.drop.animate([
    { transform: 'translateY(-750px)', offset: 0, easing: EASE_FALL },
    { transform: 'translateY(0)', offset: 0.5, easing: EASE_BOUNCE },
    { transform: 'translateY(-55px)', offset: 0.68, easing: EASE_FALL },
    { transform: 'translateY(0)', offset: 0.82, easing: EASE_BOUNCE },
    { transform: 'translateY(-12px)', offset: 0.91, easing: EASE_FALL },
    { transform: 'translateY(0)', offset: 1 },
  ], timing);

  const shadowFrame = (scale, opacity, offset) =>
    ({ transform: `${SHADOW_BASE_TRANSFORM} scale(${scale})`, opacity, offset });
  die.shadow.animate([
    shadowFrame(0.3, 0, 0), shadowFrame(1, 1, 0.5), shadowFrame(0.8, 0.6, 0.68),
    shadowFrame(1, 1, 0.82), shadowFrame(0.95, 0.85, 0.91), shadowFrame(1, 1, 1),
  ], timing);
}

/** Texts to show as the final result, one line per die. */
function getResultLines() {
  if (state.mode.type === 'custom') return getTopTexts(state.combination.faceSets);
  return state.dice.map((die) => die.fixedTexts[die.topFace - 1]);
}

/** Rolls all dice. The combination is calculated first and shown only after the dice land. */
function rollDice() {
  if (state.isRolling) return;
  state.isRolling = true;
  rollButton.disabled = true;
  resultText.textContent = '';
  hideEffects();
  state.dice.forEach(resetDieInteraction);

  const generation = state.generation;
  const isCustom = state.mode.type === 'custom';
  if (isCustom) {
    const previousGrindKey = state.combination ? state.combination.grind.key : undefined;
    const settings = getSettings();
    state.combination = generateCombination(getAvailableGrinds(settings), previousGrindKey, settings);
  }

  state.dice.forEach((die, index) => {
    die.topFace = randomFace();
    die.yawDeg = isCustom
      ? CUSTOM_DIE_YAW_DEG + (Math.random() - 0.5) * CUSTOM_DIE_YAW_JITTER_DEG
      : randomYaw();
    highlightTopFace(die);
    if (isCustom) applyFaceSet(die, state.combination.faceSets[index]);
    animateRoll(die, index * ROLL_TIMING.stagger);
  });

  const totalMs = ROLL_TIMING.fall + ROLL_TIMING.stagger * (state.dice.length - 1) + ROLL_TIMING.settleBuffer;
  setTimeout(() => {
    if (generation !== state.generation) return;   // the mode changed meanwhile
    showResult(getResultLines());
    if (isCustom) playEffectsForGrind(state.combination.grind);
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (error) { /* vibration is optional */ }
    state.isRolling = false;
    rollButton.disabled = false;
  }, totalMs);
}

/* ---------------------------------------------------------------------
 * 7. Touch interaction: tremble, pull (up and sideways) and fall back
 * ------------------------------------------------------------------- */

/** Soft rubber band: the farther you pull, the less the die follows (max = limit). */
const rubberBand = (distance, limit) => limit * (1 - Math.exp(-distance / (limit * 1.2)));

const cancelAnimations = (...animations) => animations.forEach((animation) => animation && animation.cancel());

/** Stops any tremble, pull or fall-back of a die and clears its inline styles. */
function resetDieInteraction(die) {
  die.isPressed = false;
  die.isPulling = false;
  die.liftPx = 0;
  die.shiftPx = 0;
  cancelAnimations(die.trembleAnimation, die.fallAnimation, die.shadowFallAnimation);
  die.trembleAnimation = die.fallAnimation = die.shadowFallAnimation = null;
  die.drop.style.transform = '';
  die.shadow.style.transform = '';
  die.shadow.style.opacity = '';
}

/** Damped shake: `amplitude` is 1 for a full shake. */
function playTremble(die, amplitude, durationMs) {
  if (state.isRolling) return null;
  const unit = die.cube.offsetWidth / 100;
  const steps = 10;
  const frames = [];
  for (let i = 0; i <= steps; i += 1) {
    const swing = amplitude * (1 - i / steps) * (i % 2 ? -1 : 1);
    frames.push({
      transform: `translate(${(swing * 3 * unit).toFixed(2)}px,${(swing * -1.2 * unit).toFixed(2)}px) ` +
        `rotateZ(${(swing * 2.4).toFixed(2)}deg) rotateX(${(swing * 1.4).toFixed(2)}deg)`,
    });
  }
  cancelAnimations(die.trembleAnimation);
  die.trembleAnimation = die.drop.animate(frames, { duration: durationMs, easing: 'ease-out' });
  return die.trembleAnimation;
}

/** Light continuous shake while a finger stays on the die. */
function startHoldShake(die) {
  if (!die.isPressed || die.isPulling || state.isRolling) return;
  const unit = die.cube.offsetWidth / 100;
  const frame = (x, y, angle) =>
    ({ transform: `translate(${(x * unit).toFixed(2)}px,${(y * unit).toFixed(2)}px) rotateZ(${angle}deg)` });
  cancelAnimations(die.trembleAnimation);
  die.trembleAnimation = die.drop.animate(
    [frame(0, 0, 0), frame(-1.4, 0.6, -1.1), frame(1.3, -0.7, 1.2), frame(-1, -0.5, -0.8), frame(1.1, 0.6, 0.9), frame(0, 0, 0)],
    { duration: 600, iterations: Infinity });
}

/** Measures the horizontal space each die takes on screen (including corners that stick out). */
function measureRestBounds() {
  state.dice.forEach((die) => {
    let left = Infinity;
    let right = -Infinity;
    die.cube.querySelectorAll('.face').forEach((face) => {
      const box = face.getBoundingClientRect();
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
    });
    die.restBounds = { left: left - die.shiftPx, right: right - die.shiftPx };
  });
}

/** Allowed sideways movement [min, max] in px so a die never touches its neighbours. */
function getHorizontalLimits(die) {
  const index = state.dice.indexOf(die);
  const leftNeighbour = state.dice[index - 1];
  const rightNeighbour = state.dice[index + 1];
  const margin = 8;
  let min = -Infinity;
  let max = Infinity;
  if (rightNeighbour && rightNeighbour.restBounds && die.restBounds) {
    max = rightNeighbour.restBounds.left + rightNeighbour.shiftPx - die.restBounds.right - margin;
  }
  if (leftNeighbour && leftNeighbour.restBounds && die.restBounds) {
    min = leftNeighbour.restBounds.right + leftNeighbour.shiftPx - die.restBounds.left + margin;
  }
  return [Math.min(min, 0), Math.max(max, 0)];
}

/** Moves a die with the finger: up (liftPx) and sideways (limited by the neighbours). */
function applyPull(die, deltaX, upwardDistance) {
  const width = die.cube.offsetWidth;
  const maxLift = width * 0.9;
  const maxShift = width * 0.45;
  const [minShift, maxAllowedShift] = getHorizontalLimits(die);
  const lift = rubberBand(upwardDistance, maxLift);
  const shift = Math.max(minShift,
    Math.min(Math.sign(deltaX) * rubberBand(Math.abs(deltaX), maxShift), maxAllowedShift));

  if (!die.isPulling) {
    die.isPulling = true;
    cancelAnimations(die.trembleAnimation, die.fallAnimation, die.shadowFallAnimation);
    die.trembleAnimation = die.fallAnimation = die.shadowFallAnimation = null;
  }
  die.liftPx = lift;
  die.shiftPx = shift;
  const liftRatio = lift / maxLift;
  die.drop.style.transform =
    `translate(${shift.toFixed(1)}px,${(-lift).toFixed(1)}px) rotateZ(${((shift / maxShift) * 3).toFixed(2)}deg)`;
  die.shadow.style.transform = `translateX(${shift.toFixed(1)}px) ${SHADOW_BASE_TRANSFORM} scale(${(1 - 0.25 * liftRatio).toFixed(3)})`;
  die.shadow.style.opacity = (1 - 0.45 * liftRatio).toFixed(3);
}

/** Lets a pulled die fall back to its place with a few small bounces. */
function playFallBack(die) {
  const width = die.cube.offsetWidth;
  const lift = die.liftPx;
  const shift = die.shiftPx;
  const liftRatio = lift / (width * 0.9);
  const lean = (shift / (width * 0.45)) * 3;
  const [minShift, maxShift] = getHorizontalLimits(die);
  const clampShift = (value) => Math.max(minShift, Math.min(value, maxShift));
  const swing1 = clampShift(-shift * 0.25);
  const swing2 = clampShift(shift * 0.1);
  const swing3 = clampShift(-shift * 0.05);

  const bodyFrame = (x, y, angle, offset, easing) =>
    ({ transform: `translate(${x}px,${y}px) rotateZ(${angle}deg)`, offset, easing });
  const shadowFrame = (x, scale, opacity, offset) =>
    ({ transform: `translateX(${x}px) ${SHADOW_BASE_TRANSFORM} scale(${scale})`, opacity, offset });

  die.isPulling = false;
  die.fallAnimation = die.drop.animate([
    bodyFrame(shift, -lift, lean, 0, EASE_FALL),
    bodyFrame(swing1, 0, -lean * 0.25, 0.4, EASE_BOUNCE),
    bodyFrame(swing2, -lift * 0.22, lean * 0.1, 0.58, EASE_FALL),
    bodyFrame(swing3, 0, 0, 0.74, EASE_BOUNCE),
    bodyFrame(0, -lift * 0.06, 0, 0.87, EASE_FALL),
    bodyFrame(0, 0, 0, 1),
  ], { duration: 750 });
  die.shadowFallAnimation = die.shadow.animate([
    shadowFrame(shift, 1 - 0.25 * liftRatio, 1 - 0.45 * liftRatio, 0),
    shadowFrame(swing1, 1, 1, 0.4),
    shadowFrame(swing2, 0.94, 0.9, 0.58),
    shadowFrame(swing3, 1, 1, 0.74),
    shadowFrame(0, 0.98, 0.95, 0.87),
    shadowFrame(0, 1, 1, 1),
  ], { duration: 750 });

  die.drop.style.transform = '';
  die.shadow.style.transform = '';
  die.shadow.style.opacity = '';
  die.liftPx = 0;
  die.shiftPx = 0;
}

stageElement.addEventListener('pointerdown', (event) => {
  const slot = event.target.closest('.slot');
  if (!slot || state.isRolling) return;
  const die = state.dice[[...stageElement.children].indexOf(slot)];
  if (!die) return;

  measureRestBounds();
  die.isPressed = true;
  die.startX = event.clientX;
  die.startY = event.clientY;
  die.isPulling = false;

  const tremble = playTremble(die, 1, 840);
  if (tremble) tremble.onfinish = () => { if (die.isPressed) startHoldShake(die); };
});

window.addEventListener('pointermove', (event) => {
  state.dice.forEach((die) => {
    if (!die.isPressed || state.isRolling) return;
    const deltaX = event.clientX - die.startX;
    const upwardDistance = die.startY - event.clientY;
    if (die.isPulling || Math.abs(deltaX) > 6 || upwardDistance > 6) {
      applyPull(die, deltaX, Math.max(0, upwardDistance));
    }
  });
});

function releasePressedDice() {
  state.dice.forEach((die) => {
    if (!die.isPressed) return;
    die.isPressed = false;
    if (die.isPulling) playFallBack(die);
    else playTremble(die, 0.6, 640);
  });
}
window.addEventListener('pointerup', releasePressedDice);
window.addEventListener('pointercancel', releasePressedDice);

/* ---------------------------------------------------------------------
 * 8. Visual effects
 * ------------------------------------------------------------------- */

const xGrindImage = document.getElementById('xg');
const hotDogImage = document.getElementById('hd');
let xGrindAnimation = null;
let hotDogAnimation = null;

function hideEffects() {
  cancelAnimations(xGrindAnimation, hotDogAnimation);
  xGrindAnimation = hotDogAnimation = null;
  xGrindImage.hidden = true;
  hotDogImage.hidden = true;
}

/** X Grind picture crosses the result area from right to left in 2 seconds. */
function playXGrindEffect() {
  const height = Math.max(60, Math.min(resultBox.clientHeight, 220));
  const width = (height * (xGrindImage.naturalWidth || 305)) / (xGrindImage.naturalHeight || 380);
  const boxWidth = resultBox.clientWidth;
  xGrindImage.style.height = `${height}px`;
  xGrindImage.style.width = `${width}px`;
  xGrindImage.hidden = false;
  xGrindAnimation = xGrindImage.animate(
    [{ transform: `translate(${boxWidth}px,-50%)` }, { transform: `translate(${-width}px,-50%)` }],
    { duration: 2000, easing: 'linear' });
  xGrindAnimation.onfinish = () => { xGrindImage.hidden = true; xGrindAnimation = null; };
}

/** Hot Dog picture: rises 2 s, stays 1 s, goes down 2 s. */
function playHotDogEffect() {
  hotDogImage.hidden = false;
  hotDogAnimation = hotDogImage.animate([
    { transform: 'translate(-50%,100%)', offset: 0, easing: 'ease-out' },
    { transform: 'translate(-50%,0)', offset: 0.4 },
    { transform: 'translate(-50%,0)', offset: 0.6, easing: 'ease-in' },
    { transform: 'translate(-50%,100%)', offset: 1 },
  ], { duration: 5000 });
  hotDogAnimation.onfinish = () => { hotDogImage.hidden = true; hotDogAnimation = null; };
}

/** Starts the effects that belong to the rolled grind. */
function playEffectsForGrind(grind) {
  if (/x grind$/i.test(grind.name)) playXGrindEffect();
  if (/hot\s?dog/i.test(grind.name)) playHotDogEffect();
}

/* ---------------------------------------------------------------------
 * 9. Navigation, result text and rules language
 * ------------------------------------------------------------------- */

/** Shows the result lines (one per die) and fits the text into the free space. */
function showResult(lines) {
  resultText.textContent = lines.map((line) => splitIntoLines(line).join(' ')).join('\n');
  fitResultText();
}

/** Shrinks the result font until the text fits the box. */
function fitResultText() {
  let fontSize = 40;
  resultText.style.fontSize = `${fontSize}px`;
  while ((resultText.offsetWidth > resultBox.clientWidth || resultText.offsetHeight > resultBox.clientHeight) && fontSize > 12) {
    fontSize -= 1;
    resultText.style.fontSize = `${fontSize}px`;
  }
}
window.addEventListener('resize', fitResultText);

/** Shows one of the views: "mode", "game" or "rules". The menu is hidden on the mode page. */
function showView(viewName) {
  navigation.hidden = viewName === 'mode';
  tabButtons.forEach((tab) => tab.classList.toggle('on', tab.dataset.v === viewName));
  ['mode', 'game', 'rules'].forEach((id) => { document.getElementById(id).hidden = id !== viewName; });
  if (viewName === 'game') fitResultText();
}

tabButtons.forEach((tab) => tab.addEventListener('click', () => showView(tab.dataset.v)));

document.querySelectorAll('.mode[data-mode]').forEach((card) => {
  card.addEventListener('click', () => {
    startGameMode(card.dataset.mode);
    showView('game');
  });
});

/*
 * Option checkboxes: Grind (main: Basic, Exotic, Topside; additional: Switch, Negative), Before and After.
 * They only change which values the NEXT roll can use. The dice and the result on screen stay as they
 * are until the button is pressed.
 *
 * Rules that keep the checkboxes consistent (enforceOptionRules and getLockReason):
 *  - Switch and Negative need a main Grind checkbox; Negative is also locked while Topside is the only
 *    main one (there are no negative Topside grinds).
 *  - Topside grinds are Soul grinds. While Topside is the only main Grind checkbox, the Groove-only values
 *    (Before 270, After 270 and 450) are locked and unchecked.
 *  - The other way round, Topside is locked while only Groove-only values are checked and neither
 *    Basic nor Exotic is checked.
 *  - With Basic or Exotic checked the dice can show Groove and Soul grinds, so everything stays available.
 */
const OPTION_GROUPS = [
  { attribute: 'option', options: state.grindOptions },
  { attribute: 'before', options: state.beforeOptions },
  { attribute: 'after', options: state.afterOptions },
];
const optionInputs = document.querySelectorAll('#opts input[data-option], #opts input[data-before], #opts input[data-after]');

/** The option group (Grind, Before or After) a checkbox belongs to, and its key inside that group. */
function getOptionGroupOfInput(input) {
  const group = OPTION_GROUPS.find((candidate) => input.dataset[candidate.attribute] !== undefined);
  return { group, key: input.dataset[group.attribute] };
}

/** Short description of the checked main Grind checkboxes. */
function summarizeGrindSelection() {
  const { basic, exotic, topside } = state.grindOptions;
  return {
    hasMainOption: basic || exotic || topside,
    hasBasicOrExotic: basic || exotic,
    isTopsideOnly: topside && !basic && !exotic,
  };
}

/** True when some Before / After checkboxes are checked and all of them are Groove-only. */
function areOnlyGrooveValuesChecked() {
  const checkedKeys = (options) => Object.keys(options).filter((key) => options[key]);
  const checkedBeforeKeys = checkedKeys(state.beforeOptions);
  const checkedAfterKeys = checkedKeys(state.afterOptions);
  if (checkedBeforeKeys.length + checkedAfterKeys.length === 0) return false;
  return checkedBeforeKeys.every((key) => GROOVE_ONLY_BEFORE_KEYS.has(key)) &&
    checkedAfterKeys.every((key) => GROOVE_ONLY_AFTER_KEYS.has(key));
}

/** Why a checkbox is locked (shown as its tooltip), or an empty string when it can be used. */
function getLockReason(attribute, key) {
  const { hasMainOption, hasBasicOrExotic, isTopsideOnly } = summarizeGrindSelection();

  if (attribute === 'option') {
    if ((key === 'switch' || key === 'negative') && !hasMainOption) return 'Check Basic, Exotic or Topside first';
    if (key === 'negative' && isTopsideOnly) return 'There are no negative Topside grinds';
    if (key === 'topside' && !state.grindOptions.topside && !hasBasicOrExotic && areOnlyGrooveValuesChecked()) {
      return 'Topside grinds are Soul grinds, but the checked values (270, 450) are only for Groove grinds. Check Basic or Exotic, or uncheck them';
    }
    return '';
  }

  const grooveOnlyKeys = attribute === 'before' ? GROOVE_ONLY_BEFORE_KEYS : GROOVE_ONLY_AFTER_KEYS;
  if (isTopsideOnly && grooveOnlyKeys.has(key)) {
    return 'Only for Groove grinds. Topside grinds are Soul grinds: check Basic or Exotic to use it';
  }
  return '';
}

/** Unchecks the options that the current selection does not allow. */
function enforceOptionRules() {
  const grindOptions = state.grindOptions;
  const { hasMainOption, isTopsideOnly } = summarizeGrindSelection();

  if (!hasMainOption) {
    grindOptions.switch = false;
    grindOptions.negative = false;
  }
  if (isTopsideOnly) {
    grindOptions.negative = false;
    GROOVE_ONLY_BEFORE_KEYS.forEach((key) => { state.beforeOptions[key] = false; });
    GROOVE_ONLY_AFTER_KEYS.forEach((key) => { state.afterOptions[key] = false; });
  }
}

/** Shows the state of all option checkboxes: checked, locked, and the tooltip with the reason. */
function renderOptionInputs() {
  optionInputs.forEach((input) => {
    const { group, key } = getOptionGroupOfInput(input);
    const chip = input.closest('.chip');
    if (chip.dataset.baseTitle === undefined) chip.dataset.baseTitle = chip.title;   // remember the normal tooltip

    const lockReason = getLockReason(group.attribute, key);
    input.checked = group.options[key];
    input.disabled = lockReason !== '';
    chip.title = lockReason || chip.dataset.baseTitle;
  });
}

optionInputs.forEach((input) => {
  const { group, key } = getOptionGroupOfInput(input);
  input.addEventListener('change', () => {
    group.options[key] = input.checked;
    enforceOptionRules();
    renderOptionInputs();
  });
});
renderOptionInputs();

/* ---------------------------------------------------------------------
 * Popups: hold a checked main Grind checkbox (Basic, Exotic, Topside) or a checked Before checkbox
 * for 1 second to see the grinds / values that belong to it.
 * ------------------------------------------------------------------- */

const LONG_PRESS_MS = 1000;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;
const POPUP_MIN_COLUMN_WIDTH_PX = 135;
const POPUP_ROW_HEIGHT_PX = 30;
const MAIN_GROUP_LABELS = { basic: 'Basic', exotic: 'Exotic', topside: 'Topside' };

const grindPopup = document.getElementById('grindPopup');
const popupTitle = document.getElementById('popupTitle');
const popupInfo = document.getElementById('popupInfo');
const popupList = document.getElementById('popupList');
const popupCloseButton = document.getElementById('popupClose');
let pressStartedOnBackdrop = false;   // true when the current press began on the dark background

/** Sort order in the popup: regular grinds, then negative, switch and switch + negative variants. */
const getVariantRank = (grind) => (grind.isSwitch ? 2 : 0) + (grind.isNegative ? 1 : 0);

/** Grinds of one main group, including the variants that Switch / Negative currently add. */
function getGrindsOfGroup(groupName) {
  const groupOptions = {
    basic: groupName === 'basic',
    exotic: groupName === 'exotic',
    topside: groupName === 'topside',
    switch: state.grindOptions.switch,
    negative: state.grindOptions.negative,
  };
  return getAvailableGrinds({ ...getSettings(), grind: groupOptions })
    .map((grind, index) => ({ grind, index }))
    .sort((a, b) => getVariantRank(a.grind) - getVariantRank(b.grind) || a.index - b.index)
    .map((entry) => entry.grind);
}

/** Uses several columns when the list is taller than the screen (as many as the width allows). */
function layoutPopupColumns() {
  const listWidth = Math.min(window.innerWidth - 32, 640) - 36;
  const maxColumns = Math.max(1, Math.floor(listWidth / POPUP_MIN_COLUMN_WIDTH_PX));
  const rowsPerColumn = Math.max(4, Math.floor((window.innerHeight * 0.88 - 110) / POPUP_ROW_HEIGHT_PX));
  const neededColumns = Math.max(1, Math.ceil(popupList.children.length / rowsPerColumn));
  popupList.style.columnCount = Math.min(maxColumns, neededColumns);
}

/** Fills and opens the popup. `items` are { text, note? } entries. */
function showPopup(title, info, items) {
  popupTitle.textContent = title;
  popupInfo.textContent = info;
  popupList.innerHTML = '';
  items.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = entry.text;
    if (entry.note) {
      const note = document.createElement('small');
      note.textContent = entry.note;
      item.appendChild(note);
    }
    popupList.appendChild(item);
  });

  grindPopup.hidden = false;
  pressStartedOnBackdrop = false;
  layoutPopupColumns();
  popupCloseButton.focus();
  try { if (navigator.vibrate) navigator.vibrate(25); } catch (error) { /* vibration is optional */ }
}

/** Popup of a main Grind checkbox (Basic, Exotic, Topside): its grinds. */
function openGrindPopup(groupName) {
  const grinds = getGrindsOfGroup(groupName);
  const variantNames = [];
  if (grinds.some((grind) => grind.isSwitch)) variantNames.push('switch');
  if (grinds.some((grind) => grind.isNegative)) variantNames.push('negative');

  showPopup(
    `${MAIN_GROUP_LABELS[groupName]} grinds`,
    `${grinds.length} grinds` + (variantNames.length ? ` · regular + ${variantNames.join(' / ')} variants` : ' · regular grinds'),
    grinds.map((grind) => ({ text: grind.name })));
}

/** Notes shown next to a value in a popup: the conditions under which the value is used. */
function describeValueConditions(value) {
  const notes = [];
  if (value.needsBackside === true) notes.push('grinds with Backside');
  if (value.needsBackside === false) notes.push('grinds without Backside');
  if (value.soulStall === 'front') notes.push('Soul grinds: after a face front stall');
  if (value.soulStall === 'back') notes.push('Soul grinds: after a face back stall');
  return notes.join(' · ');
}

/**
 * Popup of a Before or After checkbox: the values it adds and the grinds they can be used with.
 * @param positionLabel 'Before' or 'After'
 * @param valueGroups   BEFORE_VALUE_GROUPS or AFTER_VALUE_GROUPS
 * @param key           key of the checkbox, for example 'spin270'
 */
function openValuePopup(positionLabel, valueGroups, key) {
  const valueGroup = valueGroups.find((group) => group.key === key);
  const grindGroups = new Set();
  valueGroup.values.forEach((value) => (value.grindGroups || ['soul', 'groove']).forEach((group) => grindGroups.add(group)));
  const scope = grindGroups.size === 2 ? 'Soul and Groove grinds'
    : (grindGroups.has('soul') ? 'Soul grinds only' : 'Groove grinds only');

  showPopup(
    `${positionLabel}: ${valueGroup.label}`,
    `${valueGroup.values.length} values · ${scope}`,
    valueGroup.values.map((value) => ({ text: formatValues([value.text])[0], note: describeValueConditions(value) })));
}

function closeGrindPopup() {
  grindPopup.hidden = true;
}

// A tap on the dark background closes the popup. The press must also START there, so the finger
// that opened the popup with a long press cannot close it again when it is lifted.
grindPopup.addEventListener('pointerdown', (event) => { pressStartedOnBackdrop = event.target === grindPopup; });
grindPopup.addEventListener('click', (event) => {
  if (event.target === grindPopup && pressStartedOnBackdrop) closeGrindPopup();
  pressStartedOnBackdrop = false;
});
popupCloseButton.addEventListener('click', closeGrindPopup);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !grindPopup.hidden) closeGrindPopup();
});
window.addEventListener('resize', () => { if (!grindPopup.hidden) layoutPopupColumns(); });

/** True on phones and tablets: touch screens use touch events (pointer events can be cancelled by a long press). */
const SUPPORTS_TOUCH_EVENTS = 'ontouchstart' in window;

/**
 * Makes a checkbox chip open a popup (the checkbox state never changes):
 *  - touch screen: hold for 1 second;
 *  - mouse: right-click, or hold the button for 1 second.
 * The popup only opens while the checkbox is checked. The events are attached to the whole chip,
 * so a press anywhere on it counts.
 */
function setupPopupTrigger(chip, openPopup) {
  const input = chip.querySelector('input');
  let timerId = null;
  let startX = 0;
  let startY = 0;
  let longPressFired = false;
  let lastPointerType = 'mouse';

  const cancelHold = () => {
    clearTimeout(timerId);
    timerId = null;
    chip.classList.remove('holding');
  };

  /** Starts the long-press timer (LONG_PRESS_MS); it only runs for a checked checkbox. */
  const startHold = (x, y) => {
    longPressFired = false;
    cancelHold();
    if (!input.checked) return;
    startX = x;
    startY = y;
    chip.classList.add('holding');
    timerId = setTimeout(() => {
      timerId = null;
      longPressFired = true;
      chip.classList.remove('holding');
      openPopup();
    }, LONG_PRESS_MS);
  };

  /** Cancels the hold when the finger or mouse moves too far. */
  const moveHold = (x, y) => {
    if (timerId && Math.hypot(x - startX, y - startY) > LONG_PRESS_MOVE_TOLERANCE_PX) cancelHold();
  };

  // Mouse and pen: pointer events (touch too, when the browser has no touch events).
  const ignoreTouchPointer = (event) => event.pointerType === 'touch' && SUPPORTS_TOUCH_EVENTS;
  chip.addEventListener('pointerdown', (event) => {
    lastPointerType = event.pointerType || 'mouse';
    if (ignoreTouchPointer(event)) return;
    if (event.button > 0) { longPressFired = false; return; }   // only the main button holds
    startHold(event.clientX, event.clientY);
  });
  chip.addEventListener('pointermove', (event) => { if (!ignoreTouchPointer(event)) moveHold(event.clientX, event.clientY); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => {
    chip.addEventListener(type, (event) => { if (!ignoreTouchPointer(event)) cancelHold(); });
  });

  // Touch screens: touch events keep working during a long press.
  chip.addEventListener('touchstart', (event) => {
    lastPointerType = 'touch';
    startHold(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });
  chip.addEventListener('touchmove', (event) => moveHold(event.touches[0].clientX, event.touches[0].clientY), { passive: true });
  chip.addEventListener('touchend', (event) => {
    cancelHold();
    if (longPressFired && event.cancelable) event.preventDefault();   // no click after a long press
  });
  chip.addEventListener('touchcancel', cancelHold);

  // A long press must not toggle the checkbox when the finger or button is released.
  chip.addEventListener('click', (event) => {
    if (longPressFired) {
      event.preventDefault();
      longPressFired = false;
    }
  });

  // Right-click with a mouse opens the popup instead of the browser menu.
  chip.addEventListener('contextmenu', (event) => {
    if (lastPointerType === 'mouse' && input.checked) {
      event.preventDefault();
      openPopup();
    } else if (timerId || longPressFired || lastPointerType === 'touch') {
      event.preventDefault();        // touch long press: no browser menu
    }
  });
  chip.addEventListener('selectstart', (event) => event.preventDefault());
  chip.addEventListener('dragstart', (event) => event.preventDefault());
}

// Main Grind checkboxes list their grinds, Before and After checkboxes list their values.
document.querySelectorAll('.chip.main').forEach((chip) => {
  const groupName = chip.querySelector('input').dataset.option;
  setupPopupTrigger(chip, () => openGrindPopup(groupName));
});
document.querySelectorAll('#opts input[data-before]').forEach((input) => {
  const key = input.dataset.before;
  setupPopupTrigger(input.closest('.chip'), () => openValuePopup('Before', BEFORE_VALUE_GROUPS, key));
});
document.querySelectorAll('#opts input[data-after]').forEach((input) => {
  const key = input.dataset.after;
  setupPopupTrigger(input.closest('.chip'), () => openValuePopup('After', AFTER_VALUE_GROUPS, key));
});

rollButton.addEventListener('click', rollDice);

/* Rules language switch (UA / ENG), remembered between visits */
const languageButtons = document.querySelectorAll('.seg button');

function setRulesLanguage(language) {
  languageButtons.forEach((button) => button.classList.toggle('on', button.dataset.l === language));
  document.getElementById('r-ua').hidden = language !== 'ua';
  document.getElementById('r-en').hidden = language !== 'en';
  document.querySelector('.rbody').scrollTop = 0;
  try { localStorage.setItem('blade-lang', language); } catch (error) { /* storage is optional */ }
}

languageButtons.forEach((button) => button.addEventListener('click', () => setRulesLanguage(button.dataset.l)));

let savedLanguage = 'ua';
try { savedLanguage = localStorage.getItem('blade-lang') || 'ua'; } catch (error) { /* storage is optional */ }
setRulesLanguage(savedLanguage === 'en' ? 'en' : 'ua');

/* Start with the Classic dice ready; the mode page is shown first. */
startGameMode('classic');

