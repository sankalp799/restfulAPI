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


log.list = (includeCompressedLogs, callback) => {
    fs.readdir(log.baseDir, (err, data) => {
        if(!err && data && data.length > 0){
            let fileNames = [];
            data.forEach((logFile) => {
                if(logFile.indexOf('.log') > -1){
                    fileNames.push(logFile.replace('.log',''));
                }

                if(logFile.indexOf('.gz.b64') > -1 && includeCompressedLogs){
                    fileNames.push(logFile.replace('.gz.b64', ''));
                }
            });
        
            callback(false, fileNames);
        }else{
            callback('no logs files found');
        }
    });
}

log.compress = (logId, newFileId, callback) => {
    let sourceFile = logId + '.log';
    let destFile = newFileId + '.gz.b64';

    fs.readFile(log.baseDir + sourceFile , 'utf8', (error, inputString) => {
        if(!error && inputString){
            zlib.gzip(inputString, (err, buffer) => {
                if(buffer && !err){
                    fs.open(log.baseDir + destFile, 'wx', (error, fileDescriptor) => {
                        if(!error && fileDescriptor){
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), (error) => {
                                if(!error){
                                    fs.close(fileDescriptor, (error) => {
                                        if(!error){
                                            callback(false);
                                        }else{
                                            callback(error);
                                        }
                                    });
                                }else{
                                    callback(error);
                                }
                            });
                        }else{
                            callback(error);
                        }
                    });
                }else{
                    callback(err);
                }
            });
        }else{
            callback(error);
        }
    });
}


log.decompress = (fileId, callback) => {
    let fileName = fileId + '.gz.b64';
    fs.readFile(log.baseDir + fileName, 'utf8', (error, string) => {
        if(string && !error){
            let inputBuffer = Buffer.from(string, 'base64');
            zlib.unzip(inputBuffer, (error, outputBuffer) => {
                if(!error && outputBuffer){
                    let str = outputBuffer.toString();
                    callback(false, str);
                }else{
                    callback(error);
                }
            });
        }else{
            callback(error);
        }
    });
}


log.truncate = (logId, callback) => {
    fs.truncate(log.baseDir + logId + '.log',0,(error) => {
        if(!error){
            callback(false);
        }else{
            callback(error);
        }
    });
}

module.exports = log;
