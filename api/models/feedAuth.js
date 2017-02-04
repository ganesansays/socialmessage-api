// Load required packages
var mongoose = require('dynamoose');

// Define Social Post schema
var FeedAuthSchema   = new mongoose.Schema({
  uid: {type: String, required: true}, //Multi Tenant Firebase UID 
  feedHandle: {type: String, required: true}, 
  authentication: {type: Object, required: true},
});

// Export the Mongoose model
module.exports = mongoose.model('FeedAuth', FeedAuthSchema);