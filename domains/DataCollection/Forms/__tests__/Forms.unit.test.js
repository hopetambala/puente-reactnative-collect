/**
 * Forms - Unit Tests
 *
 * RED phase: the suggested-forms empty state must not be nested inside the
 * horizontal ScrollView. A horizontal ScrollView lays its children out in
 * unbounded horizontal space, so a Text inside it never wraps — the message
 * runs off the right edge of the screen instead of wrapping onto a second line.
 */

import Forms from '@app/domains/DataCollection/Forms';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ScrollView } from 'react-native';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({
    screenContainer: {},
    container: {},
    screenRow: {},
    cardSmallStyle: {},
  }),
  typography: {
    heading3: { fontSize: 24 },
    body2: { fontSize: 14 },
  },
}));

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { base: 200, slow: 400 } },
}));

jest.mock('@app/domains/DataCollection/Forms/index.styles', () => () => ({
  cardContainer: {},
  textContainer: {},
  text: {},
}));

jest.mock('@app/assets/graphics/static/Submission-Page-Icon.svg', () => () => null);
jest.mock('@app/domains/DataCollection/GdprCompliance', () => () => null);
jest.mock('@app/domains/DataCollection/Forms/IdentificationForm', () => () => null);
jest.mock('@app/domains/DataCollection/Forms/SupplementaryForm', () => () => null);
jest.mock('@impacto-design-system/Extensions/ResidentIdSearchbar', () => () => null);

jest.mock('@impacto-design-system/Cards/ModernCard', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  return ({ children }) => ReactLocal.createElement('view', null, children);
});

const baseProps = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() },
  navigateToGallery: jest.fn(),
  navigateToCustomForm: jest.fn(),
  selectedForm: '',
  setSelectedForm: jest.fn(),
  navigateToNewRecord: jest.fn(),
  scrollViewScroll: false,
  setScrollViewScroll: jest.fn(),
  pinnedForms: [],
  surveyingUser: 'u1',
  surveyingOrganization: 'org',
  surveyee: {},
  setSurveyee: jest.fn(),
  customForm: null,
  navigateToRoot: jest.fn(),
};

const horizontalScrollViews = (renderResult) =>
  renderResult.UNSAFE_queryAllByType(ScrollView).filter((sv) => sv.props.horizontal === true);

describe('Forms', () => {
  describe('suggested-forms empty state', () => {
    it('renders no horizontal ScrollView when there are no pinned forms, so the message can wrap', () => {
      const renderResult = render(<Forms {...baseProps} pinnedForms={[]} />);

      expect(horizontalScrollViews(renderResult)).toHaveLength(0);
    });

    it('still renders the horizontal ScrollView when pinned forms exist', () => {
      const renderResult = render(
        <Forms {...baseProps} pinnedForms={[{ tag: 'id', name: 'Resident ID' }]} />
      );

      expect(horizontalScrollViews(renderResult)).toHaveLength(1);
    });
  });
});
