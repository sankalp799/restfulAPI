const __data__ = require('./data.js');
const __helper__ = require('./helper.js');
const fs = require('fs');
const _config = require('../config');

handler = {}


/************
 *
 * HTML Handlers
 *
 */

// index handler
handler.index = (data, callback) => {
    if(data.method == 'get'){
        let pageData = {
            'head.title':'UpTime Monitoring - Simple',
            'head.description':'Free up time monitoring for HTTP/HTTPs Request',
            'body.class':'index'
        };
        
        __helper__.getTemplate('index', pageData, (error, templateData) => {
            if(templateData && !error){
                __helper__.addMasterPage(templateData, pageData, (error, masterPageData) => {
                    if(masterPageData && !error){
                        //console.log(masterPageData);
                        callback(200, masterPageData, 'html');
                    }else{
                        callback(500, undefined, 'html')
                    }
                });
            }else{
                callback(404, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html')
    }
};


handler.accountCreate = (data, callback) => {
    if(data.method == 'get'){
        let pageData = {
            'head.title':'AccountCreate',
            'head.description':'Free Sign Up for User Account',
            'body.class':'Create Account'
        };
        
        __helper__.getTemplate('accountCreate', pageData, (error, templateData) => {
            if(templateData && !error){
                __helper__.addMasterPage(templateData, pageData, (error, masterPageData) => {
                    if(masterPageData && !error){
                        //console.log(masterPageData);
                        callback(200, masterPageData, 'html');
                    }else{
                        callback(500, undefined, 'html')
                    }
                });
            }else{
                callback(404, undefined, 'html');
            }
        });
    }else{
        callback(405, undefined, 'html')
    }
}


handler.favicon = (data, callback) => {
    if(data.method == 'get'){
        __helper__.getStaticAssets('favicon.ico', (error, data) => {
            if(!error && data){
                callback(200, data, 'favicon');
            }else{
                callback(500);
            }
        });
    }else{
        callback(405);
    }
}

handler.public = (data, callback) => {
    if(data.method == 'get'){
        let path = data.path;
        // console.log('called');
        let trimmedFileName = path.split('/');
        trimmedFileName = trimmedFileName[trimmedFileName.length-1];
        if(trimmedFileName.length > 0){
            __helper__.getStaticAssets(trimmedFileName, (error, data) => {
                if(!error && data){
                    let contentType = 'plain';

                    if(trimmedFileName.indexOf('.css') > -1){
                        contentType = 'css';
                        console.log('css');
                    }
                    if(trimmedFileName.indexOf('.ico') > -1){
                        contentType = 'favicon';
                    }
                    if(trimmedFileName.indexOf('.jpg') > -1){
                        contentType = 'jpg';
                    }
                    if(trimmedFileName.indexOf('.png') > -1){
                        contentType = 'png';
                    }
                    if(trimmedFileName.indexOf('.js') > -1){
                        contentType = 'javascript';
                    }
           //         console.log(contentType);
                    callback(200, data, contentType);
                }else{
                    callback(404);
                }
            });
        }else{
            callback(404);
        }
    }else{
        callback(405);
    }
}




/****************
 *
 * JSON-API Handlers
 *
 */
handler.ping = (data, callback) => {
    callback(200);
}

handler.notFound = (data, callback) => {
    callback(404);
}


// user handlers
handler.user = (data, callback) => {
    console.log(data.method);
    let allowedMethods = ['get', 'post', 'put', 'delete'];
    if(allowedMethods.indexOf(data.method.toLowerCase()) > -1){
        handler._user[data.method](data, callback);
    }else{
        callback(403, {"Error": "Invalid method"});
    }
}

handler._user = {};

//create user handler
handler._user.post = async (data, callback) => {
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.length == 10 ? data.payload.phone : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    let agreement = typeof(data.payload.agreement) == 'boolean' && data.payload.agreement ? true : false;
    if(firstName && lastName && password && agreement && phone){
        __data__.read('user', '' + phone, (err, data) => {
            if(err){
                 let hash = __helper__.hash(password);
                 if(hash){ 
                     let newUser = {
                     "firstName":firstName,
                     "lastName": lastName,
                     "password": hash,
                     "phone": phone,
                     "agreement": agreement 
                     };
                     __data__.create('user', '' + phone, newUser, (error) => {
                         if(!error){
                             callback(200);
                         }else
                             callback(501, {'Error': 'Internal Server Error'});
                     }); 
                 }else{
                     callback(500, {"Error": "Internal Server Problem"});
                 }
            }else{
                callback(403, {"Error" : "User already exist try diff phone number"});
            }
        });
    }else{
        // console.log(data.payload);
        //console.log(data.payload.firstName, data.payload.agreement, data.payload.phone);
        //console.log(firstName, lastName, password, agreement, phone);
        callback(400, {"Error" : "Invalid input"});
    }
}


handler._user.get = (data, callback) => {
    let phone = typeof(data.queryString.phone) == 'string' && data.queryString.phone.toString().length == 10 ? data.queryString.phone : false;
    let token = typeof(data.header.token) == 'string' && data.header.token ? data.header.token : false;

    handler._token.verify(token, phone, (verifyToken) => {
        if(verifyToken){
               if(phone){
                 __data__.read('user', '' + phone, (error, data) => {
                     if(!error && data){
                         let user = __helper__.parseJsonData(data);
                         delete user.password;
                         callback(200, user);
                     }else{
                         callback(404, {"Error": "User do not exist"});
                     }
                 });
             }else{
                 callback(400, {"Error": "Invalid Input"});
             }
        }else{
            callback(400, {'Error':'Invalid Token'});
        }
    });

}

handler._user.put = (data, callback) => { 
    let phone = typeof(data.payload.phone) == 'number' && data.payload.phone.toString().length == 10 ? data.payload.phone : false;
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

    let token = typeof(data.header.token) == 'string' && data.header.token ? data.header.token : false;

    handler._token.verify(token, phone, (result) => {
        if(result){

    if(phone && password && (firstName || lastName)){
        __data__.read('user', '' + phone, (error, data) => {
            if(!error && data){
                let user = __helper__.parseJsonData(data);
                if(firstName){
                    user.firstName = firstName;
                }
                if(lastName){
                    user.lastName = lastName;
                }
                let hash = __helper__.hash(password);
                if(hash == user.password){
                    __data__.update('user', '' + phone, user, (error) => {
                        if(!error){
                            callback(200);
                        }else{
                            callback(500, {"Error":"Internal Server Problem"});
                        }
                    });
                }else{
                    callback(400, {"Error": "Incorrect Password"});
                }
            }else{
                callback(404, {"Error":"User do not exist"});
            }
        });
    }else{
        callback(400, {"Error" : "Invalid Input"});
    }
        }else{
            callback(400, {'Error':'Invalid Token'});
        }
    });

}

handler._user.delete = (data, callback) => {

    let phone = typeof(data.payload.phone) == 'number' && data.payload.phone.toString().length == 10 ? data.payload.phone : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

    let token = typeof(data.header.token) == 'string' && data.header.token ? data.header.token : false;

    handler._token.verify(token, phone, (result) => {
        if(result){

    if(phone && password){
        __data__.read('user', '' + phone, (error, data) => {
            if(!error && data){
                let user = __helper__.parseJsonData(data);
                let hash = __helper__.hash(password);
                if(hash == user.password){
                    __data__.remove('user', '' + phone, (err) => {
                        if(!err){
                            callback(200);
                        }else{
                            callback(500, {'Error': 'Could not remove user please try again later'});
                        }
                    });
                }else{
                    callback(400, {"Error": "Incorrect Password"});
                }
            }else{
                callback(404, {"Error":"User do not exist"});
            }
        });
    }else{
        callback(400, {"Error" : "Invalid Input"});
    }
        }else{
            callback(400, {'Error':'Invalid Token'});
        }
    });
}



/********************
 * TOKENS-HANDLER
 */
handler.token = (data, callback) => {
	console.log(data);
    let allowedMethods = ['get', 'post', 'put', 'delete'];                      
    if(allowedMethods.indexOf(data.method.toLowerCase()) > -1){
        handler._token[data.method](data, callback);
    }else{
        callback(405, {"Error": "Invalid Request"});
    }
}

handler._token = {}

handler._token.post = (data, callback) => {
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.toString().length == 10 ? data.payload.phone : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
    if(phone && password){
        __data__.read('user', '' + phone, (error, data) => {
            if(!error && data){
                let user = __helper__.parseJsonData(data);
                let hash = __helper__.hash(password);
                if(hash == user.password){
                    let newToken = {
                        'tokenID': __helper__.createTokenId(phone),
                        'phone': phone,
                        'expireBy': Date.now() + (60 * 60 * 1000)
                    };
                    __data__.create('tokens', '' + newToken.tokenID, newToken, (err) => {
                        if(!err){
							console.log(newToken);
                            callback(200, newToken);
                        }else{
                            callback(500, {'Error':'Could not create token please try again later'});
                        }
                    });
                }else{
					console.log('1');
                    callback(400, {"Error": "Incorrect Password"});
					
				}
            }else{
				console.log('2');
                callback(404, {"Error":"User do not exist"});
            }
        });
    }else{
		console.log('3');
        callback(400, {"Error" : "Incomplete Fields"});
    }
}


handler._token.get = (data, callback) => {
    let id = typeof(data.queryString.id) == 'string' && data.queryString.id.trim().length > 10 ? data.queryString.id : false;
    if(id){
        __data__.read('tokens', '' + id, (err, data) => {
            if(data && !err){
                let user_token = __helper__.parseJsonData(data);
                callback(200, user_token);
            }else{
                callback(404, {'Error':'Token do not exist'});
            }
        });
    }else{
        callback(400, {'Error': 'Invalid Input'});
    }
}

handler._token.put = (data, callback) => {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 10 ? data.payload.id : false;
    if(id){
        __data__.read('tokens', '' + id, (err, data) => {
            if(data && !err){
                let user_token = __helper__.parseJsonData(data);
                user_token.expireBy = Date.now() + (1000 * 60 * 60);
                console.log(Date.now(), '--', user_token);
                console.log(Date.now() < user_token.expireBy);
                __data__.update('tokens', '' + id, user_token, (err) => {
                    if(!err){
                        console.log('updated token');
                        callback(200);
                    }else{
                        callback(500, {'Error':'Internal Server Problem'});
                    }
                });
            }else{
                callback(404, {'Error':'Token do not exist'});
            }
        });
    }else{
        callback(400, {'Error': 'Invalid Input'});
    }
}

handler._token.delete = (data, callback) => {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 10 ? data.payload.id : false;
    if(id){
        if(fs.existsSync(__data__.basePath + 'tokens/' + id + '.json')){
            __data__.remove('tokens', '' + id, (err) => {
                if(!err){
                    callback(200);
                }else{
                    callback(500, {'Error': 'Internal Server Problem'});
                }
            });
        }else{
            callback(404, {'Error':'token do not exist'});
        }
    }else{
        callback(400, {'Error':'Invalid Input'});
    }
}


handler._token.verify = (id, phone, callback) => {
    __data__.read('tokens', '' + id, (err, data) => {
        if(data && !err){
            let token = __helper__.parseJsonData(data);
            console.log(id, typeof(id));
            console.log(token.expireBy, typeof(token.expireBy), Date.now(), token.expireBy > Date.now());
            console.log(phone, token.phone, typeof(phone), typeof(token.phone));
            if(token.phone == phone && token.expireBy > Date.now()){
                callback(true);
            }else{
                callback(false);
            }
        }else{
            callback(false);
        }
    });
}



/***************
 * checks
 */
handler.checks = (data, callback) => {
    let allowedMethods = ['get', 'post', 'put', 'delete'];
    if(allowedMethods.indexOf(data.method) > -1){
        handler._check[data.method](data, callback);
    }else{
        callback(405);
    }
}

handler._check = {}


handler._check.post = (data, callback) => {
    let protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    let method = typeof(data.payload.url) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
    let timeoutSec = typeof(data.payload.timeoutSec) == 'number' && data.payload.timeoutSec % 1 === 0 && data.payload.timeoutSec >= 1 && data.payload.timeoutSec <= 5 ? data.payload.timeoutSec : false;

    if(protocol && url && method && successCode && timeoutSec){
        let token = typeof(data.header.token) == 'string' ? data.header.token : false;

        __data__.read('tokens', '' + token, (err, data) => {
            if(!err && data){
                let user_token = __helper__.parseJsonData(data);
                
                __data__.read('user', ''+user_token.phone, (error, data) => {
                    if(!error && data){
                       
                         let user = __helper__.parseJsonData(data);
                        console.log(typeof(user.checks), user, typeof(user));
                         let checks = typeof(user.checks) == 'object' && user.checks instanceof Array ? user.checks : [];

                         if(checks.length < _config.checksLimit){

                             let checkID = __helper__.createTokenId(user.phone);
                             let user_check = {
                                "id": checkID,
                                 "userPhone": user.phone,
                                 "protocol": protocol,
                                 "url": url,
                                 "method": method,
                                 "successCode": successCode,
                                 "timeoutSec": timeoutSec 
                             };

                             user.checks = checks;
                             user.checks.push(checkID);

                             __data__.update('user', '' + user.phone, user, (err) => {
                                 if(!err){

                                     __data__.create('checks', '' + checkID, user_check, (error) => {
                                         if(!error){
                                             callback(200);
                                         }else{
                                             callback(500, {'Error':'could not create check please try again later'});
                                         }
                                     });

                                 }else{
                                     callback(500, {'Error':'could not update user file'});
                                 }
                             });


                         }else{
                            callback(403, {'Error':'User reached max checks limit'});
                         }
                    }else{
                        callback(400, {'Error':'User do not exist'});
                    }
                });

            }else{
                callback(404, {'Error': 'token do not eixst'});
            } 
        });

    }else{
        callback(400, {'Error': 'Missing inputs'});
    }
}




handler._check.put = (data, callback) => {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 10 ? data.payload.id : false;
    if(id){
        let protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
        let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
        let method = typeof(data.payload.url) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
        let successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode instanceof Array && data.payload.successCode.length > 0 ? data.payload.successCode : false;
        let timeoutSec = typeof(data.payload.timeoutSec) == 'number' && data.payload.timeoutSec % 1 === 0 && data.payload.timeoutSec >= 1 && data.payload.timeoutSec <= 5 ? data.payload.timeoutSec : false;
   
        let token = typeof(data.header.token) == 'string' && data.header.token ? data.header.token : false;

        __data__.read('checks', '' + id, (err, data) => {
            if(!err && data){
                let user_check = __helper__.parseJsonData(data);
                
                handler._token.verify(id, user_check.userPhone, (verify) => {
                    if(verify){
                        if(protocol){
                            user_check.protocol = protocol;
                        }
                        if(url){
                            user_check.url = url;
                        }
                        if(method){
                            user_check.method = method;
                        }
                        if(successCode){
                            user_check.successCode = successCode;
                        }
                        if(timeoutSec){
                            user_check.timeoutSec = timeoutSec;
                        }

                        __data__.update('checks', '' + user_check.id, user_check, (err) => {
                            if(!err){
                                    callback(200);
                            }else{
                                callback(500, {'Error':'could not update check please try again later'});
                            }
                        });

                    }else{
                        callback(400, {'Error': 'token has been expired'});
                    }
                });

            }else{
                callback(400, {'Error':'check do not exist'});
            }
        })
    }else{
        callback(400, {'Error':'invalid input'});
    }
}

handler._check.get = (data, callback) => {
    let id = typeof(data.queryString.id) == 'string' && data.queryString.id.trim().length > 10 ? data.queryString.id : false;

    if(id){
        __data__.read('checks', '' + id, (error, data) => {
            if(!error && data){
                let user_check = __helper__.parseJsonData(data);
                let token = typeof(data.header.token) == 'string' && data.header.token ? data.header.token : false;
                handler._token.verify(token, user_check.userPhone + '', (state) => {
                    if(state){
                        callback(200, user_check);
                    }else{  
                        callback(403, {'Error':'Token is expired'});
                    }
                });
            } else{
                callback(404, {'Error': 'check do not exist'});
            }
        });
    }else{
        callback(400, {'Error':'Invalid input'});
    }
}

handler._check.delete = (data, callback) => {
    
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 10 ? data.payload.id : false;

    if(id){
        __data__.read('checks', '' + id, (err, data) => {
            if(data && !err){
                let user_check = __helper__.parseJsonData(data);
                let token = typeof(data.header.token) == 'string' && data.header. token ? data.header.token : false;

                if(token){
                    handler._token.verify(token, user_check.userPhone, (state) => {
                        if(state){
                            __data__.read('user', user_token.userPhone + '', (err, data) => {
                                if(data && !err){
                                    let user = __helper__.parseJsonData(data);
                                    user.checks = user.checks.filter((value) => {
                                        return value != id;
                                    });
                                    
                                    __data__.update('user', user.phone + '', user, (err) => {
                                        if(!err){
                                            __data__.remove('checks', '' + id, (err) => {
                                                if(!err){
                                                    callback(200);
                                                }else{
                                                    callback(500, {'Error': 'could not remove check data please try again later'});
                                                }
                                            });
                                        }else{
                                            callback(500, {'Error': 'could not update user data'});
                                        }
                                    });

                                }else{
                                    callback(403, {'Error':'user do not exist'});
                                }
                            });
                        }else{
                            callback(403, {'Error':'token expired'});
                        }
                    });
                }else{
                    callback(400, {'Error':'Invalid token id'});
                }
            }else{
                callback(400, {'Error':'check do not exist'});
            }
        });

    }else{
        callback(400, {'Error':'invalid input'});
    }
}


module.exports = handler;
