/**
 * Created by CodyWStocker on 5/5/17.
 */

chatApp.controller('BotStartController', ['$scope', '$location', '$resource', '$routeParams', function($scope, $location, $resource, $routeParams){
    $scope.bsc = {};
    $scope.bsc.bot = {};
    $scope.bsc.bot.name = '';
    $scope.bsc.bot.basicPerm = false;
    $scope.bsc.bot.emailPerm = false;
    $scope.bsc.bot.birthdayPerm = false;
    $scope.bsc.bot.locationPerm = false;

    $scope.permissionError = function(error){
        console.log("error", error);
    };

    $scope.bsc.acceptPermissions = function(){
        var resource = $resource('/updatePermissions', {} ,
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.permissionError}
                }
            });
        //var resource = $resource('/updatePermissions');
        var botObj = {};
        botObj.botId = $routeParams.botId;
        botObj.basicPerm = $scope.bsc.bot.basicPerm;
        botObj.emailPerm = $scope.bsc.bot.emailPerm;
        botObj.birthdayPerm = $scope.bsc.bot.birthdayPerm;
        botObj.locationPerm = $scope.bsc.bot.locationPerm;
        botObj.allPerm = false;
        if(botObj.basicPerm && botObj.emailPerm && botObj.birthdayPerm && botObj.locationPerm){
            botObj.allPerm = true;
        }
        var data = resource.save(botObj, function(returnObj, err){
            if(returnObj.success){
                $location.path('/conversation/' + $routeParams.botId)
            }
            else{
                console.log("Error saving bot permissions")
            }
        });
    };

    $scope.bsc.declinePermissions = function(){
        $location.path('/userDetail/' + $scope.main.userId);
    };

    $scope.makePage = function(){
        var resource = $resource('/getBot/:botId', {botId: '@botId'});
        var data = resource.get({botId: $routeParams.botId}, function(){
            $scope.bsc.bot = data.bot;
        });
    };

    $scope.makePage();
}]);