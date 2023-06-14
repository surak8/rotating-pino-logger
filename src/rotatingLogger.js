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

/**
 * An object which functions as a rotating file-logger.
 */
const MyPinoRotatingLogger = {
	/** 
	 * human-readable months
	 */
	months: [
		'JAN', 'FEB', 'MAR',
		'APR', 'MAY', 'JUN',
		'JUL', 'AUG', 'SEP',
		'OCT', 'NOV', 'DEC',
	],
	/**
	 * Increment the underlying date of this logger.
	 * @param {Integer} ndays number of days to advance
	 */
	addDays: async function (ndays) {
		var newDate;

		if (ndays && Number.isSafeInteger(ndays)) {
			//currentDate = this[PROP_LOG_FILE_DATE];
			//tmp = new Date(currentDate);
			//console.log(`current log-date:${this.dateFormat(new Date(tmp))}`);
			//console.log(`current log-file:${this[PROP_LOG_FILE_NAME]}\r\n`);
			////console.log(`DAY=${tmp.getDate()},MONTH=${tmp.getMonth()},YEAR=${tmp.getFullYear()}  `);

			//newDate = this[PROP_LOG_FILE_DATE] + ndays * 24 * 60 * 60 * 1000;
			newDate = this[PROP_LOG_FILE_DATE] + ndays * 24 * 60 * 60 * 1000;
			//console.log(`new date:${this.logFileFormat(new Date(newDate))}\r\n`);
			console.log(`before: log-name=${this[PROP_LOG_FILE_NAME]}`);
			await this.setLogfilenameFromDate(newDate);
			console.log(`after:  log-name=${this[PROP_LOG_FILE_NAME]}`);
			//console.log(`increment to ${this.dateFormat(new Date(newDate))}\r\n`);
		}
	},
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
	init: function () {
		Object.defineProperty(this, PROP_PKG_NAME, { value: readPackageName(), writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_NAME, { value: 'dummy', writable: true });
		Object.defineProperty(this, PROP_NAME_TIME_SYM, { value: reqPino.symbols.timeSym, writable: false });
		Object.defineProperty(this, PROP_NAME_BINDINGS, { value: true, writable: false });
		Object.defineProperty(this, 'writable', { value: true, writable: false });
		Object.defineProperty(this, reqPino.symbols.needsMetadataGsym, { value: true, writable: false });
		Object.defineProperty(this, PROP_LOG_FILE_DATE, { value: Date.now(), writable: true });
		console.debug(`package-name=${this[PROP_PKG_NAME]}`);
		this.setLogfilenameFromDate(this[PROP_LOG_FILE_DATE]);
		console.debug(`log-filename=${this[PROP_LOG_FILE_NAME]}`);
		return this;
	},
	logDate: function () { return this.formatDate(new Date(this[PROP_LOG_FILE_DATE])); },
	setLogfilenameFromDate: async function (aDate) {
		var tmp, dir;

		if (aDate) {
			tmp =
				path.resolve(
					path.join(
						process.cwd(),
						this[PROP_PKG_NAME] +
						this.logFileFormat(new Date(aDate)) +
						'.log'));
			if (!fs.existsSync(dir = path.dirname(tmp)))
				fs.mkdirSync(dir, { recursive: true });
			if (this._stream) {
				//await this._stream.close((a, b, c, d) => console.log(`closed ${this[PROP_LOG_FILE_NAME]}`));
				this._stream.close();
				this._stream = null;
			}
			this._stream = fs.createWriteStream(tmp, { flag: 'a' });
			this[PROP_LOG_FILE_NAME] = tmp;
			console.log(`opened ${tmp}`);
		}
		return tmp;
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
	write: async function (msg) {
		//console.debug(`MSG=${msg}`);
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
