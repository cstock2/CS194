/**
 * Created by CodyWStocker on 5/11/17.
 */

chatApp.controller('GroupStartController', ['$scope','$resource','$location', function($scope,$resource,$location){
    $scope.gsc = {};
    $scope.gsc.noFriends = false;
    $scope.gsc.newGroup = {};
    $scope.gsc.newGroup.users = [];
    $scope.gsc.newGroup.name = "";
    $scope.gsc.newGroup.botId = "";
    $scope.gsc.newGroup.users.push($scope.main.userId);
    $scope.gsc.botCurr = false;
    $scope.gsc.botNew = false;

    $scope.gsc.moreUsers = false;
    $scope.gsc.needBot = false;
    $scope.gsc.needName = false;

    $scope.gsc.addFriend = function(id){
        var loc = $scope.gsc.newGroup.users.find(function checkUser(user){return id === user});
        if(typeof loc ==='undefined'){ //for adding members
            var friendLoc = $scope.gsc.friends.find(function checkUser(user){
                return user.id === id;
            });
            friendLoc.selected = true;
            $scope.gsc.newGroup.users.push(id);
        }
        else{ //for toggling back to false
            var friendLoc2 = $scope.gsc.friends.find(function checkUser(user){
                return user.id === id;
            });
            friendLoc2.selected = false;
            $scope.gsc.newGroup.users.splice(loc);
        }
    };


    $scope.gsc.addCurrBot = function(id){
        if($scope.gsc.newGroup.botId !== ""){
            if($scope.gsc.botCurr){
                var oldBot = $scope.gsc.currBots.find(function checkbot(bot){
                    return bot.id === $scope.gsc.newGroup.botId;
                });
                oldBot.selected = false;
            }
            else{
                var oldBot2 = $scope.gsc.allBots.find(function checkbot(bot){
                    return bot.id === $scope.gsc.newGroup.botId;
                });
                oldBot2.selected = false;
            }
        }
        $scope.gsc.newGroup.botId = id;
        var newBot = $scope.gsc.currBots.find(function checkbot(bot){
            return bot.id === id;
        });
        newBot.selected = true;
        $scope.gsc.botCurr = true;
        $scope.gsc.botNew = false;
    };

    $scope.gsc.addNewBot = function(id){
        if($scope.gsc.newGroup.botId !== ""){
            if($scope.gsc.botCurr){
                var oldBot = $scope.gsc.currBots.find(function checkbot(bot){
                    return bot.id === $scope.gsc.newGroup.botId;
                });
                oldBot.selected = false;
            }
            else{
                var oldBot2 = $scope.gsc.allBots.find(function checkbot(bot){
                    return bot.id === $scope.gsc.newGroup.botId;
                });
                oldBot2.selected = false;
            }
        }
        $scope.gsc.newGroup.botId = id;
        var newBot = $scope.gsc.allBots.find(function checkBot(bot){
            return bot.id === id;
        });
        newBot.selected = true;
        $scope.gsc.botCurr= false;
        $scope.gsc.botNew = true;
    };

    $scope.handleGroupError = function(err){
        console.log(err);
        $scope.gsc.makeError = true;
    };

    $scope.gsc.makeGroup = function(){
        console.log($scope.gsc.newGroup);
        if($scope.gsc.newGroup.users.length < 2){
            $scope.gsc.needUsers = true;
        }
        else{
            $scope.gsc.needUsers = false;
        }
        if($scope.gsc.newGroup.botId.length === 0){
            $scope.gsc.needBot = true;
        }
        else{
            $scope.gsc.needBot = false;
        }
        if($scope.gsc.newGroup.name.length === 0){
            $scope.gsc.needName = true;
        }
        else{
            $scope.gsc.needName = false;
        }
        if($scope.gsc.needUsers || $scope.gsc.needBot || $scope.gsc.needName){
            return
        }
        //NEED TO CONSIDER ADDING CURRENT BOT TO USER, SENDING GROUP JOIN ALERTS TO ALL OTHER GROUP MEMBERS
        var resource = $resource('/makeGroup', {} ,
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleGroupError}
                }
            });
        var data = resource.save(JSON.stringify($scope.gsc.newGroup), function(returnObj, err){
            if(returnObj !== null){
                $scope.main.username = returnObj.name;
                $scope.main.loggedIn = true;
                $scope.main.userId = returnObj.id;
                $location.path('/groupConversation/' + returnObj.id);
            }
        });
    };

    $scope.makePage = function(){
        var friendResource = $resource('/getFriendInfo/friends');
        var friendData = friendResource.get(function(err,res){
            console.log(friendData);
            $scope.gsc.friends = friendData.people;
            if(friendData.people.length === 0){
                $scope.gsc.noFriends = true;
            }
            for(var idx in $scope.gsc.friends){
                $scope.gsc.friends[idx].selected = false;
            }
            var currBotResource = $resource('/currentBotList');
            var currBotData = currBotResource.get(function(){
                console.log(currBotData);
                $scope.gsc.currBots = currBotData.bots;
                for(var idx2 in $scope.gsc.currBots){
                    $scope.gsc.currBots[idx2].selected = false;
                }
                var allBotResource = $resource('/botList');
                var allBotData = allBotResource.get(function(){
                    console.log(allBotData);
                    $scope.gsc.allBots = allBotData.botList;
                    var notCurrBots = [];
                    $scope.gsc.allBots.forEach(function check(currBot){
                        if(typeof $scope.gsc.currBots.find(function checkBot(bot){return currBot.id === bot.id}) === 'undefined'){
                            notCurrBots.push(currBot);
                        }
                    });
                    $scope.gsc.allBots = notCurrBots;
                    for(var idx3 in $scope.gsc.allBots){
                        $scope.gsc.allBots[idx3].selected = false;
                    }
                });
            });
        });
    };

    $scope.makePage();
}]);