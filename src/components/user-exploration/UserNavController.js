/**
 * Created by CodyWStocker on 6/11/17.
 */

chatApp.controller('UserNavController', ['$scope','$location','$resource', function($scope, $location, $resource){
    $scope.unc = {};

    $scope.goToPage = function(id){
        $location.path('/userPage/' + id);
    };

    $scope.makePage = function(){
        var resource = $resource('/usersAndFriends');
        var data = resource.get(function(){
            $scope.unc.friends = data.friends;
            $scope.unc.others = data.others;
            console.log("Friends: ", data.friends);
            console.log("Other users: ", data.others);
        });
    };

    $scope.makePage();
}]);