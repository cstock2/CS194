/**
 * Created by CodyWStocker on 4/8/17.
 */

//Sets up the required components to make the server run
var express = require('express');
var app = express();
var session = require('express-session');
var requestObj = require('request');
//app.use(session); //Below version is from code I wrote over the summer, do not remember totally what it does though
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));

//MongoDB setup
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/CS194V2');
var Users = require('./schema/user.js');
var Bots = require('./schema/bot.js');
var Messages = require('./schema/message.js');

//Utility things that are necessary
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication
app.use(bodyParser.json());

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

app.post('/admin/registerBot', function(request, response){
    if(typeof request.body === 'undefined' || typeof request.body.url !== 'string' || typeof request.body.name !== 'string' || typeof request.body.basicPerm !== 'boolean' || typeof request.body.emailPerm !== 'boolean' || typeof request.body.birthdayPerm !== 'boolean' || typeof request.body.locationPerm !== 'boolean' || typeof request.body.allPerm !== 'boolean'){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message: "Arguments not provided"
        }));
        return
    }
    if(request.body.allPerm && (!request.body.basicPerm || !request.body.emailPerm || !request.body.locationPerm || !request.body.birthdayPerm)){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message: "Invalid arguments"
        }));
        return
    }
    var botName = request.body.name;
    var botUrl = request.body.url;
    Bots.findOne({url: botUrl}, function(err, botObj){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error in bot database"
            }));
            return
        }
        if(botObj !== null) { //check if the bot url is already in system
            response.status(401).send(JSON.stringify({
                statusCode: 401,
                message: "Cannot create bot" //we could have more explicit messages, but that would tell the user that the url already exists...bad if a hacker can take a bot down
            }));
            return
        }
        Bots.findOne({name: botName}, function(err, botObj2){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Error in bot database"
                }));
                return
            }
            if(botObj2 !== null){//check if bot name is already in system
                response.status(401).send(JSON.stringify({
                    statusCode: 401,
                    message: "Cannot create bot" //same as for the url case
                }));
                return
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
                    return
                }
                if(typeof res === 'undefined' || typeof body === 'undefined'){
                    response.status(404).send(JSON.stringify({
                        statusCode: 404,
                        message: "Error contacting bot server"
                    }));
                    return
                }
                Bots.create({
                    id: "placeholder",
                    name: botName,
                    url: botUrl,
                    basicPerm: request.body.basicPerm,
                    emailPerm: request.body.emailPerm,
                    locationPerm: request.body.locationPerm,
                    birthdayPerm: request.body.birthdayPerm,
                    allPerm: request.body.allPerm
                }, function(err, botObj){
                    if(err){
                        response.status(404).send(JSON.stringify({
                            statusCode: 404,
                            message: "Error in bot database"
                        }));
                        return
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

app.post('/admin/register', function(request, response){
    var newUser = request.body;
    if(Object.keys(request.body).length !== 8){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message: "Missing some fields"
        }));
        return
    }
    if(typeof newUser.firstName !== 'string' || typeof newUser.lastName !== 'string' || typeof newUser.location !== 'string' || typeof newUser.emailAddress !== 'string' || typeof newUser.gender !== 'string' || typeof newUser.password1 !== 'string' || typeof newUser.birthday !== 'string'){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Fields are not of correct type"
        }));
        return
    }
    Users.findOne({email: newUser.email}, function(err, user){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error checking Users"
            }));
        }
        else{
            if(user !== null){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "User exists"
                }));
            }
            else{
                Users.create({
                    id: "placeholder",
                    firstName: newUser.firstName,
                    gender: newUser.gender,
                    lastName: newUser.lastName,
                    location: newUser.location,
                    password: newUser.password,
                    birthday: newUser.birthday,
                    email: newUser.emailAddress
                }, function(err, userObj){
                    if(err){
                        response.status(404).send(JSON.stringify({
                            statusCode: 404,
                            message: "Error creating User"
                        }));
                    }
                    else{
                        userObj.id = userObj._id;
                        userObj.save();
                        request.session.user = userObj;
                        var returnObj = {};
                        returnObj.username = userObj.firstName + " " + userObj.lastName;
                        returnObj.id = userObj._id;
                        response.send(JSON.stringify(returnObj));
                    }
                });
            }
        }
    });
});

//UTILITY POST FUNCTIONS

