'use strict';

// #region required packages
const fs = require('fs');
const path = require('path');
const pino = require('pino'); // logger
// #endregion required packages

const PROP_PKG_NAME = '_pkgName';
const PROP_LOG_FILE_NAME = '_logFilename';
const PROP_LOG_FILE_DATE = '_logDatetime';
const PROP_NAME_TIME_SYM = 'pino-time-sym';
const PROP_NAME_BINDINGS = 'pino-chinding-sym';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// #region constants
const months = [
	'JAN', 'FEB', 'MAR',
	'APR', 'MAY', 'JUN',
	'JUL', 'AUG', 'SEP',
	'OCT', 'NOV', 'DEC',
];

//const LOG_LEVEL = 'debug';
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
		this._args = args;
		Object.defineProperty(this, 'months', {
			value: [
				'JAN', 'FEB', 'MAR',
				'APR', 'MAY', 'JUN',
				'JUL', 'AUG', 'SEP',
				'OCT', 'NOV', 'DEC',
			], writable: false
		});
		Object.defineProperty(this, PROP_PKG_NAME, { value: this.readPackageName(), writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_NAME, { value: 'dummy', writable: true });
		Object.defineProperty(this, PROP_NAME_TIME_SYM, { value: pino.symbols.timeSym, writable: false });
		Object.defineProperty(this, PROP_NAME_BINDINGS, { value: pino.symbols.chindingsSym, writable: false });
		//Object.defineProperty(this, pino.symbols.chindingsSym, { value: 'riktest', writable: false });
		Object.defineProperty(this, 'writable', { value: true, writable: false });
		Object.defineProperty(this, pino.symbols.needsMetadataGsym, { value: true, writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_DATE, { value: Date.now(), writable: true });
		this[PROP_LOG_FILE_DATE] = new Date(Date.now() - 3 * MILLISECONDS_PER_DAY);
		this._logger = new pino(this);

		Object.defineProperty(this._logger, 'stream.container', { value: Symbol('stream.container'), writable: true });
		Object.defineProperty(this._logger, this._logger['stream.container'], { value: this, writable: true });

		this.bindFields(pino);
	}

	bindFields(apino) {
		if (apino) {
			Object.defineProperty(this, 'pinoInstance', { value: apino, writable: false });
			apino[this[PROP_NAME_TIME_SYM]] = this.timestamp.bind(this); // have framework call this function
			apino[this[PROP_NAME_BINDINGS]] =
				`,"host": "${process.env['COMPUTERNAME']}",` +
				` "username": "${process.env['USERNAME']}"`; // normalls "pid":XXXXXXX, "hostname":"some-host"
		}
	}
	timestamp() { return `,"time":"${this.formatDate(new Date())}"`; }

	/**
 * Extract the name of this package.
 * @returns a {string} containing the package-name from <b>package.json</b>.
 */
	readPackageName() {
		var fname, content, ret = 'ERROR';

		if (fs.existsSync(fname = path.resolve(path.join(process.cwd(), 'package.json')))) {
			try {
				content = require(fname);
				if (content && content.name)
					ret = content.name;
			} catch (anException) {
				console.error(anException);
			}
		}
		return ret;
	}

	/**
	 * Command-line arguments
	 * @property {object} blah
	 */
	get args() { return this._args; }
	get logger() { return this._logger; }
	get logFilename() { return this[PROP_LOG_FILE_NAME]; }
	get logFileDate() { return this[PROP_LOG_FILE_DATE]; }
	//get logFilename() { return this._logFilename; }
	//set logFilename(fname) { this._logFilename = fname; }

	///**
	// * Read <b>package.json</b> and extract the name.
	// * @returns a {string}
	// */
	//static readAppName() {
	//	const pkgContent = require(path.join(process.cwd(), 'package.json'));
	//	var ret;

	//	if (pkgContent && (ret = pkgContent.name) && ret.length > 0)
	//		return ret;
	//	return 'zzz';
	//}

	calcDate(aDate) {
		if (aDate)
			return aDate.getFullYear() * 10000 +
				aDate.getMonth() * 100 +
				aDate.getDate();
		return 0;
	}

	filenameFromDate(aDate) {
		var tmp, dir;

		if (aDate) {
			tmp = path.resolve(path.join(
				process.cwd(),
				this[PROP_PKG_NAME] + this.logFileFormat(new Date(aDate)) + '.log'));
			if (!fs.existsSync(dir = path.dirname(tmp))) fs.mkdirSync(dir, { recursive: true });
			return tmp;
		}
	}

	logFileFormat(aDate) {
		if (aDate)
			return `_${this.zeroPad(aDate.getDate())}` +
				`${this.months[aDate.getMonth()]}` +
				`${aDate.getYear()}`;
	}

	openNewLogFile(aDate) {
		var tmp;

		this[PROP_LOG_FILE_NAME] = tmp = this.filenameFromDate(aDate);
		this._stream = fs.createWriteStream(tmp, { flag: 'as' });
		console.log(`opened ${tmp}`);
		return tmp;
	}

	write(msg) {
		var vnow, vlog, dnow, dlog;

		vnow = this.calcDate(dnow = new Date());
		vlog = this.calcDate(dlog = new Date(this[PROP_LOG_FILE_DATE]));

		if (!this._stream) {
			this.openNewLogFile(dlog);
		} else if (vnow > vlog) {
			// close the current one, and open a new one.
			if (this._stream) {
				this._stream.close();
				this._stream = null;
			}
			this[PROP_LOG_FILE_DATE] = dnow;
			this.openNewLogFile(dnow);
		}

		if (this._stream)
			this._stream.write(msg);
		else
			console.log('no stream!');
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
