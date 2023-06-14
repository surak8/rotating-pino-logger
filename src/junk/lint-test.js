//var a,
//	b,
//	c;
//let a,
//	b,
//	c;
const a = 1,
	// eslint-disable-next-line no-unused-vars
	b = 2,
	// eslint-disable-next-line no-unused-vars
	c = 3;
var y;
switch (a) {
	case 'a':
		break;
	case 'b':
		break;
}
/********************** */
(function () {

	// eslint-disable-next-line no-unused-vars
	function foo(x) {
		return x + 1;
	}

})();

if (y) {
	console.log('foo');
}
/***************/
const foo2 = {};
foo2
	.bar
	.baz();
/******************** */
function foo(bar,
	baz,
	qux) {
	qux();
}

/******************** */
// eslint-disable-next-line no-unused-vars
class C {
	static {
		foo();
	}
}
/***************** */
const bar = {};
const baz = {};
const qux = {};
//const bar={}
var foo3 = [
	bar,
	baz,
	qux
];
