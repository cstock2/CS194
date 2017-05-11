/**
 * Created by CodyWStocker on 4/8/17.
 */

chatApp.controller('UserDetailController', ['$scope', '$resource','$routeParams','$location', function($scope, $resource, $routeParams, $location){
    $scope.udc = {};

    $scope.goToConversation = function(id){
        $location.path('/conversation/'+id);
    };

    $scope.goToGroupConversation = function(id){
        $location.path('/groupConversation/'+id);
    };

    $scope.makePage = function(){
        var resource = $resource('/userDetail/:userId', {userId:'@userId'});
        var data = resource.get({userId:$routeParams.userId}, function(){
            $scope.udc.user = data.user;
        });
        var userList = $resource('/userList');
        var userData = userList.get(function(){
            $scope.udc.userList = userData.users;
        });
        var currentBotList = $resource('/currentBotList');
        var currBotData = currentBotList.get(function(){
            $scope.udc.currBotList = currBotData.bots;
        });
        var currentGroupList = $resource('/groupMessages');
        var groupData = currentGroupList.get(function(){
            $scope.udc.hasGroups = groupData.hasGroups;
            $scope.udc.groups = groupData.groups;
        });
    };

    $scope.makePage();
}]);