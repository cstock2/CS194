/**
 * Created by CodyWStocker on 6/11/17.
 */
var express = require('express');
var app = express();
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication
var requestObj = require("request");
var bot = require('./bots/botTemplate.js').bot();


app.use(bodyParser.json());
var username = bot.username;
var password = bot.password;
var port = bot.port;
// const username = "echo";
// const password = "echoBot";

const relayServer = "http://localhost:3002/";
// const relayServer = "http://chatio.ngrok.io/";
var myId = "a";
var cookieJar = requestObj.jar();

var server = app.listen(port, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
    login(function(result){
        console.log("Logged in? ", result);
    });
});

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
    // var cookie = requestObj.cookie('key1=value1');
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
    bot.respond(request.body.text, function(respond){
        var postData = {type: 'text', text: request.body.text, botId: request.body.botId, userId: request.body.userId};
        var options = {
            body:postData,
            json: true,
            url: relayServer + 'botSendMessage',
            timeout: 1500,
            jar: true
        };
        requestObj.post(options, function(error, sResponse,body){
            if(error){
                console.log("FATAL ERROR");
                return;
            }
            else if(body.status === 401){
                if(error.data.statusCode === 401){
                    console.log("Not logged in");
                    login(function(){
                        requestObj.post(options, function(error, sResponse, body){
                            if(error){
                                console.log("FATAL ERROR");
                                return;
                            }
                            else if(body.status === 401){
                                console.log("UNABLE TO LOG IN");
                                return;
                            }
                            else{
                                console.log("SUCCESSFULLY POSTED A MESSAGE: ", body);
                            }
                        });
                    });
                }
            }
            else{
                console.log("SUCCESSFULLY POSTED A MESSAGE: ", body);
            }
        })
    });
});