/**
 * Created by CodyWStocker on 4/8/17.
 */

//Sets up the required components to make the server run
var express = require('express');
var app = express();
var session = require('express-session');
var requestObj = require('request');
//app.use(session); //Below version is from code I wrote over the summer, do not remember totally what it does though
//app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false, cookie: {
//    path: '/'
//    ,expires: false // Alive Until Browser Exits
//    ,httpOnly: true
//    //  ,domain:'.example.com'
//}}));
app.use(session({
    secret: 'secretKey',
    cookie:{
        path: '/',
        expires: false,
        httyOnly: true
    },
    saveUninitialized: true,
    resave: true
}));

//MongoDB setup
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/CS194V2');
var Users = require('./schema/user.js');
var Bots = require('./schema/bot.js');
var Messages = require('./schema/message.js');
var GroupMessages = require('./schema/groupMessage.js');
var GroupConversations = require('./schema/groupConversation.js');

//Utility things that are necessary
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication
app.use(bodyParser.json());
var Promise = require('promise');
var async = require('async');


//Lets the app use the stuff in the directory
app.use(express.static(__dirname));


//echo bot goes here
var echoBot = require("./echoBot.js");

app.get('/', function(request, response){
    response.send('Simple webserver of files from ' + __dirname);
});

var server = app.listen(3002, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});

//ADMIN FUNCTIONS, REGISTERING

app.get('/admin/getSession', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.send(JSON.stringify({
            isSession: false
        }));
        return;
    }
    else{
        response.send(JSON.stringify({
            isSession: true,
            firstName: request.session.user.firstName,
            lastName: request.session.user.lastName,
            id: request.session.user.id
        }));
    }
});

app.post('/admin/registerBot', function(request, response){
    if(typeof request.body === 'undefined' || typeof request.body.url !== 'string' || typeof request.body.name !== 'string' || typeof request.body.description !== 'string' || typeof request.body.basicPerm !== 'boolean' || typeof request.body.emailPerm !== 'boolean' || typeof request.body.birthdayPerm !== 'boolean' || typeof request.body.locationPerm !== 'boolean' || typeof request.body.allPerm !== 'boolean' || typeof request.body.username !== 'string' || typeof request.body.password !== 'string'){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message: "Arguments not provided"
        }));
        return;
    }
    if(request.body.allPerm && (!request.body.basicPerm || !request.body.emailPerm || !request.body.locationPerm || !request.body.birthdayPerm)){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message: "Invalid arguments"
        }));
        return;
    }
    var botName = request.body.name;
    var botUrl = request.body.url;
    Bots.findOne({url: botUrl}, function(err, botObj){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error in bot database"
            }));
            return;
        }
        if(botObj !== null) { //check if the bot url is already in system
            response.status(401).send(JSON.stringify({
                statusCode: 401,
                message: "Cannot create bot" //we could have more explicit messages, but that would tell the user that the url already exists...bad if a hacker can take a bot down
            }));
            return;
        }
        Bots.findOne({username: request.body.username}, function(err, botObj2){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Error in bot database"
                }));
                return;
            }
            if(botObj2 !== null){//check if bot name is already in system
                response.status(401).send(JSON.stringify({
                    statusCode: 401,
                    message: "Cannot create bot" //same as for the url case
                }));
                return;
            }
            var options = {
                url: botUrl,
                timeout: 6000
            };
            requestObj.get(options, function(err, res, body){
                if(err){
                    response.status(404).send(JSON.stringify({
                        statusCode: 404,
                        message: "Error in request.get"
                    }));
                    return;
                }
                if(typeof res === 'undefined' || typeof body === 'undefined'){
                    response.status(404).send(JSON.stringify({
                        statusCode: 404,
                        message: "Error contacting bot server"
                    }));
                    return;
                }
                Bots.create({
                    id: "placeholder",
                    name: botName,
                    url: botUrl,
                    description: request.body.description,
                    basicPerm: request.body.basicPerm,
                    emailPerm: request.body.emailPerm,
                    locationPerm: request.body.locationPerm,
                    birthdayPerm: request.body.birthdayPerm,
                    allPerm: request.body.allPerm,
                    username: request.body.username,
                    password: request.body.password
                }, function(err, botObj){
                    if(err){
                        response.status(404).send(JSON.stringify({
                            statusCode: 404,
                            message: "Error in bot database"
                        }));
                        return;
                    }
                        botObj.id = botObj._id;
                        botObj.save();
                        var returnObj = {};
                        returnObj.text = "Successfully added bot";
                        response.send(JSON.stringify(returnObj));
                });
            });
        });
    });
});

