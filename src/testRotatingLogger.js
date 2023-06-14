'use strict';

const { RotatingPinoLogger } = require('./rotatingLogger');
const reqPino = require('pino');

/**
 * Create a logger object.
 * @returns an {Object} instance of <b>RotatingPinoLogger</b>.
 */
function createLogger() {
	const rotatingLogger = RotatingPinoLogger.init();
	const pino = reqPino(rotatingLogger);

	rotatingLogger.setupBindings(pino);
	return rotatingLogger;
}

/**
 * main-line code.
 */
async function main() {

	var rotatingLogger = createLogger(), adate = new Date(rotatingLogger._logDatetime);

	console.log(`currentDate=${rotatingLogger.logFileFormat(adate)}`);

	await rotatingLogger.testLevels();
	rotatingLogger.incrementLogDate();
	await rotatingLogger.testLevels();
	rotatingLogger.incrementLogDate();
	await rotatingLogger.testLevels();
	//await rotatingLogger.addDays(1);
	//await rotatingLogger.testLevels();
	//await rotatingLogger.addDays(-2);
	//await rotatingLogger.testLevels();
}

try {
	main();
} catch (anException) {
	console.error(anException);
}
