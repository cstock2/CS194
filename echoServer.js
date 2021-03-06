/**
 * Created by CodyWStocker on 4/9/17.
 */

var express = require('express');
var app = express();
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication
var requestObj = require("request");

app.use(bodyParser.json());

const username = "echo";
const password = "echoBot";
const relayServer = "http://localhost:3002/";
// const relayServer = "http://chatio.ngrok.io/";
var myId = "a";
var cookieJar = requestObj.jar();

var server = app.listen(5555, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
    login(function(result){
        console.log("Logged in? ", result);
        getUsers(function(users){
            var firstUser = users[0];
            console.log("Done checking users");
            getUserPermissions(firstUser, function(permissions){
                console.log("Done checking permissions");
            });
        });
    });
});

var getUserPermissions = function(userId, callback){
    requestObj.get({json:true, url:relayServer + 'whatPermissions/' + userId, jar:true}, function(err, sResponse, body){
        if(err){
            console.log("err: ", err);
        }
        else{
            console.log("Body from getPermissions: ", body);
            callback(body.permissionList);
        }
    });
};

var login = function(callback){
    var postData = {username: username, password: password};
    var options = {
        body: postData,
        json: true,
        url: relayServer + "admin/botLogin",
        timeout: 1500,
        jar: true
    };
    var loginError = false;
    var cookie = requestObj.cookie('key1=value1');
    var url = relayServer + "admin/botLogin";
    requestObj({url: url, jar: cookieJar}, function(){
        requestObj.post(options, function(error, sResponse, body){
            if(error){
                console.log("error: ", error);
                loginError = true;
            }
            else if(typeof body.id === 'undefined'){
                console.log("error logging in: ", body);
                loginError = true;
            }
            else{
                console.log("successfully logged in: ", body);
                var myId = body.id;
            }
            callback(!loginError);
        });
    });
};

var getUsers = function(callback){
    requestObj.get({json:true, url:relayServer + 'botUsers', jar:true}, function(error, sResponse,body){
        if(error){
            console.log("Error");
        }
        else{
            console.log("Body: ", body);
            callback(body.users);
        }
    });
};

var isLoggedIn = function(callback){
    var options = {
        json: true,
        url: relayServer + 'isBotSession',
        jar: true
    };
    var isLoggedInVar = false;
    requestObj.get(options, function(error, sResponse, body){
        if(error){
            isLoggedInVar = false;
        }
        else{
            console.log("body: ", body);
            if(body.result === 'false'){
                isLoggedInVar = false;
            }
            else{
                isLoggedInVar = true;
            }
        }
        callback(isLoggedInVar);
    });
};

app.get('/', function(request,response){
    response.send('Simple webserver of files from ' + __dirname);
});

app.post('/sendMessage', function(request, response){
    console.log("GOT MESSAGE");
    response.send(JSON.stringify({message: "--ACK--"}));
    var postData = {type: 'text', text: request.body.text, botId: request.body.botId, userId: request.body.userId};
    var options = {
        body:postData,
        json: true,
        url: relayServer + 'botSendMessage',
        timeout: 1500,
        jar: true
    };
    isLoggedIn(function(result){
        if(!result){
            login(function(result){
                if(!result){
                    console.log("fatal error");
                }
                else{
                    requestObj.post(options, function(error, sResponse, body) {
                        if (error) {
                            console.log("Bad error");
                        }
                        else{
                            console.log("POSTED A MESSAGE");
                            console.log(body);
                        }
                    });
                }
            });
        }
        else{
            requestObj.post(options, function(error, sResponse, body) {
                if (error) {
                    console.log("Bad error");
                }
                else{
                    console.log(body);
                }
            });
        }
    });
});