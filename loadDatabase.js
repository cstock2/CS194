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

var removePromises = [Bots.remove({}), Users.remove({}), Messages.remove({})];

Promise.all(removePromises).then(function(){
    var idToId = [];
    var botModel = dataModel.botModel();
    var botPromises = botModel.map(function(bot){
        return Bots.create({
            id: bot.id,
            name: bot.name,
            url: bot.url,
            basicPerm: bot.basicPerm,
            emailPerm: bot.emailPerm,
            birthdayPerm: bot.birthdayPerm,
            locationPerm: bot.locationPerm,
            allPerm: bot.allPerm
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
    //var userIds = [];
    //var userModel = dataModel.userModel();
    //var userPromises = userModel.map(function(user){
    //    userIds.push(user.id);
    //    return Users.create({
    //        id: user.id,
    //        firstName: user.firstName,
    //        lastName: user.lastName,
    //        location: user.location,
    //        gender: user.gender,
    //        password: user.password,
    //        birthday: user.birthday,
    //        email: user.email
    //    }, function(err, userObj){
    //        if(err){
    //            console.log("Error creating user: ", err);
    //        }
    //        else{
    //            idToId[userObj.id] = userObj._id;
    //            userObj.id = userObj._id;
    //            userObj.save();
    //            console.log("Adding user " + userObj.firstName + " " + userObj.lastName + " with id " + userObj.id);
    //        }
    //    });
    //});
    Promise.all(botPromises).then(function(){
        var userIds = [];
        var userModel = dataModel.userModel();
        var userPromises = userModel.map(function(user){
            userIds.push(user.id);
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
                currentBots: newBotList
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
            var messageModel = dataModel.messageModel();
            var messagePromises = messageModel.map(function(message){
                var to = idToId[message.to];
                var from = idToId[message.from];
                return Messages.create({
                    id: message.id,
                    to: to,
                    from: from,
                    dateTime: message.dateTime,
                    text: message.text
                }, function(err, messObj){
                    if(err){
                        console.log("Error creating message: ", err);
                    }
                    else{
                        messObj.id = messObj._id;
                        messObj.save();
                        console.log("Added message ", messObj.text + " ::from " + messObj.from + " ::to " + messObj.to + " ::with id " + messObj.id);
                    }
                })
            });
            Promise.all(messagePromises).then(function(){
                console.log("All done");
                mongoose.disconnect();
            });
        });
    });
});
