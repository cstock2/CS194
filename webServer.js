/**
 * Created by CodyWStocker on 4/8/17.
 */
console.log("WEBSERVER");
//Sets up the required components to make the server run
var express = require('express');
var app = express();
var session = require('express-session');
var requestObj = require('request');
var expressWs = require('express-ws')(app);
var WebSocketServer = require('ws').Server;
var WebSocket = require('ws');

var https = require('https');
var url = require('url');
var fs = require('fs');

// var ngrok = require('ngrok');
// ngrok.connect({
//     proto: 'http', // http|tcp|tls
//     addr: 3030 // port or network address
// }, function (err, url) {});

var privateKey  = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};

// var httpsServer = https.createServer(credentials, app);
// httpsServer.listen(8443);

var socketManager = require('./socketManager.js').socketManager();

// app.set('port', (process.env.PORT || 3002));

var http = require('http').Server(app);
// console.log("http: ", http);
var io = require('socket.io')(http);
// console.log("IO");
// console.log(io);

http.listen(3002, function(){
    console.log("STARTING HTTP SERVER");
});

//webSocket setup
var clientIds = {};
var idCounter = 0;

// var wss = new WebSocket.Server({
//     perMessageDeflate: false,
//     port: 3030,
//     secure: true
// });
var wss;
if(process.env.PORT){
    console.log("NON-LOCAL");

    wss = new WebSocketServer({server: httpsServer});
    wss.on('connection', function connection(ws ,req){
        console.log("Connection received");
        const location = url.parse(req.url, true);
        clientIds[idCounter] = ws;
        idCounter += 1;
        ws.send(idCounter - 1);
    });
}
else{
    console.log("LOCAL");
    // httpsServer = https.createServer({}, function(){});
    // wss = new WebSocket.Server({
    //     perMessageDeflate: false,
    //     port: 3002,
    //     secure: true
    // });
    io.on('connection', function(socket){
        console.log("Connection received");
        clientIds[idCounter] = socket;
        idCounter += 1;
        // console.log("SOCKET:", socket);
        socket.emit('news', {message: 'register', number: idCounter - 1});
        // socket.on('chat message', function(msg){
        //     io.emit('chat message', msg);
        // });
    });
    // wss = new WebSocketServer({server: http})
    // httpsServer = https.createServer({port: 3030}, function(){});
    // wss = new WebSocketServer({server: httpsServer, perMessageDeflate: false});
}
// var wss = new ws({
//     server: httpsServer,
//     port: 3030,
//     perMessageDeflate: false,
// });

// io.on('connection', function(socket){
//     console.log("Connection received");
//     socket.on('disconnect', function(){
//         console.log("User disconnected");
//     });
// });


//
// console.log(wss);

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
// var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost/CS194V2');


var mongoose = require('mongoose');
var uristring =
    process.env.MONGOLAB_YELLOW_URI ||
    'mongodb://localhost/CS194V2';
console.log("uristring: ", uristring);
mongoose.connect(uristring, function(err, res){
    if(err){
        console.log("Error connecting to mongoose");
    }
    else{
        console.log("Succeeding in connectiong to: ", uristring);
    }
});
var Users = require('./schema/user.js');
var Bots = require('./schema/bot.js');
var Messages = require('./schema/message.js');
var GroupMessages = require('./schema/groupMessage.js');
var GroupConversations = require('./schema/groupConversation.js');
var Notifications = require('./schema/notification.js');

//Utility things that are necessary
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication
app.use(bodyParser.json());
var Promise = require('promise');
var async = require('async');


//Lets the app use the stuff in the directory
app.use(express.static(__dirname));


//echo bot goes here
// var echoBot = require("./echoBot.js");

// app.get('/', function(request, response){
//     response.send('Simple webserver of files from ' + __dirname);
// });
//
// console.log("PROCESS", process);
// console.log("PROCESS.ENV", process.env);
// // console.log("CONFIG PORT, ", config.port);
// var port = process.env.port || 3002;
// console.log("PORT: ", port);
//
// var server = app.listen(port, function () {
//     var port = server.address().port;
//     console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
// });

app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

// app.get('/webSocketServer', function(request,response){
//     response.send(JSON.stringify(wss));
// });

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

app.get('/admin/getsocketserver', function(request, response){

});

