# thinking.haus editorial components design QA

## Governing color reference

Thinkinghaus palette v0.6 is the governing color system for public-site work. The canonical source is [`mxpf/thinkinghaus-palette`](https://github.com/mxpf/thinkinghaus-palette) at commit `7ac354fa15ac0798db84ed4291215d8a44f35947`; its `thinkinghaus.figma.json` is the authoritative Figma variable export at that same commit. The public reference pages are [`keeping.haus/thinkinghaus-palette`](https://keeping.haus/thinkinghaus-palette/) and [`keeping.haus/thinkinghaus-ui`](https://keeping.haus/thinkinghaus-ui/). Production consumes the deliberately pinned local copies in [`app/thinkinghaus-palette.css`](app/thinkinghaus-palette.css) and [`app/thinkinghaus-palette.tokens.json`](app/thinkinghaus-palette.tokens.json), never a runtime GitHub dependency.

The public site currently supports the dark theme only. Its v0.6 foundation is charcoal/neutral-1000 `#1C1811`, ivory/neutral-0 `#F4EDDF`, body/neutral-400 `#AFADA6`, and taupe/neutral-500 `#9C9281`. The complete gently warmed neutral scale and every color family are pinned locally; v0.6 changes only the semantic link role from v0.5.

Use semantic roles rather than scale values in components:

- Primary, body, muted, and decorative faint text use `--th-text`, `--th-text-body`, `--th-text-muted`, and `--th-text-faint`. Faint is decorative only and does not meet normal-text contrast.
- Standard prose/content links use the body-colored `--th-link` (`#AFADA6` dark; `#474135` light) and remain underlined, including visited links. Hover may use primary text while retaining the underline. Navigation and button-shaped controls may retain their existing contextual hierarchy; patina remains an accent rather than the default link color.
- Keyboard focus uses ochre `--th-focus` (`#B79142` dark; `#785800` light), independently of hover color.
- Selection uses the paired `--th-selection-bg` and `--th-selection-text` roles.
- Success uses moss `#97AA74` dark / `#506624` light; warning uses ochre `#B79142` / `#785800`; error uses clay `#D2836C` / `#9B4127`; info uses slate `#8CA3C0` / `#446081`.
- Solid fills must use the dedicated `--th-*-fill` and `--th-on-*-fill` pairs. Text accents are not arbitrary button backgrounds.
- Disabled controls, selected controls, and feedback components are not present in the current public interface. If introduced, they must use the pinned semantic roles and be contrast-checked in every supported theme.

The v0.6 reference retains all 106 functional contrast passes. Against dark charcoal, primary text is 15.17:1, body/link 7.87:1, muted 5.76:1, focus/warning 6.01:1, success 7.00:1, and error 6.06:1. The application must not use `--th-text-faint` for readable text; its 3.93:1 dark ratio remains intentionally decorative.

**Source visual truth**

- H2 reference: the live portfolio evidence-label treatment at `https://maxpfennig.haus/projects/johnson-johnson/`.
- Quote reference: `/Users/mxpf/.codex/generated_images/019fcfa5-b5f6-7883-8a11-3980bcb7a11c/exec-836ac9e2-6762-41ab-b35e-17216338c11f.png`, the selected Continuous Rail direction, 1672 × 941 px.

**Implementation evidence**

- H2 desktop: `/tmp/thinkinghaus-h2-12-grid-full.jpg`, 1280 × 720 px at a 1280 × 720 CSS viewport and 1× density.
- H2 mobile: `/tmp/thinkinghaus-h2-12-grid-mobile.jpg`, 390 × 844 px at a 390 × 844 CSS viewport and 1× density.
- Quote desktop: `/tmp/thinkinghaus-quote-implementation.png`, 1280 × 720 px at a 1280 × 720 CSS viewport and 1× density.
- Combined quote comparison: `/tmp/thinkinghaus-quote-comparison.png`, 1280 × 773 px.
- State: a temporary draft article containing representative paragraphs and one Markdown block quote. The temporary content was removed after capture.

**Full-view comparison evidence**

The selected quote visual and browser-rendered implementation were placed together in `/tmp/thinkinghaus-quote-comparison.png`. The source was normalized to the same displayed width and aspect ratio as the implementation. The live implementation preserves thinking.haus’s current page shell while matching the selected component: a quiet full-height rail, unchanged body typography, and restrained separation from surrounding paragraphs.

The mock predates the live article's visible author line and full thinking.haus wordmark. Those page-shell differences are expected and outside the quote component; the focused region provides the fidelity comparison.

**Focused-region comparison evidence**

The lower half of `/tmp/thinkinghaus-quote-comparison.png` compares the quotation region at equal displayed scale. Computed browser styles confirmed:

- 16px Untitled Sans Regular, weight 400, with 24px line height.
- 24px text inset from the quote origin.
- 36px top and bottom margins.
- A 1px full-height rail using the semantic muted role, taupe/neutral-500 `#9C9281` in the current dark theme.
- No quotation marks, italic, oversized type, fill, card, citation, or decorative treatment.

The H2 component retains 12px type, 24px line height, 48px above, and 24px below. Both editorial components use spacing divisible by 12.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: the quote deliberately inherits the article's 16/24 Light body style; the H2 retains its 12px Regular label hierarchy.
- Spacing and layout rhythm: 24px inset and 36px vertical margins keep the quote on the 12px grid without changing the reading measure.
- Colors and tokens: the rail uses the established muted token against the warm dark surface; body text remains the normal foreground color.
- Image quality and asset fidelity: neither editorial component contains an image asset. The rail is a semantic divider attached to a native blockquote, not decorative media.
- Copy and content: Markdown `>` renders as a semantic `<blockquote>`; inline links and italics remain available inside the quotation; RSS preserves the blockquote structure.
- Responsiveness and accessibility: the quote stays within the article column, keeps semantic HTML, and adds no horizontal overflow or interaction burden.
- Browser console errors checked on the public sample: none.

**Comparison history**

- H2: the initial 18px reference line height was changed to 24px to honor thinking.haus’s 12px grid; post-fix desktop and mobile evidence passed.
- Quote: the first coded pass matched the selected Continuous Rail component with no actionable P0, P1, or P2 differences, so no visual correction loop was required.

**Primary interactions tested**

- Markdown `##` to semantic H2.
- Markdown `>` to semantic blockquote.
- Inline Markdown inside both editorial blocks.
- Semantic RSS output for headings and quotations.
- Public build, typecheck, lint, and automated HTML tests.

**Implementation checklist**

- [x] Portfolio-derived H2 treatment.
- [x] Selected full-height quote rail.
- [x] 12px-grid spacing.
- [x] Semantic Markdown and RSS output.
- [x] Browser-rendered comparison and console check.
- [x] Automated tests and production build.

**Follow-up polish**

- Keep block quotes concise enough that the rail remains an interruption rather than a parallel text column.

final result: passed
