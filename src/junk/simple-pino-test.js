const pino = require('pino');

class MyStream {
	constructor(args) { this._args = args; }
	get args() { return this._args; }
	get writable() { return true; }
	/*
	* changed options
	// extreme
	// onTerminated
	// changeLevelName

	******
	*  enablec
	* prettyPrint
	* prettifier
	* messageKey
	*/

}

try {
	//var p = new pino({ riktest: true, writable: true }, new MyStream());
	var p = new pino(new MyStream());
	console.log('here');
	p.log('test');

}
catch (anException) {
	console.error(anException);
}
