module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@screens': './src/screens',
          '@components': './src/components',
          '@services': './src/services',
          '@context': './src/context',
          '@navigation': './src/navigation',
          '@types': './src/types',
          '@utils': './src/utils',
          '@shared': '../shared',
        },
      },
    ],
  ],
};

