var path = require('path')

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  devServer: {
    port: 3000,
    contentBase: path.join(__dirname, "build"),
    historyApiFallback: {
      index: '/index.html'
    }
  }
}
