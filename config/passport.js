let JwtStrategy = require('passport-jwt').Strategy
let ExtractJwt = require('passport-jwt').ExtractJwt;

// load up the user model
let { sequelize } = require("./db");
var User = sequelize.import('../models/user');  // app用户表
var Admin = sequelize.import('../models/admin');  
var util = require("util")
var config = require('./database'); // get db config file

module.exports = passport => {
    var opts = {}; // jwt opts
    // fromAuthHeaderAsBearerToken()
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt")
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
        if (jwt_payload.type == "manger"){
            // 获取 admin user 
            Admin.findOne({ id: jwt_payload.id }).then(user => {
                if (user) {
                    console.log("findOne user", jwt_payload)
                    done(null, jwt_payload);
                } else {
                    done(null, false);
                }
            }).catch(err => {
                console.log("err", err)
                if (err) {
                    return done(err, false);
                }
            })
        } else if (jwt_payload.type == "app"){
            // 获取 user 
            console.log("jwt_payload", jwt_payload)
            let user = jwt_payload
            done(null, user);
            // User.findOne({ user_id: jwt_payload.user_id }).then(user=>{
            //     if (user) {  
            //         console.log("jwt_payload.user_id", jwt_payload.user_id)
            //         console.log("jwt_payloa", user)
            //       done(null, user);
            //     } else {
            //       done(null, false);
            //     }
            // }).catch(err=>{
            //     console.log("err", err)
            //     if (err) {
            //         return done(err, false);
            //     }
            // })
        }
    }));
};
