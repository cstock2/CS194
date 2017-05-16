/**
 * Created by CodyWStocker on 4/8/17.
 * Testing infrastructure for code
 */

var assert = require('assert');
var expect = require('chai').expect;
var request = require('supertest');
var session = require('supertest-session');
var app = require('../webServer');
var sinon = require('sinon');
var server = request.agent(app);
var requestObj = require('request');
var async = require('async');

//Database Objects
var Users = require('../schema/user.js');
var Bots = require('../schema/bot.js');
var Messages = require('../schema/message.js');
var GroupMessages = require('../schema/groupMessage.js');
var GroupConversations = require('../schema/groupConversation.js');

describe("Test Server APIs", function(){
    describe("authentication and registration", function(){
        describe('/admin/registerBot', function(){
            describe('failing cases', function(){
                var badBot = {username: "badBot", password: "ok", name: "badBot", url: "bad_bot.com", description: "This is a bad bot", basicPerm: true, emailPerm: false, birthdayPerm: false, locationPerm: false, allPerm: false};
                describe('proper arguments not provided', function(){
                    it('404 with no body', function(done){
                        request(app).post('/admin/registerbot').send().expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Arguments not provided"}');
                            done();
                        });
                    });
                    it('404 with no name',function(done){
                        request(app).post('/admin/registerbot').send({url: "uhoh"}).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Arguments not provided"}');
                            done();
                        });
                    });
                    it('404 with no url',function(done){
                        request(app).post('/admin/registerbot').send({name: "uhoh"}).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Arguments not provided"}');
                            done();
                        });
                    });
                    it('404 with no permissions', function(done){
                        request(app).post('/admin/registerbot').send({url: "uhoh", name: "uhoh"}).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Arguments not provided"}');
                            done();
                        });
                    });
                });
                describe('arguments do not match each other', function(){
                    var badBot2 = {name: "badBot", url: "bad_bot.com",username:"badBot",password:"bad", description: "badBot", basicPerm: true, emailPerm: false, birthdayPerm: false, locationPerm: false, allPerm: true};
                    it('404 with booleans not in agreement', function(done){
                        request(app).post('/admin/registerbot').send(badBot2).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid arguments"}');
                            done();
                        });
                    });
                });
                describe('error checking database for url', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields({error: "error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error in bot database"}');
                            done();
                        });
                    });
                });
                describe('url already exists', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name: "exists"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Cannot create bot"}');
                            done();
                        });
                    });
                });
                describe('error checking database for username', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Bots, 'findOne');
                        stub.withArgs({url: "bad_bot.com"}).yields(null, null);
                        stub.withArgs({username: "badBot"}).yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error in bot database"}');
                            done();
                        });
                    });
                });
                describe('username already exists', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Bots, 'findOne');
                        stub.withArgs({url: "bad_bot.com"}).yields(null, null);
                        stub.withArgs({username: "badBot"}).yields(null, {username: "Exists"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Cannot create bot"}');
                            done();
                        });
                    });
                });
                describe('error in request.post', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Bots, 'findOne');
                        stub.withArgs({url: "bad_bot.com"}).yields(null, null);
                        stub.withArgs({username: "badBot"}).yields(null, null);
                        sandbox.stub(requestObj, 'post').yields({error: "error"}, null, null);
                    });
                    after(function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error in request.get"}');
                            done();
                        });
                    });
                });
                describe('Cannot contact bot server', function(){
                    var sandbox;
                    before(function() {
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Bots, 'findOne');
                        stub.withArgs({url: "bad_bot.com"}).yields(null, null);
                        stub.withArgs({username: "badBot"}).yields(null, null);
                        sandbox.stub(requestObj, 'get').yields(null); //this may need to be null, null
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(404).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":404,"message":"Error contacting bot server"}');
                            done();
                        });
                    });
                });
                describe('error adding bot to database', function(){
                    var sandbox;
                    before(function() {
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Bots, 'findOne');
                        stub.withArgs({url: "bad_bot.com"}).yields(null, null);
                        stub.withArgs({username: "badBot"}).yields(null, null);
                        sandbox.stub(requestObj, 'get').yields(null, null, null);
                        sandbox.stub(Bots, 'create').yields({error: "error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        request(app).post('/admin/registerBot').send(badBot).expect(404).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":404,"message":"Error in bot database"}');
                            done();
                        });
                    });
                });
            });
            describe('passing cases', function(){
                var goodBot = {
                    url: 'goodUrl',
                    name: 'notTaken',
                    description: "This is a good bot",
                    basicPerm: true,
                    emailPerm: true,
                    birthdayPerm: true,
                    locationPerm: true,
                    allPerm: true,
                    username: 'notTaken',
                    password: 'clever'
                };
                var sandbox;
                before(function() {
                    sandbox = sinon.sandbox.create();
                    var stub = sandbox.stub(Bots, 'findOne');
                    stub.withArgs({url: "goodUrl"}).yields(null, null);
                    stub.withArgs({username: "notTaken"}).yields(null, null);
                    sandbox.stub(requestObj, 'get').yields(null, null, null);
                    sandbox.stub(Bots, 'create').yields(null,{_id: "a", save:function(){}});
                });
                after(function(){
                    sandbox.restore();
                });
                it('returns a message saying it worked', function(done){
                    request(app).post('/admin/registerBot').send(goodBot).expect(200).end(function(err, res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.text, "Successfully added bot");
                        done();
                    });
                });
            });
        });
        describe('/admin/botLogin', function(){
            var bot = {username: "test", password: "test"};
            describe('failing cases', function(){
                describe('invalid parameters', function(){
                    it('returns 400 error', function(done){
                        request(app).post('/admin/botLogin').send({}).expect(400).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                            done();
                        });
                    });
                });
                describe('error in Bots.find', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields({error:"error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error',function(done){
                        request(app).post('/admin/botLogin').send(bot).expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding bot"}');
                            done();
                        });
                    });
                });
                describe('bot does not exist', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        request(app).post('/admin/botLogin').send(bot).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Invalid username or password"}');
                            done();
                        });
                    });
                });
                describe('invalid password', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {username:"test",password:"no"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error',function(done){
                        request(app).post('/admin/botLogin').send(bot).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Invalid username or password"}');
                            done();
                        });
                    });
                });
            });
        });
        describe("post('/admin/login')", function(){
            describe("failing cases", function(){
                describe("problem with mongoDB", function(){
                    var sandbox;
                    before(function(){
                        sandbox = new sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/admin/login').send({user: {username: "Fail"}}).expect(404).end(function(err, res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding User"}');
                            done();
                        });
                    });
                });
                describe('unknown username', function(){
                    it('returns 404 error', function(done){
                        server.post('/admin/login').send({user: {username: "none"}}).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"No user Found"}');
                            done();
                        });
                    });
                });
                describe('unknown password', function(){
                    var sandbox;
                    before(function(){
                        sandbox = new sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, {password: "correct"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.post('/admin/login').send({user: {username: "madison", password: "incorrect"}}).expect(401).end(function(err, res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Incorrect Password"}');
                            done();
                        });
                    })
                });
            });
            describe('passing cases', function(){
                describe('returns correct display name', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        //THIS NEXT LINE SETS THE SESSION FOR THE REST OF THE TESTS!!!!!!
                        sandbox.stub(Users, 'findOne').yields(null, {firstName: "Cody", lastName: "Stocker", password: "correct", id: "u1"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns correct display name', function(){
                        server.post('/admin/login').send({user: {username: "cody", password: "correct"}}).expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.displayName, "Cody Stocker");
                            done();
                        });
                    });
                    it('returns correct id', function(){
                        server.post('/admin/login').send({user: {username: "cody", password: "correct"}}).expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.id, "1");
                            done();
                        });
                    });
                });
            });
        });
        describe('post(/admin/register)', function(){
            describe('failing cases', function(){
                describe('not enough data fields', function(){
                    it('returns 404 error', function(done){
                        request(app).post('/admin/register').send({}).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Missing some fields"}');
                            done();
                        });
                    });
                });
                describe('incorrect data types', function(){
                    it('returns 404 error', function(done){
                        var badObj = {firstName:1,lastName:2,emailAddress:3,location:4,gender:5,password1:6,password2:7,birthday:8};
                        request(app).post('/admin/register').send(badObj).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Fields are not of correct type"}');
                            done();
                        });
                    });
                });
                var badUser = {firstName:"Jane",lastName:"Doe",location:"Doeville",emailAddress:"doe@doe.gov",gender:"female",password1:"weak",password2:"weak",birthday:new Date()};
                describe('problem with User.findone', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        request(app).post('/admin/register').send(badUser).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error checking Users"}');
                            done();
                        });
                    });
                });
                describe('user already found', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, {exists: "yes"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        request(app).post('/admin/register').send(badUser).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"User exists"}');
                            done();
                        });
                    });
                });
                describe('error creating user', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, null);
                        sandbox.stub(Users, 'create').yields({error: "yes"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404', function(done){
                        request(app).post('/admin/register').send(badUser).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error creating User"}');
                            done();
                        });
                    });
                });
            });
            describe('passing cases', function(){
                describe('returns correct data', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, null);
                        sandbox.stub(Users, 'create').yields(null, {_id: "a", firstName: "Cody", lastName: "Stocker", save:function fun(){}});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    var data = {firstName: "Cody", lastName: "Stocker", location: "Chicago", password1: "red", password2: "red", gender:"male",emailAddress: "codywstocker", birthday: new Date("01-01-2001 00:00 PDT")};
                    it('returns correct username', function(done){
                        request(app).post('/admin/register').send(data).expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.username, "Cody Stocker");
                            done();
                        });
                    });
                    it('returns an id', function(done){
                        request(app).post('/admin/register').send(data).expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(typeof obj.id, "string");
                            done();
                        });
                    });
                });
            });
        });
    });
    describe('server functionality post login', function(){
        //THIS SETUP HERE SETS UP THAT WE ARE LOGGED IN AND ARE USING A BOT WITH ID B1! DO NOT CHANGE OR ALL OTHER TESTS WILL BREAK
        //LAST UPDATED 5/4/17
        var cookie;
        var thisSandbox;
        before(function(done){
            thisSandbox = sinon.sandbox.create();
            thisSandbox.stub(Users, 'findOne').yields(null, {
                firstName: "Cody",
                lastName: "Stocker",
                password: "correct",
                id: "u1",
                currentBots: ["1","2","3","5"]
            });
            thisSandbox.stub(Bots, 'findOne').yields(null, {
                id: "b1",
                username: "test",
                password: "test",
                name: "testBot",
                description: "a test bot"
            });
            //thisSandbox.stub(Bots, 'findOne').yields(null, {id: "b1", url: "ex@ex.com", name: "testBot"});
            server.post('/admin/login').send({user: {username: "Cody", password: "correct"}}).expect(200).end(function(err, res){
                cookie = res.headers['set-cookie'];
                done();
                //server.get('/getBot/id').expect(200).end(function(err,res){
                //    done();
                //});
                //server.post('/admin/botLogin').send({username: "test", password: "test"}).expect(200).end(function(err,res){
                //
                //});
                //done();
            });
        });
        describe('session requests', function(){
            describe('no session',function(){
                it('returns a boolean false', function(done){
                    request(app).get('/admin/getSession').expect(200).end(function(err,res){
                        var obj= JSON.parse(res.text);
                        assert.strictEqual(obj.isSession, false);
                        done();
                    });
                });
            });
            describe('is session', function(){
                it('returns proper details about user', function(done){
                    server.get('/admin/getSession').expect(200).end(function(err,res){
                        var obj=JSON.parse(res.text);
                        assert.strictEqual(obj.firstName, "Cody");
                        assert.strictEqual(obj.lastName, "Stocker");
                        assert.strictEqual(obj.id, "u1");
                        assert.strictEqual(obj.isSession, true)
                        done();
                    });
                });
                it('does not return extra details', function(done){
                    server.get('/admin/getSession').expect(200).end(function(err,res){
                        var obj=JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 4);
                        done();
                    });
                });
            });
        });
        //POST REQUESTS
        describe('post requests', function(){
            describe('sendUserUserMessage', function(){
                var message = {userTo: "alpha", text: "hello"};
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).post('/sendUserUserMessage').send({}).expect(401).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('invalid arguments', function(){
                        it('returns 404 error', function(done){
                            server.post('/sendUserUserMessage').send({}).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid arguments"}');
                                done();
                            });
                        });
                    });
                    describe('error finding current user', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendUserUserMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding current user"}');
                                done();
                            });
                        });
                    });
                    describe('current user invalid', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields(null,null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendUserUserMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Current user is invalid"}');
                                done();
                            });
                        });
                    });
                    describe('error finding recipient user', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            var stub = sandbox.stub(Users,'findOne');
                            stub.withArgs({_id:"u1"}).yields(null, {user: "hello"});
                            stub.withArgs({_id:"alpha"}).yields({error: "error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendUserUserMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding user"}');
                                done();
                            });
                        });
                    });
                    describe('recipient user invalid', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            var stub = sandbox.stub(Users, 'findOne');
                            stub.withArgs({_id:"u1"}).yields(null, {user: "hello"});
                            stub.withArgs({_id:"alpha"}).yields(null,null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendUserUserMessage').send(message).expect(404).end(function(Err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Recipient is invalid"}');
                                done();
                            });
                        });
                    });
                    describe('error creating message', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            var stub = sandbox.stub(Users, 'findOne');
                            stub.withArgs({_id:"u1"}).yields(null, {user: "hello"});
                            stub.withArgs({_id:"alpha"}).yields(null,{user: "goodbye"});
                            sandbox.stub(Messages, 'create').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendUserUserMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error creating message"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Users, 'findOne');
                        stub.withArgs({_id:"u1"}).yields(null, {user: "hello"});
                        stub.withArgs({_id:"alpha"}).yields(null,{user: "goodbye"});
                        sandbox.stub(Messages, 'create').yields(null, {_id:"beta",save:function(){}});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns only a boolean true', function(done){
                        server.post('/sendUserUserMessage').send(message).expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj).length, 1);
                            assert.strictEqual(obj.success, true);
                            done();
                        });
                    });
                });
            });
            describe('updatePermissions', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).post('/updatePermissions').send({}).expect(401).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('missing arguments', function(){
                        var missingBot = {botId: 'hello'};
                        it('returns 404 error', function(done){
                            server.post('/updatePermissions').send(missingBot).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Missing or invalid arguments"}');
                                done();
                            });
                        });
                    });
                    describe('contradictory arguments', function(){
                        var contradictoryArgs = {botId: 'bad', basicPerm:true, emailPerm:true, locationPerm:false, birthdayPerm:false, allPerm:true};
                        it('returns 404 error', function(done){
                            server.post('/updatePermissions').send(contradictoryArgs).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Contradictory arguments"}');
                                done();
                            });
                        });
                    });
                    var badBot = {botId:'bad',basicPerm:true,emailPerm:true,locationPerm:false,birthdayPerm:false,allPerm:false};
                    describe('error finding bot', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/updatePermissions').send(badBot).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding bot"}');
                                done();
                            });
                        });
                    });
                    describe('no bot', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error',function(done){
                            server.post('/updatePermissions').send(badBot).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                                done();
                            });
                        });
                    });
                    describe('error finding user', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                            sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/updatePermissions').send(badBot).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding user"}');
                                done();
                            });
                        });
                    });
                    describe('no user', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                            sandbox.stub(Users, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/updatePermissions').send(badBot).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid user"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var goodBot = {botId:'bad',basicPerm:true,emailPerm:true,locationPerm:false,birthdayPerm:false,allPerm:false};
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                        sandbox.stub(Users,'findOne').yields(null,{currentBots:[],basicAuthBots:[],emailAuthBots:[],locationAuthBots:[],birthdayAuthBots:[],allAuthBots:[],save:function(){}});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns only a boolean true if success', function(done){
                        server.post('/updatePermissions').send(goodBot).expect(404).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj).length, 1);
                            assert.strictEqual(obj.success, true);
                            done();
                        });
                    });
                });
            });
            describe('send message', function(){
                var message = {text: "hello", botId: "a"};
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).post('/sendMessage').send({}).expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('invalid arguments', function(){
                        it('returns 400 error', function(done){
                            server.post('/sendMessage').send({}).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                                done();
                            });
                        });
                    });
                    describe('error finding bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding bot"}');
                                done();
                            });
                        });
                    });
                    describe('invalid bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                                done();
                            });
                        });
                    });
                    describe('error creating user message', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({from:"u1",to:"a",text:"hello",type:'text'}).yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error creating message"}');
                                done();
                            });
                        });
                    });
                    describe('timeout error', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields( {code: 'ETIMEDOUT', connect: true});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Could not send message to bot"}');
                                done();
                            });
                        });
                    });
                    describe('error sending message to bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields( {error:"error"});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error posting to bot"}');
                                done();
                            });
                        });
                    });
                    describe('bot does not return valid type', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields(null, null, {type:'bad'});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 400 error', function(done){
                            server.post('/sendMessage').send(message).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid bot response type"}');
                                done();
                            });
                        });
                    });
                    describe('invalid bot response', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields(null, null, {type:'text'});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 400 error', function(done){
                            server.post('/sendMessage').send(message).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid bot response"}');
                                done();
                            });
                        });
                    });
                    describe("error creating bot message", function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields(null, null, {text:"goodbye",type:'text',options:[]});
                            stub.withArgs({to:"u1",from:"a",text:"goodbye",type:'text',options:[]}).yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error',function(done){
                            server.post('/sendMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error posting bot response"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing cases', function(){ //database contents will be guaranteed by not failing the mongodb stuff
                    describe('bot does not send response', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields( {code: 'ETIMEDOUT'});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns two booleans set properly', function(done){
                            server.post('/sendMessage').send(message).expect(200).end(function(err,res){
                                var obj =JSON.parse(res.text);
                                assert.strictEqual(obj.sentMessage, true);
                                assert.strictEqual(obj.receivedResponse, false);
                                done();
                            });
                        });
                    });
                    describe('bot sends response', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {url: "http://example.com"});
                            var stub = sandbox.stub(Messages, 'create');
                            stub.withArgs({to:"a",from:"u1",text:"hello",type:'text'}).yields(null,{_id:"b",save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields(null, null, {text:"goodbye",type:'text',options: []});
                            stub.withArgs({to:"u1",from:"a",text:"goodbye",type:'text',options:[]}).yields(null,{_id:"c",save:function fun(){}});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns two booleans set properly', function(done){
                            server.post('/sendMessage').send(message).expect(200).end(function(err,res){
                                var obj =JSON.parse(res.text);
                                assert.strictEqual(obj.sentMessage, true);
                                assert.strictEqual(obj.receivedResponse, true);
                                done();
                            });
                        });
                    });
                });
            });
            describe('sendGroupMessage', function(){
                var message = {text: "hello", convoId: "a"};
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).post('/sendGroupMessage').send({}).expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('invalid arguments', function(){
                        it('returns 400 error for no message text', function(done){
                            server.post('/sendGroupMessage').send({convoId: "a"}).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                                done();
                            });
                        });
                        it('returns 400 error for no convoId', function(done){
                            server.post('/sendGroupMessage').send({text: "hello"}).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                                done();
                            });
                        });
                    });
                    describe('error finding conversation', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding conversation"}');
                                done();
                            });
                        });
                    });
                    describe('invalid conversation', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid conversation"}');
                                done();
                            });
                        });
                    });
                    describe('error finding bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding bot"}');
                                done();
                            });
                        });
                    });
                    describe('invalid bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                                done();
                            });
                        });
                    });
                    describe('error creating user message', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            sandbox.stub(GroupMessages, 'create').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error creating message"}');
                                done();
                            });
                        });
                    });
                    describe('connection timed out', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            sandbox.stub(GroupMessages, 'create').yields(null, {_id:"c", save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields( {code: 'ETIMEDOUT', connect: true});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Could not send message to bot"}');
                                done();
                            });
                        });
                    });
                    describe('other post error', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            sandbox.stub(GroupMessages, 'create').yields(null, {_id:"c", save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields({error:"error"},null,null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error',function(done){
                            server.post('/sendGroupMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error posting to bot"}');
                                done();
                            });
                        });
                    });
                    describe('invalid bot response', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            sandbox.stub(GroupMessages, 'create').yields(null, {_id:"c", save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields(null,null,{});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error',function(done){
                            server.post('/sendGroupMessage').send(message).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid bot response"}');
                                done();
                            });
                        });
                    });
                    describe('error saving bot response', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            var stub = sandbox.stub(GroupMessages, 'create');
                            stub.withArgs({convoId:"a",from:"u1",text:"hello"}).yields(null, {_id:"c", save: function fun(){}});
                            stub.withArgs({convoId:"a",from:"b",text:"goodbye"}).yields({error:"error"}, null);
                            sandbox.stub(requestObj, 'post').yields(null,null,{text: "goodbye"});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/sendGroupMessage').send(message).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error saving bot response"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing cases', function(){
                    describe('bot does not send response', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            var stub = sandbox.stub(GroupMessages, 'create');
                            stub.withArgs({convoId:"a",from:"u1",text:"hello"}).yields(null, {_id:"c", save: function fun(){}});
                            sandbox.stub(requestObj, 'post').yields({code: 'ETIMEDOUT'},null,null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns two booleans', function(done){
                            server.post('/sendGroupMessage').send(message).expect(200).end(function(err,res){
                                var obj=JSON.parse(res.text);
                                assert.strictEqual(obj.sentMessage, true);
                                assert.strictEqual(obj.receivedResponse, false);
                                done();
                            });
                        });
                    });
                    describe('bot returns message', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'findOne').yields(null, {botMember: "b"});
                            sandbox.stub(Bots, 'findOne').yields(null, {id: "a", url: "http://example.com"});
                            var stub = sandbox.stub(GroupMessages, 'create');
                            stub.withArgs({convoId:"a",from:"u1",text:"hello"}).yields(null, {_id:"c", save: function fun(){}});
                            stub.withArgs({convoId:"a",from:"b",text:"goodbye"}).yields(null, {_id:"d",save:function fun(){}});
                            sandbox.stub(requestObj, 'post').yields(null,null,{text: "goodbye"});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns two booleans', function(done){
                            server.post('/sendGroupMessage').send(message).expect(200).end(function(err,res){
                                var obj=JSON.parse(res.text);
                                assert.strictEqual(obj.sentMessage, true);
                                assert.strictEqual(obj.receivedResponse, true);
                                done();
                            });
                        });
                    });
                });
            });
            describe('makeGroup', function(){
                var group = {botId:"a", users: ["b","c"],name:"GoodGroup"};
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).post('/makeGroup').send({}).expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('invalid arguments', function(){
                        it('returns 400 error', function(done){
                            server.post('/makeGroup').send({}).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                                done();
                            });
                        });
                    });
                    describe('error finding bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error',function(done){
                            server.post('/makeGroup').send(group).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding bot"}');
                                done();
                            });
                        });
                    });
                    describe('invalid bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error',function(done){
                            server.post('/makeGroup').send(group).expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                                done();
                            });
                        });
                    });
                    describe('error in async', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot:"bot"});
                            sandbox.stub(async, 'series').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/makeGroup').send(group).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error in async"}');
                                done();
                            });
                        });
                    });
                    describe('error finding user', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot:"bot"});
                            sandbox.stub(Users, 'findOne').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/makeGroup').send(group).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding user"}');
                                done();
                            });
                        });
                    });
                    describe('invalid user', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot:"bot"});
                            sandbox.stub(Users, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 400 error',function(done){
                            server.post('/makeGroup').send(group).expect(400).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid users"}');
                                done();
                            });
                        });
                    });
                    describe('error creating group', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot:"bot"});
                            sandbox.stub(Users, 'findOne').yields(null, {user: "user"});
                            sandbox.stub(GroupConversations, 'create').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.post('/makeGroup').send(group).expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error creating group"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot:"bot"});
                        sandbox.stub(Users, 'findOne').yields(null, {user: "user"});
                        sandbox.stub(GroupConversations,'create').yields(null,{_id:"a",save:function fun(){}});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns id and boolean',function(done){
                        server.post('/makeGroup').send(group).expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.success, true);
                            assert.strictEqual(obj.id, "a");
                            done();
                        });
                    });
                });
            });
        });
        describe('get requests', function(){
            describe('groupMessages', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/groupMessages').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error finding group conversations', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(GroupConversations, 'find').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/groupMessages').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error querying groups"}');
                                done();
                            });
                        });
                    });
                    describe('passing cases', function(){
                        describe('no groups', function(){
                            var sandbox;
                            before(function(){
                                sandbox = sinon.sandbox.create();
                                sandbox.stub(GroupConversations, 'find').yields(null, null);
                            });
                            after(function(){
                                sandbox.restore();
                            });
                            it('returns boolean and message', function(done){
                                server.get('/groupMessages').expect(200).end(function(err,res){
                                    var obj = JSON.parse(res.text);
                                    assert.strictEqual(obj.hasGroups, false);
                                    assert.strictEqual(obj.message, "No groups");
                                    done();
                                });
                            });
                        });
                        describe('valid groups', function(){
                            var sandbox;
                            var data = [];
                            data.push({id: "a", userMembers: ["1","2"], botMember: "3", name: "test"});
                            before(function(){
                                sandbox = sinon.sandbox.create();
                                sandbox.stub(GroupConversations, 'find').yields(null, data)
                            });
                            it('returns boolean and groups', function(done){
                                server.get('/groupMessages').expect(200).end(function(err,res){
                                    var obj = JSON.parse(res.text);
                                    assert.strictEqual(obj.hasGroups, true);
                                    assert.strictEqual(obj.groups.length, 1);
                                    done();
                                });
                            });
                            it('individual groups have proper fields', function(done){
                                server.get('/groupMessages').expect(200).end(function(err,res){
                                    var obj = JSON.parse(res.text);
                                    assert.strictEqual(obj.groups[0].id, "a");
                                    assert.strictEqual(obj.groups[0].userMembers[0], '1');
                                    assert.strictEqual(obj.groups[0].botMember, "3");
                                    assert.strictEqual(obj.groups[0].name, "test");
                                    done();
                                });
                            });
                        });
                    });
                });
            });
            describe('currentBotList', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/currentBotList').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error finding bots', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'find').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/currentBotList').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding bots"}');
                                done();
                            });
                        });
                    });
                    describe('no bots', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'find').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/currentBotList').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"No bots"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var data = [];
                    data.push({id: "1", name: "alpha", url:"bad",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: "2", name: "beta", url:"bad",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: "3", name: "gamma", url:"bad",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: "4", name: "delta", url:"bad",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: "5", name: "aaaaa", url:"bad",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'find').yields(null, data);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns the correct number of bots', function(done){
                        server.get('/currentBotList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.bots.length, 4);
                            done();
                        });
                    });
                    it('returns alphabetized bots', function(done){
                        server.get('/currentBotList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.bots[0].name, "aaaaa");
                            assert.strictEqual(obj.bots[3].name, "gamma");
                            done();
                        });
                    });
                    it('returned bots do not have any extra information', function(done){
                        server.get('/currentBotList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj.bots[0]).length, 7);
                            assert.strictEqual(typeof obj.bots[0].url, 'undefined');
                            done();
                        });
                    });
                });
            });
            describe('getUser/:userId', function(){
                describe('failing cases',function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/getUser/bad').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error finding user', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/getUser/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding user"}');
                                done();
                            });
                        });
                    });
                    describe('null user', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error',function(done){
                            server.get('/getUser/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid user"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, {firstName:"alpha",lastName:"beta",id:"c",password:"uhoh"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns basic user info correctly',function(done){
                        server.get('/getUser/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.username, "alpha beta");
                            assert.strictEqual(obj.firstName, "alpha");
                            assert.strictEqual(obj.lastName, "beta");
                            assert.strictEqual(obj.id,"c");
                            done();
                        });
                    });
                    it('does not return any extra fields', function(done){
                        server.get('/getUser/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj).length, 4);
                            assert.strictEqual(typeof obj.password, 'undefined');
                            done();
                        });
                    });
                });
            });
            describe('isType/:id', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/isType/bad').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error checking users', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isType/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error checking users"}');
                                done();
                            });
                        });
                    });
                    describe('error checking bots', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields(null, null);
                            sandbox.stub(Bots, 'findOne').yields({error:"error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isType/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error checking bots"}');
                                done();
                            });
                        });
                    });
                    describe('neither user or bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields(null, null);
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isType/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid argument"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing cases', function(){
                    describe('is a user', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users,'findOne').yields(null, {user:"user"});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns type as user', function(done){
                            server.get('/isType/good').expect(200).end(function(err,res){
                                var obj = JSON.parse(res.text);
                                assert.strictEqual(obj.type, 'user');
                                done();
                            });
                        });
                    });
                    describe('is a bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users,'findOne').yields(null, null);
                            sandbox.stub(Bots, 'findOne').yields(null, {bot:'bot'});
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns type as bot', function(done){
                            server.get('/isType/good').expect(200).end(function(err,res){
                                var obj = JSON.parse(res.text);
                                assert.strictEqual(obj.type, 'bot');
                                done();
                            });
                        });
                    });
                });
            });
            describe('userList', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/userList').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error finding users', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'find').yields({error:"error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/userList').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding users"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var data = [];
                    data.push({id:"u1",firstName:"cody",lastName:"admin"});
                    data.push({id:"a",firstName:"alpha",lastName:"zeta"});
                    data.push({id:"b",firstName:"beta",lastName:"omega"});
                    data.push({id:"c",firstName:"gamma",lastName:"delta"});
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users,'find').yields(null, data);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns correct number of users', function(done){
                        server.get('/userList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.users.length, 3);
                            done();
                        });
                    });
                    it('user list is alphabetized by last name', function(done){
                        server.get('/userList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.users[0].lastName, "delta");
                            assert.strictEqual(obj.users[2].lastName, "zeta");
                            done();
                        });
                    });
                    it('returned users do not include extra fields', function(done){
                        server.get('/userList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj.users[0]).length, 4);
                            done();
                        });
                    });
                    it('does not include current user', function(done){
                        server.get('/userList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(typeof obj.users.find(function isUser(user){return user.id === "u1"}), 'undefined');
                            done();
                        });
                    });
                });
            });
            describe('isCurrentBot/:botId', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/isCurrentBot/error').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error finding bot', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields({error: "error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isCurrentBot/error').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding bot"}');
                                done();
                            });
                        });
                    });
                    describe('bot does not exist', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isCurrentBot/error').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                                done();
                            });
                        });
                    });
                    describe('error finding user', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot: "good"});
                            sandbox.stub(Users, 'findOne').yields({error: "error"},null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isCurrentBot/error').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding user"}');
                                done();
                            });
                        });
                    });
                    describe('user does not exist', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, {bot: "good"});
                            sandbox.stub(Users, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/isCurrentBot/error').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid user"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing cases', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "good"});
                        sandbox.stub(Users, 'findOne').yields(null, {currentBots: ["good"]});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns true if the bot is in the current list', function(done){
                        server.get('/isCurrentBot/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.currentBot, true);
                            done();
                        });
                    });
                    it('returns false if the bot is not in the current list', function(done){
                        server.get('/isCurrentBot/bad').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.currentBot, false);
                            done();
                        });
                    });
                });
            });
             describe('userDetail/:userId', function(){
                 describe('failing cases', function(){
                     describe('unauthorized access', function(){
                         it('returns 401 error', function(done){
                             request(app).get('/userDetail/error').expect(401).end(function(err,res){
                                 assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                 done();
                             });
                         });
                     });
                     describe('User.findOne error', function(){
                         var sandbox;
                         before(function(){
                             thisSandbox.restore();
                             sandbox = sinon.sandbox.create();
                             sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                         });
                         after(function(){
                             sandbox.restore();
                         });
                         it('returns 404 error', function(done){
                             server.get('/userDetail/error').expect(404).end(function(err,res){
                                 assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding User"}');
                                 done();
                             });
                         });
                     });
                 });
                 describe('passing case', function(){
                    describe('returns correct data', function(){
                        var sandbox;
                        before(function(){
                            thisSandbox.restore();
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Users, 'findOne').yields(null, {
                                id: "1",
                                firstName: "John",
                                lastName: "Smith",
                                location: "Newark, NJ",
                                password: "weak",
                                birthday: new Date("11-01-1991"),
                                email: "john.smith@example.net"
                            });
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns firstname, lastname, and location', function(done){
                            server.get('/userDetail/u1').expect(200).end(function(err, res){
                                var obj = JSON.parse(res.text);
                                assert.strictEqual(Object.keys(obj.user).length, 3);
                                assert.strictEqual(obj.user.firstName, "John");
                                assert.strictEqual(obj.user.lastName, "Smith");
                                assert.strictEqual(obj.user.location, "Newark, NJ");
                                done();
                            });
                        });
                        it('does not return id, password, email, or birthday', function(done){ //as of now (4-May-2017)
                            server.get('/userDetail/u1').expect(200).end(function(err, res){
                                var obj = JSON.parse(res.text);
                                assert.strictEqual(typeof obj.user.password, 'undefined');
                                assert.strictEqual(typeof obj.user.birthday, 'undefined');
                                assert.strictEqual(typeof obj.user.id, 'undefined');
                                assert.strictEqual(typeof obj.user.email, 'undefined');
                                done();
                            });
                        });
                    });
                 });
             });
            describe('botList', function(){
                describe('failing cases', function(){
                    describe('Unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/botList').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('Error finding bots', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'find').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/botList').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding bots"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing cases', function(){
                    var sandbox;
                    var data = [];
                    data.push({id: 1, name: "alpha", description:"a"});
                    data.push({id: 2, name: "beta", description:"b"});
                    data.push({id: 3, name: "gamma",description:"c"});
                    data.push({id: 4, name: "delta",description:"d"});
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'find').yields(null, data);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns correct number of bots', function(done){
                        server.get('/botList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.botList.length, 4);
                            done();
                        });
                    });
                    it('returns correct order of bots', function(done){
                        server.get('/botList').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.botList[0].name, "alpha");
                            assert.strictEqual(obj.botList[2].name, "delta");
                            done();
                        });
                    });
                });
            });
            describe('/botListDetail', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        describe('Unauthorized access', function(){
                            it('returns 401 error', function(done){
                                request(app).get('/botListDetail').expect(401).end(function(err,res){
                                    assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                    done();
                                });
                            });
                        });
                    });
                    describe('error finding bots', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'find').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 500 error', function(done){
                            server.get('/botListDetail').expect(500).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding bots"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var sandbox;
                    var data = [];
                    data.push({id: 1, name: "alpha",url:"uhoh", description:"a",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: 2, name: "beta", description:"b",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: 3, name: "gamma", description:"c",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    data.push({id: 4, name: "delta", description:"d",basicPerm:true,emailPerm:false,locationPerm:false,birthdayPerm:false,allPerm:false});
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'find').yields(null, data);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns correct number of bots', function(done){
                        server.get('/botListDetail').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.botList.length, 4);
                            done();
                        });
                    });
                    it('returns correct order of bots', function(done){
                        server.get('/botListDetail').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.botList[0].name, "alpha");
                            assert.strictEqual(obj.botList[2].name, "delta");
                            done();
                        });
                    });
                    it('each bot has the correct number of fields', function(done){
                        server.get('/botListDetail').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj.botList[0]).length, 8);
                            assert.strictEqual(typeof obj.botList[0].url, 'undefined');
                            done();
                        });
                    });
                });
            });
            describe('getBot', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/getBot/bad').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('error with bots.findOne', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/getBot/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding Bot"}');
                                done();
                            });
                        });
                    });
                    describe('invalid bot', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Bots, 'findOne').yields(null, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/getBot/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing cases', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {id: "a", name: "alpha", url: "noPrint", description: "goodBot", basicPerm: true, emailPerm: false, birthdayPerm: false, locationPerm: false});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns proper fields', function(done){
                        server.get('/getBot/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.bot.id, "a");
                            assert.strictEqual(obj.bot.name, "alpha");
                            assert.strictEqual(obj.bot.description, "goodBot");
                            assert.strictEqual(obj.bot.basicPerm, true);
                            assert.strictEqual(obj.bot.emailPerm, false);
                            assert.strictEqual(obj.bot.locationPerm, false);
                            assert.strictEqual(obj.bot.birthdayPerm, false);
                            done();
                        });
                    });
                    it('does not return url', function(done){
                        server.get('/getBot/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj.bot).length, 7);
                            assert.strictEqual(typeof obj.bot.url, 'undefined');
                            done();
                        });
                    });
                });
            });
            describe('getConversation', function(){
                describe('failing cases', function(){
                    describe('unauthorized access', function(){
                        it('returns 401 error', function(done){
                            request(app).get('/getBot/bad').expect(401).end(function(err,res){
                                assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                                done();
                            });
                        });
                    });
                    describe('Error finding messages', function(){
                        var sandbox;
                        before(function(){
                            sandbox = sinon.sandbox.create();
                            sandbox.stub(Messages, 'find').yields({error:"error"}, null);
                        });
                        after(function(){
                            sandbox.restore();
                        });
                        it('returns 404 error', function(done){
                            server.get('/conversation/bad').expect(404).end(function(err,res){
                                assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding messages"}');
                                done();
                            });
                        });
                    });
                });
                describe('passing case', function(){
                    var sandbox;
                    var data = [];
                    data.push({id: "1", text: "yo", to: "bot", from: "user", dateTime: new Date("2015-04-11 00:00 PDT")});
                    data.push({id: "2", text: "wo", to: "user", from: "bot", dateTime: new Date("2015-04-11 10:00 PDT")});
                    data.push({id: "3", text: "zo", to: "bot", from: "user", dateTime: new Date("2015-04-11 11:00 PDT")});
                    data.push({id: "4", text: "to", to: "bot", from: "user", dateTime: new Date("2015-04-10 00:00 PDT")});
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Messages, 'find').yields(null, data);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('has correct number of messages', function(done){
                        server.get('/conversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.chatHistory.length, 4);
                            done();
                        });
                    });
                    it('has correct ordering of messages', function(done){
                        server.get('/conversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.chatHistory[0].text, "to");
                            assert.strictEqual(obj.chatHistory[1].text, "yo");
                            done();
                        });
                    });
                    it('does not return any message ids', function(done){
                        server.get('/conversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(typeof obj.chatHistory[0].id, 'undefined');
                            done();
                        });
                    });
                });
            });
        });
        describe('groupConversation/:convoId', function(){
            describe('failing cases', function(){
                describe('unauthorized access', function(){
                    it('returns 401 error', function(done){
                        request(app).get('/groupConversation/bad').expect(401).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('error finding conversation', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/groupConversation/bad').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding conversation"}');
                            done();
                        });
                    });
                });
                describe('invalid conversation', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/groupConversation/bad').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid conversation"}');
                            done();
                        });
                    });
                });
                describe('error finding messages', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, {convo: "yes"});
                        sandbox.stub(GroupMessages,'find').yields({error: "error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/groupConversation/bad').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding messages"}');
                            done();
                        });
                    });
                });
            });
            describe('passing cases', function(){
                describe('no messages in conversation', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, {convo: "yes"});
                        sandbox.stub(GroupMessages,'find').yields(null,null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns boolean and message', function(done){
                        server.get('/groupConversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.hasMessages, false);
                            assert.strictEqual(obj.message, "No messages in conversation");
                            done();
                        });
                    });
                });
                describe('messages in conversation', function(){
                    var sandbox;
                    var data = [];
                    data.push({text:"Hello",id:"No",dateTime:new Date("2016-05-01"),from:"b"});
                    data.push({text:"Goodbye",id:"No2",dateTime:new Date("2016-06-01"),from:"c"});
                    data.push({text:"What",id:"No3",dateTime:new Date("2016-01-01"),from:"d"});
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, {convo: "yes"});
                        sandbox.stub(GroupMessages,'find').yields(null,data);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns boolean and list of messages', function(done){
                        server.get('/groupConversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.hasMessages, true);
                            assert.strictEqual(obj.messages.length, 3);
                            done();
                        });
                    });
                    it('returns correct data in correct order', function(done){
                        server.get('/groupConversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.messages[0].text, "What");
                            assert.strictEqual(obj.messages[1].text, "Hello");
                            assert.strictEqual(obj.messages[2].text, "Goodbye");
                            done();
                        });
                    });
                    it('messages do not have extra information', function(done){
                        server.get('/groupConversation/good').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(Object.keys(obj.messages[0]).length, 3);
                            assert.strictEqual(typeof obj.messages[0].id, 'undefined');
                            done();
                        });
                    });
                });
            })
        });
        describe('group/:convoId', function(){
            describe('failing cases', function(){
                describe('unauthorized access', function(){
                    it('returns 401 error', function(done){
                        request(app).get('/group/bad').expect(401).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('error finding group', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/group/bad').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding conversation"}');
                            done();
                        });
                    });
                });
                describe('invalid group', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/group/bad').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid conversation"}');
                            done();
                        });
                    });
                });
            });
            describe('passing case', function(){
                var sandbox;
                before(function(){
                    sandbox = sinon.sandbox.create();
                    sandbox.stub(GroupConversations, 'findOne').yields(null, {name:"Hello", userMembers: ['a','b','c'], botMember:"d",id:"no"});
                });
                after(function(){
                    sandbox.restore();
                });
                it('returns proper information', function(done){
                    server.get('/group/good').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.name, "Hello");
                        assert.strictEqual(obj.userMembers[0], 'a');
                        assert.strictEqual(obj.botMember, "d");
                        done();
                    });
                });
                it('does not return extra information', function(done){
                    server.get('/group/good').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 3);
                        assert.strictEqual(typeof obj.id, 'undefined');
                        done();
                    });
                });
            });
        });
        describe('groupUsers/:groupId', function(){
            describe('failing cases', function(){
                describe('unauthorized access', function(){
                    it('returns 401 error', function(done){
                        request(app).get('/groupUsers/bad').expect(401).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('error finding conversation', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/groupUsers/bad').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding conversation"}');
                            done();
                        });
                    });
                });
                describe('invalid conversation', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/groupUsers/bad').expect(404).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":404,"message":"Invalid group"}');
                            done();
                        });
                    });
                });
                var data = {userMembers: ['a','b','c']};
                describe('error finding a user', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, data);
                        sandbox.stub(Users, 'findOne').yields({error: "error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/groupUsers/bad').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding users"}');
                            done();
                        });
                    });
                });
                describe('invalid user', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(GroupConversations, 'findOne').yields(null, data);
                        sandbox.stub(Users, 'findOne').yields(null,null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error',function(done){
                        server.get('/groupUsers/bad').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid user"}');
                            done();
                        });
                    });
                });
            });
            describe('passing case', function(){
                var sandbox;
                var data = {userMembers: ['a','b','c']};
                before(function(){
                    thisSandbox.restore();
                    sandbox = sinon.sandbox.create();
                    sandbox.stub(GroupConversations, 'findOne').yields(null, data);
                    var stub = sandbox.stub(Users, 'findOne');
                    stub.withArgs({id: 'a'}).yields(null, {firstName: "alpha", lastName: "Beta", id: 'a', password: "uhoh"});
                    stub.withArgs({id: 'b'}).yields(null, {firstName: "John", lastName: "Doe", id: 'b', password: "uhoh"});
                    stub.withArgs({id: 'c'}).yields(null, {firstName: "Aaron", lastName: "Aaronson", id:'c', password: "uhoh"});
                });
                after(function(){
                    sandbox.restore();
                });
                it('returns proper number of users in proper order', function(done){
                    server.get('/groupUsers/good').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.users.length, 3);
                        assert.strictEqual(obj.users[0].firstName, "Aaron");
                        assert.strictEqual(obj.users[1].firstName, "alpha");
                        assert.strictEqual(obj.users[2].firstName, "John");
                        done();
                    });
                });
                it('user objects do not have extra information', function(done){
                    server.get('/groupUsers/good').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj.users[0]).length, 3);
                        assert.strictEqual(typeof obj.users[0].password, 'undefined');
                        done();
                    });
                });
            });
        });
        describe('getFriendInfo/:type', function(err,res){
            describe('failing cases', function(){
                describe('Unauthorized access',function(){
                    it('returns 401 error', function(done){
                        request(app).get('/getFriendInfo/bad').expect(401).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('invalid arguments', function(){
                    it('returns 400 error', function(done){
                        server.get('/getFriendInfo/bad').expect(400).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                            done();
                        });
                    });
                });
                describe('Error finding logged in user', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields({error:"error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/getFriendInfo/friends').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding user"}');
                            done();
                        });
                    });
                });
                describe('Invalid logged in user', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null,null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/getFriendInfo/friends').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid login"}');
                            done();
                        });
                    });
                });
                describe('Error in async', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, {friends:['a','b','c']});
                        sandbox.stub(async, 'series').yields({error:"error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.get('/getFriendInfo/friends').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error in async"}');
                            done();
                        });
                    });
                });
                describe('Error finding friends', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Users, 'findOne');
                        stub.withArgs({id:"u1"}).yields(null, {friends:['a','b','c'],friendRequests:['d','e','f'],pendingFriendRequests:['g']});
                        stub.withArgs({id:'a'}).yields({error:"err"},null);
                        stub.withArgs({id:'b'}).yields(null,null);
                        stub.withArgs({id:'c'}).yields(null,null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error',function(done){
                        server.get('/getFriendInfo/friends').expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding users"}');
                            done();
                        });
                    });
                });
                describe('Invalid friends', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Users, 'findOne');
                        stub.withArgs({id:"u1"}).yields(null, {friends:['a','b','c'],friendRequests:['d','e','f'],pendingFriendRequests:['g']});
                        stub.withArgs({id:'a'}).yields(null,null);
                        stub.withArgs({id:'b'}).yields(null,null);
                        stub.withArgs({id:'c'}).yields(null,null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error',function(done){
                        server.get('/getFriendInfo/friends').expect(500).end(function(err,res){
                            assert.strictEqual(res.text,'{"statusCode":500,"message":"Error in friends list"}');
                            done();
                        });
                    });
                });
            });
            describe('passing cases', function(){
                describe('no data', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Users, 'findOne').yields(null, {friends:[],friendRequests:[],pendingFriendRequests:[]});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns boolean and empty array', function(done){
                        server.get('/getFriendInfo/friends').expect(200).end(function(err,res){
                            var obj = JSON.parse(res.text);
                            assert.strictEqual(obj.noData,true);
                            assert.strictEqual(obj.people.length,0);
                            done();
                        });
                    });
                });
                describe('has data', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        var stub = sandbox.stub(Users, 'findOne');
                        stub.withArgs({id:"u1"}).yields(null, {friends:['a','b','c'],friendRequests:['d','e','f'],pendingFriendRequests:['g']});
                        stub.withArgs({id:'a'}).yields(null, {firstName:"John",lastName:"Doe",id:'a'});
                        stub.withArgs({id:'b'}).yields(null, {firstName:"Jennifer",lastName:"Zeta",id:'b'});
                        stub.withArgs({id:'c'}).yields(null, {firstName:"Jim",lastName:"Aaronson",id:'c'});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns boolean and full array, sorted properly', function(done){
                        server.get('/getFriendInfo/friends').expect(200).end(function(err,res){
                            var obj= JSON.parse(res.text);
                            assert.strictEqual(obj.noData,false);
                            assert.strictEqual(obj.people[0].lastName, "Aaronson");
                            assert.strictEqual(obj.people[1].lastName, "Doe");
                            assert.strictEqual(obj.people[2].lastName, "Zeta");
                            assert.strictEqual(obj.people.length, 3);
                            done();
                        });
                    });
                });
            });
        });
    });
    describe('bot utilities', function(){
        var cookie;
        var thisSandbox;
        before(function(done){
            thisSandbox = sinon.sandbox.create();
            thisSandbox.stub(Bots, 'findOne').yields(null, {
                id: "b1",
                username: "test",
                password: "test",
                name: "testBot",
                description: "a test bot"
            });
            server.post('/admin/botLogin').send({username: "test", password: "test"}).expect(200).end(function(err,res){
                cookie = res.headers['set-cookie'];
                done();
            });
        });
        describe('botSendGroupMessage', function(){
            var message = {convoId: "a", botId: "b", text: "hello"};
            describe('failing cases', function(){
                describe('unauthorized', function(){
                    it('returns 401 error', function(done){
                        request(app).post('/botSendGroupMessage').send({}).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('invalid arguments', function(){
                    it('returns 400 error', function(done){
                        server.post('/botSendGroupMessage').send({}).expect(400).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":400,"message":"Invalid arguments"}');
                            done();
                        });
                    });
                });
                describe('error finding bot', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.post('/botSendGroupMessage').send(message).expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding bot"}');
                            done();
                        });
                    });
                });
                describe('invalid bot', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendGroupMessage').send(message).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                            done();
                        });
                    });
                });
                describe('error finding conversation', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                        sandbox.stub(GroupConversations, 'findOne').yields({error:"error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.post('/botSendGroupMessage').send(message).expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error finding conversation"}');
                            done();
                        });
                    });
                });
                describe('invalid conversation', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                        sandbox.stub(GroupConversations, 'findOne').yields(null,null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendGroupMessage').send(message).expect(404).end(function(Err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid conversation"}');
                            done();
                        });
                    });
                });
                describe('bot not member of conversation', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot", id: "a"});
                        sandbox.stub(GroupConversations, 'findOne').yields(null,{botMember: "b"});
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 400 error',function(done){
                        server.post('/botSendGroupMessage').send(message).expect(400).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":400,"message":"Bot not member of conversation"}');
                            done();
                        });
                    });
                });
                describe('error posting message', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot", id: "a"});
                        sandbox.stub(GroupConversations, 'findOne').yields(null,{botMember: "a", convo:"a"});
                        sandbox.stub(GroupMessages, 'create').yields({error:"error"},null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 500 error', function(done){
                        server.post('/botSendGroupMessage').send(message).expect(500).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":500,"message":"Error saving message"}');
                            done();
                        });
                    });
                });
            });
            describe('passing case', function(){
                var sandbox;
                before(function(){
                    thisSandbox.restore();
                    sandbox = sinon.sandbox.create();
                    sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot", id: "a"});
                    sandbox.stub(GroupConversations, 'findOne').yields(null,{botMember: "a", convo:"a"});
                    sandbox.stub(GroupMessages, 'create').yields(null, {_id:"a", save:function fun(){}});
                });
                after(function(){
                    sandbox.restore();
                });
                it('returns proper boolean', function(done){
                    server.post('/botSendGroupMessage').send(message).expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.success, true);
                        assert.strictEqual(Object.keys(obj).length, 1);
                        done();
                    });
                });
            });
        });
        describe('userConversation', function(){
            describe('failing cases', function(){
                describe('unauthorized', function(){
                    it('returns 401 error', function(done){
                        request(app).post('/botSendGroupMessage').send({}).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('error in messages.find', function(){
                    var sandbox;
                    before(function(){
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Messages, 'find').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/userConversation/badUser/badBot').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding messages"}');
                            done();
                        });
                    });
                });
            });
            describe('passing case', function(){
                var sandbox;
                var data = [];
                data.push({id: "1", text: "yo", to: "bot", from: "user", dateTime: new Date("2015-04-11 00:00 PDT")});
                data.push({id: "2", text: "wo", to: "user", from: "bot", dateTime: new Date("2015-04-11 10:00 PDT")});
                data.push({id: "3", text: "zo", to: "bot", from: "user", dateTime: new Date("2015-04-11 11:00 PDT")});
                data.push({id: "4", text: "to", to: "bot", from: "user", dateTime: new Date("2015-04-10 00:00 PDT")});
                before(function(){
                    sandbox = sinon.sandbox.create();
                    sandbox.stub(Messages, 'find').yields(null, data);
                });
                after(function(){
                    sandbox.restore();
                });
                it('has correct number of messages', function(done){
                    server.get('/userConversation/goodUser/goodBot').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.chatHistory.length, 4);
                        done();
                    });
                });
                it('has correct ordering of messages', function(done){
                    server.get('/userConversation/goodUser/goodBot').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.chatHistory[0].text, "to");
                        assert.strictEqual(obj.chatHistory[1].text, "yo");
                        done();
                    });
                });
                it('does not return any message ids', function(done){
                    server.get('/userConversation/goodUser/goodBot').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(typeof obj.chatHistory[0].id, 'undefined');
                        done();
                    });
                });
            });
        });
        describe('botSendMessage', function(){
            var message = {type: 'text', botId: "alpha", userId: "beta", text: "gamma"};
            describe('failing cases', function(){
                describe('unauthorized', function(){
                    it('returns 401 error', function(done){
                        request(app).post('/botSendGroupMessage').send({}).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                describe('invalid arguments', function(){
                    it('returns 404 error', function(done){
                        server.post('/botSendMessage').send({}).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid arguments"}');
                            done();
                        });
                    });
                });
                describe('error finding bot', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendMessage').send(message).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding bot"}');
                            done();
                        });
                    });
                });
                describe('invalid bot', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendMessage').send(message).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid bot"}');
                            done();
                        });
                    });
                });
                describe('error finding user', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                        sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendMessage').send(message).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding user"}');
                            done();
                        });
                    });
                });
                describe('invalid user', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                        sandbox.stub(Users, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendMessage').send(message).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid user"}');
                            done();
                        });
                    });
                });
                describe('error creating message', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                        sandbox.stub(Users, 'findOne').yields(null, {user: "user"});
                        sandbox.stub(Messages, 'create').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.post('/botSendMessage').send(message).expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error creating message"}');
                            done();
                        });
                    });
                });
            });
            describe('passing case', function(){
                var sandbox;
                before(function(){
                    thisSandbox.restore();
                    sandbox = sinon.sandbox.create();
                    sandbox.stub(Bots, 'findOne').yields(null, {bot: "bot"});
                    sandbox.stub(Users, 'findOne').yields(null, {user: "user"});
                    sandbox.stub(Messages, 'create').yields(null, {_id: "alpha", save: function(){}});
                });
                after(function(){
                    sandbox.restore();
                });
                it('returns boolean true', function(done){
                    server.post('/botSendMessage').send(message).expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 1);
                        assert.strictEqual(obj.success, true);
                        done();
                    });
                });
            });
        });
        describe('User basic detail', function(){
            describe('failing cases', function(){
                describe('unauthorized', function(){
                    it('returns 401 error', function(done){
                        request(app).post('/botSendGroupMessage').send({}).expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Unauthorized"}');
                            done();
                        });
                    });
                });
                var goodUser = {firstName:"John",lastName:"Doe",gender:"Male",password:"uhoh",basicAuthBots:['goodBot'],emailAuthBots:['goodBot'],locationAuthBots:['goodBot'],birthdayAuthBots:['goodBot'],allAuthBots:['goodBot']};
                describe('invalid data request type', function(){
                    it('returns 404 error', function(done){
                        server.get('/userInfo/badBot/badUser/wrongType').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Invalid type request"}');
                            done();
                        });
                    });
                });
                describe('error finding bot', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/userInfo/badBot/badUser/basic').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error authenticating bot"}');
                            done();
                        });
                    });
                });
                describe('invalid bot', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/basic').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Invalid bot id"}');
                            done();
                        });
                    });
                });
                describe('error finding user', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name: "Bot"});
                        sandbox.stub(Users, 'findOne').yields({error: "error"}, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 404 error', function(done){
                        server.get('/userInfo/badBot/badUser/basic').expect(404).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":404,"message":"Error finding user"}');
                            done();
                        });
                    });
                });
                describe('invalid user', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                        sandbox.stub(Users, 'findOne').yields(null, null);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/basic').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Invalid user id"}');
                            done();
                        });
                    });
                });
                describe('not authorized to access user basic info', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                        sandbox.stub(Users, 'findOne').yields(null,goodUser);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/basic').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Not authorized"}');
                            done();
                        });
                    });
                });
                describe('not authorized to access user email', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                        sandbox.stub(Users, 'findOne').yields(null,goodUser);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/email').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Not authorized"}');
                            done();
                        });
                    });
                });
                describe('not authorized to access user birthday', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                        sandbox.stub(Users, 'findOne').yields(null,goodUser);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/birthday').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Not authorized"}');
                            done();
                        });
                    });
                });
                describe('not authorized to access user location', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                        sandbox.stub(Users, 'findOne').yields(null,goodUser);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/location').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Not authorized"}');
                            done();
                        });
                    });
                });
                describe('not authorized to access user all', function(){
                    var sandbox;
                    before(function(){
                        thisSandbox.restore();
                        sandbox = sinon.sandbox.create();
                        sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                        sandbox.stub(Users, 'findOne').yields(null,goodUser);
                    });
                    after(function(){
                        sandbox.restore();
                    });
                    it('returns 401 error', function(done){
                        server.get('/userInfo/badBot/badUser/all').expect(401).end(function(err,res){
                            assert.strictEqual(res.text, '{"statusCode":401,"message":"Not authorized"}');
                            done();
                        });
                    });
                });
            });
            describe('passing case', function(){
                var birthday = new Date("11-1-1991");
                var goodUser = {
                    firstName:"John",
                    lastName:"Doe",
                    gender:"Male",
                    email: "john.doe@doe.gov",
                    location: "Doeville",
                    birthday: birthday,
                    password:"uhoh",
                    basicAuthBots:['goodBot'],
                    emailAuthBots:['goodBot'],
                    locationAuthBots:['goodBot'],
                    birthdayAuthBots:['goodBot'],
                    allAuthBots:['goodBot']};
                var sandbox;
                before(function(){
                    thisSandbox.restore();
                    sandbox = sinon.sandbox.create();
                    sandbox.stub(Bots, 'findOne').yields(null, {name:"Bot"});
                    sandbox.stub(Users, 'findOne').yields(null, goodUser);
                });
                after(function(){
                    sandbox.restore();
                });
                it('returns correct values for basic', function(done){
                    server.get('/userInfo/goodBot/goodUser/basic').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.firstName, "John");
                        assert.strictEqual(obj.lastName, "Doe");
                        assert.strictEqual(obj.gender, "Male");
                        done();
                    });
                });
                it('returns no extra values for basic', function(done){
                    server.get('/userInfo/goodBot/goodUser/basic').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 3);
                        assert.strictEqual(typeof obj.password, 'undefined');
                        done();
                    });
                });
                it('returns correct values for email', function(done){
                    server.get('/userInfo/goodBot/goodUser/email').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.email, "john.doe@doe.gov");
                        done();
                    });
                });
                it('returns no extra values for email', function(done){
                    server.get('/userInfo/goodBot/goodUser/email').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 1);
                        assert.strictEqual(typeof obj.firstName, 'undefined');
                        done();
                    });
                });
                it('returns correct values for location', function(done){
                    server.get('/userInfo/goodBot/goodUser/location').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.location, "Doeville");
                        done();
                    });
                });
                it('returns no extra values for location', function(done){
                    server.get('/userInfo/goodBot/goodUser/location').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 1);
                        assert.strictEqual(typeof obj.firstName, 'undefined');
                        done();
                    });
                });
                it('returns correct values for birthday', function(done){
                    server.get('/userInfo/goodBot/goodUser/birthday').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.deepEqual(new Date(obj.birthday), birthday);
                        done();
                    });
                });
                it('returns no extra values for birthday', function(done){
                    server.get('/userInfo/goodBot/goodUser/birthday').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 1);
                        assert.strictEqual(typeof obj.firstName, 'undefined');
                        done();
                    });
                });
                it('returns correct values for all', function(done){
                    server.get('/userInfo/goodBot/goodUser/all').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(obj.firstName, "John");
                        assert.strictEqual(obj.lastName, "Doe");
                        assert.strictEqual(obj.gender, "Male");
                        assert.strictEqual(obj.email, "john.doe@doe.gov");
                        assert.strictEqual(obj.location, "Doeville");
                        assert.deepEqual(new Date(obj.birthday), birthday);
                        done();
                    });
                });
                it('returns no extra values for all', function(done){
                    server.get('/userInfo/goodBot/goodUser/all').expect(200).end(function(err,res){
                        var obj = JSON.parse(res.text);
                        assert.strictEqual(Object.keys(obj).length, 6);
                        assert.strictEqual(typeof obj.password, 'undefined');
                        done();
                    });
                });
            });
        });
    });
});
