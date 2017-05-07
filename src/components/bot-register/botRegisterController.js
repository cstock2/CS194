/**
 * Created by CodyWStocker on 5/5/17.
 */

chatApp.controller('BotRegisterController', ['$scope', '$location', '$resource', function($scope, $location, $resource){
    $scope.brc = {};
    $scope.brc.newBot = {};
    $scope.brc.newBot.name = "";
    $scope.brc.newBot.url = "";
    $scope.brc.newBot.basicPerm = true;
    $scope.brc.newBot.emailPerm = false;
    $scope.brc.newBot.locationPerm = false;
    $scope.brc.newBot.birthdayPerm = false;
    $scope.brc.newBot.allPerm = false;

    $scope.brc.badBotName = false;
    $scope.brc.badBotUrl = false;
    $scope.brc.botDetailLack = false;
    $scope.brc.botInternalError = false;
    $scope.brc.successBotRegister = false;


    $scope.handleBotRegisterError = function(err) {
        console.log("error:", err);
        if (err.data.message === "Bot name exists") {
            $scope.brc.badBotName = true;
        }
        else if (err.data.message === "Bot url exists") {
            $scope.brc.badBotUrl = true;
        }
        else if (err.data.message === "Error contacting bot server") {
            $scope.brc.badBotUrl = true;
        }
        else if (err.data.message === "Error in bot database" || err.data.message === "Error in request.get") {
            $scope.brc.botInternalError = true;
        }
    };

    $scope.registerBot = function(){
        if($scope.brc.newBot.name === "" || $scope.brc.newBot.url === ""){
            $scope.brc.botDetailLack = true;
            return
        }
        $scope.brc.botDetailLack = false;
        if($scope.brc.newBot.basicPerm && $scope.brc.newBot.emailPerm && $scope.brc.newBot.locationPerm && $scope.brc.newBot.birthdayPerm){
            $scope.brc.newBot.allPerm = true;
        }
        var resource = $resource('/admin/registerBot', {},
            {
                'save:': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleBotRegisterError}
                }

            });
        var data = resource.save(JSON.stringify($scope.brc.newBot), function(returnObj, err){
            console.log("err: ", err);
            if(returnObj !== null){
                $scope.brc.badBotName = false;
                $scope.brc.badBotUrl = false;
                $scope.brc.botDetailLack = false;
                $scope.brc.botInternalError = false;
                $scope.brc.successBotRegister = true;
            }
        });
    };
}]);