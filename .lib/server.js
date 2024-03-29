const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

// user-def lib
const _config = require('../config.js');
const __handler__ = require('./handler.js');
const __helper__ = require('./helper.js');
// const user_data = require('./.lib/data.js');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');



let server = {}

//PORT NUMBER
const http_PORT = _config.HTTP_port;
const https_PORT = _config.HTTPs_port;


//SSL files
server.SSLOptions = {
    'key': fs.readFileSync(path.join(__dirname + '/' + '../ssl_key/key.pen')),
    'cert': fs.readFileSync(path.join(__dirname) + '/' + '../ssl_key/cert.pem')
};

server.httpServer = http.createServer((req, res) => {
    server.mainServer(req, res);
});

server.httpsServer = https.createServer(server.SSLOptions, (req, res) => {
    server.mainServer(req, res);
});

server.mainServer = (req, res) => {

    // fetch and parse url
    let parseURL = url.parse(req.url, true);
    // console.log(parseURL.search);

    // get path from url
    let path = parseURL.pathname;
    // console.log('path: ', path);
    path = path.replace(/^\/+|\/+$/g, '');
    // console.log('parsed path: ', path);

    //query string
    let queryString = parseURL.query;

    // headers
    let header = req.headers;
    
    //method
    let method = req.method.toLowerCase();
    
    //payloads
    let decoder = new stringDecoder('UTF-8');
    let buffer="";
    
    //staring decoding
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // chose handler
        let handler = typeof(server.router[path]) !== 'undefined' ? server.router[path] : __handler__.notFound;

        handler = path.indexOf('public/') > -1 ? __handler__.public : handler;
       // console.log(path);

        // data
        let data = {
            "path": path,
            "method": method,
            "queryString": queryString,
            "header": header,
            "payload": __helper__.parseJsonData(buffer)
        };

        handler(data, (statusCode, payload, contentType) => {
            contentType = typeof(contentType) == 'string' ? contentType : 'json';

            let StatusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            
            let _payload = '';
            if(contentType == 'json'){
                _payload = typeof(payload) == 'object' ? payload : {};
                _payload = JSON.stringify(_payload);
                res.setHeader('Content-Type', 'application/json');
            }
            if(contentType == 'html'){
               // console.log('html');
                res.setHeader('Content-Type', 'text/html');
                _payload = typeof(payload) == 'string' ? payload : '';
            }
            if(contentType == 'favicon'){
                res.setHeader('Content-Type', 'image/x-icon');
                _payload = typeof(payload) !== 'undefined' ? payload : '';
            }
            
            if(contentType == 'css'){
                //console.log('css');
                res.setHeader('Content-Type', 'text/css');
                _payload = typeof(payload) !== 'undefined' ? payload : '';
            }
            
            if(contentType == 'javascript'){
                //console.log('css');
                res.setHeader('Content-Type', 'text/javascript');
                _payload = typeof(payload) !== 'undefined' ? payload : '';
            }

            if(contentType == 'png'){
                res.setHeader('Content-Type', 'image/png');
                _payload = typeof(payload) !== 'undefined' ? payload : '';
            }
            
            if(contentType == 'jpg'){
                res.setHeader('Content-Type', 'image/jpeg');
                _payload = typeof(payload) !== 'undefined' ? payload : '';
            }
            
            if(contentType == 'plain'){
                res.setHeader('Content-Type', 'text/plain');
                _payload = typeof(payload) !== 'undefined' ? payload : '';
            }
            
			// console.log(_payload);           
            res.writeHead(StatusCode);
			// console.log(_payload['Error'], _payload['error']);
            res.end(_payload);

            
            


            let statusCodeColor = '';
            if(statusCode == 200)
                 debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + path + ' ' + statusCode);
            else
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + path + ' ' + statusCode);
        });
    });
}



// routers
server.router = {
    '':__handler__.index,
    'account/create': __handler__.accountCreate,
    'account/edit': __handler__.accountEdit,
    'account/removed': __handler__.accountRemove,
    'session/create': __handler__.sessionCreate,
    'session/removed': __handler__.sessionDeleted,
    'checks/all': __handler__.checkList,
    'checks/create': __handler__.checksCreate,
    'checks/edit':__handler__.checksEdit,
    'ping': __handler__.ping,
    'api/user': __handler__.user,
    'api/token': __handler__.token,
    'api/check': __handler__.checks,
    'favicon.ico': __handler__.favicon,
    'public': __handler__.public
};

server.init = () => {

server.httpServer.listen(http_PORT, (error) => {
    if(!error)
        console.log('\x1b[36m%s\x1b[0m' ,`HTTP_Server is running at ${_config.envName} port: ${http_PORT}`);
});

server.httpsServer.listen(https_PORT, (error) => {
    if(!error)
        console.log('\x1b[35m%s\x1b[0m', `HTTPs_Server is running at ${_config.envName} - port: ${https_PORT}`)
});
}



module.exports = server;
