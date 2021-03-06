/**
 * Created by CodyWStocker on 5/14/17.
 */

var express = require('express');
var app = express();
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication
var requestObj = require("request");

app.use(bodyParser.json());

const username = "mcbot";
const password = "mcbot";
const relayServer = "http://localhost:3002/";
var myId = "a";
var cookieJar = requestObj.jar();

var server = app.listen(6666, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
    login(function(result){
        if(result){
            console.log("Successfully logged in");
        }
        else{
            console.log("Could not login");
        }
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

app.post('/', function(request, response){
    response.send(JSON.stringify({message: "--ACK--"}));
    var responseObj = {};
    var resOptions = [];
    resOptions.push('hello');
    resOptions.push('goodbye');
    resOptions.push('goodmorning');
    resOptions.push('goodnight');
    var postData = {type: 'mc', options: resOptions, botId: request.body.botId, userId: request.body.userId};
    var options = {
        body:postData,
        json: true,
        url: 'http://localhost:3002/botSendMessage',
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
                            console.log("Success?");
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
                    console.log("Success?");
                    console.log(body);
                }
            });
        }
    });
    //response.send(JSON.stringify({text: request.body.text}));
});