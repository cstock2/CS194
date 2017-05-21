/**
 * Created by CodyWStocker on 4/8/17.
 * Loads a database of mocked data
 */

var dataModel = require('./modelData/userModels.js').getData();

var mongoose = require('mongoose');
var Promise = require('promise');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/CS194V2');

var Users = require('./schema/user.js');
var Bots = require('./schema/bot.js');
var Messages = require('./schema/message.js');
var GroupMessages = require('./schema/groupMessage.js');
var GroupConversations = require('./schema/groupConversation.js');
var Notifications = require('./schema/notification');

var removePromises = [Bots.remove({}), Users.remove({}), Messages.remove({}), GroupMessages.remove({}), GroupConversations.remove({}), Notifications.remove({})];

Promise.all(removePromises).then(function(){
    var idToId = [];
    var botModel = dataModel.botModel();
    var botPromises = botModel.map(function(bot){
        return Bots.create({
            id: bot.id,
            name: bot.name,
            url: bot.url,
            description: bot.description,
            basicPerm: bot.basicPerm,
            emailPerm: bot.emailPerm,
            birthdayPerm: bot.birthdayPerm,
            locationPerm: bot.locationPerm,
            allPerm: bot.allPerm,
            username: bot.username,
            password: bot.password
        }, function(err, botObj){
            if(err){
                console.log("Error creating bot: ", err);
            }
            else{
                idToId[botObj.id] = botObj._id;
                botObj.id = botObj._id;
                botObj.save();
                console.log("Adding bot " + botObj.name + " with id " + botObj.id);
            }
        });
    });
    Promise.all(botPromises).then(function(){
        //var userIds = [];
        var userModel = dataModel.userModel();
        var userPromises = userModel.map(function(user){
            //userIds.push(user.id);
            var newBotList = [];
            for(var idx in user.currentBots){
                var currentId = user.currentBots[idx];
                newBotList.push(idToId[currentId]);
            }
            return Users.create({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                location: user.location,
                gender: user.gender,
                password: user.password,
                birthday: user.birthday,
                email: user.email,
                currentBots: newBotList,
                friends: user.friends,
                friendRequests: user.friendRequests,
                pendingFriendRequests: user.pendingFriendRequests
            }, function(err, userObj){
                if(err){
                    console.log("Error creating user: ", err);
                }
                else{
                    idToId[userObj.id] = userObj._id;
                    userObj.id = userObj._id;
                    userObj.save();
                    console.log("Adding user " + userObj.firstName + " " + userObj.lastName + " with id " + userObj.id);
                }
            });
        });
        Promise.all(userPromises).then(function(){
            Users.find(function(err,users){
                if(err){
                    console.log("Error finding users. Aborting program");
                    return;
                }
                var user2Promises = users.map(function(user){
                    var newFriendList = [];
                    for(var idx2 = 0; idx2 < user.friends.length; idx2++){
                        var currFriend = user.friends[idx2];
                        newFriendList.push(idToId[currFriend]);
                    }
                    var newFriendRequestList = [];
                    for(var idx3=0; idx3 < user.friendRequests.length; idx3++){
                        var currFR = user.friendRequests[idx3];
                        newFriendRequestList.push(idToId[currFR]);
                    }
                    var newPFRList = [];
                    for(var idx4=0; idx4<user.pendingFriendRequests.length; idx4++){
                        var currPFR = user.pendingFriendRequests[idx4];
                        newPFRList.push(idToId[currPFR]);
                    }
                    console.log("Updating friends and friend requests for: ", user.firstName, " ", user.lastName);
                    user.friends = newFriendList;
                    user.friendRequests = newFriendRequestList;
                    user.pendingFriendRequests = newPFRList;
                    user.save();
                });
                Promise.all(user2Promises).then(function(){
                    var messageModel = dataModel.messageModel();
                    var messagePromises = messageModel.map(function(message){
                        var to = idToId[message.to];
                        var from = idToId[message.from];
                        return Messages.create({
                            id: message.id,
                            to: to,
                            from: from,
                            dateTime: message.dateTime,
                            type: message.type,
                            text: message.text,
                            options: message.options,
                            selectedOption: message.selectedOption
                        }, function(err, messObj){
                            if(err){
                                console.log("Error creating message: ", err);
                            }
                            else{
                                messObj.id = messObj._id;
                                messObj.save();
                                console.log("Added message ", messObj.text + " ::from " + messObj.from + " ::to " + messObj.to + " ::with id " + messObj.id);
                            }
                        });
                    });
                    Promise.all(messagePromises).then(function(){
                        var groupModel = dataModel.groupModel();
                        var groupPromises = groupModel.map(function(group){
                            var newUserList = [];
                            for(var idx in group.userMembers){
                                newUserList.push(idToId[group.userMembers[idx]]);
                            }
                            return GroupConversations.create({
                                id: group.id,
                                userMembers: newUserList,
                                botMember: idToId[group.botMember],
                                name: group.name
                            }, function(err, groupObj){
                                if(err){
                                    console.log("Error creating group: ", err);
                                }
                                else{
                                    idToId[groupObj.id] = groupObj._id;
                                    groupObj.id = groupObj._id;
                                    groupObj.save();
                                    console.log("Successfully added group: ", groupObj.name, " with id: ", groupObj.id);
                                }
                            });
                        });
                        Promise.all(groupPromises).then(function(){
                            var multiModel = dataModel.multiModel();
                            var multiPromises = multiModel.map(function(multiMessage){
                                return GroupMessages.create({
                                    id: multiMessage.id,
                                    convoId: idToId[multiMessage.convoId],
                                    from: idToId[multiMessage.from],
                                    text: multiMessage.text,
                                    dateTime: multiMessage.dateTime
                                }, function(err, multiObj){
                                    if(err){
                                        console.log("Error making group message: ", err);
                                    }
                                    else{
                                        idToId[multiObj.id] = multiObj._id;
                                        multiObj.id = multiObj._id;
                                        multiObj.save();
                                        console.log("Added message ", multiObj.text + " ::from " + multiObj.from + " ::to " + multiObj.convoId + " ::with id " + multiObj.id);
                                    }
                                });
                            });
                            Promise.all(multiPromises).then(function(){
                                var notificationModel = dataModel.notificationModel();
                                var notifPromises = notificationModel.map(function(notification){
                                    return Notifications.create({
                                        id: notification.id,
                                        to: idToId[notification.to],
                                        dateTime: notification.dateTime,
                                        text: notification.text,
                                        action: notification.action,
                                        relId: idToId[notification.relId],
                                        seen: notification.seen,
                                        type: notification.type
                                    }, function(err, notifObj){
                                        if(err){
                                            console.log("Error making notification: ", err);
                                        }
                                        else{
                                            idToId[notifObj.id] = notifObj._id;
                                            notifObj.id = notifObj._id;
                                            notifObj.save();
                                            console.log("Added notification ", notifObj.text + " ::to ", notifObj.to);
                                        }
                                    });
                                });
                                Promise.all(notifPromises).then(function(){
                                    console.log("All done");
                                    mongoose.disconnect();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
