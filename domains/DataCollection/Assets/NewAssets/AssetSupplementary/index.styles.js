import { Dimensions, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  assetContainer: {
    width: Dimensions.get('window').width * 0.90,
    padding: 10,
    textAlign: 'left',
  }
});

export default styles;
