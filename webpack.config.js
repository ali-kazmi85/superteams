const path = require("path");

const commonNodeConfig = {
  mode: "production",
  devtool: false,
  target: "node",
  output: {
    filename: "[name]/index.js",
    path: path.resolve(__dirname, "extensions"),
    libraryTarget: "commonjs2",
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /(node_modules)/,
        use: "babel-loader",
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
  externals: {
    electron: "electron",
  },
};

module.exports = [
  Object.assign({}, commonNodeConfig, {
    entry: {
      "recording-reminder": "./src/recording-reminder/index.js",
    },
  }),
  {
    mode: "production",
    // Where files should be sent once they are bundled
    entry: {
      "reply-injector": "./src/reply-injector/index.js",
      "mention-all": "./src/mention-all/index.js",
    },
    output: {
      filename: "[name]/index.js",
      path: path.resolve(__dirname, "extensions"),
    },
    // Rules of how webpack will take our files, compile & bundle them for the browser
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                "@babel/preset-react",
              ],
              plugins: [["@babel/transform-runtime"]],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    resolve: {
      extensions: ["", ".js", ".jsx"],
    },
  },
];
