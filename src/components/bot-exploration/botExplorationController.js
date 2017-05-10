/**
 * Created by CodyWStocker on 5/6/17.
 */

chatApp.controller('BotExplorationController', ['$scope', '$location','$resource', function($scope,$location,$resource){
    $scope.bec = {};

    $scope.makePage = function(){
        var currBots = $resource('/currentBotList');
        var currBotData = currBots.get(function(){
            $scope.bec.currBots = currBotData.bots;
            var allBots = $resource('/botList');
            var allBotData = allBots.get(function(){
                $scope.bec.allBots = allBotData.botList;
                var toRemove = [];
                var notCurrBots = [];
                for(var idx in $scope.bec.allBots){
                    var currBot = $scope.bec.allBots[idx];
                    if(typeof $scope.bec.currBots.find(function check(bot){return currBot.id === bot.id})==='undefined'){
                        notCurrBots.push(currBot);
                    }
                }
                $scope.bec.allBots = notCurrBots;
                console.log($scope.bec.allBots);
            });
        });
    };

    $scope.makePage();
}]);