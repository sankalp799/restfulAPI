const https = require('https');
const http = require('http');
const path = require('path');
const _data = require('./data.js');
const __helper__ = require('./helper.js');
const url = require('url');
const __log = require('./log.js');
// const queryString = require('queryString');

let worker = {}


worker.init = () => {
    worker.gatherAllChecks();
    worker.loopChecks();
}

worker.gatherAllChecks = () => {
    _data.list('checks', (err, data) => {
        if(!err && data && data.length > 0){
            data.forEach((check) => {
                _data.read('checks', '' + check, (error, data) => {
                    if(data && !error){
                        let check = __helper__.parseJsonData(data);
                        worker.validateCheck(check);
                    }else{
                        console.log('could not read check');
                    }
                });
            });
        }else{
            console.log('Error : Could not find any check');
        }
    });
}


worker.loopChecks = () => {
    setInterval(worker.gatherAllChecks, 1000 * 60);
}


worker.validateCheck = (check) => {
    check= typeof(check) == 'object' && check !== null ? check : false;
    if(check){
        let protocol = typeof(check.protocol) == 'string' && ['http', 'https'].indexOf(check.protocol) > -1 ? check.protocol : false;
        let url = typeof(check.url) == 'string' && check.url.trim().length > 0 ? check.url : false;
        let method = typeof(check.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(check.method) > -1 ? check.method : false;
        let successCode = typeof(check.successCode) == 'object' && check.successCode instanceof Array && check.successCode.length > 0 ? check.successCode : false;
        let timeoutSec = typeof(check.timeoutSec) == 'number' && check.timeoutSec % 1 === 0 && check.timeoutSec >= 1 && check.timeoutSec <= 5 ? check.timeoutSec : false;
        let id = typeof(check.id) == 'string' && check.id.trim().length > 0 ? check.id : false;
        
        check.state = typeof(check.state) == 'string' && ['up', 'down'].indexOf(check.state) > -1 ? check.state : 'down';
        check.lastChecked = typeof(check.lastChecked) == 'number' && check.lastChecked > 0 ? check.lastChecked : false;

        if(id && protocol && url && method && successCode && timeoutSec){
            worker.processCheck(check);
        }else{
            console.log(`check: ${id} is not formatted`);
        }
    }else{
        console.log('null check');
    }
}

worker.processCheck = (check) => {
    let checkOutcome = {
        'error': false,
        'responseCode': false 
    };

    let outcomeSent = false;

    let parseUrl = url.parse(check.protocol + '://' + check.url, true);

    let hostName = parseUrl.hostname;
    let path = parseUrl.path;

    let requestDetails = {
        'portocol': check.protocol + ':',
        'hostName': hostName,
        'method': check.method.toUpperCase(),
        'path': path,
        'timeout': check.timeoutSec * 1000
    };
    
    let protocol_module = check.protocol.toLowerCase() == 'http' ? http : https;
    let req = protocol_module.request(requestDetails, (res) => {
       //  console.log(res.statusCode);
        let status = res.statusCode;
        checkOutcome.responseCode = status;
        if(!outcomeSent){
            worker.processCheckOutCome(check, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', (e) => {
        checkOutcome.error = {
            'error': true,
            'value': e
        };
        if(!outcomeSent){
            worker.processCheckOutCome(check, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', (e) => {
        checkOutcome.error = {
            'error': true,
            'value': e
        };
        if(!outcomeSent){
            worker.processCheckOutCome(check, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
}


worker.processCheckOutCome = (check, checkOutcome) => {
   // console.log(check.state, check.successCode, checkOutcome); 

    let state = !checkOutcome.error && checkOutcome.responseCode && check.statusCode.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    
    let alert = check.state !== state && check.lastChecked ? true : false;
    
    let checkTime = Date.now();
    worker.uploadLogs(check, checkOutcome, state, alert, checkTime);

    var newCheck = check;
    newCheck.state = state;
    newCheck.lastChecked = checkTime;

    _data.update('checks', '' + newCheck.id, newCheck, (err) => {
        if(!err){
            if(alert){
                worker.alertUserToStatusChange(newCheck);
            }else{
                console.log('check outcome has not changed, no alert needed');
            }
        }else{
            console.log('Error trying to save update to check');
        }
    })
}

worker.alertUserToStatusChange = (check) => {
    let message = 'Alert: Your check for' + check.method.toUpperCase() + ' ' + check.protocol + '://' + check.url + ' is currently ' + check.state;

    __helper__.sendTwilioSMS(check.userPhone, message, (error) => {
        if(!error){
            console.log('message sent to check user: ', message);
        }else{
            console.log('could not send message to check user');
        }
    });
}

worker.uploadLogs = (check, checkOutcome, state, userAlert, checkTime) => {
    let logData = {
        'check': check,
        'checkOutcome': checkOutcome,
        'state': state,
        'userAlert': userAlert,
        'checkTime': checkTime 
    };

    let logDataString = JSON.stringify(logData);

    __log.appendLogs(check.id, logDataString, (error) => {
        if(!error){
            console.log('logged');
        }else{
            console.log("could not append log data");
        }
    });
}

module.exports = worker;
