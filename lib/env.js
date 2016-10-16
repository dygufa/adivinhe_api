// It only uses env.js file if the env variable are not defined on the system
if(!process.env.ADIVINHE_SALTING) {
	var env = require('../env.js')
}

exports.SALTING = process.env.ADIVINHE_SALTING,
exports.RECAPTCHA_PRIVATEKEY = process.env.ADIVINHE_RECAPTCHA_PRIVATEKEY,
exports.FACEBOOK_ID = process.env.ADIVINHE_FACEBOOK_ID,
exports.FACEBOOK_CLIENTSECRET = process.env.ADIVINHE_FACEBOOK_CLIENTSECRET,
exports.NODEPATH = process.env.ADIVINHE_NODEPATH,
exports.LOCALHOST = true;
