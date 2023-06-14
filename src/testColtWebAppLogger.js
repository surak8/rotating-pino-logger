'use strict';
const logger = require('./coltWebAppLogger')();

async function logStuff(alogger) {
	alogger.fatal('fatal');
	alogger.error('error');
	alogger.warn('warn');
	alogger.info('info');
	alogger.debug('debug');
	alogger.trace('trace');
}

// #region main-line function
/*
* main - line function	
*/
async function main() {
	logger.info('here');
	logStuff(logger);
}
// #endregion main-line function

main();
