/**
* Desenvolvido por Guilherme Sehn
*/

var f = require('./functions');

/* Lista de sessões */
var sessions = {};
var ip_sess = {};

/* Constantes */
var SID_STRING = 'ADVID';
var TIMEOUT = 10 * 60;

/* Funções */
exports.start = function(req, res, callback)
{
	var set_sid = function(sid) {
		sessions[sid]['__timeout'] = f.time() + TIMEOUT; /* Seta ou atualiza data de expiração */
		res.setCookie(SID_STRING, sid); /* Instancia de Cookie */

		var manager = {
			set: function(key, value) {
				if (typeof(key) != 'string' || key == '__timeout' || key == '__ip' || key == '__agent')
				{
					return false;
				}

				sessions[sid][key] = value;

				return true;
			},

			get: function(key) {
				if (typeof(key) != 'string' || key == '__timeout' || key == '__ip' || key == '__agent')
				{
					return null;
				}

				return sessions[sid][key];
			},

			unset: function(key) {
				if (typeof(key) != 'string' || key == '__timeout' || key == '__ip' || key == '__agent')
				{
					return false;
				}

				delete sessions[sid][key];
			}
		};

		callback(manager);
	};

	var create_new_session = function() {
		var ip = f.getIp(req);

		/* Destrói outras sessões do mesmo IP e mesmo browser */
		if (ip_sess[ip] && typeof(sessions[ip_sess[ip]]) == 'object' && sessions[ip_sess[ip]]['__ip'] == ip && sessions[ip_sess[ip]]['__agent'] == req.headers['user-agent'])
		{
			delete sessions[ip_sess[ip]];
		}

		var sid = f.sha1(ip + 'S3SSALT' + Date.now());

		ip_sess[ip] = sid;

		sessions[sid] = {};
		sessions[sid]['__ip'] = ip;
		sessions[sid]['__agent'] = typeof(req.headers['user-agent']) == 'string' ? req.headers['user-agent'] : 'AGENT_NOT_FOUND';

		set_sid(sid);
	};

	var sid_cookie = req.getCookie(SID_STRING);

	if (typeof(sid_cookie) !== 'string' || typeof(sessions[sid_cookie]) !== 'object')
	{
		create_new_session(req);
	}
	else if (sessions[sid_cookie]['__timeout'] < f.time())
	{
		delete sessions[sid_cookie];
		delete ip_sess[f.getIp(req)];

		create_new_session(req);
	}
	else if (sessions[sid_cookie]['__ip'] == f.getIp(req) && sessions[sid_cookie]['__agent'] == req.headers['user-agent'])
	{
		set_sid(sid_cookie); // Atualiza timeout seta cookie novamente
	}
	else
	{
		delete sessions[sid_cookie];
		delete ip_sess[f.getIp(req)];

		create_new_session(req);
	}
};

exports.session_destroy = function(req, res, ck_instance) {
	var sid_cookie = ck_instance.get(SID_STRING);

	if (typeof(sid_cookie) !== 'string' || typeof(sessions[sid_cookie]) !== 'object')
	{
		return false;
	}

	delete sessions[sid_cookie];
	//ck_instance.unset(sid_cookie);

	return true;
};