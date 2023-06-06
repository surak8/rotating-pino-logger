const fs = require('fs');
const path = require('path');
const pino = require('pino');

const logName = path.resolve(path.join(process.cwd(), 'logs', packageName() + '.log'));
var dir, opts;

function packageName() {
	var content;

	try {
		content = require(path.join(process.cwd(), 'package.json'));
	} catch (anException) {
		console.error(anException.message);
	}
	return content.name || 'ERROR';
}

function formatDate(date) {
	var str = date.toString(), data;

	data = {
		month: str.slice(4, 7).toUpperCase(),
		day: str.slice(8, 10),
		year: str.slice(11, 15),
		time: str.slice(16, 24)
	};

	//return str.slice(8, 10) /* day */ +
	//	'-' +
	//	str.slice(4, 7).toUpperCase() /* month */ +
	//	'-' +
	//	str.slice(11, 15) /* year */ +
	//	' ' +
	//	str.slice(16, 24) /* time portion */;
	return data.day + '-' + data.month + '-' + data.year + ' ' + data.time;
}

if (!fs.existsSync(dir = path.dirname(logName))) fs.mkdirSync(dir, { recursive: true });

console.log(
	`NODE version: ${process.version}\r\n` +
	`pino version: ${pino.version}\r\n`);
console.log('logging to: ' + logName);

opts = {
	level: process.env.PINO_LOG_LEVEL || 'trace',
	formatters: {
		level: (label) => { return { level: label.toUpperCase() }; },
		bindings: (bindings) => { return { host: bindings.hostname }; },
	},
	crlf: true,
	timestamp: () => { return `,"time":"${formatDate(new Date(Date.now()))}"`; }
};

module.exports = pino(opts, pino.destination(logName));
