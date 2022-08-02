const slsw = require("serverless-webpack");
const webpack = require("webpack");

module.exports = {
  entry: { ...slsw.lib.entries, worker: "./service/pdf.worker.js" },
  target: "node",
  plugins: [new webpack.IgnorePlugin({ resourceRegExp: /canvas/ })],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};
