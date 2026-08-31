/**
 * Sizing and identity rules for the autofill suggestion list.
 *
 * Extracted as plain values so the rules that make the list TAPPABLE are
 * testable, rather than buried in a StyleSheet nobody exercises. The list only
 * began populating in 2026 after the organization source was repointed, so none
 * of this had ever been used in anger.
 */

/** iOS HIG and WCAG 2.5.5 both put the minimum touch target at 44. */
export const MIN_TOUCH_TARGET = 44;

/**
 * One suggestion row.
 *
 * The old row was fontSize 15 + padding 5 + margin 2 — about 29px, well under
 * the floor, and genuinely hard to hit one-handed. That is how a promotora
 * signs up: standing, one thumb, often in sunlight.
 */
export const SUGGESTION_ROW_HEIGHT = MIN_TOUCH_TARGET;

/** How many rows the list may show before it starts scrolling. */
export const MAX_VISIBLE_SUGGESTIONS = 5;

/**
 * Identity for a suggestion.
 *
 * Suggestions are plain strings. The previous extractor read `item.key`, which
 * is `undefined` on a string, so every row shared the same undefined key —
 * React can then mis-recycle rows and a tap lands on the wrong organization.
 */
export const keyForSuggestion = (item) => (typeof item === "string" ? item : "");

/**
 * The list's height, in whole rows.
 *
 * Whole rows on purpose: a half-visible row reads as the end of the list, so
 * someone stops scrolling and never sees their organization. Replaces a
 * hard-coded 80px — about two and a half rows — chosen when the list never
 * populated at all, against 36 organizations in production today.
 */
export const listHeightFor = (count) => {
  const rows = Math.min(Math.max(count, 0), MAX_VISIBLE_SUGGESTIONS);
  return rows * SUGGESTION_ROW_HEIGHT;
};

/**
 * The suggestions actually rendered.
 *
 * Capped, because the list is drawn as plain views rather than a FlatList:
 * nesting a VirtualizedList inside the signup form's ScrollView at the same
 * orientation is what React Native warns "can break windowing and other
 * functionality" — and touch delivery is part of what breaks, which is why a
 * plainly visible suggestion refused to be tapped.
 *
 * Five rows needs no virtualisation, and typing narrows the list further, which
 * is how an autocomplete is meant to be used.
 */
export const visibleSuggestions = (items) =>
  (Array.isArray(items) ? items : []).slice(0, MAX_VISIBLE_SUGGESTIONS);
