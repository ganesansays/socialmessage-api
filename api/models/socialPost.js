// Load required packages
var mongoose = require('mongoose');

// Define Social Post schema
var SocialPostSchema   = new mongoose.Schema({
  uid: {type: String, required: true}, //Multi Tenant Firebase UID 
  feedId: {type: mongoose.Schema.ObjectId, required: true},
  profileId: {type: String, required: true},
  profileName: {type: String, required: true},
  profileImageUrl: {type: String, required: true},
  postText: { type: String },
  postMediaUrl: String,
  postMediaType: {
    type: String,
    enum : ['none','image', 'video', 'audio'],
    default : 'none'
  },
  postedOn: { type: Date, required: true },
  rawPost: { type: Object, required: true },
  tags: {type: [String]},
  metaData: {type: Object},
  approvalStatus: {
    type: String,
    enum : ['new','approved', 'rejected', 'deleted'],
    default : 'new'
  }
});

// Export the Mongoose model
module.exports = mongoose.model('SocialPost', SocialPostSchema);