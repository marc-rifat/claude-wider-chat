# Claude Wider Chat

A small Chrome extension that makes the chat area on [claude.ai](https://claude.ai) wider and lets you pick a different font for the whole UI.

By default, Claude's conversation column is fairly narrow. This extension lets you drag a slider to widen it anywhere from 40% to 98% of the screen. Your preferred width is saved automatically.

## How to Install

Since this isn't on the Chrome Web Store, you'll need to load it manually:

1. Download or clone this repository to a folder on your computer.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the folder containing this extension.
5. Visit [claude.ai](https://claude.ai) -- you should see a small control panel in the bottom-right corner.

## How to Use

- **Slider** -- Drag it left or right to adjust the chat width.
- **Font** -- Pick a typeface for the whole claude.ai UI: Inter, Lexend, Lora, Merriweather, or JetBrains Mono. Code blocks and math keep their own fonts. Choose Default to restore Claude's original look.
- **Reset** -- Click the Reset button to go back to the defaults (75% width, Default font).
- **Collapse** -- Click the arrow icon to hide the controls. Click it again to bring them back.

The panel fades out after a few seconds so it stays out of your way. Hover over it to bring it back.

Your width and font settings are remembered across sessions.

## Fonts

Bundled typefaces (Inter, Lexend, Lora, Merriweather, JetBrains Mono) are
distributed under the SIL Open Font License; see the license files in `fonts/`.
