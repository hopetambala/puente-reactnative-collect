import {
  StyleSheet
} from 'react-native';

import { theme } from '../../../modules/theme';

const stylesDefault = StyleSheet.create({
  horizontalLine: {
    borderBottomColor: '#D0D0D0',
    borderBottomWidth: 1,
    marginTop: 10,
    marginBottom: 10,

  },
  inputItem: {
    flex: 7,
    marginHorizontal: 5
  },
  multiInputContainer: {
    flexDirection: 'row'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 10,
  },
  header: {
    fontWeight: 'bold',
    marginTop: 10
  },
  label: {
    fontWeight: 'bold',
    color: theme.colors.black,
    backgroundColor: theme.colors.background
  }

});

const stylesPaper = {
  colors: {
    placeholder: theme.colors.black
  },
  text: theme.colors.priary,
};

const styleX = StyleSheet.create({
  sideLabel: {
    flex: 1,
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: 10,
    fontSize: 15
  },
  textSplit: {
    fontSize: 35,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 'auto',
    marginBottom: 25,
  }
});

export { stylesDefault, stylesPaper, styleX };
