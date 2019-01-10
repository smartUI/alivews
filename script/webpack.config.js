const webpack = require('webpack');
const path = require('path');

const cwd = process.cwd();
const srcPath = path.resolve(cwd, 'src');
const buildPath = path.resolve(cwd, 'build');
const NODE_ENV = process.env.NODE_ENV;

const config = {
    context: srcPath,
    entry: {
        AliveWS: path.resolve(srcPath, 'AliveWS.js'),
        test: path.resolve(srcPath, 'test.js')
    },
    output: {
        path: path.resolve(buildPath),
        filename: "[name].js",
        chunkFilename: "[name].[id].[chunkhash].js",
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            loader: 'babel-loader',
            include: [srcPath],
            exclude: /node_modules/,
        }],
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
    ],
};


if (NODE_ENV === 'development') {
    Object.assign(config, {
        devtool: '#cheap-module-source-map',
        target: 'web',
    });
    config.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                drop_console: false,
            }
        })
    )
} else if (NODE_ENV === 'production') {
    config.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            minimize: true,
            compress: {
                drop_console: true,
                warnings: false,
            }
        })
    )
}

module.exports = config;