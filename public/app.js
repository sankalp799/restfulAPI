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
                console.log('Error:', __payload);
            }else{
                console.log(statusCode);
                app.formResponseProcessor(formId, payload, __payload);
            }
        });
    
    });
}

app.formResponseProcessor = (id, payload, formResponsePayload) => {
    let functionToCall = false;
    if(id == 'accountCreate'){
        console.log('200 ok');
    }
};

app.init = () => {
    app.bindForm();
}

window.onload = () => {
    app.init();
};
