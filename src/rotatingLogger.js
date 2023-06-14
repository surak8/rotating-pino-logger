'use strict';
const fs = require('fs');
const path = require('path');
const reqPino = require('pino');
const PROP_PKG_NAME = '_pkgName';
const PROP_LOG_FILE_NAME = '_logFilename';
const PROP_LOG_FILE_DATE = '_logDatetime';
const PROP_NAME_TIME_SYM = 'pino-time-sym';
const PROP_NAME_BINDINGS = 'pino-chinding-sym';

/**
 * Extract the name of this package.
 * @returns a {string} containing the package-name from <b>package.json</b>.
 */
function readPackageName() {
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

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
/**
 * An object which functions as a rotating file-logger.
 */
var MyPinoRotatingLogger = {
	dateFormat: function (aDate) {
		if (aDate)
			return `${this.zeroPad(aDate.getDate())}-` +
				`${this.months[aDate.getMonth()]}-` +
				`${aDate.getFullYear()}`;
	},
	logFileFormat: function (aDate) {
		if (aDate)
			return `_${this.zeroPad(aDate.getDate())}` +
				`${this.months[aDate.getMonth()]}` +
				`${aDate.getYear()}`;
	},

	formatDate: function (aDate) { return `${this.dateFormat(aDate)} ${this.timeFormat(aDate)}`; },
	incrementLogDate: function () {
		if (!this[PROP_LOG_FILE_DATE]) this[PROP_LOG_FILE_DATE] = Date.now();
		this[PROP_LOG_FILE_DATE] += MILLISECONDS_PER_DAY;
	},
	init: function () {
		Object.defineProperty(this, 'months', {
			value: [
				'JAN', 'FEB', 'MAR',
				'APR', 'MAY', 'JUN',
				'JUL', 'AUG', 'SEP',
				'OCT', 'NOV', 'DEC',
			], writable: false
		});
		Object.defineProperty(this, PROP_PKG_NAME, { value: readPackageName(), writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_NAME, { value: 'dummy', writable: true });
		Object.defineProperty(this, PROP_NAME_TIME_SYM, { value: reqPino.symbols.timeSym, writable: false });
		Object.defineProperty(this, PROP_NAME_BINDINGS, { value: reqPino.symbols.chindingsSym, writable: false });
		Object.defineProperty(this, 'writable', { value: true, writable: false });
		Object.defineProperty(this, reqPino.symbols.needsMetadataGsym, { value: true, writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_DATE, { value: Date.now(), writable: true });
		this[PROP_LOG_FILE_DATE] = new Date(Date.now() - 3 * MILLISECONDS_PER_DAY);
		return this;
	},
	logDate: function () { return this.formatDate(new Date(this[PROP_LOG_FILE_DATE])); },
	filenameFromDate: function (aDate) {
		var tmp, dir;

		if (aDate) {
			tmp = path.resolve(path.join(
				process.cwd(),
				this[PROP_PKG_NAME] + this.logFileFormat(new Date(aDate)) + '.log'));
			if (!fs.existsSync(dir = path.dirname(tmp))) fs.mkdirSync(dir, { recursive: true });
			return tmp;
		}
	},

	setupBindings: function (pino) {
		if (pino) {
			Object.defineProperty(this, 'pinoInstance', { value: pino, writable: false });
			pino[this[PROP_NAME_TIME_SYM]] = this.timestamp.bind(this); // have framework call this function
			pino[this[PROP_NAME_BINDINGS]] =
				`,"host": "${process.env['COMPUTERNAME']}",` +
				` "username": "${process.env['USERNAME']}"`; // normalls "pid":XXXXXXX, "hostname":"some-host"
		}
	},
	testLevels: function () {
		var pino = this['pinoInstance'];

		if (pino && pino.levels && pino.levels.values)
			Object.keys(pino.levels.values).forEach((alevel) => pino[alevel](alevel.toString()));
	},
	timeFormat: function (aDate) {
		if (aDate)
			return `${this.zeroPad(aDate.getHours())}:` +
				`${this.zeroPad(aDate.getMinutes())}:` +
				`${this.zeroPad(aDate.getSeconds())}` +
				`${this.zeroPad(aDate.getMilliseconds())}`;
	},
	timestamp: function () { return `,"time":"${this.formatDate(new Date())}"`; },
	calcDate: function (aDate) {
		if (aDate)
			return aDate.getFullYear() * 10000 +
				aDate.getMonth() * 100 +
				aDate.getDate();
		return 0;
	},
	openNewLogFile: function (aDate) {
		var tmp;

		this[PROP_LOG_FILE_NAME] = tmp = this.filenameFromDate(aDate);
		this._stream = fs.createWriteStream(tmp, { flag: 'as' });
		console.log(`opened ${tmp}`);
		return tmp;
	},
	write: async function (msg) {
		var vnow, vlog, dnow, dlog;

		vnow = this.calcDate(dnow = new Date());
		vlog = this.calcDate(dlog = new Date(this[PROP_LOG_FILE_DATE]));

		if (!this._stream) {
			this.openNewLogFile(dlog);
		} else if (vnow > vlog) {
			// close the current one, and open a new one.
			if (this._stream) {
				//this._stream.flush();
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
	},
	zeroPad: function (anInt) {
		if (anInt < 10) return '0' + anInt.toString();
		return anInt.toString();
	}
};

module.exports.RotatingPinoLogger = MyPinoRotatingLogger;
