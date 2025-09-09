import { ConfigPlugin } from '@expo/config-plugins';

const withRnFileinfo: ConfigPlugin = (config) => {
  // This plugin doesn't need to modify any native configurations
  // The module should be autolinked automatically by React Native
  // and discovered by Expo through expo-module.config.json
  return config;
};

export default withRnFileinfo;
