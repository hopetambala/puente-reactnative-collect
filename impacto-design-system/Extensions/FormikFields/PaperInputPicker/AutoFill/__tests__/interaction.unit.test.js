import {
  FIELD_HEADROOM,
  keyForSuggestion,
  listHeightFor,
  MAX_VISIBLE_SUGGESTIONS,
  MIN_TOUCH_TARGET,
  scrollTargetFor,
  SUGGESTION_ROW_HEIGHT,
  visibleSuggestions,
} from "@app/impacto-design-system/Extensions/FormikFields/PaperInputPicker/AutoFill/interaction";

describe("keyForSuggestion", () => {
  it("keys a suggestion by the string itself", () => {
    // The list holds plain strings - organization names. The old
    // keyExtractor read `item.key`, which is undefined on a string, so EVERY
    // row was keyed undefined. React can then mis-recycle rows, and a tap
    // lands on the wrong organization.
    expect(keyForSuggestion("Puente")).toEqual("Puente");
  });

  it("never returns undefined, even for a blank or missing entry", () => {
    expect(keyForSuggestion("")).toEqual("");
    expect(keyForSuggestion(undefined)).toEqual("");
  });
});

describe("suggestion row sizing", () => {
  it("meets the 44pt minimum touch target", () => {
    // iOS HIG and WCAG 2.5.5 both put the floor at 44. The row was
    // fontSize 15 + padding 5 + margin 2, about 29px - genuinely hard to hit
    // one-handed, which is how a promotora signs up.
    expect(SUGGESTION_ROW_HEIGHT).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(MIN_TOUCH_TARGET).toEqual(44);
  });
});

describe("listHeightFor", () => {
  it("grows with the number of suggestions rather than a fixed keyhole", () => {
    // It was a hard-coded 80px - about two and a half rows - decided when the
    // list never populated at all. There are 36 organizations in production.
    expect(listHeightFor(1)).toBeLessThan(listHeightFor(4));
  });

  it("shows a whole number of rows, so none is clipped mid-height", () => {
    // A half-visible row reads as the end of the list.
    expect(listHeightFor(2) % SUGGESTION_ROW_HEIGHT).toEqual(0);
  });

  it("caps the list so it cannot swallow the screen", () => {
    expect(listHeightFor(50)).toEqual(listHeightFor(5));
  });

  it("collapses to nothing when there is nothing to show", () => {
    expect(listHeightFor(0)).toEqual(0);
  });
});

describe("visibleSuggestions", () => {
  it("caps the rendered rows so the list cannot swallow the screen", () => {
    const many = Array.from({ length: 40 }, (unused, i) => `Org ${i}`);

    expect(visibleSuggestions(many)).toHaveLength(5);
  });

  it("keeps order, so the closest match stays first", () => {
    expect(visibleSuggestions(["Puente", "Puentes"])).toEqual(["Puente", "Puentes"]);
  });

  it("tolerates a missing list", () => {
    // Rendered every keystroke; a throw here would take the signup screen down.
    expect(visibleSuggestions(undefined)).toEqual([]);
  });
});

describe("scrollTargetFor — clearing the keyboard", () => {
  // The list was correct and unreachable: Organization is the LAST field on a
  // long form, so focusing it opens the keyboard over the exact strip of screen
  // the suggestions render into. Nothing scrolled, so the rows sat under the
  // keyboard. This is the rule that moves the field up first.

  it("lifts the field toward the top, leaving the space below it for the list", () => {
    // A field 900px down a form must not stay 900px down once its list opens.
    expect(scrollTargetFor(900)).toBeLessThan(900);
  });

  it("leaves headroom rather than jamming the field against the top edge", () => {
    // Scrolling it to exactly 0 hides the fields above it, so the person loses
    // their place in a form they are midway through. A zero headroom would pass
    // the arithmetic below while doing exactly that, so it is pinned first.
    expect(FIELD_HEADROOM).toBeGreaterThan(0);
    expect(scrollTargetFor(900)).toBe(900 - FIELD_HEADROOM);
  });

  it("never scrolls to a negative offset", () => {
    // A field already near the top would otherwise ask the ScrollView to scroll
    // above its own content, which on Android jumps the form.
    expect(scrollTargetFor(10)).toBe(0);
    expect(scrollTargetFor(0)).toBe(0);
  });

  it("treats a field it has never measured as no scroll at all", () => {
    // onLayout has not fired yet. Guessing a number here would scroll the form
    // somewhere arbitrary the moment the field is touched.
    expect(scrollTargetFor(undefined)).toBe(0);
    expect(scrollTargetFor(null)).toBe(0);
    expect(scrollTargetFor(NaN)).toBe(0);
  });

  it("keeps a full open list visible above a standard keyboard", () => {
    // The whole point. With the field lifted, the five rows plus the input have
    // to fit in what is left above the keyboard on the smallest supported
    // screen, or this fix does not actually fix anything.
    const SMALLEST_SCREEN = 667;   // iPhone SE
    const KEYBOARD = 260;          // iOS keyboard, worst case with the accessory bar
    const INPUT_HEIGHT = 56;

    expect(FIELD_HEADROOM).toBeGreaterThan(0);
    const fieldTopAfterScroll = FIELD_HEADROOM;
    const listBottom =
      fieldTopAfterScroll + INPUT_HEIGHT + listHeightFor(MAX_VISIBLE_SUGGESTIONS);

    expect(listBottom).toBeLessThan(SMALLEST_SCREEN - KEYBOARD);
  });
});
