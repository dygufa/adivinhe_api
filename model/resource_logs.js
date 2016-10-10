var mongoose = require('mongoose');  
var mongoResourceLogsSchema = new mongoose.Schema({
	memory: Number,
	online_users: Number,
	created_at: Number
});
module.exports = mongoose.model('mongo_resource_logs', mongoResourceLogsSchema);