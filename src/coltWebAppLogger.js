'use strict';

// #region required packages
const fs = require('fs');
const path = require('path');
const pino = require('pino'); // logger
// #endregion required packages

// #region constants
const months = [
	'JAN', 'FEB', 'MAR',
	'APR', 'MAY', 'JUN',
	'JUL', 'AUG', 'SEP',
	'OCT', 'NOV', 'DEC',
];

const LOG_LEVEL = 'debug';
// #endregion constants

// #region exported class
/**
 * Wrapped logger. 
 * */
class ColtWebAppLogger {
	/**
	 * ctor. 
	 * set the log-filename, and create the underlying <b>pino</b> logger.
	 * @param {object} args constructor args.
	 */
	constructor(args) {
		var appName, dir;

		appName = ColtWebAppLogger.readAppName();
		this._args = args ? args : {};

		if (!this.logFilename)
			this.logFilename = path.resolve(
				this.args.logFilename ?
					this.args.logFilename :
					path.join(process.cwd(), 'logs', appName + '.log')
			);

		console.log(`log-file: ${this.logFilename}`);

		if (!fs.existsSync(dir = path.dirname(this.logFilename)))
			fs.mkdirSync(dir, { recursive: true });

		const opts = {
			name: appName,
			level: LOG_LEVEL,
			msgPrefix: `[${appName}] `,
			formatters: {
				bindings: (bindings) => { return { host: bindings.hostname, username: process.env['USERNAME'] }; },
				level: (label) => { return { level: label.toLowerCase() }; },
			},
			timestamp: () => { return this.myDate(new Date()); }
		};

		//this._logger = pino();
		//this._logger = pino(opts);
		//this._logger = pino({ prettyPrint: true, });

		this._logger = pino(opts,
			pino.multistream([
				{ level: LOG_LEVEL, stream: fs.createWriteStream(this.logFilename, { flags: 'a' }) },
				{ level: LOG_LEVEL, stream: process.stdout },
				{ level: 'info', stream: process.stdout },
				{ level: 'error', stream: process.stderr },
			], opts));
	}

	/**
	 * Command-line arguments
	 * @property {object} blah
	 */
	get args() { return this._args; }
	get logger() { return this._logger; }
	get logFilename() { return this._logFilename; }
	set logFilename(fname) { this._logFilename = fname; }

	/**
	 * Read <b>package.json</b> and extract the name.
	 * @returns a {string}
	 */
	static readAppName() {
		const pkgContent = require(path.join(process.cwd(), 'package.json'));
		var ret;

		if (pkgContent && (ret = pkgContent.name) && ret.length > 0)
			return ret;
		return 'zzz';
	}

	/**
	 * Prepend a leading zero, if necessary
	 * @param {integer} anInt the number to format.
	 * @returns a {string} with a leading zero.
	 */
	zeroPad(anInt) {
		if (anInt < 10) return '0' + anInt.toString();
		return anInt.toString();
	}

	/**
	 * Produce a human-readable date-string.
	 * @param {Date} aDate the date to format
	 * @returns a {string} containing a reasonable human-readable format
	 */
	myDate(aDate) {
		return ',"time":"' +
			`${this.zeroPad(aDate.getDay())}-` +
			`${months[aDate.getMonth()]}-` +
			`${aDate.getFullYear()} ` +
			`${this.zeroPad(aDate.getHours())}:` +
			`${this.zeroPad(aDate.getMinutes())}:` +
			`${this.zeroPad(aDate.getSeconds())}"`;
	}
}
// #endregion exported class

// #region static variables
var sharedLogger;
// #endregion static variables

/**
 * Expose a <b>pino</b> logger to the developer.
 * @param {object} args object for exported object?
 * @returns a <b>pino</b> logger.
 */
module.exports = (args) => {
	if (!sharedLogger)
		sharedLogger = new ColtWebAppLogger(args);
	return sharedLogger.logger;
};