app.post('/admin/login', function(request, response){
    var username = request.body.user.username;
    var password = request.body.user.password;
    Users.findOne({email: username}, function(err, userObj){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error finding User"
            }));
        }
        else{
            if(userObj === null){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "No user Found"
                }));
            }
            else{
                if(userObj.password !== password){
                    response.status(401).end(JSON.stringify({
                        statusCode: 401,
                        message: "Incorrect Password"
                    }));
                }
                else{
                    request.session.user = userObj; //may want to change this so it doesn't have the password?
                    var returnObj = {};
                    returnObj.name = userObj.firstName + " " + userObj.lastName;
                    returnObj.id = userObj.id;
                    response.send(JSON.stringify(returnObj));
                }
            }
        }
    });
});

app.post('/admin/botLogin', function(request, response){
    if(typeof request.body.username !=='string' || typeof request.body.password !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Bots.findOne({username: request.body.username}, function(err, botObj){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message: "Error finding bot"
            }));
            return;
        }
        else if(botObj === null){
            response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Invalid username or password"
            }));
            return;
        }
        else if(botObj.password !== request.body.password){
            response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Invalid username or password"
            }));
            return;
        }
        request.session.botLogin = botObj;
        response.send(JSON.stringify({id: botObj.id}));
    });
});

app.post('/admin/register', function(request, response){
    var newUser = request.body;
    if(Object.keys(request.body).length !== 8){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message: "Missing some fields"
        }));
        return;
    }
    if(typeof newUser.firstName !== 'string' || typeof newUser.lastName !== 'string' || typeof newUser.location !== 'string' || typeof newUser.emailAddress !== 'string' || typeof newUser.gender !== 'string' || typeof newUser.password1 !== 'string' || typeof newUser.birthday !== 'string'){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Fields are not of correct type"
        }));
        return;
    }
    Users.findOne({email: newUser.emailAddress}, function(err, user){
        if(err) {
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error checking Users"
            }));
            return;
        }
        if(user !== null){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "User exists"
            }));
            return;
        }
        Users.create({
            id: "placeholder",
            firstName: newUser.firstName,
            gender: newUser.gender,
            lastName: newUser.lastName,
            location: newUser.location,
            password: newUser.password1,
            birthday: newUser.birthday,
            email: newUser.emailAddress
        }, function(err, userObj){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Error creating User"
                }));
                return;
            }
            userObj.id = userObj._id;
            userObj.save();
            request.session.user = userObj;
            var returnObj = {};
            returnObj.username = userObj.firstName + " " + userObj.lastName;
            returnObj.id = userObj._id;
            response.send(JSON.stringify(returnObj));
        });
    });
});

//UTILITY POST FUNCTIONS

app.post('/sendUserUserMessage', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 2 || (typeof request.body.userTo !== 'string' || typeof request.body.text !== 'string')){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({_id: request.session.user.id}, function(err, user1){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding current user"
            }));
            return;
        }
        else if (user1 === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Current user is invalid"
            }));
            return;
        }
        Users.findOne({_id: request.body.userTo}, function(err,user2){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return;
            }
            else if(user2 === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Recipient is invalid"
                }));
                return;
            }
            Messages.create({
                to: request.body.userTo,
                from: request.session.user.id,
                type: 'text',
                dateTime: Date.now(),
                text: request.body.text
            }, function(err,message){
                if(err){
                    response.status(404).send(JSON.stringify({
                        statusCode:404,
                        message:"Error creating message"
                    }));
                    return;
                }
                message.id = message._id;
                message.save();
                var returnObj = {};
                returnObj.success = true;
                response.send(JSON.stringify(returnObj));
            });
        });
    });
});

