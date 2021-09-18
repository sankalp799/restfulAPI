const fs = require('fs');
const path = require('path');

let _data = {};

_data.basePath = __dirname + '/../.data/';

_data.create = (directory, filename, data, callback) => {
    fs.open(_data.basePath + directory + '/' + filename + '.json', 'wx', (error, fileDescriptor) => {
        if(!error && fileDescriptor){
            let stringData = JSON.stringify(data);
            // write data to file
            fs.writeFile(fileDescriptor, stringData, (error) => {
                if(!error){
                    fs.close(fileDescriptor, (error) => {
                        if(!error){
                            callback(false);
                            console.log("file create successfully");
                        }else{
                            callback('could not close file but, data is written');
                        }
                    });
                }else{
                    console.log(error.message);
                    callback('could not save data to file please try again later');
                }
            });
        }else{
            console.log(error.message);
            callback('Could not open file please try again later');
        }
    });
}


_data.read = (directory, filename, callback) => {
    fs.readFile(_data.basePath + directory + '/' + filename + '.json', 'utf8', (error, data) => {
        if(!error && data){
            callback(false, data);
        }else{
            callback("could not read data please try again later OR File may not exist");
        }
    });
}


_data.update = (directory, filename, update, callback) => {
    let data = JSON.stringify(update);
    fs.writeFile(_data.basePath + directory + '/' + filename + '.json', data, (error) => {
        if(!error){
            callback(false);
        }
        else{
            console.log(error);
            callback('could not update file data please try again later');
        }
    });
}

_data.remove = (directory, file, callback) => {
    let filePath = _data.basePath + directory + '/' + file + '.json';
    if(fs.existsSync(filePath)){
        fs.unlink(filePath, (error) => {
            if(!error)
                callback(false);
            else
                callback('Could not remove file please try again later');
        });
    }else{
        callback('File do not exist');
    }
}


_data.list = (directory, callback) => {
    fs.readdir(_data.basePath + '/../.data/' + directory + '/', (err, data) => {
        if(!err && data && data.length > 0){
           let fileName = [];
            data.forEach((file) => {
                fileName.push(file.replace('.json', ''));
            });
            callback(false, fileName);
        }else{
            callback(err, data);
        }
    });
}

module.exports = _data;
