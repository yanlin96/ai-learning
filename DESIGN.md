---
name: CPA Tools workspace
description: Compact tools workbench with navy navigation and white working surfaces.
colors:
  brand: "#00539d"
  action-hover: "#003f78"
  workspace-navy: "#071226"
  nav-surface: "#10213a"
  navy: "#090d46"
  paper: "#ffffff"
  cyan-200: "oklch(91.7% 0.08 205.041)"
  blue-50: "oklch(97% 0.014 254.604)"
  slate-50: "oklch(98.4% 0.003 247.858)"
  slate-200: "oklch(92.9% 0.013 255.508)"
  slate-300: "oklch(86.9% 0.022 252.894)"
  slate-500: "oklch(55.4% 0.046 257.417)"
  slate-600: "oklch(44.6% 0.043 257.281)"
  slate-700: "oklch(37.2% 0.044 257.287)"
  amber-50: "oklch(98.7% 0.022 95.277)"
  amber-800: "oklch(47.3% 0.137 46.201)"
  red-50: "oklch(97.1% 0.013 17.38)"
  red-800: "oklch(44.4% 0.177 26.899)"
  teal-700: "oklch(51.1% 0.096 186.391)"
typography:
  headline:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "clamp(28px, 2.4vw, 36px)"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-.02em"
  title:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  section:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  field:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: "1.25rem"
  chip:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1rem"
  metadata:
    fontFamily: 'Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    typography: "{typography.field}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    width: "100%"
  nav-tool:
    textColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "10px 12px"
  notice:
    backgroundColor: "{colors.blue-50}"
    textColor: "{colors.brand}"
    typography: "{typography.chip}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  notice-warning:
    backgroundColor: "{colors.amber-50}"
    textColor: "{colors.amber-800}"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "20px"
  panel-sm:
    padding: "24px"
---

# Design System: CPA Tools workspace

## Overview

**Creative North Star: "CPA Tools workspace"**

The CPA Tools workspace is a compact tools workbench: navy navigation frames white working surfaces, with blue actions and cyan navigation accents. The refinement preserves the incumbent identity and Tailwind implementation rather than introducing a new visual concept.

Hierarchy comes from compact task headings, readable descriptions, single-border panels and explicit control states. The shared shell supports finding a tool and inspecting its evidence without promotional scale or decorative motion. Native disclosures contain secondary configuration, while embedded evidence uses dividers rather than redundant enclosing panels.

This is a source-grounded record of the current shared system, not a claim of completed visual or accessibility verification. Evidence: `docs/PRODUCT.md`, `docs/WORKSPACE-UI.md`, `app/globals.css`, `app/page-template.tsx`, `app/tool-ui.tsx`, `app/site-header.tsx`, `app/workspace-assistant.tsx`, `app/daily-brief.tsx`, `app/smoke-test-form.tsx`, `app/smoke-url-results.tsx`, `app/smoke-history-list.tsx`, `app/train-status-search.tsx`, and the installed Tailwind theme. Existing domain report CSS has not been migrated; its old type sizes, colors and decoration are not the shared workspace specification.

**Key Characteristics:**

- Navy navigation and white content.
- Compact task hierarchy with the existing sans-serif stack.
- Single-border panels and generous control targets.
- Explicit active, pending and unavailable states.

## Colors

The established palette separates dark navigation, blue actions and light neutral working surfaces. Frontmatter values are normative; names describe existing source roles, not a new brand vocabulary.

### Primary

- **Brand blue** (`brand`): primary actions, field focus, heading icons and official-source links. Matches the existing global brand variable.
- **Action hover blue** (`action-hover`): the shared primary action's darker hover state; not the older global brand-dark value.
- **Workspace navy** (`workspace-navy`): top navigation and desktop/mobile toolbox background.
- **Heading navy** (`navy`): titles and field text; distinct from the shell navy.
- **Navigation surface** (`nav-surface`): icon tiles and account surfaces inside the navy shell.

### Secondary

