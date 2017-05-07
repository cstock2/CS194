/**
 * Created by CodyWStocker on 4/8/17.
 */

chatApp.controller('BotNavController', ['$scope', '$resource', '$location', function($scope, $resource, $location){
    $scope.bnc = {};

    $scope.bnc.setLocation = function(navPath){
        if(navPath === 'logout'){
            $scope.main.loggedIn = false;
            $location.path('/');
        }
        else if(navPath === 'profile'){
            $location.path('/userDetail/' + $scope.main.userId);
        }
        else{
            $location.path('/' + navPath);
        }
    };

    $scope.bnc.getChat = function(botId){
        var resource = $resource('/isCurrentBot/:botId', {botId:'@botId'});
        var data = resource.get({botId: botId}, function(){
            if(data.currentBot){
                $location.path('/conversation/' + botId);
            }
            else{
                $location.path('/botStart/' + botId);
            }
        });
    };

    $scope.makePage = function(){
        var resource = $resource('/botList');
        var data = resource.get({}, function(){
            $scope.bnc.botList = data.botList;
        });
    };


    $scope.makePage();
}]);