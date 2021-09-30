let app = {};

app.config = {
    sessionToken: false,
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
					// console.log(responseText);
                    callback(statusCode, responseText);
                }catch(e){
                    callback(statusCode, false);
                }
            }console.log(responseText);
        }
    }
    
    let payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
}


// bind form
app.bindForm = () => {
	try{
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        let formData = document.querySelector('form');
        let formId = formData.id;
        let formMethod = formData.method;
        let formPath = formData.action;
		document.getElementById('error').style.display = 'hidden';
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
			console.log(__payload);
            if(statusCode !== 200){
				document.getElementById('error').innerText = __payload['Error'];
				document.getElementById('error').style.display = 'block';
            }else{
                app.formResponseProcessor(formId, payload, __payload);
            }
        });
    
    });
	}catch(e){
		console.log(e.message);
	}
}

app.formResponseProcessor = (id, payload, formResponsePayload) => {
    let functionToCall = false;
    if(id == 'accountCreate'){
		// create token payload
		let tokenRequestPayload = {
			phone: payload.phone,
			password: payload.password,
		};

		// request to restapi for session creation
		app.client.request(undefined, '/api/token', 'POST', undefined, tokenRequestPayload, (tokenResStatus, tokenResPayload) => {
			sessionStorage.setItem('_token', JSON.stringify(tokenResPayload));
			sessionStorage.setItem('s', tokenResStatus);
			if(tokenResStatus !== 200){
				document.getElementById('error').innerText = "Sorry, Failed to create session token please try manually";
				document.getElementById('error').style.display = 'block';
				setTimeout(() => { window.location = '/session/create' }, 3000);
			}else{
				// console.log(tokenResPayload);
				localStorage.setItem('token', JSON.stringify(tokenResPayload));
				app.formResponseProcessor('sessionCreate', tokenResPayload, tokenResPayload);	
			}
		});
    }

	if(id == 'sessionCreate'){
		app.setSessionToken(formResponsePayload);
		window.location = '/checks/all';
	}
};

app.setSessionToken = (data) => {

	localStorage.setItem('token', JSON.stringify(data));
	app.config.sessionToken = JSON.stringify(data);
	if(typeof(data) == 'object'){
		app.setLoggedIn(true);
	}else{
		localStorage.removeItem('token');
		app.setLoggedIn(false);
		app.config.sessionToken = false;
	}
};

app.setLoggedIn = (set) => {
	let _t = document.querySelector('body');
	let _c = _t.classList.contains('loggedIn'); 
	set == true ? ( _c == true ? console.log('loggedIn') : _t.classList.add('loggedIn') ) : _t.classList.remove('loggedIn');
};

app.getSessionToken = () => {
	let token = localStorage.getItem('token');
	if(typeof(token) == 'string'){
		try{
			let tokenObj = JSON.parse(token);
			app.config.sessionToken = token;
			if(typeof(tokenObj) == 'object'){
				app.setLoggedIn(true);
			}else{
				app.setLoggedIn(false);
			}
		}catch(e){
			app.config.sessionToken = false;
			app.setLoggedIn(false);
		}
	}
};

app.bindLogoutEvent = () => {
	document.getElementById('sessionLogout').addEventListener('click', (e) => {
		e.preventDefault();
		try{
			let currToken = JSON.parse(app.config.sessionToken);
			currToken = typeof(currToken) == 'object' ? currToken : false;
			console.log(currToken);
			if(currToken){
				let _token = {
					'id': currToken.id,
				};
				app.client.request(undefined, '/api/token', 'DELETE', undefined, _token, (s, rp) => {
					console.log(s, rp);
					app.setSessionToken(false);
					window.location = '/';
				});
			}
		}catch(e){
			console.log(e.message);
		}
	});
};

app.renewToken = (callback) => {
	let token = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
	if(token){
		// renew this token 
		// create new token payload
		let userPayload = {
			'id':token.id,
			'extend': true,
		};

		// make request
		app.client.request(undefined, '/api/token', 'PUT', undefined, userPayload, (s, rp) => {
			if(s !== 200){
				app.setSessionToken(false);
				callback(false);
			}else{
				// success
				app.setSessionToken(rp);
				callback(true);
			}
		});
	}else{
		app.setSessionToken(false);
		callback(false);
	}
};

app.renewTokenWorker = () => {
	setInterval(() => {
		app.renewToken((res) => {
			res ? console.log('token renewed') : console.log(`couldn't renew token`);
		});
	}, 900000)
};

app.init = () => {
    app.bindForm();
	app.getSessionToken();
	app.bindLogoutEvent();
	// give some time 
	// to load files
	setTimeout(app.renewTokenWorker, 350);
}

window.onload = () => {
    app.init();
};
