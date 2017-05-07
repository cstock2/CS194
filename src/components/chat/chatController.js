/**
 * Created by CodyWStocker on 4/9/17.
 */

chatApp.controller('ChatController', ['$scope', '$resource','$routeParams', function($scope, $resource, $routeParams){
    $scope.cc = {};
    $scope.cc.myMessage = "";
    $scope.isBot = false;
    $scope.isUser = false;

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

    $scope.handleMessageError = function(err){
        console.log(err);
        //We can probably do more here, but this would handle if there are problems with the database
    };

    $scope.cc.sendMessage = function(){
        if($scope.cc.myMessage !== ""){
            var message = {};
            message.text = $scope.cc.myMessage;
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
                $scope.isUser = true;
                var userResource = $resource('/getUser/:userId', {id:'@userId'});
                var userData = userResource.get({userId: $routeParams.id},function(err){
                    console.log(err);
                    $scope.cc.currUser = userData;
                });
                var resource2 = $resource('/conversation/:id', {id:'@id'});
                var data2 = resource2.get({id: $routeParams.id}, function(){
                    console.log(data2);
                    $scope.cc.chatHistory = data2.chatHistory;
                });
            }
            else if(btr.type === 'bot'){
                $scope.isBot = true;
                var botResource = $resource('/getBot/:botId', {botId:'@botId'});
                var botData = botResource.get({botId: $routeParams.id}, function(){
                    $scope.cc.currBot = botData.bot;
                });
                var resource = $resource('/conversation/:id', {id:'@id'});
                var data = resource.get({id: $routeParams.id}, function(){
                    $scope.cc.chatHistory = data.chatHistory;
                });
            }
        });
    };

    $scope.makePage();
}]);