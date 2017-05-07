/**
 * Created by CodyWStocker on 4/8/17.
 */

var talk = function(request){
    return "bot" + request
};

module.exports.talk = function(request){
    return "bot: " + request
};