//has not been unit tested
app.get('/admin/logout', function(request,response){
    if(request.session.user === null){
        console.log("No user logged in");
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"No user logged in"
        }));
        return;
    }
    request.session.destroy(function(err){
        if(err){
            console.log("err", err);
            // console.log("Logged out");
            response.status(401).send(JSON.stringify({
                statusCode:401,
                message:"Error logging out"
            }));
        }
        response.send(JSON.stringify({
            loggedOut:true
        }));
    });
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
    console.log("Got login request");
    var username = request.body.user.username;
    var password = request.body.user.password;
    var socketId = request.body.socketId;
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
                    socketManager.addId(socketId, userObj._id);
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
    console.log("Login request", request.body);
    console.log("Login request", request.data);
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

app.post('/declineFriendRequest', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 1 || typeof request.body.userId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({id: request.session.user.id}, function(err, currUser){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding current user"
            }));
            return;
        }
        else if(currUser === null){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Invalid current user"
            }));
            return;
        }
        Users.findOne({id: request.body.userId}, function(err, reqUser){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(reqUser === null){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid user"
                }));
                return;
            }
            var pendingIndex = currUser.pendingFriendRequests.indexOf(request.body.userId);
            var frIndex = reqUser.friendRequests.indexOf(currUser.id);
            if(pendingIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Not an active friend request"
                }));
                return;
            }
            if(frIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"User has not sent you a friend request"
                }));
                return;
            }
            currUser.pendingFriendRequests.splice(pendingIndex, 1);
            reqUser.friendRequests.splice(frIndex, 1);
            currUser.save();
            reqUser.save();
            response.send(JSON.stringify({
                success: true
            }));
        });
    });
});

app.post('/cancelFriendRequest', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 1 || typeof request.body.userId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({id: request.session.user.id}, function(err, currUser){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding current user"
            }));
            return;
        }
        else if(currUser === null){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Invalid current user"
            }));
            return;
        }
        Users.findOne({id: request.body.userId}, function(err, reqUser){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(reqUser === null){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid user"
                }));
                return;
            }
            var frIndex = currUser.friendRequests.indexOf(request.body.userId);
            var pendingIndex = reqUser.pendingFriendRequests.indexOf(currUser.id);
            if(frIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Not an active friend request"
                }));
                return;
            }
            if(pendingIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"You have not sent user a friend request"
                }));
                return;
            }
            currUser.friendRequests.splice(frIndex, 1);
            reqUser.pendingFriendRequests.splice(pendingIndex, 1);
            currUser.save();
            reqUser.save();
            var text = currUser.firstName + " " + currUser.lastName + " has sent you a friend request";
            Notifications.remove({to: reqUser.id, text: text, relId: currUser.id}, function(result){
                if(result.writeConcernError){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error deleting notification"
                    }));
                    return;
                }
                response.send(JSON.stringify({
                    success: true
                }));
            });
        });
    });
});

app.post('/unfriend', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 1 || typeof request.body.userId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({id: request.session.user.id}, function(err, currUser){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding current user"
            }));
            return;
        }
        else if(currUser === null){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Invalid current user"
            }));
            return;
        }
        Users.findOne({id: request.body.userId}, function(err, reqUser){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(reqUser === null){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid user"
                }));
                return;
            }
            var frIndex = currUser.friends.indexOf(request.body.userId);
            var frIndex2 = reqUser.friends.indexOf(currUser.id);
            if(frIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Not a current friend"
                }));
                return;
            }
            if(frIndex2 === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Not a current friend of user"
                }));
                return;
            }
            currUser.friends.splice(frIndex, 1);
            reqUser.friends.splice(frIndex2, 1);
            currUser.save();
            reqUser.save();
            response.send(JSON.stringify({
                success: true
            }));
        });
    });
});

app.post('/seeNotifications', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 1 || typeof request.body.notifications === 'undefined'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    var calls = [];
    var errorInNotifications = false;
    var badNotification = false;
    request.body.notifications.forEach(function(notif, i){
        calls.push(function(callback){
            Notifications.findOne({id: notif}, function(err,notification){
                if(err){
                    errorInNotifications = true;
                }
                else if(notification === null){
                    badNotification = true;
                }
                else{
                    notification.seen = true;
                    notification.save();
                }
                callback();
            });
        });
    });
    async.series(calls, function(err, result){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error in async"
            }));
            return;
        }
        else if(errorInNotifications){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding notification"
            }));
            return;
        }
        else if(badNotification){
            response.status(400).send(JSON.stringify({
                statusCode:400,
                message:"Invalid notification"
            }));
            return;
        }
        response.send(JSON.stringify({
            success: true
        }));
    });
});

