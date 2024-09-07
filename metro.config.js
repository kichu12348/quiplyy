// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

["js", "jsx", "json", "ts", "tsx", "cjs", "mjs"].forEach((ext) => {
    config.resolver.sourceExts.push(ext);
});

["glb", "gltf", "png", "jpg"].forEach((ext) => {
    config.resolver.assetExts.push(ext);
  
});

module.exports = config;
