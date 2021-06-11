let app = {};

app.config = {
    'sessionToken': false,
};

app.client = {};

app.client.request = (headers, path, method, queryStringObj, payload, callback) => {

    headers = typeof(headers) == 'object' && headers !== null ? headers : {};
    path = typeof(path) == 'string' ? path : '/';
    method = typeof(method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method : 'GET';
    queryStringObj = typeof(queryStringObj) == 'object' && queryStringObj !== null ? queryStringObj : {};
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : null;

    
    // concat url
    let counter = 0;
    let reqUrl = path + '?';
    for(let key in queryStringObj){
        if(queryStringObj.hasOwnProperty(key)){
            counter++;

            if(counter > 1){
                reqUrl += '&';
            }

            reqUrl += key + '=' + queryStringObj[key];
        }
    }

    let xhr = new XMLHttpRequest();
    xhr.open(method, reqUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');


    // add user header to AJAX REQUEST
    for(let header in headers){
        if(headers.hasOwnProperty(header)){
            xhr.setRequestHeader(header, headers[header]);
        }
    }

    // set user config token to xml request headers
    if(app.config.sessionToken){
        xhr.setRequestHeader('token', app.config.sessionToken.id);
    }

    xhr.onreadystatechange = () => {
        if(xhr.readyState == XMLHttpRequest.DONE){
            let statusCode = xhr.status;
            let responseText = xhr.responseText;

            if(callback){
                try{
                    responseText = JSON.parse(responseText);
                    callback(statusCode, responseText);
                }catch{
                    callback(statusCode, false);
                }
            }
        }
    }
    
    let payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
}


// bind form
app.bindForm = () => {
    if(document.querySelector('form')){
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        let formData = document.getElementById('accountCreate');
        let formId = formData.id;
        let formMethod = formData.method;
        let formPath = formData.action;

        let payload = {};
        let Elements = formData.elements;
        //console.log(Elements);
        for(let i=0; i<Elements.length; i++){
            if(Elements[i].type !== 'submit'){
                let value = Elements[i].type == 'checkbox' ? Elements[i].checked : Elements[i].value;
                payload[Elements[i].name] = value;
            }
        }
        
    
        app.client.request(undefined, formPath, formMethod, undefined, payload, (statusCode, __payload) => {
            if(statusCode !== 200){
                let error = typeof(__payload.Error) == 'string' ? __paload.Error : 'An Error Occured Please try again later';
                document.querySelector('#'+formId+' .formError').innerHTML = error;
                document.querySelector('#'+formId+' .formError').style.display = 'block';
            }else{
                console.log(statusCode);
                app.formResponseProcessor(formId, payload, __payload);
            }
        });
    });
    }
}

app.formResponseProcessor = (id, payload, formResponsePayload) => {
    let functionToCall = false;
    if(id == 'accountCreate'){
        let newPayload = {
            'phone': payload.phone,
            'password': payload.password
        };
        
        app.client.request(undefined, 'api/token', 'POST', undefined, newPayload, (status, responsePayload) => {
            if(status !== 200){
                console.log('failed to create token');
            }else{
                app.setSessionToken(responsePayload);
                window.location = '/checks/all';
            }
        });
    }

    if(id == 'sessionCreate'){
        app.setSessionToken(formResponsePayload);
        window.location = '/checks/all';
    }

};


app.setSessionToken = (token) => {
    if(token){
        app.config.sessionToken = token;
        let tokenString = JSON.stringify(token);
        localStorage.setItem('token', tokenString);
        if(typeof(token) == 'object'){
            app.setLoggedInClass(true);
        }else{
            app.setLoggedInClass(false);
        }
    }
};

app.getSessionToken = () => {
    let sessionToken_t = localStorage.getItem('token');
    if(typeof(sessionToken_t) == 'string'){
        try{
            let token_t = JSON.parse(sessionToken_t);
            if(typeof(token_t) == 'object'){
                app.setLoggedInClass(true);
            }else{
                app.setLoggedInClass(false);
            }
        }catch(e){
            app.config.sessionToken = false;
            app.setLoggedInClass(false);
        }
    }
};


app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};



app.renewSessionToken = (callback) => {
    let currentToken = app.config.sessionToken;
    if(typeof(currentToken) == 'object'){
        let update = {
            'id':currentToken.id,
            'expand':true 
        };
        app.client.request(undefined, 'api/token', 'PUT', undefined, update, (s, p) => {
            if(s == 200){
                let tokenQueryString = {'id':currentToken.id};
                app.client.request(undefined, 'api/token', 'GET', tokenQueryString, undefined, (status, payload) => {
                    if(status == 200){
                        app.setSessionToken(payload);
                        callback(false);
                    }else{
                        app.setLoggedInClass(false);
                        callback(true);
                    }
                });
            }else{
                app.setLoggedInClass(false);
                callback(true);
            }
        });
    }else{
        app.setLoggedInClass(false);
        callback(true);
    }
};


app.tokenRenewLoop = () => {
    setInterval(() => {
        app.renewSessionToken((done) => {
            if(!done){
                console.log('Session Token Renewd @', Date.now());
            }else{
                console.log('Failed to Renew Session Token');
            }
        });
    }, 1000 * 60);
};



app.init = () => {
    app.bindForm();
    app.getSessionToken();
    app.tokenRenewLoop();
}

window.onload = () => {
    app.init();
};