app.post('/acceptFriendRequest', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 1 || typeof request.body.userId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({id: request.session.user.id}, function(err, currUser){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding current user"
            }));
            return;
        }
        else if(currUser === null){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Invalid current user"
            }));
            return;
        }
        Users.findOne({id: request.body.userId}, function(err, reqUser){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(reqUser === null){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid user"
                }));
                return;
            }
            var pendingIndex = currUser.pendingFriendRequests.indexOf(request.body.userId);
            var frIndex = reqUser.friendRequests.indexOf(currUser.id);
            if(pendingIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Not an active friend request"
                }));
                return;
            }
            if(frIndex === -1){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"User has not sent you a friend request"
                }));
                return;
            }
            currUser.pendingFriendRequests.splice(pendingIndex, 1);
            reqUser.friendRequests.splice(frIndex, 1);
            currUser.friends.push(reqUser._id);
            reqUser.friends.push(currUser._id);
            currUser.save();
            reqUser.save();
            Notifications.create({
                to: reqUser._id,
                text: currUser.firstName + " " + currUser.lastName + " has accepted your friend request",
                action: 'visit user page',
                relId: currUser._id,
                type: 'other'
            }, function(err, notifObj){
                if(err){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error creating notification"
                    }));
                    return;
                }
                notifObj.id = notifObj._id;
                notifObj.save();
                response.send(JSON.stringify({
                    addedFriend: true
                }));
            });
        });
    });
});

app.post('/sendFriendRequest', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 1 || typeof request.body.userId !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Users.findOne({id: request.session.user.id}, function(err, currUser){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding current user"
            }));
            return;
        }
        else if(currUser === null){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Invalid current user"
            }));
            return;
        }
        Users.findOne({id: request.body.userId}, function(err, reqUser){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(reqUser === null){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid user"
                }));
                return;
            }
            currUser.friendRequests.push(request.body.userId);
            currUser.save();
            reqUser.pendingFriendRequests.push(currUser.id);
            reqUser.save();
            Notifications.create({
                to: reqUser._id,
                text: currUser.firstName + " " + currUser.lastName + " has sent you a friend request",
                action: 'friend request',
                relId: currUser.id,
                type: 'other'
            }, function(err, notifObj){
                if(err){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error creating notification"
                    }));
                    return;
                }
                notifObj.id = notifObj._id;
                notifObj.save();
                response.send(JSON.stringify({
                    requestSent: true
                }));
            });
        });
    });
});

