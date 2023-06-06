// https://github.com/pinojs/pino/blob/HEAD/docs/transports.md
const pino = require('pino');
const transport = pino.transport({
	target: 'some-file-transport',
	options: { destination: '/dev/null' }
});
var p = pino(transport);
p.fatal('fatal');
