const nodeModulePath = require('path')
const config = require('./common.conf')

module.exports = {
  ...config,
  bail: true, // Don't attempt to continue if there are any errors.
  devtool: 'source-map', // Don't attempt to continue if there are any errors.
  output: {
    path: nodeModulePath.join(__dirname, '../../library/pack'),
    filename: '[name].[chunkhash:8].js'
  }
}