- **Cyan navigation accent** (`cyan-200`): navigation marks, icon color and keyboard outlines. Active tool links use this color at 15% for the fill and 40% for the border.
- **Pale blue** (`blue-50`): notice chips, selected scope presets and informational feedback.
- **Amber feedback** (`amber-50`, `amber-800`): service-change chips and warning text.
- **Red feedback** (`red-50`, `red-800`): form-error background and text.
- **Teal feedback** (`teal-700`): clear train-status icon. Semantic report outcomes retain their own evidenced Tailwind tone variants; this is not a replacement report palette.

### Neutral

- **White paper** (`paper`): body, forms and the entire daily-brief row, including outer gutters.
- **Light slate** (`slate-50`): empty-state background, disabled fields and gentle content hover.
- **Panel divider** (`slate-200`): panel outlines, heading rules and result dividers.
- **Field border / dark-shell detail** (`slate-300`): field outlines and secondary navigation copy.
- **Placeholder slate** (`slate-500`): placeholders, search icons and trailing chevrons.
- **Secondary slate** (`slate-600`): descriptions, helper text and timestamps.
- **Body slate** (`slate-700`): shared page content and supporting metadata.

**The Shell and Paper Rule.** Keep navy on navigation and white on working content, including the daily-brief gutters.

Sidecar ramps are preview metadata only: existing Tailwind scales are reused; ramps for standalone hex colors are synthesized for the panel, not authorized new UI colors.

## Typography

**Headline and Body Font:** Avenir, "Avenir Next", "Nunito Sans", Helvetica, Arial, sans-serif, from the existing `--sans` variable. Nunito Sans is imported at weights 400, 600, 700 and 800; Avenir availability depends on the device. No new display face or font pairing is introduced.

**Character:** One established sans-serif stack, with weight and scale supplying hierarchy. There is no separate canonical display role: the shared workbench heading supersedes the older hero sizing.

### Hierarchy

- **Headline:** compact page title with tight leading, balanced wrapping and slightly tightened tracking.
- **Title:** result and empty-state titles.
- **Section:** form section titles and result-item headings.
- **Body:** descriptions and helper copy, commonly with a 24px line box.
- **Field:** full-size input text; multi-line priority text uses the body size and leading.
- **Label:** bold sentence-case labels and primary-action copy. Navigation titles use extra-bold weight and the same small size.
- **Metadata:** daily-brief labels, source attribution and timestamps. A timestamp may use the body line box.

**The Compact Heading Rule.** Use the shared page heading, not the legacy promotional hero ramp, for workspace tool pages.

The stack is established on body; native control font-family inheritance is not uniformly explicit because Tailwind preflight is not imported. That possible browser drift is not a separate sanctioned type system. The isolated previews explicitly bind the established stack.

## Layout

Shared content and top navigation are centered with a maximum width of 1080px. Content width subtracts 32px on small screens and 48px from the small breakpoint upward, giving 16px and 24px side gutters. Shared content starts with 24px top padding, increasing to 32px at the small breakpoint, and ends with 48px bottom padding.

The heading ends with one divider: 20px bottom padding and 24px space before the working surface. Description width is capped at 72ch; empty-state descriptions use 65ch and train detail uses 75ch. Action rows wrap instead of relying on fixed single-line placement.

Shared working panels generally use 20px internal padding, increasing to 24px at the small breakpoint; Metro search/status panels use a compact 16px mobile inset. The smoke form uses 16px grid gaps initially, increasing to 24px in its two-column 1.2:1 grid at the medium breakpoint. Scope presets remain a three-column row. On small screens, presets, the current-limit note and the primary action precede the collapsed advanced-options disclosure; at the medium breakpoint, that disclosure occupies the left column and scope/action controls the right. The smoke form's secondary heading is hidden below the small breakpoint. The daily brief stacks initially, splits into two equal columns at the small breakpoint and adds a separate attribution column at the large breakpoint.

URL-result explorer controls use a single-column mobile grid with full-width search and result filter, becoming a flexible search column plus an auto-sized filter at the small breakpoint. Both standalone and embedded explorers use 16px control-area padding; embedded history results omit a second full border and radius enclosure.

