import AutoFill from "@app/impacto-design-system/Extensions/FormikFields/PaperInputPicker/AutoFill/index";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

// The pure rule in interaction.js says WHERE to scroll. This says the form is
// actually told to. Without this the helper is correct and never called, which
// is exactly the shape of the original defect: the list was correct and never
// reachable.

jest.mock("@modules/async-storage", () => ({ getData: jest.fn(async () => null) }));

const theme = {
  colors: {
    primary: "#000",
    surface: "#fff",
    surfaceSunken: "#eee",
    textPrimary: "#111",
    background: "#fff",
  },
};

function renderField(props = {}) {
  const formikProps = {
    setFieldValue: jest.fn(),
    handleChange: () => jest.fn(),
    handleBlur: () => jest.fn(),
  };
  const utils = render(
    <AutoFill
      parameter="organization"
      formikProps={formikProps}
      formikKey="organization"
      label="signUp.organization"
      translatedLabel="Organization"
      theme={theme}
      options={["Puente", "DRMT"]}
      setScrollViewScroll={jest.fn()}
      {...props}
    />
  );
  return { ...utils, formikProps };
}

describe("AutoFill tells the form when it opens", () => {
  it("calls onFocus so the form can lift it clear of the keyboard", async () => {
    const onFocus = jest.fn();
    const { findByPlaceholderText } = renderField({ onFocus });

    const input = await findByPlaceholderText("Organization");
    fireEvent(input, "focus");

    expect(onFocus).toHaveBeenCalled();
  });

  it("still works when no onFocus is given", async () => {
    // The component is used on other screens that have no scrolling to do.
    // Focusing it there must not throw.
    const { findByPlaceholderText } = renderField();

    const input = await findByPlaceholderText("Organization");
    expect(() => fireEvent(input, "focus")).not.toThrow();
  });
});
