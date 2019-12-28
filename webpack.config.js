const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const YamlLocalesWebpackPlugin = require('yaml-locales-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const WebpackExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const merge = require('webpack-merge');
const path = require('path');
const purgecss = require('@fullhuman/postcss-purgecss')({
  content: ['./src/**/*.html', './src/**/*.vue'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
});
const webpack = require('webpack');

const manifest = require('./src/manifest.json');
const pkg = require('./package.json');

module.exports = (env, argv) => {
  const config = {
    entry: {
      background: './src/background.js',
      popup: './src/popup/popup.js'
    },
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                  ...(argv.mode === 'production' ? [purgecss] : [])
                ]
              }
            }
          ]
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        }
      ]
    },
    plugins: [
      new Dotenv(),
      new HtmlWebpackPlugin({
        filename: 'popup.html',
        template: 'src/popup/popup.html',
        chunks: ['popup']
      }),
      new CopyPlugin([{ from: 'src/icons', to: 'icons' }]),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new YamlLocalesWebpackPlugin(),
      new VueLoaderPlugin(),
      new webpack.ProgressPlugin()
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
    // development mode
    const dotEnv = new Dotenv();

    return merge(
      argv.watch
        ? {}
        : {
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
                key: dotEnv.definitions['process.env.EXTENSION_KEY'].replace(/"/g, '')
                //content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self';"
              }
            }
          })
        ],
        devtool: 'inline-source-map'
      }
    );
  }
};
