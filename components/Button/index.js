import * as React from 'react';
import { Button } from 'react-native-paper';
import { theme, layout } from '../../modules/theme';

export default function PaperButton({ onPressEvent, buttonText }) {
  return (
    <Button
      mode="contained"
      theme={theme}
      style={layout.button}
      onPress={onPressEvent}
    >
      {buttonText}
    </Button>
  );
}
