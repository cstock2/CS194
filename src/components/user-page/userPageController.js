/**
 * Created by CodyWStocker on 5/21/17.
 */

chatApp.controller('UserPageController', ['$scope', '$routeParams', '$resource', '$location', function($scope, $routeParams,$resource,$location){
    $scope.upc = {};
    $scope.upc.friend = false;
    $scope.upc.pendingFriend = false;
    $scope.upc.friendRequest = false;
    $scope.upc.none = false;

    $scope.makePage = function(){
        var resource = $resource('/getUser/:userId', {userId:'@userId'});
        var data = resource.get({userId:$routeParams.userId}, function(){
            console.log(data);
            $scope.upc.user = data;
        });
        var typeResource = $resource('/friendType/:userId', {userId: '@userId'});
        var friendData = typeResource.get({userId:$routeParams.userId}, function(){
            console.log("FriendData: ", friendData);
            if(friendData.type === 'friend'){
                console.log("IS FRIEND");
                $scope.upc.friend = true;
            }
            else if(friendData.type === 'sent request'){
                console.log("SENT REQUEST");
                $scope.upc.friendRequest = true;
            }
            else if(friendData.type === 'pending request'){
                console.log("PENDING REQUEST");
                $scope.upc.pendingFriend = true;
            }
            else{
                console.log("NONE OF THE ABOVE");
                $scope.upc.none = true;
            }
        });
    };

    $scope.goToConvo = function(){
        $location.path('/conversation/' + $routeParams.userId);
    };

    $scope.handleError = function(error){
        console.log(error);
    };

    $scope.unfriend = function(){
        console.log("UNFRIENDING");
        var resource = $resource('/unfriend', {} ,
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleError}
                }
            });
        var data = resource.save(JSON.stringify({userId: $routeParams.userId}), function(returnObj, err){
            if(returnObj !== null){
                $scope.upc.friends = false;
            }
        });
    };

    $scope.sendFriendRequest = function(){
        console.log("SENDING FRIEND REQUEST");
        var resource = $resource('/sendFriendRequest', {},
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleError}
                }
        });
        var data = resource.save(JSON.stringify({userId: $routeParams.userId}), function(returnObj, err){
            if(returnObj !== null){
                $scope.upc.pendingFriend = true;
            }
        });
    };

    $scope.acceptFriendRequest = function(){
        console.log("ACCEPTING FRIEND REQUEST");
        var resource = $resource('/acceptFriendRequest', {},
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleError}
                }
            });
        var data = resource.save(JSON.stringify({userId: $routeParams.userId}), function(returnObj, err){
            if(returnObj !== null){
                $scope.upc.friends = true;
                $scope.upc.friendRequest = false;
            }
        });
    };

    $scope.cancelFriendRequest = function(){
        console.log("CANCELING FRIEND REQUEST");
        var resource = $resource('/cancelFriendRequest', {},
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleError}
                }
            });
        var data = resource.save(JSON.stringify({userId: $routeParams.userId}), function(returnObj, err){
            if(returnObj !== null){
                $scope.upc.pendingFriend = false;
            }
        });
    };

    $scope.declineFriendRequest = function(){
        console.log("DECLINING FRIEND REQUEST");
        var resource = $resource('/declineFriendRequest', {},
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleError}
                }
            });
        var data = resource.save(JSON.stringify({userId: $routeParams.userId}), function(returnObj, err){
            if(returnObj !== null){
                $scope.upc.pendingFriend = false;
            }
        });
    };


    $scope.makePage();
}]);