app.post('/sendUserUserMessage', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return
    }
    if(Object.keys(request.body).length !== 2 || (typeof request.body.userTo !== 'string' || typeof request.body.text !== 'string')){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Invalid arguments"
        }));
        return
    }
    Users.findOne({_id: request.session.user.id}, function(err, user1){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding current user"
            }));
            return
        }
        else if (user1 === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Current user is invalid"
            }));
            return
        }
        Users.findOne({_id: request.body.userTo}, function(err,user2){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return
            }
            else if(user2 === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Recipient is invalid"
                }));
                return
            }
            Messages.create({
                to: request.body.userTo,
                from: request.session.user.id,
                dateTime: Date.now(),
                text: request.body.text
            }, function(err,message){
                if(err){
                    response.status(404).send(JSON.stringify({
                        statusCode:404,
                        message:"Error creating message"
                    }));
                    return
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
        return
    }
    if(Object.keys(request.body).length !== 6 || (typeof request.body.botId !== 'string' || typeof request.body.basicPerm !== 'boolean' || typeof request.body.emailPerm !== 'boolean' || typeof request.body.birthdayPerm !== 'boolean' || typeof request.body.locationPerm !== 'boolean' || typeof request.body.allPerm !== 'boolean')){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Missing or invalid arguments"
        }));
        return
    }
    //I suppose this doesn't take into account the reverse, but I'm not too worried about that case, since it'll give less access
    if(request.body.allPerm && (!request.body.basicPerm || !request.body.emailPerm || !request.body.birthdayPerm || !request.body.locationPerm)){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Contradictory arguments"
        }));
        return
    }
    Bots.findOne({_id: request.body.botId}, function(err,bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Error finding bot"
            }));
            return
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Invalid bot"
            }));
            return
        }
        Users.findOne({_id: request.session.user.id}, function(err,user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return
            }
            else if(user === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message: "Invalid user"
                }));
                return
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
    }
    else{
        //var botId = request.session.bot.id;
        var message = request.body.text;
        Messages.create({
            to: request.session.bot.id,
            from: request.session.user.id,
            text: message
        }, function(err, mess){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message: "Error posting message to database"
                }));
            }
            else{
                mess.id = mess._id;
                mess.save();
                var postData = {text: message, userId: request.session.user.id, botId: request.session.bot.id};
                var url = request.session.bot.url;
                var options = {
                    body:postData,
                    json: true,
                    url: url
                };
                requestObj.post(options, function(error, sResponse, body){
                    if(error){
                        response.status(404).send(JSON.stringify({
                            statusCode:404,
                            message: "Error in request.post"
                        }));
                    }
                    else{
                        var responseMessage = body.text;
                        Messages.create({
                            to: request.session.user.id,
                            from: request.session.bot.id,
                            text: responseMessage
                        }, function(err, mess2){
                            if(err){
                                response.status(404).send(JSON.stringify({
                                    statusCode: 404,
                                    message: "Error posting bot response to database"
                                }));
                            }
                            else{
                                mess2.id = mess2._id;
                                mess2.save();
                                var returnObj = {};
                                returnObj.message = {};
                                returnObj.message.text = mess2.text;
                                returnObj.message.to = mess2.to;
                                returnObj.message.from = mess2.from;
                                returnObj.message.dateTime = mess2.dateTime;
                                response.send(JSON.stringify(returnObj));
                            }
                        });
                    }
                });
            }
        });
    }
});


//GET REQUESTS

app.get('/currentBotList', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return
    }
    Bots.find(function(err,bots){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding bots"
            }));
            return
        }
        else if(bots === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"No bots"
            }));
            return
        }
        var currentBots = [];
        for(var idx in bots){
            var currBot = bots[idx];
            if(typeof request.session.user.currentBots.find(function find(id){return currBot.id === id})!== 'undefined'){
                currentBots.push({id: currBot.id, name: currBot.name});
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
        return
    }
    Users.findOne({id: request.params.userId}, function(err,user){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding user"
            }));
            return
        }
        else if(user === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid user"
            }));
            return
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
        return
    }
    Users.findOne({id: request.params.id}, function(err,user){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error checking users"
            }));
            return
        }
        else if(user !== null){
            response.send(JSON.stringify({type: 'user'}));
            return
        }
        Bots.findOne({id: request.params.id}, function(err,bot){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error checking bots"
                }));
                return
            }
            else if(bot !== null){
                response.send(JSON.stringify({type: 'bot'}));
                return
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
        return
    }
    Users.find(function(err,users){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding users"
            }));
            return
        }
        var returnObj = {};
        returnObj.users = [];
        console.log("Number of users: ", users.length);
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
        return
    }
    Bots.findOne({_id: request.params.botId}, function(err,bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Error finding bot"
            }));
            return
        }
        if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message: "Invalid bot"
            }));
            return
        }
        Users.findOne({_id: request.session.user}, function(err,user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Error finding user"
                }));
                return
            }
            if(user === null){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Invalid user"
                }));
                return
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
    }
    else{
        Users.findOne({_id: request.params.userId}, function(err, user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode: 404,
                    message: "Error finding User"
                }));
            }
            else{
                //may need to check if user is null, but tests indicated otherwise
                var returnObj = {};
                returnObj.user = {};
                returnObj.user.firstName = user.firstName;
                returnObj.user.lastName = user.lastName;
                returnObj.user.location = user.location;
                response.send(JSON.stringify(returnObj));
            }
        });
    }
});

