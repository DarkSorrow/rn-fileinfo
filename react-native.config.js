module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: '../android/',
        packageImportPath: 'import com.novastera.rnfileinfo.RnFileinfoPackage;',
      },
      ios: {
        podspecPath: '../ios/RnFileinfo.podspec',
      },
    },
  },
};
