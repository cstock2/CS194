/**
 * Created by CodyWStocker on 5/10/17.
 */

chatApp.controller('GroupChatController', ['$scope', '$location', '$resource', '$routeParams', function($scope,$location,$resource,$routeParams){
    $scope.gcc = {};
    $scope.gcc.idToMemberName = [];
    $scope.gcc.myMessage = "";

    $scope.gcc.isUser = function(recipient){
        if(recipient === $scope.main.userId){
            return true;
        }
        return false;
    };

    $scope.handleMessageError = function(err){
        console.log(err);
        //We can probably do more here, but this would handle if there are problems with the database
    };

    $scope.gcc.sendMessage = function(){
        console.log("Got here");
        if($scope.gcc.myMessage !== ""){
            var message = {};
            message.text = $scope.gcc.myMessage;
            message.convoId = $routeParams.convoId;
            var resource = $resource('/sendGroupMessage', {} ,
                {
                    'save': {
                        method: 'POST',
                        interceptor: {responseError: $scope.handleMessageError}
                    }
                });
            var data = resource.save(JSON.stringify(message), function(err, returnObj){
                console.log(data);
                if(returnObj !== null){
                    $scope.makePage();
                }
            });
        }
    };

    $scope.makePage = function(){
        var convoResource = $resource('/groupConversation/:convoId', {convoId:'@convoId'});
        var convoData = convoResource.get({convoId: $routeParams.convoId}, function(){
            $scope.gcc.messages = convoData;
        });
        var groupResource = $resource('/group/:convoId', {convoId:'@convoId'});
        var groupData = groupResource.get({convoId: $routeParams.convoId}, function(){
            $scope.gcc.group = groupData;
            var botResource = $resource('/getBot/:botId', {botId:'@botId'});
            var botData = botResource.get({botId:$scope.gcc.group.botMember}, function(){
                $scope.gcc.botInfo = botData.bot;
                $scope.gcc.idToMemberName[botData.bot.id] = botData.bot.name;
            });
        });
        var memberResource = $resource('/groupUsers/:convoId', {convoId:'@convoId'});
        var memberData = memberResource.get({convoId: $routeParams.convoId}, function(){
            $scope.gcc.groupMembers = memberData.users;
            var numMembers = $scope.gcc.groupMembers.length;
            for(var idx = 0; idx < numMembers; idx++){
                $scope.gcc.idToMemberName[memberData.users[idx].id] = memberData.users[idx].firstName + ' ' + memberData.users[idx].lastName;
            }
        });
    };

    $scope.makePage();
}]);