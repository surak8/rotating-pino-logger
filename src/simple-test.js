const logger = require('./logger');

async function testit() {
	logger.fatal('fatal');
	logger.error('error');
	logger.warn('warn');
	logger.info('info');
	logger.debug('debug');
	logger.trace('trace');
}

async function main() {
	await testit();
	console.log('done');
}

/*
SET PINO_LOG_LEVEL=warn&& node src\simple-test.js 

nvm use 12.3.1
yarn add pino@6.10.0
SET PINO_LOG_LEVEL=warn&& node src\simple-test.js 

nvm use 20.2.0
yarn add pino@latest
SET PINO_LOG_LEVEL=warn&& node src\simple-test.js 
*/
main();
