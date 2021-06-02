const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

let log = {}

log.baseDir = __dirname + '/' + '../.log/'

log.appendLogs = (logFileName, logData, callback) => {
    if(logData){
        fs.open(log.baseDir + logFileName + '.log', 'a', (err, fileDescriptor) => {
            if(fileDescriptor && !err){
                fs.appendFile(fileDescriptor, logData+'\n', (err) => {
                    if(!err){
                        fs.close(fileDescriptor, (err) => {
                            if(!err){
                                callback(false);
                            }else{
                                callback("could not close log file");
                            }
                        });
                    }else{
                        callback("could not append log data to file");
                    }
                });
            }else{
                callback("could not open log file");
            }
        });
    }else{
        callback('Invalid log data');
    }
}

module.exports = log;