app.post('/updatePermissions', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 6 || (typeof request.body.botId !== 'string' || typeof request.body.basicPerm !== 'boolean' || typeof request.body.emailPerm !== 'boolean' || typeof request.body.birthdayPerm !== 'boolean' || typeof request.body.locationPerm !== 'boolean' || typeof request.body.allPerm !== 'boolean')){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Missing or invalid arguments"
        }));
        return;
    }
    //I suppose this doesn't take into account the reverse, but I'm not too worried about that case, since it'll give less access
    if(request.body.allPerm && (!request.body.basicPerm || !request.body.emailPerm || !request.body.birthdayPerm || !request.body.locationPerm)){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Contradictory arguments"
        }));
        return;
    }
    Bots.findOne({_id: request.body.botId}, function(err,bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Invalid bot"
            }));
            return;
        }
        Users.findOne({_id: request.session.user.id}, function(err,user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return;
            }
            else if(user === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message: "Invalid user"
                }));
                return;
            }
            user.currentBots.push(request.body.botId);
            if(request.body.basicPerm){
                user.basicAuthBots.push(request.body.botId);
            }
            if(request.body.emailPerm){
                user.emailAuthBots.push(request.body.botId);
            }
            if(request.body.locationPerm){
                user.locationAuthBots.push(request.body.botId);
            }
            if(request.body.birthdayPerm){
                user.birthdayAuthBots.push(request.body.botId);
            }
            if(request.body.allPerm){
                user.allAuthBots.push(request.body.botId);
            }
            user.save();
            var returnObj = {};
            returnObj.success = true;
            response.status(200).send(JSON.stringify(returnObj));
        });
    });
});

app.post('/sendMessage', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Unauthorized"
            })
        );
        return;
    }
    if(typeof request.body.text !== 'string' || request.body.text.length < 1 || typeof request.body.botId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Bots.findOne({id: request.body.botId}, function(err,bot){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid bot"
            }));
            return;
        }
        Messages.create({
            to: request.body.botId,
            from: request.session.user.id,
            text: request.body.text,
            type: 'text'
        }, function(err, mess){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message: "Error creating message"
                }));
                return;
            }
            mess.id = mess._id;
            mess.save();
            var postData = {text: request.body.text, userId: request.session.user.id, botId: request.body.botId};
            var options = {
                body:postData,
                json: true,
                url: bot.url,
                timeout: 1500
            };
            requestObj.post(options, function(error, sResponse, body){
                if(error){
                    if(error.code === 'ETIMEDOUT'){
                        if(error.connect === true){
                            response.status(404).send(JSON.stringify({
                                statusCode:404,
                                message:"Could not send message to bot"
                            }));
                            return;
                        }
                        response.status(200).send(JSON.stringify({
                            sentMessage: true,
                            receivedResponse: false
                        }));
                        return;
                    }
                    else{
                        response.status(500).send(JSON.stringify({
                            statusCode:500,
                            message:"Error posting to bot"
                        }));
                        return;
                    }
                }
                if(typeof body.type !== 'string' || (body.type !== 'text' && body.type !== 'mc')){
                    response.status(400).send(JSON.stringify({
                        statusCode:400,
                        message:"Invalid bot response type"
                    }));
                    return;
                }
                if((body.type === 'text' && (typeof body.text !== 'string' || body.text.length < 1)) || (body.type === 'mc' && (typeof body.options === 'undefined' || body.options.length < 1))){
                    response.status(400).send(JSON.stringify({
                        statusCode:400,
                        message:"Invalid bot response"
                    }));
                    return;
                }
                var responseMessage = body.text;
                Messages.create({
                    to: request.session.user.id,
                    from: request.body.botId,
                    type: body.type,
                    text: body.text,
                    options: body.options
                }, function(err, mess2){
                    if(err){
                        response.status(500).send(JSON.stringify({
                            statusCode: 500,
                            message: "Error posting bot response"
                        }));
                        return;
                    }
                    mess2.id = mess2._id;
                    mess2.save();
                    response.send(JSON.stringify({
                        sentMessage: true,
                        receivedResponse: true
                    }));
                });
            });
        });
    });
});

