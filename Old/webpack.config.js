const path = require('path');
const PropertiesReader = require('properties-reader');

const appProperties = PropertiesReader('./src/main/resources/application.properties')._properties;

module.exports = {
	mode: 'production',
    entry: ['@babel/polyfill','./src/main/js/app.js'],
    devtool: 'source-map',
    output: {
        path: __dirname,
        filename: './src/main/resources/static/built/bundle.js'
    },
    module: {
    	rules: [
            {
                test: path.join(__dirname, '.'),
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env',
                    	      '@babel/react', 
                    	     {'plugins': ['@babel/plugin-proposal-class-properties']}
                             ]
                }
            },
            {
            	test: /\.(png|jpg|gif)$/,
                use: [
                	{
	                    loader: 'file-loader',
	                    options: {
	                    	name: '[name].[ext]',
	                        outputPath: 'src/main/resources/static/built',
	                        publicPath: 'built/'
                    	}
                	}
                ]
            }
        ]
    },
    externals: {
    	'Config': JSON.stringify(appProperties)
    }
};