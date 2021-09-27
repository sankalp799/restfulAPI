let server = require('./.lib/server.js');
let worker = require('./.lib/worker.js');
let __helper = require('./.lib/helper.js');
let cli = require('./.lib/cli');

let app = {}

app.init = () => {
    server.init();
    worker.init();
	//	setTimeout(cli.init, 500);
}

app.init();

module.exports = app;
