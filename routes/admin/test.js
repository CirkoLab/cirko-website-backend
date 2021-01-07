var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let test_controller = require("../../controllers/testController")

router.put("/passwd", passport.authenticate('jwt', { session: false }), test_controller.testResetPassword)  // 后台直接修改APP用户手机号


module.exports = router;