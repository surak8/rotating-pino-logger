'use strict';
const logger = require('./coltWebAppLogger')();

function logStuff(alogger) {
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
function main() {
	logger.info('here');
}
// #endregion main-line function

main();