app.get('/botList', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
                statusCode:401,
                message: "Unauthorized"
        }));
    }
    else{
        Bots.find(function(err, bots){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding bots"
                }));
            }
            else{
                var newBots = [];
                for(var idx in bots){
                    var currBot = bots[idx];
                    var botObj = {};
                    botObj.name = currBot.name;
                    botObj.id = currBot.id;
                    newBots.push(botObj);
                }
                newBots.sort(function(a, b){
                    return a.name > b.name;
                });
                var returnObj = {};
                //also want to sort these alphabetically
                returnObj.botList = newBots;
                response.send(JSON.stringify(returnObj));
            }
        });
    }
});


app.get('/getBot/:botId', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return
    }
    Bots.findOne({_id: request.params.botId}, function(err, bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Error finding Bot"
            }));
            return
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode: 404,
                message: "Invalid bot"
            }));
            return
        }
        //may need to check if user is null, but tests indicated otherwise
        request.session.bot = bot;
        var returnObj = {};
        returnObj.bot = {};
        returnObj.bot.id = bot.id;
        returnObj.bot.name = bot.name;
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
    }
    else{
        var bot = request.params.id;
        var user = request.session.user.id;
        Messages.find({$or: [{to: user, from: bot}, {to: bot, from: user}]}, function(err, messages){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding messages"
                }));
            }
            else{
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
            }
        });
    }
});

//BOT UTILITIES
app.get('/userConversation/:botId/:userId', function(request,response){
    if(typeof request.params === 'undefined' || typeof request.params.userId === 'undefined' || typeof request.params.botId === 'undefined'){
        response.status(404).send(JSON.stringify({
            statusCode: 404,
            message:"Arguments not provided"
        }));
        return
    }
    var bot = request.params.botId;
    var user = request.params.userId;
    Messages.find({$or: [{to: user, from: bot}, {to: bot, from: user}]}, function(err, messages){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding messages"
            }));
        }
        else{
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
        }
    });
});

app.get('/userInfo/:botId/:userId/:type', function(request, response){
    var userId = request.params.userId;
    var botId = request.params.botId;
    var type = request.params.type;
    if(type !== 'basic' && type !== 'email' && type !== 'birthday' && type !== 'location' && type !== 'all'){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Invalid type request"
        }));
        return
    }
    Bots.findOne({id: botId}, function(err, botObj){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error authenticating bot"
            }));
            return
        }
        else if(botObj === null){
            response.status(401).send(JSON.stringify({
                statusCode:401,
                message:"Invalid bot id"
            }));
            return
        }
        Users.findOne({id: userId}, function(err, userObj){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return
            }
            else if(userObj === null){
                response.status(401).send(JSON.stringify({
                    statusCode:401,
                    message:"Invalid user id"
                }));
                return
            }
            var botAuth;
            if(type === 'basic'){
                botAuth = userObj.basicAuthBots.find(function findId(id){
                    return id === botId
                });
            }
            else if(type === 'email'){
                botAuth = userObj.emailAuthBots.find(function findId(id){
                    return id === botId
                });
            }
            else if(type === 'birthday'){
                botAuth = userObj.birthdayAuthBots.find(function findId(id){
                    return id === botId
                });
            }
            else if(type === 'location'){
                botAuth = userObj.locationAuthBots.find(function findId(id){
                    return id === botId
                });
            }
            else if(type === 'all'){
                botAuth = userObj.allAuthBots.find(function findId(id){
                    return id === botId
                });
            }
            if(typeof botAuth === 'undefined'){
                response.status(401).send(JSON.stringify({
                    statusCode:401,
                    message:"Not authorized"
                }));
                return
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

app.post('/botSendMessage', function(request, response){
    if(Object.keys(request.body).length !== 3 || typeof request.body.userId !== 'string' || typeof request.body.botId !== 'string' || typeof request.body.text !== 'string'){
        response.status(404).send(JSON.stringify({
            statusCode:404,
            message:"Invalid arguments"
        }));
        return
    }
    Bots.findOne({_id:request.body.botId}, function(err,bot){
        if(err){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Error finding bot"
            }));
            return
        }
        else if(bot === null){
            response.status(404).send(JSON.stringify({
                statusCode:404,
                message:"Invalid bot"
            }));
            return
        }
        Users.findOne({_id:request.body.userId}, function(err,user){
            if(err){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Error finding user"
                }));
                return
            }
            else if(user === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Invalid user"
                }));
                return
            }
            Messages.create({
                to: request.body.userId,
                from: request.body.botId,
                text: request.body.text
            }, function(err, mess){
                if(err){
                    response.status(404).send(JSON.stringify({
                        statusCode:404,
                        message:"Error creating message"
                    }));
                    return
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