app.post('/sendGroupMessage', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(typeof request.body.text !== 'string' || typeof request.body.convoId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    GroupConversations.findOne({id: request.body.convoId}, function(err,convo){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding conversation"
            }));
            return;
        }
        else if(convo === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid conversation"
            }));
            return;
        }
        Bots.findOne({id: convo.botMember}, function(err,bot){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding bot"
                }));
                return;
            }
            else if(bot === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Invalid bot"
                }));
                return;
            }
            GroupMessages.create({
                convoId: request.body.convoId,
                from: request.session.user.id,
                text: request.body.text
            }, function(err,messObj){
                if(err){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error creating message"
                    }));
                    return;
                }
                messObj.id = messObj._id;
                messObj.save();
                var postData = {text: request.body.text, userId: request.session.user.id, botId: bot.id};
                var options = {
                    body:postData,
                    json: true,
                    url: bot.url,
                    timeout: 1500
                };
                requestObj.post(options, function(error, sResponse, body){
                    if(error){
                        if(error.code === 'ETIMEDOUT'){
                            if(error.connect === true){
                                response.status(404).send(JSON.stringify({
                                    statusCode:404,
                                    message:"Could not send message to bot"
                                }));
                                return;
                            }
                            response.status(200).send(JSON.stringify({
                                sentMessage: true,
                                receivedResponse: false
                            }));
                            return;
                        }
                        else{
                            response.status(500).send(JSON.stringify({
                                statusCode:500,
                                message:"Error posting to bot"
                            }));
                            return;
                        }
                    }
                    if(typeof body.text !== 'string' || body.text.length < 1){
                        response.status(400).send(JSON.stringify({
                            statusCode:400,
                            message:"Invalid bot response"
                        }));
                        return;
                    }
                    GroupMessages.create({
                        convoId: request.body.convoId,
                        from: convo.botMember,
                        text: body.text
                    },function(err, newMessage){
                        if(err){
                            response.status(500).send(JSON.stringify({
                                statusCode:500,
                                message:"Error saving bot response"
                            }));
                            return;
                        }
                        newMessage.id = newMessage._id;
                        newMessage.save();
                        response.send(JSON.stringify({
                            sentMessage: true,
                            receivedResponse: true
                        }));
                    });
                });
            });
        });
    });
});

app.post('/makeGroup', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 3 || !Array.isArray(request.body.users)|| typeof request.body.name !== 'string' || typeof request.body.name.length < 1 || typeof request.body.botId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Bots.findOne({_id: request.body.botId}, function(err,bot){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid bot"
            }));
            return;
        }
        var calls = [];
        var errorInUsers = false;
        var badUser = false;
        request.body.users.forEach(function(user, i){
            calls.push(function(callback){
                Users.findOne({id: user}, function(err,user){
                    if(err){
                        errorInUsers = true;
                    }
                    else if(user === null){
                        badUser = true;
                    }
                    callback();
                });
            });
        });
        async.series(calls, function(err,results){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error in async"
                }));
                return;
            }
            else if(errorInUsers){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(badUser){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid users"
                }));
                return;
            }
            GroupConversations.create({
                userMembers:request.body.users,
                botMember:request.body.botId,
                name:request.body.name
            }, function(err,groupObj){
                if(err){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error creating group"
                    }));
                    return;
                }
                groupObj.id = groupObj._id;
                groupObj.save();
                response.send(JSON.stringify({
                    id: groupObj.id,
                    success: true
                }));
            });
        });
    });
});


//GET REQUESTS

app.get('/groupConversation/:convoId', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    GroupConversations.findOne({_id: request.params.convoId}, function(err,convo){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message: "Error finding conversation"
            }));
            return;
        }
        else if(convo === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Invalid conversation"
            }));
            return;
        }
        GroupMessages.find({convoId: request.params.convoId}, function(err, messages){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding messages"
                }));
                return;
            }
            else if(messages === null){
                response.send(JSON.stringify({
                    hasMessages:false,
                    message: "No messages in conversation"
                }));
                return;
            }
            var returnMessages = [];
            var numMessages = messages.length;
            for(var idx = 0; idx<numMessages; idx++){
                var currMessage = messages[idx];
                returnMessages.push({
                    text: currMessage.text,
                    from: currMessage.from,
                    dateTime: currMessage.dateTime
                });
            }
            returnMessages.sort(function func(a,b){
                return a.dateTime > b.dateTime;
            });
            response.send(JSON.stringify({
                hasMessages:true,
                messages: returnMessages
            }));
        });
    });
});

