/**
 * Created by CodyWStocker on 4/8/17.
 */
var chatApp = angular.module('chatApp', ['ngRoute', 'ngMaterial', 'ngResource']);

chatApp.config(['$routeProvider',
    function($routeProvider){
        $routeProvider.
            when('/login',{
                templateUrl: 'src/components/login-register/loginRegisterTemplate.html',
                controller: 'LoginRegisterController'
            }).
            when('/userDetail/:userId', {
                templateUrl: 'src/components/user-detail/userDetailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/botNavigation',{
                templateUrl: 'src/components/bot-navigation/botNavTemplate.html',
                controller: 'BotNavController'
            }).
            when('/botExploration',{
                templateUrl: 'src/components/bot-exploration/botExpTemplate.html',
                controller: 'BotExplorationController'
            }).
            when('/conversation/:id',{
                templateUrl: 'src/components/chat/chatTemplate.html',
                controller: 'ChatController'
            }).
            when('/registerBot',{
                templateUrl: 'src/components/bot-register/botRegisterTemplate.html',
                controller: 'BotRegisterController'
            }).
            when('/botStart/:botId',{
                templateUrl: 'src/components/bot-start/botStartTemplate.html',
                controller: 'BotStartController'
            }).
            when('/groupConversation/:convoId',{
                templateUrl: 'src/components/group-chat/groupChatTemplate.html',
                controller: 'GroupChatController'
            }).
            when('/groupStart',{
                templateUrl: 'src/components/group-start/groupStartTemplate.html',
                controller: 'GroupStartController'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);

chatApp.controller('MainController', ['$scope', '$rootScope', '$location','$resource', function($scope, $rootScope, $location, $resource){
    $scope.main = {};
    $scope.main.title = "Chat App";
    $scope.main.loggedIn = false;
    $scope.main.userId = "";
    $scope.main.botRegistering = false;
    $scope.main.days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    $scope.main.months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    $scope.main.beginPage = function(){
        var sessionResource = $resource('/admin/getSession');
        var sessionData = sessionResource.get(function(){
            if(sessionData.isSession){
                $scope.main.userId = sessionData.id;
            }
            else{
                $scope.main.loggedIn = false;
            }
        });
    };

    $scope.main.setLocation = function(arg){
        $scope.main.botRegistering = true;
        $location.path(arg);
    };

    //This method ensures that if you are no longer logged in, you do not get to access other people's information
    //However, as of now, refreshing the page effectively logs you out, so we will need a better way to do this
    $rootScope.$on("$routeChangeStart", function(event, next) {
        var sessionResource = $resource('/admin/getSession');
        var sessionData = sessionResource.get(function(){
            if(sessionData.isSession){
                $scope.main.userId = sessionData.id;
                $scope.main.loggedIn = true;
                $scope.main.userName = sessionData.firstName + ' ' + sessionData.lastName;
            }
            else{
                $scope.main.loggedIn = false;
            }
            if($scope.main.botRegistering){
                return
            }
            if (!$scope.main.loggedIn) {
                if (next.templateUrl !== "components/login-register/loginRegisterTemplate.html") {
                    $location.path("/login");
                }
            }
        });

    });
    //$scope.main.beginPage();
}]);

