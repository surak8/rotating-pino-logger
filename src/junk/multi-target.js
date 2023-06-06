const fs = require('fs');
const path = require('path');
const FILE_NAME = '/absolute/path/to/my-transport.mjs';
var dir;

if (!fs.existsSync(dir = path.dirname(FILE_NAME))) fs.mkdirSync(dir, { recursive: true });

//var p1 = require('pino')({
//	transport: {
//		target: '/absolute/path/to/my-transport.mjs'
//	}
//});
//p1.fatal('here-0');

// or multiple transports
var p2 = require('pino')({
	transport: {
		targets: [
			{ target: FILE_NAME, level: 'error' },
			//{ target: 'some-file-transport', options: { destination: '/dev/null' } }
		]
	}
});
p2.fatal('here-1');
p2.error('here-2');
p2.warn('here-3');
//p2.fatal('here-1');
//p2.fatal('here-1');