app.get('/groupUsers/:convoId', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    GroupConversations.findOne({_id:request.params.convoId},function(err,group){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding conversation"
            }));
            return;
        }
        else if(group === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid group"
            }));
            return;
        }
        var errorInUsers = false;
        var badUser = false;
        var groupUsers = [];
        var calls = [];
        group.userMembers.forEach(function(user, i){
            calls.push(function(callback){
                Users.findOne({id: user}, function(err,user){
                    if(err){
                        errorInUsers = true;
                    }
                    else if(user === null){
                        badUser = true;
                    }
                    else{
                        groupUsers.push({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            id: user.id
                        });
                    }
                    callback();
                });
            });
        });
        async.series(calls, function(err,results){
            if(badUser){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Invalid user"
                }));
                return;
            }
            else if(errorInUsers){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding users"
                }));
                return;
            }
            groupUsers.sort(function fun(a,b){
                return a.lastName > b.lastName;
            });
            response.send(JSON.stringify({
                users: groupUsers
            }));
        });
    });
});

app.get('/group/:convoId', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    GroupConversations.findOne({id:request.params.convoId},function(err,group){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding conversation"
            }));
            return;
        }
        else if(group === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid conversation"
            }));
            return;
        }
        response.send(JSON.stringify({
            name: group.name,
            userMembers: group.userMembers,
            botMember: group.botMember
        }));
    });
});

app.get('/groupMessages', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    GroupConversations.find({userMembers: request.session.user.id}, function(err,groups){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error querying groups"
            }));
            return;
        }
        else if(groups === null){
            response.send(JSON.stringify({
                hasGroups: false,
                message: "No groups"
            }));
            return;
        }
        var currentGroups = [];
        for(var idx = 0; idx < groups.length; idx++){
            var currentGroup = groups[idx];
            currentGroups.push({
                id: currentGroup.id,
                userMembers: currentGroup.userMembers,
                botMember: currentGroup.botMember,
                name: currentGroup.name
            });
        }
        response.send(JSON.stringify({
            hasGroups: true,
            groups: currentGroups
        }));
    });
});

app.get('/getFriendInfo/:type', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(request.params.type !== 'friends' && request.params.type !== 'pending' && request.params.type !== 'sentRequests'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({id: request.session.user.id}, function(err,user){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding user"
            }));
            return;
        }
        else if(user === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid login"
            }));
            return;
        }
        var calls = [];
        var errorInUsers = false;
        var badUser = false;
        var userFriends = [];
        var arrayOfPeople = [];
        if(request.params.type === 'friends'){
            arrayOfPeople = user.friends;
        }
        else if(request.params.type === 'sentRequests'){
            arrayOfPeople = user.friendRequests;
        }
        else{
            arrayOfPeople = user.pendingFriendRequests;
        }
        if(arrayOfPeople.length === 0){
            response.send(JSON.stringify({
                noData: true,
                people: []
            }));
            return;
        }
        arrayOfPeople.forEach(function(friend, i){
            calls.push(function(callback){
                Users.findOne({id: friend}, function(err,userObj){
                    if(err){
                        errorInUsers = true;
                    }
                    else if(userObj === null){
                        badUser = true;
                    }
                    else{
                        userFriends.push({
                            firstName:userObj.firstName,
                            lastName:userObj.lastName,
                            id:userObj.id
                        });
                    }
                    callback();
                });
            });
        });
        async.series(calls, function(err,results){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error in async"
                }));
                return;
            }
            else if(errorInUsers){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding users"
                }));
                return;
            }
            else if(badUser){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error in friends list"
                }));
                return;
            }
            userFriends.sort(function alpha(a,b){
                return a.lastName > b.lastName;
            });
            response.send(JSON.stringify({
                noData: false,
                people:userFriends
            }));
        });
    });
});

