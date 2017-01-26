// Load required packages
var mongoose = require('mongoose');

// Define Social Post schema
var FeedSchema   = new mongoose.Schema({
  uid: {type: String, required: true}, //Multi Tenant Firebase UID 
  feedName: {type: String, required: true},
  feedHandle: {
      type: String, 
      required: true,
      validate: {
          validator: function(v) {
              var re = /[^\s-]/;
              return ( v === null || v.trim().length < 1 || re.test(v));
          }, 
          message: "Feed handle cannot have space"
      }
    }, 
  feedType: {
      type: String,
      enum: ['none', 'facebook', 'twitter', 'instagram'],
      default: 'none'
  },
  //authentication: {type: Object, required: true},
  feedStatus: {
      type: String,
      enum: ['scheduled', 'stopped'],
      default: 'scheduled'
  },
  hashTag: { type: String },
  scrappedSince: {type: Object}
});

// Export the Mongoose model
module.exports = mongoose.model('Feed', FeedSchema);