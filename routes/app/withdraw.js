var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let withdrawC_controller = require("../../controllers/withdrawController")

router.get('/info', passport.authenticate('jwt', { session: false }), withdrawC_controller.getwindrawInfo);// app提现信息
router.post('/', passport.authenticate('jwt', { session: false }), withdrawC_controller.createOrder);// app提现
router.get("/list", passport.authenticate('jwt', { session: false }), withdrawC_controller.getUserWindrawList) // 用户三种货币提现流水

module.exports = router;