app.get('/currentBotList', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    Bots.find(function(err,bots){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding bots"
            }));
            return;
        }
        else if(bots === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"No bots"
            }));
            return;
        }
        var currentBots = [];
        for(var idx in bots){
            var currBot = bots[idx];
            if(typeof request.session.user.currentBots.find(function find(id){return currBot.id === id})!== 'undefined'){
                currentBots.push({id: currBot.id, name: currBot.name, basicPerm: currBot.basicPerm, emailPerm: currBot.emailPerm, locationPerm: currBot.locationPerm, birthdayPerm: currBot.birthdayPerm, allPerm:currBot.allPerm});
            }
        }
        currentBots.sort(function(a,b){
            return a.name > b.name;
        });
        var returnObj = {};
        returnObj.bots = currentBots;
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/getUser/:userId', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    Users.findOne({id: request.params.userId}, function(err,user){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding user"
            }));
            return;
        }
        else if(user === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid user"
            }));
            return;
        }
        var returnObj = {};
        returnObj.username = user.firstName + " " + user.lastName;
        returnObj.firstName = user.firstName;
        returnObj.lastName = user.lastName;
        returnObj.id = user.id;
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/isType/:id', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    Users.findOne({id: request.params.id}, function(err,user){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error checking users"
            }));
            return;
        }
        else if(user !== null){
            response.send(JSON.stringify({type: 'user'}));
            return;
        }
        Bots.findOne({id: request.params.id}, function(err,bot){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error checking bots"
                }));
                return;
            }
            else if(bot !== null){
                response.send(JSON.stringify({type: 'bot'}));
                return;
            }
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid argument"
            }));
        });
    });
});

app.get('/userList', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Users.find(function(err,users){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding users"
            }));
            return;
        }
        var returnObj = {};
        returnObj.users = [];
        for(var idx in users){
            var currUser = users[idx];
            if(currUser.id !== request.session.user.id){
                var userObj = {};
                userObj.fullName = currUser.firstName + " " + currUser.lastName;
                userObj.lastName = currUser.lastName;
                userObj.firstName = currUser.firstName;
                userObj.id = currUser.id;
                returnObj.users.push(userObj);
            }
        }
        returnObj.users.sort(function(a,b){
            return a.lastName > b.lastName;
        });
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/isCurrentBot/:botId', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Bots.findOne({_id: request.params.botId}, function(err,bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Error finding bot"
            }));
            return;
        }
        if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Invalid bot"
            }));
            return;
        }
        Users.findOne({_id: request.session.user}, function(err,user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Error finding user"
                }));
                return;
            }
            if(user === null){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Invalid user"
                }));
                return;
            }
            var returnObj = {};
            returnObj.currentBot = false;
            var inCurrArray = user.currentBots.find(function isBot(botId){
                //return botId.equals(request.params.botId);
                return botId == request.params.botId;
            });
            if(typeof inCurrArray !== 'undefined'){
                returnObj.currentBot = true;
            }
            response.send(JSON.stringify(returnObj));
        });
    });
});

app.get('/userDetail/:userId', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Unauthorized"
            })
        );
        return;
    }
    Users.findOne({_id: request.params.userId}, function(err, user){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error finding User"
            }));
            return;
        }
        //may need to check if user is null, but tests indicated otherwise
        var returnObj = {};
        returnObj.user = {};
        returnObj.user.firstName = user.firstName;
        returnObj.user.lastName = user.lastName;
        returnObj.user.location = user.location;
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/botList', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Unauthorized"
        }));
        return;
    }
    Bots.find(function(err, bots){
        if(err) {
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error finding bots"
            }));
            return;
        }
        var newBots = [];
        for(var idx in bots){
            var currBot = bots[idx];
            var botObj = {};
            botObj.name = currBot.name;
            botObj.id = currBot.id;
            botObj.description = currBot.description;
            newBots.push(botObj);
        }
        newBots.sort(function(a, b){
            return a.name > b.name;
        });
        var returnObj = {};
        returnObj.botList = newBots;
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/botListDetail', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Bots.find(function(err, bots){
        if(err) {
            response.status(500).send(JSON.stringify({
                statusCode: 500,
                message: "Error finding bots"
            }));
            return;
        }
        var newBots = [];
        for(var idx in bots){
            var currBot = bots[idx];
            var botObj = {};
            botObj.name = currBot.name;
            botObj.id = currBot.id;
            botObj.description = currBot.description;
            botObj.basicPerm = currBot.basicPerm;
            botObj.emailPerm = currBot.emailPerm;
            botObj.locationPerm = currBot.locationPerm;
            botObj.birthdayPerm = currBot.birthdayPerm;
            botObj.allPerm = currBot.allPerm;
            newBots.push(botObj);
        }
        newBots.sort(function(a, b){
            return a.name > b.name;
        });
        var returnObj = {};
        returnObj.botList = newBots;
        response.send(JSON.stringify(returnObj));
    });

});


