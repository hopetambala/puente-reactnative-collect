import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import React from "react";
import { useTheme } from "react-native-paper";

function TabBarIcon({ name, focused }) {
  const theme = useTheme();
  return (
    <Ionicons
      name={name}
      size={30}
      style={{
        marginBottom: -3,
      }}
      color={
        focused ? theme.colors.primary : theme.colors.textSecondary
      }
    />
  );
}

TabBarIcon.propTypes = {
  name: PropTypes.string.isRequired,
  focused: PropTypes.bool.isRequired,
};

export default TabBarIcon;
