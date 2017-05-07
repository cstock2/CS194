/**
 * Created by CodyWStocker on 4/9/17.
 */

var express = require('express');
var app = express();
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication

app.use(bodyParser.json());

var server = app.listen(5555, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});

app.get('/', function(request,response){
    response.send('Simple webserver of files from ' + __dirname);
});

app.post('/', function(request, response){
    console.log(request.body);
    response.send(JSON.stringify({text: request.body.text}));
});