/**
 * Created by CodyWStocker on 4/9/17.
 */

chatApp.controller('ChatController', ['$scope', '$resource','$routeParams','$rootScope', function($scope, $resource, $routeParams,$rootScope){
    $scope.cc = {};
    $scope.cc.myMessage = "";
    // $scope.main.userId = "BAD";
    // $rootScope.$broadcast('logged out');
    $scope.cc.isBot = false;
    $scope.cc.isNotBot = false;

    $scope.cc.isUser = function(recipient){
        if(recipient !== $scope.main.userId){
            return true;
        }
        return false;
    };

    $scope.cc.isNotUser = function(recipient){
        if(recipient === $scope.main.userId){
            return true;
        }
        return false;
    };

    $scope.formatDate = function(date){
        var newDate = new Date(date);
        var string = "";
        string += newDate.getDate() + " ";
        string += $scope.main.months[newDate.getMonth()] + " ";
        string += newDate.getFullYear() + " ";
        string += newDate.getHours() + ":";
        var minutes = newDate.getMinutes();
        if(minutes < 10){
            string+= "0" + minutes + ":";
        }
        else{
            string += minutes + ":"
        }
        var seconds = newDate.getSeconds();
        if(seconds < 10){
            string+="0"+seconds
        }
        else{
            string+=seconds;
        }
        return string;
    };

    $scope.handleMessageError = function(err){
        console.log(err);
        //We can probably do more here, but this would handle if there are problems with the database
    };

    $scope.handleUserMessageError = function(err){
        console.log(err);
    };

    $scope.cc.sendUserMessage = function(userId){
        if($scope.cc.myMessage !== ""){
            var message2 = {};
            message2.text = $scope.cc.myMessage;
            message2.userTo = userId;
            var resource = $resource('/sendUserUserMessage');
            var data = resource.save(JSON.stringify(message2), function(err, returnObj){
                if(returnObj !== null){
                    $scope.makePage();
                }
            });
        }
    };

    $scope.cc.sendMessage = function(){
        if($scope.cc.myMessage !== ""){
            var message = {};
            message.text = $scope.cc.myMessage;
            message.botId = $scope.cc.currBot.id;
            var resource = $resource('/sendMessage', {} ,
                {
                    'save': {
                        method: 'POST',
                        interceptor: {responseError: $scope.handleMessageError}
                    }
                });
            var data = resource.save(JSON.stringify(message), function(err, returnObj){
                if(returnObj !== null){
                    $scope.makePage();
                }
            });
        }
    };



    $scope.makePage = function(){
        var botTypeResource = $resource('/isType/:id', {id:'@id'});
        var btr = botTypeResource.get({id: $routeParams.id}, function(){
            if(btr.type === 'user'){
                $scope.cc.isNotBot = true;
                var userResource = $resource('/getUser/:userId', {id:'@userId'});
                var userData = userResource.get({userId: $routeParams.id},function(err){
                    $scope.cc.currUser = userData;
                });
                var resource2 = $resource('/conversation/:id', {id:'@id'});
                var data2 = resource2.get({id: $routeParams.id}, function(){
                    $scope.cc.chatHistory = data2.chatHistory;
                    for(var idx in $scope.cc.chatHistory){
                        var currChat = $scope.cc.chatHistory[idx];
                        var dateString = $scope.formatDate(currChat.dateTime);
                        $scope.cc.chatHistory[idx].dateTime = dateString;
                    }
                    console.log($scope.cc.chatHistory);
                });
            }
            else if(btr.type === 'bot'){
                $scope.cc.isBot = true;
                var botResource = $resource('/getBot/:botId', {botId:'@botId'});
                var botData = botResource.get({botId: $routeParams.id}, function(){
                    $scope.cc.currBot = botData.bot;
                });
                var resource = $resource('/conversation/:id', {id:'@id'});
                var data = resource.get({id: $routeParams.id}, function(){
                    $scope.cc.chatHistory = data.chatHistory;
                    for(var idx in $scope.cc.chatHistory){
                        var currChat = $scope.cc.chatHistory[idx];
                        var dateString = $scope.formatDate(currChat.dateTime);
                        $scope.cc.chatHistory[idx].dateTime = dateString;
                    }
                });
            }
        });
    };

    $scope.makePage();
}]);