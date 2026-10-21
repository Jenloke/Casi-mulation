# UI: the shared design system

Every browser app styles itself with `@casino/ui` (`packages/ui`): [shadcn/ui](https://ui.shadcn.com)
components on [Base UI](https://base-ui.com) primitives in shadcn's Nova style, Tailwind CSS v4,
and one theme. Apps write no CSS of their own. They compose these components and style with
Tailwind utilities on the theme's semantic tokens.

## What's in the package

| Path | What | Edited by |
| --- | --- | --- |
| `src/components/*.tsx` | shadcn components: button, card, table, tabs, field, item, … | the shadcn CLI only |
| `src/lib/utils.ts`, `src/hooks/` | `cn()` and any hooks the components need | the shadcn CLI only |
| `src/styles/globals.css` | Tailwind, the theme tokens (light and dark), base styles | hand |
| `src/theme/` | `ThemeProvider` (light / dark / system) and `ModeToggle` | hand |

Import paths: `@casino/ui/components/<name>`, `@casino/ui/lib/utils`, `@casino/ui/theme/<Name>`,
and the stylesheet `@casino/ui/globals.css`.

## Using it in an app

```tsx
import { Button } from '@casino/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@casino/ui/components/card';
import { cn } from '@casino/ui/lib/utils';
import { CoinsIcon } from 'lucide-react';
```

- Import `@casino/ui/globals.css` once, in the app's `main.tsx`.
- Style with semantic tokens: `bg-card`, `text-muted-foreground`, `border-border`,
  `text-primary`. No hex colors and no `dark:` color overrides in app code; the tokens already
  change with the theme. The Phaser canvas is the one exception, since it draws with numbers.
- Icons come from `lucide-react`. Add it to the app's own dependencies (pnpm is strict).
- `CardTitle` renders a `div`, so keep the heading inside it: `<CardTitle><h2>Shop</h2></CardTitle>`.
- A choice between options is a row of `Button`s with `aria-pressed` and
  `variant={selected ? 'default' : 'outline'}` (speeds, bet options).
- In the game, avoid components that move focus with the arrow keys (`ToggleGroup`,
  `RadioGroup`, `Tabs`). They cancel the key event and Phaser then ignores it, so the character
  stops walking while one has focus. The dashboard has no such conflict and uses `Tabs`.

## Tokens

| Tailwind name | Use |
| --- | --- |
| `background`, `foreground` | page and default text |
| `card`, `popover` (and `-foreground`) | surfaces |
| `primary` (and `-foreground`) | casino gold: main actions, the selected choice; `ring` matches it |
| `secondary`, `muted`, `accent` | low-emphasis fills and hover washes |
| `muted-foreground` | secondary text |
| `destructive`, `success` | errors and losses, wins. Pair with an icon or words, never color alone |
| `border`, `input`, `ring` | hairlines, form borders, focus rings |
| `sidebar*` | the game's side panel |
| `chart-1` … `chart-8` | categorical series, in fixed order (a game keeps its registry slot) |
| `chart-grid`, `chart-axis`, `chart-muted`, `chart-deemphasis` | chart chrome: gridlines, baselines, tick labels, the gray "other" series |

The neutrals, chart colors and status steps are the reference data-viz palette, with light and
dark each chosen rather than inverted. The gold is darker in light mode (`#8a6514`) than in dark
mode (`#e6b84a`) so it passes contrast both as a fill and as text. Charts render on `card`, and
their series colors were validated against exactly that surface: if you change `card` or any
`chart-*` value, re-run the data-viz palette validator for both modes.

## Dark mode

Dark mode is the `.dark` class on `<html>`, which also drives the `dark:` variant.

- The game is always dark: `<html class="dark">` in `apps/game/index.html`.
- The dashboard follows the OS by default. `ThemeProvider` keeps `.dark` in sync, `ModeToggle`
  offers Light / Dark / System (stored in `localStorage` as `casino-theme`), and a small inline
  script in `index.html` applies the stored choice before the first paint.

A new app picks one of those two setups.

## Adding a shadcn component

```sh
pnpm ui:add dialog            # several at once: pnpm ui:add dialog sheet tooltip
pnpm ui:add dialog --dry-run  # preview the files and dependencies first
```

`ui:add` runs the shadcn CLI pinned in `packages/ui` from inside that package, so the files and
their npm dependencies land there and every app can use them. Then import from
`@casino/ui/components/dialog`.

- Don't edit files in `components/`, `hooks/` or `lib/` by hand; compose them in the app
  instead. They stay exactly as the CLI writes them (Biome lints them but doesn't format them),
  so `pnpm ui:add <name> --diff` shows only real upstream changes and `--overwrite` updates cleanly.
- Never run `shadcn init` or `shadcn apply` here: they replace the hand-tuned theme in
  `globals.css`. Change the theme by editing its tokens.
- Each app also has a `components.json` pointing at `@casino/ui`, so the CLI and editor tooling
  know where components live. Still prefer `pnpm ui:add`; see the Windows notes below.

## Adding an app

1. Dependencies: `@casino/ui` (`workspace:*`) and `lucide-react`; dev dependencies `tailwindcss`
   and `@tailwindcss/vite`, at the versions the other apps use.
2. `vite.config.ts`: add `tailwindcss()` to `plugins`.
3. `main.tsx`: `import '@casino/ui/globals.css';` and, if the app follows the OS theme, wrap it
   in `ThemeProvider`.
4. Copy `components.json` from `apps/dashboard`.
5. Pick a dark-mode setup from above.

Tailwind finds class names in the app's own files by itself, and in `packages/ui` through the
`@source` line in `globals.css`.

## Windows notes (shadcn CLI 4.22)

Two CLI bugs hit Windows paths that contain a dot (`C:\Users\first.last\...`). Keep both
workarounds until shadcn fixes them:

- `packages/ui/package.json` exports `./components`, `./hooks` and `./lib` as plain directories.
  Nothing imports those entries. They give the CLI an exact alias match, which skips the code
  path that cuts the resolved path off at its first dot.
- The CLI compares Windows and POSIX separators when it looks for the workspace that owns an
  alias, never finds `packages/ui`, and would install dependencies into the app it was run from.
  That's why `pnpm ui:add` runs it inside `packages/ui`.
