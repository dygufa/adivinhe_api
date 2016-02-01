var mongoose = require('mongoose');  
var mongoContactsSchema = new mongoose.Schema({
	author : String,
	subject: Number,
	content: String,
	viewed: Boolean,
	created_at: Number
});
module.exports = mongoose.model('mongo_contacts', mongoContactsSchema);