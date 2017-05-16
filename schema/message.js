/**
 * Created by CodyWStocker on 4/9/17.
 */

var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
    id: String,
    to: mongoose.Schema.Types.ObjectId,
    from: mongoose.Schema.Types.ObjectId,
    type: {type: String, required: true},
    dateTime: {type: Date, default: Date.now},
    text: String,
    options: {type: [String], default: []}
});

var Messages = mongoose.model('Messages', MessageSchema);

module.exports = Messages;