At the extra-large breakpoint, a fixed 252px desktop sidebar appears and global main padding reserves its width. Below that breakpoint, navigation uses a right toolbox drawer up to 410px wide, bounded by viewport width. The top bar is 64px high. Small-screen account/name reductions at 700px and 520px are local shell adaptations, not additional global grid breakpoints.

The assistant is a shell-level modal anchored above a 48px bottom-right launcher. Its panel is capped at 390px wide and 620px high, while remaining within 16px mobile gutters and the available dynamic viewport height. Conversation content scrolls inside the panel; the underlying workspace does not scroll while it is open.

The existing spacing scale is expressed in frontmatter; half-steps used by controls remain component-specific padding. The older shell's 1180px/1760px width rules are not the shared content model.

## Elevation & Depth

Working forms, result panels and the daily brief are flat: one border and tonal contrast establish separation without resting shadows. Navigation adds translucent layers on navy; the account popover, mobile drawer and assistant are elevated overlays. The account popover uses a soft navy shadow (`0 18px 46px rgba(9,13,70,.16)`); the account trigger has a smaller hover shadow (`0 5px 16px rgba(9,13,70,.07)`). The assistant uses a deeper soft navy shadow (`0 22px 60px rgba(7,18,38,.24)`) over a restrained dark backdrop. The global legacy shadow variable does not establish a shared panel-shadow rule.

**The Border Before Shadow Rule.** Use single borders for shared working panels; reserve overlay elevation for navigation surfaces.

Control color transitions use the installed Tailwind default (150ms, cubic-bezier(0.4, 0, 0.2, 1)). Shared primary actions and toolbox links suppress transitions under reduced motion; smoke and Metro loading indicators suppress animation. Reduced-motion support is not uniformly complete across the account shell or legacy CSS, so it is not claimed as a verified system-wide invariant.

## Shapes

Working panels and navigation links have restrained large corners (`xl`); inputs, actions and icon tiles use smaller corners (`lg`). Informational chips use modest corners (`md`). Account controls and avatars remain fully rounded; the account menu uses `2xl`. These existing exceptions do not turn all components into pills.

Single one-pixel borders separate surfaces. Source-supplied train-line colors stay data swatches, not brand primitives. Icons use the existing outlined SVG language, generally 16–24px; previews inline the SVG rather than requiring an icon package or substituting text glyphs.

## Components

### Buttons

Direct, compact task actions. Primary uses brand blue with white bold copy, the smaller control radius and shared horizontal/vertical padding. Minimum height is 48px. Hover darkens the fill; keyboard focus is a 2px brand-blue outline offset by 2px. Pending actions use a wait cursor and 60% opacity, with explicit pending text. No transform is added. Content source/action links have at least 44px height and visible underlining.

Scope presets are selection buttons, not status chips: they use a one-pixel field border, 64px minimum height and an `aria-pressed` state. Selection changes border/text to brand blue and fill to pale blue; unselected hover uses light slate. They keep the same keyboard outline.

The smoke form keeps Quick, Standard and Full presets, its current-limit/time-budget note and full-width primary action outside the advanced-options disclosure. The default limit is 30 pages. Native `details`/`summary`, labelled "Priority URLs & custom limit", starts collapsed and contains the numeric limit (1–100) and priority-URL textarea. Its summary has a 44px minimum height, smaller control corners and a visible brand-blue keyboard outline. This disclosure is an observed local configuration pattern, not a requirement to hide every form's secondary fields.

### Chips

Short, noninteractive evidence labels. Notice and Service change use pale blue/brand blue or pale amber/amber text respectively, with compact padding, modest corners and bold extra-small copy. They are sentence case, not marketing kickers. Their text names the evidence category; color is supplemental.

### Cards / Containers

White working panels with the panel radius, one divider-color border and responsive padding. Train results use internal dividers instead of nested card stacks. History empty states use light slate with 24px horizontal and 40px vertical padding, a title, description and a shared primary link back to the task. Passive panels do not acquire invented hover elevation or keyboard focusability.

