/**
 * Created by CodyWStocker on 5/19/17.
 */

function socketManager(){
    var userIdToSocket = {};

    var addId = function(socket, userId){
        if(typeof userIdToSocket[userId] !== 'undefined'){
            if(userIdToSocket[userId].indexOf(socket) !== -1){
                userIdToSocket[userId].push(socket);
            }
            else{
                userIdToSocket[userId].push(socket);
            }
        }
        else{
            var sockArray = [];
            sockArray.push(socket);
            userIdToSocket[userId] = sockArray;
        }
    };

    var removeId = function(socket, userId){
        if(typeof userIdToSocket[userId] !== 'undefined'){
            var index = userIdToSocket[userId].indexOf(socket);
            if(index !== -1){
                userIdToSocket[userId].splice(index, 1);
            }
            else{
                return; //should also return that there is no socket there
            }
        }
        else{
            return; //may want to return that there is no socket
        }
    };

    var getSocketFromId = function(userId){
        return userIdToSocket[userId];
    };

    var getSocketsFromIds = function(userIds){
        var sockets = [];
        for(var idx in userIds){
            var currSocks = userIdToSocket[userIds[idx]];
            if(typeof currSocks !== 'undefined'){
                sockets = sockets.concat(currSocks);
            }
            // sockets = sockets.concat(currSocks);
        }
        return sockets;
    };

    return {addId: addId, removeId: removeId, getSocketFromId: getSocketFromId, getSocketsFromIds: getSocketsFromIds};
}

module.exports = {
    socketManager: socketManager
};