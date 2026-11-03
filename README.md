# b.l.a.d.e. dice

A mobile-first web game for the BLADE inline skating game. Tap **b.l.a.d.e.** and 3D dice fall and show a trick
combination. The **Rules** tab has the rules in Ukrainian (UA) and English (ENG).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure: mode page, game page (dice, checkboxes, result), rules page, popup |
| `style.css` | Styles, light and dark theme |
| `script.js` | All game logic (commented, 9 sections) |
| `xgrind.png`, `hotdog.png` | Pictures of the two Easter egg effects |

Open `index.html` in a browser, or publish the folder with GitHub Pages.

## Modes

- **Classic** - two real six-sided dice with fixed words on the sides.
- **Custom** - three "slot-like" dice (Before, Grind, After). Every die shows one value from a list that depends on
  the checkboxes and on the rolled grind. The two visible side faces show the neighbouring values of the list.
- **Switch-up** and **Goat mode** - not available yet.

## Custom mode: how a combination is calculated

1. **Grind first.** A grind is picked at random from the grinds that the checkboxes allow. The same grind never
   comes up twice in a row (unless it is the only one available).
2. **Before value.** Picked at random from the values of the checked **Before** checkboxes that fit the grind.
3. **After value.** Picked at random from the values of the checked **After** checkboxes that fit the grind (and, for
   Soul grinds, the Before value - see below).
4. The result is shown only after the dice have landed. Changing a checkbox never changes the screen; it only decides
   what the **next** roll can use.

Every grind belongs to the **Soul** list or the **Groove** list (`SOUL_GRINDS`, `GROOVE_GRINDS` in `script.js`).
Names are matched case-insensitively and duplicates are removed. A grind with the word "backside" in its name is a
*backside* grind.

### Grind checkboxes

- **Main:** Basic, Exotic, Topside (shown bigger). Any of them can be checked together. They give the **regular**
  grinds of the checked groups (no switch or negative variants). Basic and Exotic follow `BASIC_GRINDS` /
  `EXOTIC_GRINDS`; a variant takes the category of its base name.
- **Additional:** Switch adds the switch variants, Negative adds the negative variants, both together also add the
  switch + negative variants. The regular grinds always stay. They are locked until a main checkbox is checked
  (Negative is also locked while Topside is the only main one, because there are no negative topside grinds).
- **Only the checked additional variants appear**, whatever the main checkboxes are (one, two or all three). For example Basic + Exotic + Topside + Switch gives the regular grinds and the switch variants, but no negative variants; with Switch and Negative both checked you get every grind (107).
- **Nothing checked:** only **Hot Dog** is available (Easter egg) and it fills every side of the Grind dice.

### Before checkboxes (dice 1)

| Checkbox | Values | Used with |
| --- | --- | --- |
| Basic | Forward, Zero spin | Soul and Groove grinds |
| 180 | Alleyoop, Truspin, Inspin 180, Outspin 180 | Soul grinds only |
| 270 | 270, Inspin 270 | Groove grinds with "backside" in the name |
| 270 | Truspin 270, Outspin 270 | Groove grinds without "backside" |
| 360 | 360 inspin, 360 outspin, Truspin 360, Alleyoop 360 | Soul grinds only |
| D&D | Darkside, Disaster | Soul and Groove grinds |

### After checkboxes (dice 3)

| Checkbox | Values | Used with |
| --- | --- | --- |
| Basic | Forward, Backward | Soul and Groove grinds (see the stall rule) |
| 180 | 180, 180 rewind | Soul grinds only |
| 270 | 270, 270 rewind | Groove grinds only |
| 360 | 360, 360 rewind | Soul grinds only |
| 450 | 450, 450 rewind | Groove grinds only |
| 540 | 540, 540 rewind | Soul grinds only |

