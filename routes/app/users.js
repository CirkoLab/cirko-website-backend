var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let user_controller = require("../../controllers/userController")

/* GET users listing. */
// router.get('/',passport.authenticate('jwt', { session: false }),function(req, res, next) {
//   console.log("req.user", req.user)
//   res.send({user:req.user});
// });

router.get("/", passport.authenticate('jwt', { session: false }), user_controller.queryUserInfo)    // 用户个人信息
router.post("/register/:type", user_controller.register)      // 用户注册
router.post("/login", user_controller.login)                  // 用户登陆
router.put("/reset/password", user_controller.resetPassword)  // 重置密码
router.put("/phone", passport.authenticate('jwt', { session: false }), user_controller.updatePhone)    // 修改用户账号状态 0正常 1冻结 

router.put("/info", passport.authenticate('jwt', { session: false }), user_controller.updateUserInfo) // 修改用户名

module.exports = router;
