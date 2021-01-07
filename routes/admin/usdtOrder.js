var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let usdt_order_controller = require("../../controllers/usdtOrderController")


router.get('/queryAll', passport.authenticate('jwt', { session: false }),usdt_order_controller.queryAllUsdtOrder);         // 查询所有提现订单
router.put('/updateStatus', passport.authenticate('jwt', { session: false }), usdt_order_controller.updateStatus); // 审核
router.get('/search', passport.authenticate('jwt', { session: false }), usdt_order_controller.queryUsdtOrder);

router.get("/baseInfo", passport.authenticate('jwt', { session: false }), usdt_order_controller.queryBaseInfo);
router.put("/baseInfo", passport.authenticate('jwt', { session: false }), usdt_order_controller.alterBaseInfo);

module.exports = router;