app.post('/sendMCMessage', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    if(Object.keys(request.body).length !== 4 ||
        typeof request.body.messageId !== 'string' ||
        typeof request.body.botId !== 'string' ||
        typeof request.body.answerNumber !== 'number' ||
        typeof request.body.answer !== 'string'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid arguments"
        }));
        return;
    }
    Bots.findOne({_id: request.body.botId}, function(err, bot){
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
                message: "Invalid bot"
            }));
            return;
        }
        Messages.findOne({_id: request.body.messageId}, function(err, message){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding message"
                }));
                return;
            }
            else if(message === null){
                response.status(404).send(JSON.stringify({
                    statusCode:404,
                    message:"Invalid message"
                }));
                return;
            }
            message.selectedOption = request.body.answerNumber;
            message.save();
            Messages.create({
                to: bot._id,
                from: request.session.user._id,
                type: 'text',
                text: request.body.answer
            }, function(err, mess){
                if(err){
                    response.status(500).send(JSON.stringify({
                        statusCode:500,
                        message:"Error creating message"
                    }));
                    return;
                }
                mess.id = mess._id;
                mess.save();
                var postData = {text: request.body.answer, userId: request.session.user.id, botId: request.body.botId, answerNumber: request.body.answerNumber};
                var options = {
                    body:postData,
                    json: true,
                    url: bot.url,
                    timeout: 1500
                };
                requestObj.post(options, function(error, sResponse, body){
                    // if(error){
                    //     if(error.code === 'ETIMEDOUT'){
                    //         if(error.connect === true){
                    //             response.status(500).send(JSON.stringify({
                    //                 statusCode:500,
                    //                 message:"Could not send message to bot"
                    //             }));
                    //             return;
                    //         }
                    //         response.status(200).send(JSON.stringify({
                    //             sentMessage: true,
                    //             receivedResponse: false
                    //         }));
                    //         return;
                    //     }
                    //     else{
                    //         response.status(500).send(JSON.stringify({
                    //             statusCode:500,
                    //             message:"Error posting to bot"
                    //         }));
                    //         return;
                    //     }
                    // }
                    if(error){
                        response.status(500).send(JSON.stringify({
                            statusCode:500,
                            message:"Error posting to bot"
                        }));
                        return;
                    }
                    else if(body.message !== '--ACK--'){
                        response.status(500).send(JSON.stringify({
                            statusCode:500,
                            message:"Invalid bot response"
                        }));
                        return;
                    }
                    response.send(JSON.stringify({
                        sentMessage: true,
                        receivedResponse: true
                    }));
                    // if(typeof body.type !== 'string' || (body.type !== 'text' && body.type !== 'mc')){
                    //     response.status(400).send(JSON.stringify({
                    //         statusCode:400,
                    //         message:"Invalid bot response type"
                    //     }));
                    //     return;
                    // }
                    // if((body.type === 'text' && (typeof body.text !== 'string' || body.text.length < 1)) || (body.type === 'mc' && (typeof body.options === 'undefined' || body.options.length < 1))){
                    //     response.status(400).send(JSON.stringify({
                    //         statusCode:400,
                    //         message:"Invalid bot response"
                    //     }));
                    //     return;
                    // }
                    // Messages.create({
                    //     to: request.session.user.id,
                    //     from: request.body.botId,
                    //     type: body.type,
                    //     text: body.text,
                    //     options: body.options
                    // }, function(err, mess2){
                    //     if(err){
                    //         response.status(500).send(JSON.stringify({
                    //             statusCode: 500,
                    //             message: "Error creating bot message"
                    //         }));
                    //         return;
                    //     }
                    //     mess2.id = mess2._id;
                    //     mess2.save();
                    //     response.send(JSON.stringify({
                    //         sentMessage: true,
                    //         receivedResponse: true
                    //     }));
                    // });
                });
            });
        });
    });
});

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
                var data = 'update';
                var clients = [];
                // console.log("clientIds: ", clientIds);
                var openSockets = socketManager.getSocketFromId(user2._id);
                if(typeof openSockets !== 'undefined' && openSockets.length !== 0){
                    for(var idx in openSockets){
                        clients.push(clientIds[openSockets[idx]]);
                    }
                }
                console.log("ABOUT TO SEND CLIENT MESSAGES");
                console.log("clients.length", clients.length);
                if(clients.length !== 0){
                    clients.forEach(function each(client){
                        //will probably want to do more robust error checking here
                        client.emit('news', {message: 'user message received'});
                        // if(typeof client !== 'undefined' && client.readyState === WebSocket.OPEN){
                        //     console.log("EMITTING A MESSAGE");
                        //     console.log("CLIENT: ", client.emit);
                        //     client.emit('news', {message: 'user message received'});
                        // }
                        // else if(typeof client !== 'undefined' && client.readyState === WebSocket.CLOSED){
                        //     socketManager.removeId(client, user2._id);
                        // }
                    });
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
                if(error) {
                    // if(error.code === 'ETIMEDOUT'){
                    //     if(error.connect === true){
                    //         response.status(404).send(JSON.stringify({
                    //             statusCode:404,
                    //             message:"Could not send message to bot"
                    //         }));
                    //         return;
                    //     }
                    //     response.status(200).send(JSON.stringify({
                    //         sentMessage: true,
                    //         receivedResponse: false
                    //     }));
                    //     return;
                // }
                    // else{
                        response.status(500).send(JSON.stringify({
                            statusCode:500,
                            message:"Error posting to bot"
                        }));
                        return;

                    // }
                }
                else if(body.message !== "--ACK--"){
                    console.log("SRESPONSe", sResponse);
                    console.log("BAD BOT RESPONSE: ", body);
                    response.status(500).send(JSON.stringify({
                        statuscode:500,
                        message: "Bad bot response"
                    }));
                    return;
                }
                response.send(JSON.stringify({
                    sentMessage: true,
                    receivedResponse: true
                }));

                // if(typeof body.type !== 'string' || (body.type !== 'text' && body.type !== 'mc')){
                //     response.status(400).send(JSON.stringify({
                //         statusCode:400,
                //         message:"Invalid bot response type"
                //     }));
                //     return;
                // }
                // if((body.type === 'text' && (typeof body.text !== 'string' || body.text.length < 1)) || (body.type === 'mc' && (typeof body.options === 'undefined' || body.options.length < 1))){
                //     response.status(400).send(JSON.stringify({
                //         statusCode:400,
                //         message:"Invalid bot response"
                //     }));
                //     return;
                // }
                // var responseMessage = body.text;
                // Messages.create({
                //     to: request.session.user.id,
                //     from: request.body.botId,
                //     type: body.type,
                //     text: body.text,
                //     options: body.options
                // }, function(err, mess2){
                //     if(err){
                //         response.status(500).send(JSON.stringify({
                //             statusCode: 500,
                //             message: "Error posting bot response"
                //         }));
                //         return;
                //     }
                //     mess2.id = mess2._id;
                //     mess2.save();
                //     response.send(JSON.stringify({
                //         sentMessage: true,
                //         receivedResponse: true
                //     }));
                // });
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
                var clients = [];
                // var openSockets = socketManager.getSocketFromId(user2._id);
                var openSockets = socketManager.getSocketsFromIds(convo.userMembers);
                if(typeof openSockets !== 'undefined' && openSockets.length !== 0){
                    for(var idx in openSockets){
                        var currSocket = clientIds[openSockets[idx]];
                        clients.push(clientIds[openSockets[idx]]);
                    }
                }
                if(clients.length !== 0){
                    clients.forEach(function each(client){
                        if(typeof client !== 'undefined' && client.readyState === WebSocket.OPEN){
                            // client.send('group message received');
                            client.emit('news', {message: 'group message received'});
                        }
                        // else if(typeof client !== 'undefined' && client.readyState === WebSocket.CLOSED){
                        //     socketManager.removeId(client, user2._id);
                        // }
                    });
                }
                var postData = {text: request.body.text, userId: request.session.user.id, botId: bot.id};
                var options = {
                    body:postData,
                    json: true,
                    url: bot.url,
                    timeout: 1500
                };
                requestObj.post(options, function(error, sResponse, body){
                    if(error){
                        response.status(500).send(JSON.stringify({
                            statusCode:500,
                            message:"Error posting to bot"
                        }));
                        return;
                        // if(error.code === 'ETIMEDOUT'){
                        //     if(error.connect === true){
                        //         response.status(404).send(JSON.stringify({
                        //             statusCode:404,
                        //             message:"Could not send message to bot"
                        //         }));
                        //         return;
                        //     }
                        //     response.status(200).send(JSON.stringify({
                        //         sentMessage: true,
                        //         receivedResponse: false
                        //     }));
                        //     return;
                        // }
                        // else{
                        //     response.status(500).send(JSON.stringify({
                        //         statusCode:500,
                        //         message:"Error posting to bot"
                        //     }));
                        //     return;
                        // }
                    }
                    else if(body.text !== "--ACK--"){
                        response.status(400).send(JSON.stringify({
                            statusCode:400,
                            message:"Invalid bot response"
                        }));
                    }
                    response.send(JSON.stringify({
                        sentMessage: true,
                        receivedResponse: true
                    }));
                    // if(typeof body.text !== 'string' || body.text.length < 1){
                    //     response.status(400).send(JSON.stringify({
                    //         statusCode:400,
                    //         message:"Invalid bot response"
                    //     }));
                    //     return;
                    // }
                    // GroupMessages.create({
                    //     convoId: request.body.convoId,
                    //     from: convo.botMember,
                    //     text: body.text
                    // },function(err, newMessage){
                    //     if(err){
                    //         response.status(500).send(JSON.stringify({
                    //             statusCode:500,
                    //             message:"Error saving bot response"
                    //         }));
                    //         return;
                    //     }
                    //     newMessage.id = newMessage._id;
                    //     newMessage.save();
                    //     if(clients.length !== 0){
                    //         clients.forEach(function each(client){
                    //             if(typeof client !== 'undefined' && client.readyState === WebSocket.OPEN){
                    //                 client.send('group message received');
                    //             }
                    //         });
                    //     }
                    //     response.send(JSON.stringify({
                    //         sentMessage: true,
                    //         receivedResponse: true
                    //     }));
                    // });
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

app.get('/friendType/:userId', function(request,response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message:"Unauthorized"
        }));
        return;
    }
    Users.findOne({_id: request.session.user._id}, function(err, user){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message: "Error finding current user"
            }));
            return;
        }
        else if(user === null){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Current user invalid"
            }));
            return;
        }
        Users.findOne({_id: request.params.userId}, function(err,user2){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding user"
                }));
                return;
            }
            else if(user2 === null){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid parameter"
                }));
                return;
            }
            if(user.friends.indexOf(user2.id) !== -1){
                response.send(JSON.stringify({
                    type: 'friend'
                }));
            }
            else if(user.friendRequests.indexOf(user2.id) !== -1){
                response.send(JSON.stringify({
                    type: 'sent request'
                }));
            }
            else if(user.pendingFriendRequests.indexOf(user2.id) !== -1){
                response.send(JSON.stringify({
                    type: 'pending request'
                }));
            }
            else{
                response.send(JSON.stringify({
                    type: 'none'
                }));
            }
        });
    });
});

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
                message:"Invalid user"
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
                if(typeof user.currentBots.find(function find(id){return currBot.id == id})!== 'undefined'){
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
            newMessage.type = currMessage.type;
            if(currMessage.type === 'text'){
                newMessage.text = currMessage.text;
            }
            else if(currMessage.type === 'mc'){
                newMessage.options = currMessage.options;
                if(typeof currMessage.selectedOption !== 'undefined'){
                    newMessage.selectedOption = currMessage.selectedOption;
                }
            }
            newMessage.dateTime = currMessage.dateTime;
            newMessage.to = currMessage.to;
            newMessage.from = currMessage.from;
            newMessage.id = currMessage.id;
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

app.get('/notifications/:type', function(request, response){
    if(typeof request.session.user === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    if(request.params.type !== 'all' && request.params.type !== 'pending' && request.params.type !== 'message' && request.params.type !== 'messagePending' && request.params.type !== 'other' && request.params.type !== 'otherPending'){
        response.status(400).send(JSON.stringify({
            statusCode:400,
            message:"Invalid argument"
        }));
        return;
    }
    var notifObj = {to: request.session.user.id}; //this is the default for all
    if(request.params.type === 'pending'){
        notifObj.seen = false;
    }
    else if(request.params.type === 'message'){
        notifObj.type = 'message';
    }
    else if(request.params.type === 'messagePending'){
        notifObj.type = 'message';
        notifObj.seen = false;
    }
    else if(request.params.type === 'other'){
        notifObj.type = 'other';
    }
    else{
        notifObj.type = 'other';
        notifObj.seen = false;
    }
    Notifications.find(notifObj, function(err, notifs){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message:"Error finding notifications"
            }));
            return;
        }
        if(notifs === null){
            response.send(JSON.stringify({notifs: false, notifications: []}));
            return;
        }
        var returnNotifs = [];
        for(var idx in notifs){
            var currNotif = notifs[idx];
            returnNotifs.push({
                id: currNotif.id,
                dateTime: currNotif.dateTime,
                text: currNotif.text,
                action: currNotif.action,
                relId: currNotif.relId,
                seen: currNotif.seen,
                type: currNotif.type
            });
        }
        returnNotifs.sort(function compare(a, b){
            return a.dateTime < b.dateTime;
        });
        response.send(JSON.stringify({notifs: true, notifications: returnNotifs}));
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

app.get('/isBotSession', function(request, response){
    if(typeof request.session.botLogin === 'undefined'){
        response.send(JSON.stringify({result: 'false'}));
    }
    else{
        response.send(JSON.stringify({result: 'true'}));
    }
});

app.get('/whatPermissions/:userId', function(request, response){
    if(typeof request.session.botLogin === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Bots.findOne({_id: request.session.botLogin._id}, function(err, bot){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message: "Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(400).send(JSON.stringinfy({
                statusCode:400,
                message:"Invalid bot"
            }));
            return;
        }
        Users.findOne({_id: request.params.userId}, function(err, user){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message: "Error finding bot"
                }));
                return;
            }
            else if(user === null){
                response.status(400).send(JSON.stringinfy({
                    stautsCode:400,
                    message:"Invalid bot"
                }));
                return;
            }
            var botId = request.session.botLogin._id;
            var basic = false;
            var email = false;
            var location = false;
            var birthday = false;
            var all = false;
            console.log("USER: ", user);
            if(user.basicAuthBots.indexOf(botId) !== -1){
                basic = true;
            }
            if(user.emailAuthBots.indexOf(botId) !== -1){
                email = true;
            }
            if(user.locationAuthBots.indexOf(botId) !== -1){
                location = true;
            }
            if(user.birthdayAuthBots.indexOf(botId) !== -1){
                birthday = true;
            }
            if(user.allAuthBots.indexOf(botId) !== -1){
                all = true;
            }
            response.send(JSON.stringify({permissionList: {basic: basic, email: email, location:location,birthday:birthday,all:all}}));
        });
    });
});

