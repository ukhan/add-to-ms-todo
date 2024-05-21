const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const YamlLocalesWebpackPlugin = require('yaml-locales-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const WebpackExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const { merge } = require('webpack-merge');
const resolve = require('path').resolve;
const webpack = require('webpack');
const dotEnv = new Dotenv();

const manifestBase = require('./src/manifest/base.json');
const manifestChrome = require('./src/manifest/chrome.json');
const manifestFireFox = require('./src/manifest/firefox.json');
const pkg = require('./package.json');

module.exports = (env, argv) => {
  let manifestConfig = {
    base: manifestBase,
    extend: { version: pkg.version },
  };
  if (argv.firefox) {
    const extID = dotEnv.definitions['process.env.FF_EXT_ID'].replace(/"/g, '');
    manifestConfig.extend = { ...manifestConfig.extend, ...manifestFireFox };
    manifestConfig.extend.browser_specific_settings.gecko.id = `{${extID}}`;
  } else {
    manifestConfig.extend = { ...manifestConfig.extend, ...manifestChrome };
    if (argv.mode !== 'production') {
      manifestConfig.extend.key = dotEnv.definitions[
        'process.env.EXTENSION_KEY'
      ].replace(/"/g, '');
    }
  }

  const config = {
    entry: {
      background: './src/background.js',
      popup: './src/popup/popup.js',
      options: './src/options/options.js',
      log: './src/log/log.js',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.vue', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.s[ac]ss$/i,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 10000,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new Dotenv(),
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: 'src/popup/popup.html',
        chunks: ['popup'],
      }),
      new HtmlWebpackPlugin({
        filename: 'options.html',
        template: 'src/options/options.html',
        chunks: ['options'],
      }),
      new HtmlWebpackPlugin({
        filename: 'log.html',
        template: 'src/log/log.html',
        chunks: ['log'],
      }),
      new CopyPlugin({
        patterns: [
          { from: 'src/icons', to: 'icons' },
          { from: 'src/assets', to: 'assets' },
        ],
      }),
      new WebpackExtensionManifestPlugin({
        config: manifestConfig,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new YamlLocalesWebpackPlugin({
        messageAdditions: argv.beta
          ? { extName: ' (beta)', BrowserActionTitle: ' (beta)' }
          : {},
      }),
      new VueLoaderPlugin(),
      new webpack.ProgressPlugin(),
    ],
  };

  if (argv.mode === 'production') {
    return merge(
      {
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                output: {
                  comments: false,
                },
              },
              extractComments: false,
            }),
            new OptimizeCSSAssetsPlugin({}),
          ],
        },
      },
      config
    );
  } else {
    // development mode

    return merge(config, {
      devtool: 'inline-source-map',
    });
  }
};
