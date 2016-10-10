var mongoose = require('mongoose');  
var mongoUsersSchema = new mongoose.Schema({
	nick : String,
	nick_lower : String,
	name : String,
	privilege: String,
	client_id : String,
	password: String,
	email : String,
	photo: String,
	register_type: Number,
	updated_at: Number,
	created_at: Number,
	score: Number,
	rounds: Number,
	first_hit: Number
});

module.exports = mongoose.model('mongo_users', mongoUsersSchema);