app.get('/botUsersInGroup/:convoId', function(request, response){
    if(typeof request.session.botLogin === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Bots.findOne({_id: request.session.botLogin._id}, function(err, bot){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message: "Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(400).send(JSON.stringify({
                statusCode:400,
                message:"Invalid bot"
            }));
            return;
        }
        GroupConversations.findOne({_id: request.params.convoId}, function(err, convo){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding conversation"
                }));
                return;
            }
            else if(convo === 'undefined'){
                response.status(400).send(JSON.stringify({
                    statusCode:400,
                    message:"Invalid conversation"
                }));
                return;
            }
            var users= JSON.parse(JSON.stringify(convo.userMembers));
            response.send(JSON.stringify({userIds: users}));
        });
    });
});

app.get('/botUsers', function(request,response){
    if(typeof request.session.botLogin === 'undefined'){
        response.status(401).send(JSON.stringify({
            statusCode:401,
            message: "Unauthorized"
        }));
        return;
    }
    Bots.findOne({_id: request.session.botLogin._id}, function(err, bot){
        if(err){
            response.status(500).send(JSON.stringify({
                statusCode:500,
                message: "Error finding bot"
            }));
            return;
        }
        else if(bot === null){
            response.status(400).send(JSON.stringinfy({
                statusCode:400,
                message:"Invalid bot"
            }));
            return;
        }
        Users.find({}, function(err, users){
            if(err){
                response.status(500).send(JSON.stringify({
                    statusCode:500,
                    message:"Error finding users"
                }));
                return;
            }
            var userIds = [];
            for(var idx in users){
                var currUser = users[idx];
                if(currUser.currentBots.indexOf(request.session.botLogin._id) !== -1){
                    userIds.push(currUser._id);
                }
            }
            response.send(JSON.stringify({users: userIds}));
        });
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
                var clients = [];
                // var openSockets = socketManager.getSocketFromId(user2._id);
                var openSockets = socketManager.getSocketsFromIds(convo.userMembers);
                if(typeof openSockets !== 'undefined' && openSockets.length !== 0){
                    for(var idx in openSockets){
                        clients.push(clientIds[openSockets[idx]]);
                    }
                }
                if(clients.length !== 0){
                    clients.forEach(function each(client){
                        if(typeof client !== 'undefined' && client.readyState === WebSocket.OPEN){
                            // client.send('group message received');
                            client.emit('news', {message: 'group message received'});
                        }
                    });
                }
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
    if(Object.keys(request.body).length !== 4 || typeof request.body.type !== 'string' || typeof request.body.userId !== 'string' || typeof request.body.botId !== 'string' || (request.body.type === 'text' && typeof request.body.text !== 'string') || (request.body.type === 'mc' && typeof request.body.options === 'undefined')){
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
                var clients = [];
                var openSockets = socketManager.getSocketFromId(user._id);
                if(typeof openSockets !== 'undefined' && openSockets.length !== 0){
                    for(var idx in openSockets){
                        clients.push(clientIds[openSockets[idx]]);
                    }
                }
                if(clients.length !== 0){
                    clients.forEach(function each(client){
                        if(typeof client !== 'undefined' && client.readyState === WebSocket.OPEN){
                            // client.send('user message received');
                            client.emit('news', {message: 'user message received'});
                        }
                        else if(typeof client !== 'undefined' && client.readyState === WebSocket.CLOSED){
                            socketManager.removeId(client, user._id); //need to apply this to group messages as well
                        }
                    });
                }
                var returnObj = {};
                returnObj.success = true;
                response.send(JSON.stringify(returnObj));
            });
        });
    });
});

module.exports = app;