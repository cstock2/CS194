/**
 * Created by CodyWStocker on 5/9/17.
 */

var mongoose = require('mongoose');

var groupMessageSchema = mongoose.Schema({
    id: String,
    convoId: mongoose.Schema.Types.ObjectId,
    from: mongoose.Schema.Types.ObjectId,
    dateTime: {type: Date, default: Date.now()},
    text: String
});

var GroupMessages = mongoose.model('GroupMessages', groupMessageSchema);

module.exports = GroupMessages;