app.get('/getBot/:botId', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Bots.findOne({_id: request.params.botId}, function(err, bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error finding Bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Invalid bot"
            }));
            return;
        }
        //may need to check if user is null, but tests indicated otherwise
        request.session.bot = bot;
        var returnObj = {};
        returnObj.bot = {};
        returnObj.bot.id = bot.id;
        returnObj.bot.name = bot.name;
        returnObj.bot.description = bot.description;
        returnObj.bot.basicPerm = bot.basicPerm;
        returnObj.bot.emailPerm = bot.emailPerm;
        returnObj.bot.locationPerm = bot.locationPerm;
        returnObj.bot.birthdayPerm = bot.birthdayPerm;
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/conversation/:id', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Unauthorized"
        }));
        return;
    }
    var bot = request.params.id;
    var user = request.session.user.id;
    Messages.find({$or: [{to: user, from: bot}, {to: bot, from: user}]}, function(err, messages){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding messages"
            }));
            return;
        }
        var messageList = [];
        for(var idx=0; idx < messages.length; idx++){
            var currMessage = messages[idx];
            var newMessage = {};
            newMessage.text = currMessage.text;
            newMessage.dateTime = currMessage.dateTime;
            newMessage.to = currMessage.to;
            newMessage.from = currMessage.from;
            messageList.push(newMessage);
        }
        messageList.sort(function(a,b){
            if(a.dateTime < b.dateTime){
                return -1;
            }
            if(a.dateTime > b.dateTime){
                return 1;
                }
                return 0;
            });
        var returnObj = {};
        returnObj.chatHistory = messageList;
        response.send(JSON.stringify(returnObj));
    });
});

//BOT UTILITIES
app.get('/userConversation/:botId/:userId', function(request,response){
    if(typeof request.session.botLogin === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(typeof request.params === 'undefined' || typeof request.params.userId === 'undefined' || typeof request.params.botId === 'undefined'){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message:"Arguments not provided"
        }));
        return;
    }
    var bot = request.params.botId;
    var user = request.params.userId;
    Messages.find({$or: [{to: user, from: bot}, {to: bot, from: user}]}, function(err, messages){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding messages"
            }));
            return;
        }
        var messageList = [];
        for(var idx=0; idx < messages.length; idx++){
            var currMessage = messages[idx];
            var newMessage = {};
            newMessage.text = currMessage.text;
            newMessage.dateTime = currMessage.dateTime;
            newMessage.to = currMessage.to;
            newMessage.from = currMessage.from;
            messageList.push(newMessage);
        }
        messageList.sort(function(a,b){
            if(a.dateTime < b.dateTime){
                return -1;
            }
            if(a.dateTime > b.dateTime){
                return 1;
            }
            return 0;
        });
        var returnObj = {};
        returnObj.chatHistory = messageList;
        response.send(JSON.stringify(returnObj));
    });
});

