/**
 * Created by CodyWStocker on 5/20/17.
 */

var mongoose = require('mongoose');

var NotificationSchema = new mongoose.Schema({
    id: String,
    to: mongoose.Schema.Types.ObjectId,
    dateTime: {type: Date, default: Date.now},
    text: String,
    action: String,
    relId: String,
    seen: {type: Boolean, default: false}
});

var Notifications = mongoose.model('Notifications', NotificationSchema);

module.exports = Notifications;