Explain the topic below like I'm someone who knows nothing about it,
using a self-contained HTML page with big pictures and very few words.

Topic: $ARGUMENTS

Rules:
- Pictures do the explaining. Inline SVG only — no external images, no CDN, no JS libraries.
- Very few words. Short labels, not sentences. A 5-year-old's vocabulary.
- 4-7 steps/panels max, top to bottom, in the order things actually happen.
- Show the real mechanism, not a vague metaphor. If the thing has parts that
  talk to each other, draw the parts and draw the arrows between them.
- Label the arrows with what is being passed, not with jargon.
- One HTML file, everything inlined (CSS in <style>, SVG in the markup).
- Responsive, readable in both light and dark (define colors as CSS variables
  and override them under `@media (prefers-color-scheme: dark)`).

Then:
1. Write the file to `./eli5-<short-slug>.html` (or the path the user named).
2. Open it: `start <file>` on Windows, `open` on macOS, `xdg-open` on Linux.
3. Reply with just the file path and a one-line summary of what the page shows.
