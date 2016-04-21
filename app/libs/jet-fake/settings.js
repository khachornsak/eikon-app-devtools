const settingMock = {
  'COMMON.OTHER_SETTINGS.MOVEMENTCOLOR_UP': '#00fff0',
  'COMMON.OTHER_SETTINGS.MOVEMENTCOLOR_LEVEL': '#387c2b',
  'COMMON.OTHER_SETTINGS.MOVEMENTCOLOR_DOWN': '#ff9100',
  'COMMON.REGIONAL_SETTINGS.UI_LANGUAGE': 'en',
};

const Settings = {
  read(cb, { settingName }) {
    setTimeout(() => {
      cb(settingMock[settingName]);
    }, 100);
  },
};

export default Settings;
