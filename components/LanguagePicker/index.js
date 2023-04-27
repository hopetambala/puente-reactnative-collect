import { Select } from 'native-base';
import React from 'react';

import I18n from '../../modules/i18n';

const languages = [
  {
    key: 'en', label: I18n.t('languagePicker.english')
  },
  {
    key: 'es', label: I18n.t('languagePicker.spanish')
  },
  {
    key: 'hk', label: I18n.t('languagePicker.creole')
  }
];

const LanguagePicker = (props) => {
  const { language, onChangeLanguage } = props;
  return (
    <Select
      mode="dropdown"
      iosHeader=""
      style={{ width: undefined, height: 40, }}
      selectedValue={language}
      onValueChange={onChangeLanguage}
    >
      {languages.map((lang) => <Select.Item key={lang.key} value={lang.key} label={`🌐${lang.label}`} />)}
    </Select>
  );
};

export default LanguagePicker;
