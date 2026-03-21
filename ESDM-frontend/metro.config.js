const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ Handle packages that are native-only and will fail on web
// These packages will be replaced with empty mocks on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    // Replace native-only packages with empty shims on web
    const nativeOnlyPackages = [
      "react-native-pdf",
      "react-native-blob-util",
      "react-native-worklets",
    ];

    if (nativeOnlyPackages.some((pkg) => moduleName.startsWith(pkg))) {
      return {
        filePath: require.resolve("./shims/empty-module.js"),
        type: "sourceFile",
      };
    }
  }

  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;