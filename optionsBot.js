/**
 * Created by CodyWStocker on 5/14/17.
 */

var express = require('express');
var app = express();
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication

app.use(bodyParser.json());

var server = app.listen(6666, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});

app.get('/', function(request,response){
    response.send('Simple webserver of files from ' + __dirname);
});

app.post('/', function(request, response){
    var responseObj = {};
    responseObj.type = 'mc';
    responseObj.options = [];
    responseObj.text = '';
    responseObj.options.push('hello');
    responseObj.options.push('goodbye');
    responseObj.options.push('goodmorning');
    responseObj.options.push('goodnight');
    response.send(JSON.stringify(responseObj));
    //response.send(JSON.stringify({text: request.body.text}));
});