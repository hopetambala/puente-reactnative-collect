import {
  StyleSheet
} from 'react-native';

import { theme } from '../../modules/theme';

const styles = StyleSheet.create({
  map: {
    marginVertical: 10,
    marginHorizontal: 10
  },
  screenFlexRowWrap: {
    marginHorizontal: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardInfoContainer: {
    flexDirection: 'column',
    flex: 1
  },
  cardSmallStyle: {
    height: 150,
    marginHorizontal: 7,
    marginVertical: 7,
    flex: 1
  },
  horizontalLine: {
    borderBottomColor: theme.colors.primary,
    borderBottomWidth: 1,
    marginVertical: 10
  },
  userInfoContainer: {
    flexDirection: 'row'
  },
  mySurveysContainer: {
    width: '20%',
    marginRight: 'auto',
    marginLeft: 20
  },
  totalSurveysContainer: {
    width: '22%',
    marginLeft: 'auto',
    marginRight: 20
  },

  cardContainer: {
    flexDirection: 'row',
  },
  svg: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 'auto'
  },
  text: {
    flexShrink: 1,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginVertical: 20,
  }
});

export default styles;
