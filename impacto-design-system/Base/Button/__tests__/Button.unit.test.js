import Button from "@impacto-design-system/Base/Button";
import { render, userEvent } from "@testing-library/react-native";
import React from "react";

jest.mock("react-native-paper", () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require("react");
  // eslint-disable-next-line global-require
  const { Pressable, Text } = require("react-native");

  return {
    ...jest.requireActual("react-native-paper"),
    // Paper's native button exposes one accessible press target. Use a native
    // Pressable here so disabled handling and accessibility queries stay real.
    Button: ({ children, disabled, ...props }) => ReactLocal.createElement(
      Pressable,
      {
        ...props,
        disabled,
        accessibilityRole: "button",
        accessibilityState: { disabled },
      },
      ReactLocal.createElement(Text, null, children)
    ),
  };
});

describe("shared Button press target", () => {
  it("invokes onPress when the enabled button is selected by its supplied testID", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button buttonText="Continue" testID="continue-button" onPress={onPress} />
    );

    await user.press(getByTestId("continue-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onPress when the disabled button is selected by its supplied testID", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button disabled buttonText="Continue" testID="continue-button" onPress={onPress} />
    );

    await user.press(getByTestId("continue-button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("exposes one named button without an additional accessible decorative wrapper", () => {
    const { getAllByRole, queryAllByRole } = render(
      <Button buttonText="Continue" testID="continue-button" onPress={jest.fn()} />
    );

    expect(getAllByRole("button", { name: "Continue" })).toHaveLength(1);
    expect(queryAllByRole("none")).toHaveLength(0);
  });
});
