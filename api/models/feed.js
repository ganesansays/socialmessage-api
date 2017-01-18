// Load required packages
var mongoose = require('mongoose');

// Define Social Post schema
var FeedSchema   = new mongoose.Schema({
  uid: {type: String, required: true}, //Multi Tenant Firebase UID 
  feedName: {type: String, required: true}, 
  feedType: {
      type: String,
      enum: ['none', 'facebook', 'twitter'],
      default: 'none'
  },
  //authentication: {type: Object, required: true},
  feedStatus: {
      type: String,
      enum: ['scheduled', 'stopped'],
      default: 'scheduled'
  },
  hashTag: String
});

// Export the Mongoose model
module.exports = mongoose.model('Feed', FeedSchema);