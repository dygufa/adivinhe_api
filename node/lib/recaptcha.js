var qs = require('querystring'),
    http = require('http');

exports.verify = function(ip, challenge, response, callback) {
	var data = {};	
	data['privatekey'] = env.RECAPTCHA_PRIVATEKEY;
	data['remoteip'] = ip;
	data['challenge'] = challenge;
	data['response'] = response;
    var data_qs = qs.stringify(data);
    var recaptcha = http.createClient(80, 'www.google.com');
    var request = recaptcha.request('POST', '/recaptcha/api/verify', {
        host:             'www.google.com',
        'Content-Length': data_qs.length,
        'Content-Type':   'application/x-www-form-urlencoded'
    });

    request.on('response', function(response) {
        var body = '';
        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            //console.log(body);
			callback(body);
        });
    });
    request.write(data_qs, 'utf8');
    request.end();
};