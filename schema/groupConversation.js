/**
 * Created by CodyWStocker on 5/9/17.
 */

var mongoose = require('mongoose');

var groupConversationSchema = mongoose.Schema({
    id: String,
    userMembers: {type: [mongoose.Schema.Types.ObjectId], required: true},
    botMember: mongoose.Schema.Types.ObjectId,
    name: String
});

var GroupConversations = mongoose.model('GroupConversations', groupConversationSchema);

module.exports = GroupConversations;