app.get('/userInfo/:botId/:userId/:type', function(request, response){
    if(typeof request.session.botLogin === 'undefined') {
        response.status(401).send(JSON.stringify({
            statusCode: 401,
            message: "Unauthorized"
        }));
        return;
    }
    var userId = request.params.userId;
    var botId = request.params.botId;
    var type = request.params.type;
    if(type !== 'basic' && type !== 'email' && type !== 'birthday' && type !== 'location' && type !== 'all'){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Invalid type request"
        }));
        return;
    }
    Bots.findOne({id: botId}, function(err, botObj){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error authenticating bot"
            }));
            return;
        }
        else if(botObj === null){
            response.status(401).send(JSON.stringify({
                statusCode:401,
                message:"Invalid bot id"
            }));
            return;
        }
        Users.findOne({id: userId}, function(err, userObj){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return;
            }
            else if(userObj === null){
                response.status(401).send(JSON.stringify({
                    statusCode:401,
                    message:"Invalid user id"
                }));
                return;
            }
            var botAuth;
            if(type === 'basic'){
                botAuth = userObj.basicAuthBots.find(function findId(id){
                    return id === botId;
                });
            }
            else if(type === 'email'){
                botAuth = userObj.emailAuthBots.find(function findId(id){
                    return id === botId;
                });
            }
            else if(type === 'birthday'){
                botAuth = userObj.birthdayAuthBots.find(function findId(id){
                    return id === botId;
                });
            }
            else if(type === 'location'){
                botAuth = userObj.locationAuthBots.find(function findId(id){
                    return id === botId;
                });
            }
            else if(type === 'all'){
                botAuth = userObj.allAuthBots.find(function findId(id){
                    return id === botId;
                });
            }
            if(typeof botAuth === 'undefined'){
                response.status(401).send(JSON.stringify({
                    statusCode:401,
                    message:"Not authorized"
                }));
                return;
            }
            var returnObj = {};
            if(type === 'basic'){
                returnObj.firstName = userObj.firstName;
                returnObj.lastName = userObj.lastName;
                returnObj.gender = userObj.gender;
            }
            else if(type === 'email'){
                returnObj.email = userObj.email;
            }
            else if(type === 'birthday'){
                returnObj.birthday = userObj.birthday;
            }
            else if(type === 'location'){
                returnObj.location = userObj.location;
            }
            else if(type === 'all'){
                returnObj.firstName = userObj.firstName;
                returnObj.lastName = userObj.lastName;
                returnObj.gender = userObj.gender;
                returnObj.email = userObj.email;
                returnObj.birthday = userObj.birthday;
                returnObj.location = userObj.location;
            }
            response.send(JSON.stringify(returnObj));
        });
    });
});

app.post('/botSendGroupMessage', function(request,response){
    if(typeof request.session.botLogin === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 3 || typeof request.body.convoId !== 'string' || typeof request.body.botId !== 'string' || typeof request.body.text !== 'string' || request.body.text.length < 1){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Bots.findOne({_id:request.body.botId}, function(err,bot){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid bot"
            }));
            return;
        }
        GroupConversations.findOne({_id:request.body.convoId}, function(err,convo){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding conversation"
                }));
                return;
            }
            else if(convo === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Invalid conversation"
                }));
                return;
            }
            else if(convo.botMember !== bot.id){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Bot not member of conversation"
                }));
                return;
            }
            GroupMessages.create({
                convoId: request.body.convoId,
                from: request.body.botId,
                text: request.body.text
            }, function(err, groupMess){
                if(err){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error saving message"
                    }));
                    return;
                }
                groupMess.id = groupMess._id;
                groupMess.save();
                response.send(JSON.stringify({
                    success:true
                }));
            });
        });
    });
});

app.post('/botSendMessage', function(request, response){
    if(typeof request.session.botLogin === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 4 || typeof request.body.type !== 'string' || typeof request.body.userId !== 'string' || typeof request.body.botId !== 'string' || (request.body.text === 'string' && typeof request.body.text !== 'string') || (request.body.type === 'mc' && typeof request.body.options !== 'undefined')){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Invalid arguments"
        }));
        return;
    }
    Bots.findOne({_id:request.body.botId}, function(err,bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid bot"
            }));
            return;
        }
        Users.findOne({_id:request.body.userId}, function(err,user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return;
            }
            else if(user === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Invalid user"
                }));
                return;
            }
            Messages.create({
                to: request.body.userId,
                from: request.body.botId,
                type: request.body.type,
                text: request.body.text,
                options: request.body.options
            }, function(err, mess){
                if(err){
                    response.status(404).send(JSON.stringify({
                        statusCode:404,
                        message:"Error creating message"
                    }));
                    return;
                }
                mess.id = mess._id;
                mess.save();
                returnObj = {};
                returnObj.success = true;
                response.send(JSON.stringify(returnObj));
            });
        });
    });
});

module.exports = app;