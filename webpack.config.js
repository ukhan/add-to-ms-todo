const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const YamlLocalesWebpackPlugin = require('yaml-locales-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const merge = require('webpack-merge');

const manifest = require('./src/manifest.json');
const pkg = require('./package.json');

module.exports = (env, argv) => {
  const config = {
    entry: {
      background: './src/background.js'
    },
    plugins: [
      new CopyPlugin([{ from: 'src/icons', to: 'icons' }]),
      new YamlLocalesWebpackPlugin()
    ]
  };

  if (argv.mode === 'production') {
    return merge(
      {
        optimization: {
          minimizer: [new TerserPlugin({}), new OptimizeCSSAssetsPlugin({})]
        },
        plugins: [
          new CleanWebpackPlugin(),
          new WebpackExtensionManifestPlugin({
            config: {
              base: manifest,
              extend: { version: pkg.version }
            }
          }),
          new ZipPlugin({
            path: '../release',
            filename: `${pkg.name}-${pkg.version}`
          })
        ]
      },
      config
    );
  } else {
    return merge(
      {
        plugins: [new CleanWebpackPlugin()]
      },
      config,
      {
        plugins: [
          new WebpackExtensionManifestPlugin({
            config: {
              base: manifest,
              extend: {
                version: pkg.version,
                content_security_policy:
                  "script-src 'self' 'unsafe-eval'; object-src 'self';"
              }
            }
          })
        ],
        devtool: 'inline-source-map'
      }
    );
  }
};
