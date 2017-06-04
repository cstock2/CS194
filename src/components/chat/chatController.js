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

    $scope.cc.buttonSelected = {'background-color': 'lightgreen'};

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

    $rootScope.$on('user message received', function(){
        console.log('user message received in chat controller');
        $scope.makePage();
    });

    $rootScope.$on('bot message received', function(){
        console.log('bot message received in chat controller');
        $scope.makePage();
    });

    $scope.handleMessageError = function(err){
        console.log(err);
        //We can probably do more here, but this would handle if there are problems with the database
    };

    $scope.handleUserMessageError = function(err){
        console.log(err);
    };

    $scope.handleMCMessageError = function(err){
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
                    $scope.cc.myMessage = "";
                    $scope.makePage();
                }
            });
        }
    };

    $scope.cc.isSelected = function(index, parentIndex ,grandParentIndex){
        return $scope.cc.chatHistory[grandParentIndex].selectedOption === (index + 2*parentIndex);
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
                    $scope.cc.myMessage = "";
                    $scope.makePage();
                }
            });
        }
    };

    $scope.cc.sendOption = function(index1, index2){
        var optionNumber = index1 + 2*index2;
        var numChats = $scope.cc.chatHistory.length;
        var currOptions = $scope.cc.chatHistory[numChats-1].options;
        var answer = currOptions[optionNumber];
        var message = {};
        message.answer = answer;
        message.botId = $scope.cc.currBot.id;
        message.answerNumber = optionNumber;
        message.messageId = $scope.cc.chatHistory[numChats-1].id;
        var resource = $resource('/sendMCMessage', {}, {
            'save': {
                method: 'POST',
                nterceptor: {responseError: $scope.handleMCMessageError}
            }
        });
        var data = resource.save(JSON.stringify(message), function(err,returnObj){
            if(returnObj !== null){
                $scope.cc.myMessage = "";
                $scope.makePage();
            }
        });
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
                        var dateString = $scope.main.formatDate(currChat.dateTime);
                        $scope.cc.chatHistory[idx].dateTime = dateString;
                    }
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
                        var dateString = $scope.main.formatDate(currChat.dateTime);
                        $scope.cc.chatHistory[idx].dateTime = dateString;
                        if(currChat.type === 'mc'){
                            var newOptions = [];
                            var copyOptions = JSON.parse(JSON.stringify(currChat.options));
                            while(copyOptions.length){
                                newOptions.push(copyOptions.splice(0,2));
                            }
                            currChat.newOptions = newOptions;
                        }
                    }
                    var numChats = $scope.cc.chatHistory.length;
                    if(numChats > 0){
                        $scope.cc.chatHistory[numChats-1].current = true;
                    }
                });
            }
        });
    };

    $scope.makePage();
}]);