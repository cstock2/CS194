/**
 * Created by CodyWStocker on 4/8/17.
 */
var chatApp = angular.module('chatApp', ['ngRoute', 'ngMaterial', 'ngResource', 'ngWebSocket']);

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
            when('/notifications',{
                templateUrl: 'src/components/notifications/notificationTemplate.html',
                controller: 'NotificationController'
            }).
            when('/userPage/:userId',{
                templateUrl: 'src/components/user-page/userPageTemplate.html',
                controller: 'UserPageController'
            }).
            when('/userExploration', {
                templateUrl: 'src/components/user-exploration/UserNavTemplate.html',
                controller: 'UserNavController'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);

chatApp.controller('MainController', ['$scope', '$rootScope', '$location','$resource', '$websocket', function($scope, $rootScope, $location, $resource, $websocket){
    $scope.main = {};
    $scope.main.title = "Chat App";
    $scope.main.loggedIn = false;
    $scope.main.webSocketId = "";
    $scope.main.userId = "";
    $scope.main.botRegistering = false;
    $scope.main.days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    $scope.main.months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var socket;
    var baseurl = $location.host();
    console.log("baseurl: ", $location.host());
    if(baseurl === 'localhost'){
        // socket = new WebSocket('ws://localhost:3030');
        socket = io();
        // socket = new WebSocket('ws://localhost:8443');
        // console.log("socket: ", socket);
        // socket = io();
    }
    else{
        // socket = new WebSocket('wss://' + baseurl + ":3030");
        var sockUrl = 'ws://' + baseurl + ":3030";
        console.log("SockURL: ", sockUrl);
        // socket = io(sockUrl);
        socket = io();
        console.log("socket: ", socket);
        // socket =  new WebSocket('wss://' + baseurl + ":8443");
        // console.log("socket: ", socket);
    }


    socket.on('news', function(data){
        console.log("Message from server: ", data);
        if(data.message === 'register'){
            $scope.main.webSocketId = data.number;
            $rootScope.$broadcast('user message received');
        }
        if(data.message === 'user message received'){
            console.log('user message received in main controller');
            $rootScope.$broadcast('user message received');
        }
        else if(data.message === 'group message received'){
            $rootScope.$broadcast('group message received');
        }
        else if(data.message === 'bot group message received'){
            $rootScope.$broadcast('bot group message received');
        }
        else if(data.message === 'bot message received'){
            $rootScope.$broadcast('bot message received');
        }
    });
    // socket.addEventListener('open', function(event){
    //     socket.send('Hello Server!');
    // });
    // //
    // socket.addEventListener('message', function(event){
    //     console.log("Message from server: ", event.data);
    //     $scope.main.webSocketId = event.data;
    //     if(event.data === 'user message received'){
    //         console.log('user message received in main controller');
    //         $rootScope.$broadcast('user message received');
    //     }
    //     else if(event.data === 'group message received'){
    //         $rootScope.$broadcast('group message received');
    //     }
    //     else if(event.data === 'bot group message received'){
    //         $rootScope.$broadcast('bot group message received');
    //     }
    //     else if(event.data === 'bot message received'){
    //         $rootScope.$broadcast('bot message received');
    //     }
    // });

    // $scope.main.webSocket.$on('$open', function(){
    //     $scope.main.webSocket.$emit('message', 'hello');
    // });

    $scope.main.margin = '5px';
    $scope.main.inputStyle = {'margin-top': $scope.main.margin, 'margin-bottom': $scope.main.margin, 'margin-right': $scope.main.margin, 'margin-left':$scope.main.margin};
    $scope.main.button = {'box-shadow': '0 0 3px #ccc'};
    $scope.main.buttonSelected = {'box-shadow': '0 0 3px #ccc', color: 'blue'};

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

    // var wssResource = $resource('/webSocketServer');
    // var wssData = wssResource.get(function(){
    //     console.log("swssData", wssData);
    // });

    $scope.main.formatDate = function(date){
        var newDate = new Date(date);
        var string = "";
        string += newDate.getDate() + " ";
        string += $scope.main.months[newDate.getMonth()] + " ";
        string += newDate.getFullYear() + " ";
        string += newDate.getHours() + ":";
        var minutes = newDate.getMinutes();
        if(minutes < 10){
            string+= "0" + minutes + ":";
        }
        else{
            string += minutes + ":"
        }
        var seconds = newDate.getSeconds();
        if(seconds < 10){
            string+="0"+seconds
        }
        else{
            string+=seconds;
        }
        return string;
    };

    $scope.main.logout = function() {
        $scope.main.hasLoginAttempt = false;
        //console.log("In logout");
        var resource = $resource('/admin/logout');
        resource.get({}, function () {
            console.log("Here for whatever reason");
        }, function errorHandling(err) {
            console.log("Got an error");
        });
        $rootScope.$broadcast("logged out");
        $scope.main.loggedIn = "";
        $scope.main.userId = "";
        //$scope.$apply();
        $location.path("/login");
    };

    $scope.main.setLocation = function(arg){
        if(arg === 'logout'){
            $scope.main.loggedIn = false;
            $scope.main.userId = "";
            console.log($scope.main);
            // $scope.$apply();
            // $rootScope.$broadcast('logged out');
            $location.path('/');
        }
        else if(arg === 'profile'){
            $location.path('/userDetail/' + $scope.main.userId);
        }
        else if(arg === 'newGroup'){
            $location.path('/groupStart');
        }
        else{
            $scope.main.botRegistering = true; //need to determine why this is here
            $location.path(arg);
        }
        //$location.path(arg);
        // console.log("Got here");
        // $scope.$apply();
    };

    //This method ensures that if you are no longer logged in, you do not get to access other people's information
    //However, as of now, refreshing the page effectively logs you out, so we will need a better way to do this
    $rootScope.$on("$routeChangeStart", function(event, next) {
        var sessionResource = $resource('/admin/getSession');
        var sessionData = sessionResource.get(function(){
            if(sessionData.isSession){
                $scope.main.userId = sessionData.id;
                $scope.main.loggedIn = true;
                $scope.main.username = sessionData.firstName + ' ' + sessionData.lastName;
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

    $rootScope.$on('logged out', function(event,next){
        console.log("Logging out");
        $scope.main.userId = "";
        $scope.main.loggedIn = false;
        console.log($scope.main);
        // $rootScope.$broadcast('apply logout');
    });
    //$scope.main.beginPage();
}]);

