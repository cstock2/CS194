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
        email: "codywstocker@hotmail.com"
    });
    users.push({
        id: "2",
        firstName: "John",
        lastName: "Pericich",
        gender: "male",
        location: "Stanford, CA",
        password: "strong",
        email: "John"
    });
    users.push({
        id: "4",
        firstName: "James",
        lastName: "Madison",
        gender: "male",
        location: "Washington, DC",
        password: "weak",
        birthday: new Date("06-04-1976 00:00 PDT"),
        email: "jamesmadison@usa.gov"
    });
    users.push({
        id: "5",
        firstName: "George",
        lastName: "Washington",
        location: "Richmond, VA",
        gender: "male",
        password: "weak",
        birthday: new Date("02-22-1723 10:00 PDT"),
        email: "georgewashington@usa.gov"
    });
    users.push({
        id: "1",
        firstName: "Cody",
        lastName: "Admin",
        gender: "male",
        location: "Stanford",
        password: "weak",
        email: "cody",
        currentBots: ["10"]
    });
    users.push({
        id: "7",
        firstName: "Jesus",
        lastName: "Guzman",
        gender: "male",
        location: "Stanford, CA",
        password: "password",
        email: "Jesus"
    });

    var bots = [];
    bots.push({
        id: "10",
        name: "echo",
        url: 'http://localhost:5555',
        basicPerm: true,
        emailPerm: true,
        locationPerm: true,
        birthdayPerm: true,
        allPerm: true
    });

    var messages = [];
    messages.push({
        id: "1",
        to: "10",
        from: "1",
        dateTime: new Date("2016-08-01 12:00 PDT"),
        text: "Hello"
    });
    messages.push({
        id: "2",
        to: "1",
        from: "10",
        dateTime: new Date("2016-08-01 12:01 PDT"),
        text: "Hello"
    });
    messages.push({
        id: "3",
        to: "10",
        from: "1",
        dateTime: new Date("2016-08-01 12:02 PDT"),
        text: "did i ever tell you the tragedy of darth plagueis the wise?"
    });
    messages.push({
        id: "4",
        to: "1",
        from: "10",
        dateTime: new Date("2016-08-01 12:03 PDT"),
        text: "did i ever tell you the tragedy of darth plagueis the wise?"
    });
    messages.push({
        id: "5",
        to: "10",
        from: "1",
        dateTime: new Date("2016-08-01 12:04 PDT"),
        text: "stop copying me"
    });
    messages.push({
        id: "6",
        to: "1",
        from: "10",
        dateTime: new Date("2016-08-01 12:05 PDT"),
        text: "stop copying me"
    });
    messages.push({
        id: "7",
        to: "6",
        from: "1",
        dateTime: new Date("2016-10-01 12:00 PDT"),
        text: "Hello"
    });
    messages.push({
        id: "8",
        to: "6",
        from: "1",
        dateTime: new Date("2016-10-01 12:01 PDT"),
        text: "How's the work going?"
    });
    messages.push({
        id: "9",
        to: "1",
        from: "6",
        dateTime: new Date("2016-10-01 12:02 PDT"),
        text: "Pretty good"
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

    var logModels = {
        userModel: userModel,
        botModel: botModel,
        messageModel: messageModel
    };

    return logModels;
}

module.exports = {
    getData: getData
};