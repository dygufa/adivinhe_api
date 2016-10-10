var mongoose = require('mongoose');  
var mongoWordsSchema = new mongoose.Schema({
	word : String,
	difficulty: Number,
	used_at: Number,
	created_at: Number
});

module.exports = mongoose.model('mongo_words', mongoWordsSchema);