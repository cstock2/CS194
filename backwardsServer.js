/**
 * Created by CodyWStocker on 4/9/17.
 */

var express = require('express');
var app = express();
var bodyParser = require("body-parser"); //getting rid of this will make it so you can't parse HTTP communication

app.use(bodyParser.json());

var server = app.listen(5556, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});

app.get('/', function(request,response){
    response.send('Simple webserver of files from ' + __dirname);

});

app.post('/', function(request, response){
    console.log(request.body);
    var string = request.body.text;
    var splitString = string.split("");
    var reverseArray = splitString.reverse();
    var newString = reverseArray.join("");
    response.send(JSON.stringify({text: reverseArray}));
});