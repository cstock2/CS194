/**
 * Created by CodyWStocker on 4/8/17.
 * Mocked Data for users
 */

function getData(){
    var users = [];
    users.push({
        id: "6",
        firstName: "Cody",
        lastName: "Stocker",
        location: "Stanford, CA",
        password: "weak",
        gender: "male",
        birthday: new Date("11-05-1995 00:00 PDT"),
        email: "codywstocker@hotmail.com",
        friends: ["1"]
    });
    users.push({
        id: "2",
        firstName: "John",
        lastName: "Pericich",
        gender: "male",
        location: "Stanford, CA",
        password: "strong",
        email: "John",
        friends: ["1"]
    });
    users.push({
        id: "4",
        firstName: "Eric",
        lastName: "Musyoke",
        gender: "male",
        location: "Washington, DC",
        password: "strong",
        birthday: new Date("06-04-1976 00:00 PDT"),
        email: "eric",
        friends: ["1"]
    });
    users.push({
        id: "5",
        firstName: "Daniel",
        lastName: "Schiferaw",
        location: "Stanford, CA",
        gender: "male",
        password: "weak",
        birthday: new Date("02-22-1723 10:00 PDT"),
        email: "dan",
        pendingFriendRequests: ["1"]
    });
    users.push({
        id: "1",
        firstName: "Cody",
        lastName: "Admin",
        gender: "male",
        location: "Stanford",
        password: "weak",
        email: "cody",
        currentBots: ["10","12"],
        friends: ["2","6","4"],
        friendRequests: ["5"],
        pendingFriendRequests: ["7"]
    });
    users.push({
        id: "7",
        firstName: "Jesus",
        lastName: "Guzman",
        gender: "male",
        location: "Stanford, CA",
        password: "password",
        email: "Jesus",
        friendRequests: ["1"]
    });

    var notifications = [];
    notifications.push({
        id: "1000",
        to: "1",
        dateTime: new Date("05-17-2017 01:00 PDT"),
        text: "Friend Request from Daniel Schiferaw",
        action: 'friend request',
        relId: "5",
        seen: false,
        type: 'other'
    });
    notifications.push({
        id: "1001",
        to: "1",
        dateTime: new Date("05-17-2017 00:00 PDT"),
        text: "Welcome to Chat.IO",
        action: "NONE",
        relId: null,
        seen: false,
        type: 'other'
    });

    var bots = [];
    bots.push({
        id: "10",
        name: "echo",
        url: 'http://localhost:5555',
        description: "a simple echo server",
        basicPerm: true,
        emailPerm: true,
        locationPerm: true,
        birthdayPerm: true,
        allPerm: true,
        username: "echo",
        password: "echoBot"
    });
    bots.push({
        id: "german",
        name: "German Bot",
        url: 'https://www.beastweavers.com/germanbot',
        basicPerm: true,
        emailPerm: true,
        locationPerm: false,
        birthdayPerm: false,
        allPerm: false,
        username: "germanbot",
        password: "germanbot1",
        description: "A bot that teaches German"
    });
    bots.push({
        id: "11",
        name: "dummy",
        url: 'http://localhost:5678', //PLEASE CHANGE THIS IF YOU USE THIS PORT
        description: "a simple dummy bot, does not do anything",
        basicPerm: true,
        emailPerm: false,
        locationPerm: false,
        birthdayPerm: false,
        allPerm: false,
        username: "dummy",
        password: "dummy"
    });
    bots.push({
        id: "12",
        name: "dummy2",
        url: 'http://localhost:6789',
        description: "another simple dummy bot",
        basicPerm: true,
        emailPerm: true,
        locationPerm: false,
        birthdayPerm: false,
        allPerm: false,
        username: "dummy2",
        password: "dummy2"
    });
    bots.push({
        id: "12",
        name: "mcbot",
        url: 'http://localhost:6666',
        description: "a basic multiple choice bot",
        basicPerm: true,
        emailPerm: true,
        locationPerm: false,
        birthdayPerm: true,
        allPerm: false,
        username: "mcbot",
        password: "mcbot"
    });

    var messages = [];
    messages.push({
        id: "1",
        to: "10",
        from: "1",
        dateTime: new Date("2016-08-01 12:00 PDT"),
        text: "Hello",
        type: 'text'
    });
    messages.push({
        id: "2",
        to: "1",
        from: "10",
        dateTime: new Date("2016-08-01 12:01 PDT"),
        text: "Hello",
        type: 'text'
    });
    messages.push({
        id: "3",
        to: "10",
        from: "1",
        dateTime: new Date("2016-08-01 12:02 PDT"),
        text: "did i ever tell you the tragedy of darth plagueis the wise?",
        type: 'text'
    });
    messages.push({
        id: "4",
        to: "1",
        from: "10",
        dateTime: new Date("2016-08-01 12:03 PDT"),
        text: "did i ever tell you the tragedy of darth plagueis the wise?",
        type: 'text'
    });
    messages.push({
        id: "5",
        to: "10",
        from: "1",
        dateTime: new Date("2016-08-01 12:04 PDT"),
        text: "stop copying me",
        type: 'text'
    });
    messages.push({
        id: "6",
        to: "1",
        from: "10",
        dateTime: new Date("2016-08-01 12:05 PDT"),
        text: "stop copying me",
        type: 'text'
    });
    messages.push({
        id: "-1",
        to: "1",
        from: "12",
        dateTime: new Date("2016-08-01 12:06 PDT"),
        type: 'mc',
        options: ['a','b','c','d'],
        selectedOption: 0
    });
    messages.push({
        id: "-2",
        to: "12",
        from: "1",
        dateTime: new Date("2016-08-02 12:06 PDT"),
        type: 'text',
        text: 'a'
    });
    messages.push({
        id: "-3",
        to: "1",
        from: "12",
        dateTime: new Date("2016-08-02 12:10 PDT"),
        type: 'mc',
        options: ['e','f','g','h']
    });
    messages.push({
        id: "7",
        to: "6",
        from: "1",
        dateTime: new Date("2016-10-01 12:00 PDT"),
        text: "Hello",
        type: 'text'
    });
    messages.push({
        id: "8",
        to: "6",
        from: "1",
        dateTime: new Date("2016-10-01 12:01 PDT"),
        text: "How's the work going?",
        type: 'text'
    });
    messages.push({
        id: "9",
        to: "1",
        from: "6",
        dateTime: new Date("2016-10-01 12:02 PDT"),
        text: "Pretty good",
        type: 'text'
    });

    var groups = [];
    groups.push({
        id: "20",
        userMembers: ["1", "2"],
        botMember: "10",
        name: "Echo time!"
    });
    groups.push({
        id: "21",
        userMembers: ["1","2","4","5","6","7"],
        botMember: "10",
        name: "Echo chamber!"
    });

    var multiMessages = [];
    multiMessages.push({
        id: "30",
        convoId: "20",
        from: "1",
        text: "Hello",
        dateTime: new Date("2017-05-01 1:00 PDT"),
        type: 'text'
    });
    multiMessages.push({
        id: "31",
        convoId: "20",
        from: "10",
        text: "Hello",
        dateTime: new Date("2017-05-01 1:00:01 PDT"),
        type: 'text'
    });
    multiMessages.push({
        id: "32",
        convoId: "20",
        from: "2",
        text: "Wow, speedy response",
        dateTime: new Date("2017-05-01 1:05:00 PDT"),
        type: 'text'
    });
    multiMessages.push({
        id: "33",
        convoId: "20",
        from: "10",
        text: "Wow, speedy response",
        dateTime: new Date("2017-05-01 1:05:02 PDT"),
        type: 'text'
    });
    multiMessages.push({
        id: "35",
        convoId: "21",
        from: "5",
        text: "Welcome to the echo chamber",
        dateTime: new Date("2017-04-01 3:00 PDT"),
        type: 'text'
    });
    multiMessages.push({
        id: "36",
        convoId: "21",
        from: "10",
        text: "Welcome to the echo chamber",
        dateTime: new Date("2017-04-01 3:01 PDT"),
        type: 'text'
    });


    var userModel = function(){
        return users;
    };

    var botModel = function(){
        return bots;
    };

    var messageModel = function(){
        return messages;
    };

    var groupModel = function(){
        return groups;
    };

    var multiModel = function(){
        return multiMessages;
    };

    var notificationModel = function(){
        return notifications;
    };

    var logModels = {
        userModel: userModel,
        botModel: botModel,
        messageModel: messageModel,
        groupModel: groupModel,
        multiModel: multiModel,
        notificationModel: notificationModel
    };

    return logModels;
}

module.exports = {
    getData: getData
};