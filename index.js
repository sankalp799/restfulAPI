let server = require('./.lib/server.js');
let worker = require('./.lib/worker.js');
let __helper = require('./.lib/helper.js');

let app = {}

app.init = () => {
    server.init();
    worker.init();
}

app.init();

module.exports = app;