Standalone URL results retain a rounded, single-border white enclosure. Inside expanded smoke-history runs, the explorer's `embedded` variant uses only a top divider and white background; the parent history card supplies the outer enclosure. Search and filtering are shared across both variants, with 20-row pagination and a bounded scrolling result body.

When Metro status is unavailable and no longer loading, "Check official service updates" appears directly below the status header, before recovery guidance. It uses the established blue underlined source-link treatment and a 44px minimum target. Available status keeps its official-source link after the evidence; the unavailable state does not duplicate that trailing link.

### Inputs / Fields

White, full-width fields with a one-pixel field border, smaller control corners, heading-navy text and slate placeholders. Minimum height is 48px. Focus changes the border to brand blue and adds the offset outline. Disabled fields use light slate, placeholder-tone text and a not-allowed cursor. Labels and helper text remain associated with controls.

History search adds an 18px outlined search icon and 40px left input padding. Metro search puts the icon and border on a wrapper: focus is shown on that wrapper, while the inner input has no border. The popup is a bordered white panel positioned 8px below the control, with bounded vertical scrolling. Existing listbox semantics are recorded as implementation evidence, not certification of complete combobox keyboard behavior.

### Navigation

Navy with white tool titles and light-slate supporting descriptions. Tool rows have a 56px minimum height, 12px horizontal padding, larger corners and a transparent border at rest. Hover uses white at 10%; active links use the cyan fill/border and `aria-current="page"`. Keyboard focus uses the cyan 2px offset outline. Groups are divided by translucent white rules and use native disclosure controls.

Desktop sidebar and mobile toolbox share the same tool content. The drawer contains keyboard focus, closes on Escape or navigation, restores trigger focus and locks background scrolling. Account and sign-out controls stay in the top shell rather than being duplicated inside tools.

### Daily brief

A flat white bordered panel with two compact icon-and-text summaries and weather attribution. Icon tiles are 36px; the train link has a 44px minimum target and a brand-blue keyboard outline. Weather and train failures retain explicit unavailable copy independently. Loading uses placeholders and a status label; it does not claim successful service. The old daily-brief shimmer and raised-card CSS are not the current component design.

### Workspace assistant

The assistant extends the established shell rather than introducing a separate identity: workspace navy header and launcher, white conversation surface, brand-blue user messages/actions and cyan icon tile. Suggested commands use compact bordered buttons; completed tool results open in a dedicated authenticated report page rather than expanding inside chat.

While open, the panel is an accessible modal dialog with a backdrop, contained Tab order, Escape and explicit close actions, body scroll lock and focus restoration to the launcher. The launcher leaves the tab order until the dialog closes. The message log announces additions politely, and the composer retains the shared field/focus treatment.

Submitting a message immediately adds the user's message, then shows labelled thinking and running states. A supported check runs through its existing protected API while the conversation remains open. Completion adds one prominent, keyboard-focusable `/reports/[id]` action to the assistant response; navigation waits for the user's click. The link uses Next.js client navigation, closes the panel so the report is immediately usable, and preserves the shell-level conversation for reopening. The dynamic page uses the shared page heading and the normal report component in result-only mode; it does not duplicate the tool form or turn the conversation into a long report. Reports are current-tab-only, and the empty state explains when local data is missing. Status animation uses the existing loading icon and is removed under reduced-motion preferences; text preserves every state when motion is reduced.

## Do's and Don'ts

### Do:

- Do preserve navy navigation, white working surfaces and cyan navigation accents.
- Do reuse shared page headings, fields and primary actions through Tailwind utilities.
- Do keep evidence, coverage limits and unavailable states visible in plain language.
- Do use one border on shared panels and visible offset keyboard outlines on controls.
- Do preserve the established sans-serif stack and existing compact type hierarchy.

### Don't:

- Don't invent a new identity, display face or promotional hero for the workbench.
- Don't turn legacy report CSS, uppercase kickers or tiny report labels into shared design rules.
- Don't flatten warning, error and unavailable evidence into a successful state.
- Don't use data-specific train colors or operator-local color deviations as workspace brand tokens.
- Don't claim report CSS migration or uniformly verified accessibility and reduced-motion coverage.
