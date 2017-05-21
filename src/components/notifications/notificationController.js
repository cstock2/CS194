/**
 * Created by CodyWStocker on 5/20/17.
 */

chatApp.controller('NotificationController', ['$scope', '$location', '$resource', '$rootScope', function($scope, $location, $resource, $rootScoe){
    $scope.nc = {};
    $scope.nc.markedSeen = false;

    $scope.handleNotifError = function(err){
        console.log(err);
    };

    $scope.makePage = function(){
        var allNotifsResouce = $resource('/notifications/:type', {type: '@type'});
        var seenResource = $resource('/seeNotifications', {},
            {
                'save': {
                    method: 'POST',
                    interceptor: {responseError: $scope.handleNotifError}
                }
            });
        var allNotifs = allNotifsResouce.get({type: 'other'}, function(){
            $scope.nc.notifications = allNotifs.notifications;
            console.log("allNotifs: ",allNotifs);
            var notifIds = [];
            for(var idx in $scope.nc.notifications){
                var currNotif = $scope.nc.notifications[idx];
                if(!currNotif.seen){
                    notifIds.push(currNotif.id);
                }
                currNotif.dateTime = $scope.main.formatDate(currNotif.dateTime);
            }
            seenResource.save(JSON.stringify({notifications: notifIds}), function(err, returnObj){
                if(returnObj !== null){
                    $scope.nc.markedSeen = true; //will likely want to later get rid of notification alert
                }
            }); 
        });
    };

    $scope.makePage();
}]);