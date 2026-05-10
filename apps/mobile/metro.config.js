const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// pnpm isolated installs + Metro: ensure NativeWind's JSX runtime resolves.
config.resolver.unstable_enableSymlinks = true;
try {
  const cssInteropRoot = path.dirname(
    require.resolve("react-native-css-interop/package.json", {
      paths: [projectRoot],
    }),
  );
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    "react-native-css-interop": cssInteropRoot,
  };
} catch {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    "react-native-css-interop": path.resolve(
      projectRoot,
      "node_modules/react-native-css-interop",
    ),
  };
}

module.exports = withNativeWind(config, {
  input: "./src/global.css",
  configPath: "./tailwind.config.js",
});
