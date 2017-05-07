/**
 * Created by CodyWStocker on 4/8/17.
 */

var mongoose = require('mongoose');

var BotSchema = new mongoose.Schema({
    id: String,
    name: String,
    url: String,
    basicPerm: {type: Boolean, default: true},
    emailPerm: {type: Boolean, default: false},
    locationPerm: {type: Boolean, default: false},
    birthdayPerm: {type: Boolean, default: false},
    allPerm: {type: Boolean, default: false}
});

var Bots = mongoose.model('Bots', BotSchema);

module.exports = Bots;