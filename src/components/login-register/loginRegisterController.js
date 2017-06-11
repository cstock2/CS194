/**
 * Created by CodyWStocker on 4/8/17.
 */

chatApp.controller('LoginRegisterController', ['$scope', '$location', '$resource', function($scope, $location, $resource){
    $scope.lrc = {};
    $scope.lrc.testname = "John Doe";
    $scope.lrc.user = {};
    $scope.lrc.newUser = {};
    $scope.lrc.newUser.firstName = "";
    $scope.lrc.newUser.lastName = "";
    $scope.lrc.newUser.location = "";
    $scope.lrc.newUser.emailAddress = "";
    $scope.lrc.newUser.gender = "";
    $scope.lrc.newUser.password1 = "";
    $scope.lrc.newUser.password2 = "";
    $scope.lrc.newUser.birthday = new Date();
    $scope.lrc.user.username = "";
    $scope.lrc.user.password = "";
    $scope.lrc.userNameBad = false;
    $scope.lrc.passwordBad = false;
    $scope.lrc.detailLack = false;
    $scope.lrc.passwordMatch = true;
    $scope.lrc.passwordLength = true;
    $scope.lrc.invalidUsername = false;
    $scope.lrc.otherError = false;
    $scope.lrc.databaseError = false;

    //$scope.lrc.newBot = {};
    //$scope.lrc.newBot.name = "";
    //$scope.lrc.newBot.url = "";
    //$scope.lrc.badBotName = false;
    //$scope.lrc.badBotUrl = false;
    //$scope.lrc.botDetailLack = false;
    //$scope.lrc.botInternalError = false;
    //$scope.lrc.successBotRegister = false;


    $scope.handleLoginError = function(err){
        if(err.data.message === "No user Found"){
            $scope.lrc.passwordBad = false;
            $scope.lrc.userNameBad = true;
            $scope.lrc.databaseError = false;
        }
        else if(err.data.message == "Error finding user"){
            $scope.lrc.passwordBad = false;
            $scope.lrc.userNameBad = false;
            $scope.lrc.databaseError = true;
        }
        else if(err.data.message === "Incorrect Password"){
            $scope.lrc.userNameBad = false;
            $scope.lrc.passwordBad = true;
            $scope.lrc.databaseError = false;
        }
    };

    $scope.handleRegisterError = function(err){
        console.log(err);
        if(err.data.message === "User exists"){
            console.log("Here");
            console.log(err.data);
            $scope.lrc.invalidUsername = true;
        }
        else{
            $scope.lrc.otherError = true;
        }
    };

    $scope.handleBotRegisterError = function(err){
        if(err.data.message === "Bot name exists"){
            $scope.lrc.badBotName = true;
        }
        else if(err.data.message === "Bot url exists"){
            $scope.lrc.badBotUrl = true;
        }
        else if(err.data.message === "Error contacting bot server"){
            $scope.lrc.badBotUrl = true;
        }
        else if(err.data.message === "Error in bot database" || err.data.message === "Error in request.get"){
            $scope.lrc.botInternalError = true;
        }
    };

    $scope.login = function(){
        if($scope.lrc.user.username === ""){
            $scope.lrc.userNameBad = true;
        }
        else if($scope.lrc.user.password === ""){
            $scope.lrc.passwordBad = true;
        }
        else{
            $scope.lrc.userNameBad = false;
            $scope.lrc.passwordBad = false;
        }
        var resource = $resource('/admin/login', {} ,
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleLoginError}
                }
            });
        var data = resource.save(JSON.stringify({socketId: $scope.main.webSocketId, user: $scope.lrc.user}), function(returnObj, err){
            if(returnObj !== null){
                $scope.main.username = returnObj.name;
                $scope.main.loggedIn = true;
                $scope.main.userId = returnObj.id;
                $scope.lrc.loginTest = true;
                $location.path('/userDetail/' + returnObj.id);
            }
        });
    };

    $scope.handleEvent = function(event){
        if(event.keyCode === 13){
            $scope.login();
        }
    };

    $scope.register = function(){
        if($scope.lrc.newUser.firstName === "" || $scope.lrc.newUser.lastName === "" || $scope.lrc.newUser.location === "" || $scope.lrc.newUser.gender === "" || $scope.lrc.emailAddress === "" || $scope.lrc.birthday === {} || $scope.lrc.password1 === "" || $scope.lrc.password2 === ""){
            $scope.lrc.detailLack = true;
            return;
        }
        if($scope.lrc.newUser.password1.length < 8){
            $scope.lrc.passwordLength = false;
            return;
        }
        if($scope.lrc.newUser.password1 !== $scope.lrc.newUser.password2){
            $scope.lrc.passwordMatch = false;
            return;
        }
        $scope.lrc.detailLack = false;
        $scope.lrc.passwordLength = true;
        $scope.lrc.passwordMatch = true;
        var resource = $resource('/admin/register', {} ,
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleRegisterError}
                }
            });
        var data = resource.save(JSON.stringify($scope.lrc.newUser), function(returnObj, err){
            if(returnObj !== null){
                $scope.main.username = returnObj.name;
                $scope.main.loggedIn = true;
                $scope.main.userId = returnObj.id;
                $scope.lrc.registerTest = true;
                $location.path('/userDetail/' + returnObj.id);
            }
        });
    };

    //$scope.registerBot = function(){
    //    if($scope.lrc.newBot.name === "" || $scope.lrc.newBot.url === ""){
    //        $scope.lrc.botDetailLack = true;
    //    }
    //    $scope.lrc.botDetailLack = false;
    //    var resource = $resource('/admin/registerBot', {},
    //        {
    //            'save:': {
    //                method: 'POST',
    //                interceptor: {responseError: $scope.handleBotRegisterError}
    //            }
    //
    //    });
    //    var data = resource.save(JSON.stringify($scope.lrc.newBot), function(returnObj, err){
    //        if(returnObj !== null){
    //            $scope.lrc.badBotName = false;
    //            $scope.lrc.badBotUrl = false;
    //            $scope.lrc.botDetailLack = false;
    //            $scope.lrc.botInternalError = false;
    //            $scope.lrc.successBotRegister = true;
    //        }
    //    });
    //}

}]);