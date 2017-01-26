// Load required packages
var mongoose = require('mongoose');

// Define Social Post schema
var FeedAuthSchema   = new mongoose.Schema({
  uid: {type: String, required: true},
  feedId: {type: String, required: true}, //Multi Tenant Firebase UID 
  authentication: {type: Object, required: true},
});

// Export the Mongoose model
module.exports = mongoose.model('FeedAuth', FeedAuthSchema);