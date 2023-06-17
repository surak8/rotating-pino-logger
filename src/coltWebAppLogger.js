'use strict';

// #region required packages
const fs = require('fs');
//const { maxHeaderSize } = require('http');
//const { defaultFormat } = require('moment/moment');
//const { localeData } = require('moment/moment');
const path = require('path');
const pino = require('pino'); // logger
// #endregion required packages

const PROP_PKG_NAME = '_pkgName';
const PROP_LOG_FILE_NAME = '_logFilename';
const PROP_LOG_FILE_DATE = '_logDatetime';
const PROP_NAME_TIME_SYM = 'pino-time-sym';
const PROP_NAME_BINDINGS = 'pino-chinding-sym';
const DEFAULT_PACKAGE_NAME = 'ERROR-PKG-NAME';

// eslint-disable-next-line no-unused-vars
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

		Object.defineProperty(this, 'debug', { value: findBoolProperty(args, 'debug'), writable: false });
		Object.defineProperty(this, 'logToConsole', { value: findBoolProperty(args, 'logToConsole'), writable: false });
		Object.defineProperty(this, 'logLocation', { value: findStringProperty(args, 'logLocation', '/temp/logs'), writable: false });

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
		Object.defineProperty(this, 'writable', { value: true, writable: false });
		Object.defineProperty(this, pino.symbols.needsMetadataGsym, { value: true, writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_DATE, { value: Date.now(), writable: true });
		this._logger = new pino(this);

		//var v = pino.symbols.setLevelSym;
		if ((this.logToConsole || this.debug) && pino.symbols.setLevelSym)
			//this._logger[pino.setLevelSym]('debug');
			this._logger[pino.symbols.setLevelSym]('trace');

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
		var content, ret = DEFAULT_PACKAGE_NAME, searchPaths = [], pmPath;

		searchPaths.push(path.resolve(path.join(process.cwd(), 'package.json')));

		if ((pmPath = process.env['pm_exec_path']))
			searchPaths.push(path.resolve(path.join(path.dirname(pmPath), 'package.json')));

		searchPaths.forEach((fname) => {
			if (fs.existsSync(fname)) {
				try {
					content = require(fname);
					if (content && content.name)
						ret = content.name;
					else
						console.warn(`package ${fname} does not contain a 'name' attribute`);
				} catch (anException) {
					console.error(anException);
				}
			}
			//else
			//	console.error(`non-existent: ${fname}\r\nEnvironment:\r\n${JSON.stringify(process.env, null, '\t')}`);
		});
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

	calcDate(aDate) {
		if (aDate)
			return aDate.getFullYear() * 10000 +
				aDate.getMonth() * 100 +
				aDate.getDate();
		return 0;
	}

	filenameFromDate(aDate) {
		var tmp, dir, parts;

		if (aDate) {
			parts = [];
			if (this.logLocation) parts.push(this.logLocation);
			else parts.push(process.cwd(), 'logs');
			parts.push(this[PROP_PKG_NAME] + this.logFileFormat(new Date(aDate)) + '.log');
			tmp = path.resolve(path.resolve(parts.join('/')));
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

	logLevel(level) {
		if (level)
			if (this._logger && this._logger && this.logger.levels && this._logger.levels.labels)
				return this._logger.levels.labels[level];
		return '*ACK*';
	}

	displayDate(aDate) {
		return `${this.zeroPad(aDate.getDate())}-` +
			`${months[aDate.getMonth()]}-` +
			`${aDate.getFullYear()} ` +
			`${this.zeroPad(aDate.getHours())}:` +
			`${this.zeroPad(aDate.getMinutes())}:` +
			`${this.zeroPad(aDate.getSeconds())}.` +
			`${this.zeroPad(aDate.getMilliseconds(), 3)}`;
	}

	logMessage(msg) {
		var tmp, logDate;

		if (msg && this.logToConsole) {
			tmp = JSON.parse(msg);
			logDate = new Date(tmp.time);
			console.log(`[${this.logLevel(tmp.level).toUpperCase()} ${this.displayDate(logDate)}] ${tmp.msg}`);
		}
	}

	openNewLogFile(aDate) {
		var tmp;

		this[PROP_LOG_FILE_NAME] = tmp = this.filenameFromDate(aDate);
		this._stream = fs.createWriteStream(tmp, { flag: 'as' });
		console.log(`new log-file: ${tmp}`);
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

		if (this.logToConsole) this.logMessage(msg);

		if (this._stream) this._stream.write(msg);
		else console.log('no stream!');
	}

	/**
	 * Prepend a leading zero, if necessary
	 * @param {integer} anInt the number to format.
	 * @returns a {string} with a leading zero.
	 */
	zeroPad(anInt1, maxWidth = 2) {
		var dispWidth, maxPower10, renderVal, ret, n, pn, p10, subval;

		renderVal = anInt1 || 0; // value that we're writing
		dispWidth = maxWidth; // desired width
		if (renderVal < 1) return '0'.repeat(dispWidth); // handle zero, since it's log-value is undefined.
		maxPower10 = Math.floor(Math.log10(renderVal < 1 ? 1 : renderVal)); // number of powers of 10 to contain the number

		ret = (dispWidth - maxPower10 - 1 > 0) ?
			('0'.repeat(dispWidth - maxPower10 - 1)) :
			'';
		pn = n = maxPower10;
		while (n >= 0) {
			p10 = Math.pow(10, n);
			// have this power of 10?
			if (renderVal >= p10) {
				// yes
				subval = Math.floor(renderVal / p10);
				// how many multiples of this power of 10?
				ret += subval.toString(); // append the digit
				renderVal -= (subval * p10); // remove it
			} else
				ret += '0';	// append a zero
			n--;
		}
		if (this.verbose)
			console.log(
				`anInt1=${anInt1}, ` +
				`renderVal=${renderVal}, ` +
				`maxWidth=${maxWidth}, ` +
				`dispWidth=${dispWidth}, ` +
				`digitsRequired=${maxPower10},` +
				`n=${pn},` +
				`RET=${ret}`
			);
		return ret;

	}

	/**
	 * Produce a human-readable date-string.
	 * @param {Date} aDate the date to format
	 * @returns a {string} containing a reasonable human-readable format
	 */
	myDate(aDate) {
		return ',"time":"' +
			`${this.zeroPad(aDate.getDate())}-` +
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

function findBoolProperty(anObj, propertyName) {
	var propertyValue;

	if (anObj) {
		if (Object.prototype.hasOwnProperty.call(anObj, propertyName)) {
			propertyValue = anObj[propertyName];
			//if (propertyValue)
			if (typeof (propertyValue) === 'boolean')
				return Boolean(propertyValue).valueOf();
			console.log('here');
		}
	}
	return false;

}

function findStringProperty(anObj, propertyName, defaultValue) {
	var propertyValue;

	if (anObj) {
		if (Object.prototype.hasOwnProperty.call(anObj, propertyName)) {
			propertyValue = anObj[propertyName];
			if (propertyValue)
				if (typeof (propertyValue) === 'string')
					return propertyValue;
			console.log('here');
		}
	}
	return defaultValue ? defaultValue : 'ERROR-property';

}

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
