import { StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../modules/theme';

const borderRadius = 20;

const { accent, black } = theme.colors;

const styles = StyleSheet.create({
  container: {
    backgroundColor: accent,
    width: Dimensions.get('window').width,
    borderBottomRightRadius: borderRadius,
    borderBottomLeftRadius: borderRadius,
  },
  header: {
    height: 80, // equivalent to flex: 0.2,
    // width: Dimensions.get('window').width * .99,
    paddingTop: 20, // for ios
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: accent
  },
  headerIcon: {
    borderRadius: 30,
    color: black
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: black,
    flex: 0.7
  },
  calculationText: {
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20
  }

});

export default styles;