**Stall rule (Soul grinds only):** with the After *Basic* checkbox, Forward is only used after a *face front stall*
(Before is Forward, 360 inspin, 360 outspin, Inspin 180, Outspin 180, Darkside or Disaster) and Backward only after a
*face back stall* (Alleyoop, Truspin, Zero spin, Truspin 360, Alleyoop 360). Groove grinds can use both. To change this
rule edit `soulStall` in `AFTER_VALUE_GROUPS`.

### Checkbox restrictions (Topside and Groove-only values)

Topside grinds are Soul grinds, so they can never use the values that exist only for Groove grinds: **Before 270**,
**After 270** and **After 450** (the groups are found automatically by `isGrooveOnlyGroup`). The checkboxes enforce this
(`enforceOptionRules`, `getLockReason`); a locked checkbox is greyed out and its tooltip tells why:

| Selection | Result |
| --- | --- |
| Topside is the **only** main Grind checkbox | Before 270, After 270 and After 450 are locked and unchecked |
| Only Groove-only values are checked (any of Before 270, After 270, After 450) and neither Basic nor Exotic is checked | Topside is locked |
| Basic, Exotic, Basic + Topside, Exotic + Topside or all three | Everything is available, because the dice can show Groove and Soul grinds |
| Topside + Basic/Exotic with Groove-only values checked, then Basic and Exotic are unchecked | The Groove-only values are unchecked (Topside is alone now) |

Switch and Negative stay locked until a main Grind checkbox is checked (Negative is also locked for Topside alone).

### Defaults and fallbacks

- No **Before** checkbox checked: the Before dice shows only **Forward**.
- No **After** checkbox checked: the After dice shows only **Forward**. With nothing checked at all the combination is
  therefore Forward / Hot Dog / Forward.
- Grinds that have no value for the checked Before / After checkboxes are left out (for example with only Before 270
  checked, only Groove grinds come up; with only After 180, only Soul grinds). A group without a checked checkbox does
  not limit the grinds.
- If no grind fits at all, the Grind selection is used as it is and the dice show Forward.

## Lists of values (popups)

Hold a **checked** checkbox for 1 second (touch screen or mouse button), or right-click it with a mouse, to open a popup
with its list. The checkbox stays checked.

- **Grind checkboxes (Basic, Exotic, Topside):** the grinds of the group, including the switch / negative variants that
  are currently checked (regular grinds first). The list uses several columns when the screen is short.
- **Before and After checkboxes:** the values, the grinds they can be used with and the conditions (backside, stall).
- Close with the X, the dark background or Esc.

## Easter egg pictures

- **X Grind** (or Switch X Grind) on the Grind dice: `xgrind.png` crosses the screen from right to left in 2 seconds.
- **Hot Dog** on the Grind dice: `hotdog.png` rises from the bottom in 2 seconds, stays 1 second and goes down in 2 seconds.

## Touch effects on the dice

Touch (or click) a die and it trembles. Drag it up or sideways and it follows your finger a little, then falls back
with small bounces. Dice cannot touch each other while moving sideways.

## Code overview (`script.js`)

1. **Constants** - geometry of the dice, timing, popup settings.
2. **Game data** - Classic dice texts, grind lists, category lists, Before / After value groups, stall lists.
3. **Combination logic** - `getAvailableGrinds`, `getBeforeValues`, `getAfterValues`, `collectValues`,
   `generateCombination`. These functions do not touch the page, so they are easy to test.
4. **DOM references and application state** - `state`, `getSettings`.
5. **Dice rendering** - creating the 3D cubes and writing a face set onto them (`applyFaceSet`).
6. **Rolling** - `rollDice`, `animateRoll`, `showResult`.
7. **Touch interaction** - tremble, pull and fall back.
8. **Visual effects** - the two Easter egg pictures.
9. **Navigation, popups, checkboxes, rules language** - `showView`, `setupPopupTrigger`, `openGrindPopup`,
   `openValuePopup`, `bindOptionCheckboxes`.
