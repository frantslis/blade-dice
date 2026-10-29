# b.l.a.d.e. dice

Mobile-first web game: tap **b.l.a.d.e.** and two 3D dice fall, showing a trick combination for the BLADE game. The **Mode** tab is the main page for choosing a game mode (Classic 2 dice and Custom (3 slot-like dice) are playable, the others are coming soon). The Mode/Game/Rules menu appears only after a mode is chosen. The **Rules** tab has the rules and dice lists in Ukrainian (UA) and English (ENG).

## Files
- `index.html` - page structure (Game and Rules tabs)
- `style.css` - styles, light and dark themes
- `script.js` - dice, animation and tab logic

## Run
Open `index.html` in a browser, or serve the folder (for example with GitHub Pages).

## Custom mode combinations
The Grind dice is rolled first. Each grind belongs to the Soul list or the Groove list, and that group decides which values the Before and After dice can show:

- **Soul grinds:** Before has 12 spin values. After depends on Before: a face front stall (Forward, 360 inspin, 360 outspin, inspin 180, outspin 180, darkside, disaster) gives Forward, 180, 360, rewinds and 540; a face back stall (Alleyoop, truspin, zero spin, truspin 360, alleyoop 360) gives the same list with Backward instead of Forward.
- **Groove grinds:** Before has Forward and Zero spin for every grind, 270 and Inspin 270 only for grinds with "backside" in the name, and Truspin 270 and Outspin 270 only for grinds without it. After has 6 values (Forward, Backward, 270, 450 and their rewinds).

The result is shown only after the dice have landed. Checkboxes under the menu add Switch, Negative and Topside grinds (a grind with several modifiers needs all of its checkboxes). All lists are at the top of `script.js`.

## Easter egg
In Custom mode, when X Grind (or Switch X Grind) lands on the Grind dice, `xgrind.png` slides across the screen from right to left in 2 seconds.

When a Hot Dog value lands on the Grind dice, `hotdog.png` rises from the bottom of the screen in 2 seconds, stays for 1 second and slides back down in 2 seconds.
