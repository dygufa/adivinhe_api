var mongoose = require('mongoose'),
	f = require('../lib/functions'),
	mongoResourceLogs = mongoose.model('mongo_resource_logs');

exports.mem_mb = 0;
exports.count_online_users = 0;

var mem = process.memoryUsage();
setInterval(function () {
  mem = process.memoryUsage();  
  exports.mem_mb = Math.round(mem.rss/(1024*1024));
}, 10*1000);

setInterval(function () {
	newResourceLog = new mongoResourceLogs();
	newResourceLog.memory = exports.mem_mb;
	newResourceLog.online_users = exports.count_online_users;
	newResourceLog.created_at = f.time();
	newResourceLog.save();
}, 60*5*1000);