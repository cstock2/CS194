/**
 * Created by CodyWStocker on 6/11/17.
 */


function botLogic(){
    var respond = function(text, callback){
        return callback(text);
    };

    var username = "testBot";
    var password = "testBot";
    var url = "http://localhost";
    var port = 5557;


    return {
        username: 'testBot',
        password: 'testBot',
        url: 'http://localhost',
        port: 5557,
        respond: respond
    };
}


module.exports = {
    bot: botLogic
};