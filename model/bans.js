var mongoose = require('mongoose');  
var mongoBansSchema = new mongoose.Schema({
	author : String,
	receiver: String,
	reason: String,
	duration: Number,
	created_at: Number
});
module.exports = mongoose.model('mongo_bans', mongoBansSchema);