import AutoFill from "@app/impacto-design-system/Extensions/FormikFields/PaperInputPicker/AutoFill/index";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

// The pure rule in interaction.js says WHERE to scroll. This says the form is
// actually told to. Without this the helper is correct and never called, which
// is exactly the shape of the original defect: the list was correct and never
// reachable.

jest.mock("@modules/async-storage", () => ({ getData: jest.fn(async () => null) }));

// Records the component handed to renderResultList on every render, so the
// stability that makes a press possible can be asserted directly.
const capturedResultLists = [];
jest.mock("react-native-autocomplete-input", () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require("react");
  // eslint-disable-next-line global-require
  const { TextInput: RNTextInput, View: RNView } = require("react-native");
  return function MockAutocomplete({
    renderResultList, data, placeholder, onChangeText, onFocus, defaultValue,
  }) {
    capturedResultLists.push(renderResultList);
    const ResultList = renderResultList;
    return ReactLocal.createElement(RNView, null,
      ReactLocal.createElement(RNTextInput, {
        placeholder, onChangeText, onFocus, value: defaultValue,
      }),
      ResultList ? ReactLocal.createElement(ResultList, { data }) : null);
  };
});

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

beforeEach(() => {
  capturedResultLists.length = 0;
});

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

describe("the suggestion list keeps its identity across re-renders", () => {
  // THE reported bug: "the dropdown is nearly unclickable". Nearly, because it
  // depends on whether anything re-rendered between touch-down and touch-up.
  //
  // Touching the field fires onStartShouldSetResponderCapture, which calls
  // setScrollViewScroll on the PARENT. That re-renders the form, so Formik
  // hands down a BRAND NEW formikProps object - it builds one every render.
  // handleSelect depends on that object, so it changes identity, so the
  // memoised ResultList changes identity, so the library receives a new
  // component TYPE and React unmounts the whole list. A TouchableOpacity
  // remounted between touch-down and touch-up can never complete its press.
  //
  // The comment in the component already says a fresh component type breaks
  // the press. The dependency array quietly reintroduces one.
  //
  // fireEvent.press cannot show this - it invokes onPress directly and never
  // spans a remount. So this asserts the MECHANISM: the component handed to
  // renderResultList must be referentially stable when only formikProps is new.
  it("hands the library the same component when only formikProps is new", async () => {
    const setFieldValue = jest.fn();
    const makeFormikProps = () => ({
      setFieldValue,
      handleChange: () => jest.fn(),
      handleBlur: () => jest.fn(),
    });

    const props = {
      parameter: "organization",
      formikKey: "organization",
      label: "signUp.organization",
      translatedLabel: "Organization",
      theme,
      options: ["Puente", "DRMT"],
      setScrollViewScroll: jest.fn(),
    };

    const { findByPlaceholderText, rerender } = render(
      <AutoFill {...props} formikProps={makeFormikProps()} />
    );
    await findByPlaceholderText("Organization");

    rerender(<AutoFill {...props} formikProps={makeFormikProps()} />);

    // Every list component this render ever handed the library must be the
    // same one. The array is cleared per test, so these are only ours.
    expect(capturedResultLists.length).toBeGreaterThan(1);
    expect(new Set(capturedResultLists).size).toBe(1);
  });
});
