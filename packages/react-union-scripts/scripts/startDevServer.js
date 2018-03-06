const invariant = require('invariant');
const browserSync = require('browser-sync');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const configs = require('./webpack.config');
const { APP, PROXY } = require('./lib/cli');
const { stats, getAppConfig } = require('./lib/utils');

function startDevServer() {
	invariant(
		configs && configs.length === 1,
		'You can start DEV Sever only for one module at the same time.'
	);

	const webpackConfig = configs[0];
	const unionConfig = getAppConfig(APP);

	invariant(!PROXY || unionConfig.proxy.port, "Missing 'port' for proxy in your union.config.");
	invariant(!PROXY || unionConfig.proxy.target, "Missing 'target' for proxy in your union.config");

	return new Promise(resolve => {
		const compiler = webpack(webpackConfig);
		const handleCompilerComplete = () => {
			const middleware = [
				webpackDevMiddleware(compiler, {
					publicPath: webpackConfig.output.publicPath,
					stats,
				}),
				webpackHotMiddleware(compiler),
			];

			const config = PROXY
				? {
						port: unionConfig.proxy.port,
						proxy: {
							target: unionConfig.proxy.target,
							middleware,
						},
						serveStatic: [
							{
								route: webpackConfig.output.publicPath,
								dir: webpackConfig.output.path,
							},
						],
					}
				: {
						port: unionConfig.devServer.port,
						server: {
							baseDir: unionConfig.devServer.baseDir || unionConfig.buildDir,
							middleware,
						},
					};

			browserSync.create().init(
				{
					ui: false,
					files: ['**/*.css', 'build/public/*.html'],
					...config,
				},
				resolve
			);
		};

		compiler.run(handleCompilerComplete);
	});
}
module.exports = startDevServer;
