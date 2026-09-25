import TermsModal from "@impacto-design-system/Extensions/TermsModal";
import { PRIVACY_POLICY_URL } from "@modules/legal";
import { fireEvent, render } from "@testing-library/react-native";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { StyleSheet } from "react-native";
import { Modal } from "react-native-paper";

jest.mock("@modules/i18n", () => ({ t: (key) => key }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));

describe("TermsModal", () => {
  it("uses an opaque themed surface for readable legal text", () => {
    const { UNSAFE_getByType: getByType } = render(
      <TermsModal visible setVisible={jest.fn()} />
    );
    const modal = getByType(Modal);
    const modalStyle = StyleSheet.flatten(modal.props.contentContainerStyle);

    expect(modalStyle.backgroundColor).toBeTruthy();
    expect(modalStyle.backgroundColor).not.toBe("transparent");
  });

  it("opens the canonical public privacy policy", () => {
    const { getByTestId } = render(
      <TermsModal visible setVisible={jest.fn()} />
    );

    fireEvent.press(getByTestId("privacy-policy-link"));

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
    expect(PRIVACY_POLICY_URL).toBe("https://www.puente-dr.org/privacy-policy/");
  });
});
