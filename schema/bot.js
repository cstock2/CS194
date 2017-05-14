/**
 * Created by CodyWStocker on 4/8/17.
 */

var mongoose = require('mongoose');

var BotSchema = new mongoose.Schema({
    id: String,
    name: {type: String, required: true},
    url: {type: String, required: true, unique: true},
    description: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    basicPerm: {type: Boolean, default: true},
    emailPerm: {type: Boolean, default: false},
    locationPerm: {type: Boolean, default: false},
    birthdayPerm: {type: Boolean, default: false},
    allPerm: {type: Boolean, default: false}
});

var Bots = mongoose.model('Bots', BotSchema);

module.exports = Bots;