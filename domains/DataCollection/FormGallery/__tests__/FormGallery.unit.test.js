/**
 * FormGallery - Unit Tests
 *
 * RED phase: the pinned-forms empty state must not be nested inside the
 * horizontal ScrollView. A horizontal ScrollView lays its children out in
 * unbounded horizontal space, so a Text inside it never wraps — the message
 * runs off the right edge of the screen instead of wrapping onto a second line.
 */

import FormGallery from '@app/domains/DataCollection/FormGallery';
import { render } from '@testing-library/react-native';
import React from 'react';
import { ScrollView } from 'react-native';

jest.mock('@modules/i18n', () => ({ t: (key) => key }));

jest.mock('@modules/theme', () => ({
  createLayoutStyles: () => ({ screenRow: {}, cardSmallStyle: {} }),
}));

jest.mock('@modules/async-storage', () => ({
  getData: jest.fn().mockResolvedValue([]),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@modules/cached-resources', () => ({
  customFormsQuery: jest.fn().mockResolvedValue([]),
}));

jest.mock('@modules/utils/animations', () => ({
  MOTION_TOKENS: { duration: { base: 200 } },
}));

jest.mock('@app/domains/DataCollection/FormGallery/index.styles', () => () => ({
  header: {},
  cardContainer: {},
  textContainer: {},
  text: {},
}));

jest.mock('@app/domains/DataCollection/FormGallery/FormsHorizontalView', () => () => null);

jest.mock('@impacto-design-system/Cards/SmallCardsCarousel', () => () => null);

jest.mock('@impacto-design-system/Cards/ModernCard', () => {
  // eslint-disable-next-line global-require
  const ReactLocal = require('react');
  return ({ children }) => ReactLocal.createElement('view', null, children);
});

const baseProps = {
  navigateToNewRecord: jest.fn(),
  navigateToCustomForm: jest.fn(),
  puenteForms: [],
  pinnedForms: [],
  setPinnedForms: jest.fn(),
  setLoading: jest.fn(),
  surveyingOrganization: 'org',
};

const horizontalScrollViews = (renderResult) =>
  renderResult.UNSAFE_queryAllByType(ScrollView).filter((sv) => sv.props.horizontal === true);

describe('FormGallery', () => {
  describe('pinned-forms empty state', () => {
    it('renders no horizontal ScrollView when there are no pinned forms, so the message can wrap', () => {
      const renderResult = render(<FormGallery {...baseProps} pinnedForms={[]} />);

      expect(horizontalScrollViews(renderResult)).toHaveLength(0);
    });

    it('still renders the horizontal ScrollView when pinned forms exist', () => {
      const renderResult = render(
        <FormGallery {...baseProps} pinnedForms={[{ tag: 'id', name: 'Resident ID' }]} />
      );

      expect(horizontalScrollViews(renderResult)).toHaveLength(1);
    });
  });
});
