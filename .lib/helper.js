const crypto = require('crypto');
const https = require('https');
const _config = require('../config.js');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');


let helper = {}

helper.hash = (raw_password) => {
    if(raw_password.trim().length > 0){
        let hash_password = crypto.createHmac('sha256', _config.hashSecret).update(raw_password).digest('hex');
        return hash_password;
    }else{
        return false;
    }
}


helper.parseJsonData = (data) => {
    try{
        let jsonObj = JSON.parse(data);
        return jsonObj;
    }catch{
        return {};
    }
}

helper.createTokenId = (user_phone) => {
    return (user_phone + '-' + Math.floor(Math.random() * (9999)));
}


helper.sendTwilioSMS = (phone, message, callback) => {
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
    message = typeof(message) == 'string' && message.trim().length > 0 ? message : false;

    if(phone && message){
        let payload = {
            'From': _config.twilio.fromPhone,
            'To': '+1' + phone,
            'Body': message 
        };

        let stringPayload = querystring.stringify(payload);

        let request = {
            'protocol':'https',
            'hostname':'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + _config.twilio.accountSid + '/Message.json',
            'auth': _config.twilio.accountSid + ':' + _config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-from-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        let req = https.request(request, (response) => {
            let status = response.statusCode;

            if(status == 200 || status == 201){
                callback(false);
            }else{
                callback('Status Code return was: ' + status);
            }
        });

        req.on('error', (e) => {
            callback(e);
        });

        req.write(stringPayload);

        req.end();
    }else{
        callback('Invalid or missing input');
    }
}


helper.getTemplate = (templateName, data, callback) => {
    templateName = typeof(templateName) == 'string' && templateName.trim().length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};

    if(templateName){
        let templatePath = path.join(__dirname + '/' + '../templates/');
        fs.readFile(templatePath + templateName + '.html', 'utf8', (error, str) => {
            if(!error && str){
                let finalTemplateData = helper.interpolate(str, data);
                callback(false, finalTemplateData);    
            }else{
                callback("Error : could not read template data");
            }
        }); 
    }else{
        callback("Error : template not found");
    }
}

helper.addMasterPage = (string, data, callback) => {
    string = typeof(string) == 'string' && string.length > 0 ? string : false;
    data = typeof(data) == 'data' && data !== null ? data : {};
    helper.getTemplate('header', data, (error, header) => {
        if(header && !error){
            helper.getTemplate('footer', data, (error, footer) => {
                if(!error && footer){
                    let pageData = header + string + footer;
                    //  console.log(pageData);
                    callback(false, pageData);
                }else{
                    callback('Error : Could not find footer');
                }
            });
        }else{
            callback('Error : Could not find header');
        }
    });
}



helper.interpolate = (string, data) => {
    string = typeof(string) == 'string' && string.length > 0 ? string : '';
    data = typeof(data) == 'object' && data !== null ? data : false;
	let globalEnv = _config.templateGlobals;
	// apply template data
	Object.keys(data).forEach(k => {
		string = string.replace(`{${k}}`, data[(k + '')]);
		// console.log(k, ' - ', data[k], ' - ', string.indexOf(`{${k}}`));
	});

	// apply global variables
	Object.keys(globalEnv).forEach(k => {
		// console.log(k, ' - ', globalEnv[k]);
		// console.log(string.indexOf(`{${k}}`));
		string = string.replace(`{${k}}`, globalEnv[k]);
	});
	
	// console.log(data, globalEnv);	
    // console.log(string);
    return string;
}

helper.getStaticAssets = (fileName, callback) => {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if(fileName){
        let filePath = path.join(__dirname, '/', '../public/');
        fs.readFile(filePath+fileName, (error, data) => {
            if(data && !error){
            
                callback(false, data);
            }else{
            //    console.log('could not find public');
                callback('could not find public file');
            }
        });
    }else{
        // callback('invalid public file');
        callback('invalid file name');
    }
}


module.exports = helper;
