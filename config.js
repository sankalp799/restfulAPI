let environment = {}

//default environment
environment.defaultStage = {
    'HTTP_port': 3000,
    'HTTPs_port': 3100,
    'envName': 'defaultStage',
    'hashSecret': 'DefaultHashSecret',
    'checksLimit':5,
    'twilio': {
        'accountSid': 'AC93bdb7e3acd520ea82c8e14ef81b2970',
        'authToken': 'e46a2fa9efde4f09482a36658a474677',
        'fromPhone': '7043074748'
    },
    'templateGlobals': {
        'appName': 'UpTimeChecker',
        'companyName': 'NotARealCompany, Inc',
        'yearCreated': '2018',
        'baseUrl': 'http://localhost:3000'
    }
};

//user environment
environment.user = {
    'HTTP_Serverport': 4000,
    'HTTPs_port': 4100,
    'envName': 'User',
    'hashSecret': 'userHashSecret',
    'checksLimit': 5, 
    'twilio': {
        'accountSid': 'AC93bdb7e3acd520ea82c8e14ef81b2970',
        'authToken': 'e46a2fa9efde4f09482a36658a474677',
        'fromPhone': '7043074748'
    },
    'templateGlobals': {
        'appName': 'UpTimeChecker',
        'companyName': 'NotARealCompany, Inc',
        'yearCreated': '2018',
        'baseUrl': 'http://localhost:4000'
    }
};

let choosenEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

let environmentToExport  = typeof(environment[choosenEnvironment]) == 'object' ? environment[choosenEnvironment] : environment.defaultStage;

module.exports = environmentToExport;
