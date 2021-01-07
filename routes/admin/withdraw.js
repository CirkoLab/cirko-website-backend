var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let withdrawC_controller = require("../../controllers/withdrawController")


router.get('/queryAll', passport.authenticate('jwt', { session: false }), withdrawC_controller.queryAll);         // 查询所有提现订单
router.put('/updateStatus', passport.authenticate('jwt', { session: false }),  withdrawC_controller.updateStatus); // 审核

module.exports = router;