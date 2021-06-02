const crypto = require('crypto');
const https = require('https');
const _config = require('../config.js');
const querystring = require('querystring');

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
        console.log("could not parse json data");
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


module.exports = helper;
