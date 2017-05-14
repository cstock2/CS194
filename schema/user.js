/**
 * Created by CodyWStocker on 4/8/17.
 * Represents a user of the network
 */

var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    id: String,
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    gender: String,
    location: String,
    password: {type: String, required: true},
    birthday: {type: Date, default: Date.now},
    email: {type: String, required: true, unique: true},
    basicAuthBots: {type: Array, default: []}, //any bot that a user has contact with
    emailAuthBots: {type: Array, default: []}, //any bot that a user has given email authorization to
    birthdayAuthBots: {type: Array, default: []}, //any bot that a user has given birthday authorization to
    locationAuthBots: {type: Array, default: []},
    allAuthBots: {type: Array, default: []},
    currentBots: {type: Array, default: []},
    friends: {type: Array, default: []},
    friendRequests: {type: Array, default: []},
    pendingFriendRequests: {type: Array, default: []}
});

var Users = mongoose.model('Users', UserSchema);

module.exports = Users;