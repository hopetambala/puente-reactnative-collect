import {
  keyForSuggestion,
  listHeightFor,
  MIN_TOUCH_TARGET,
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
