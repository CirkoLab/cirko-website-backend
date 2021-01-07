var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

// const market_controller = require("../../controllers/admin/marketController")

// router.get('/', passport.authenticate('jwt', { session: false }), market_controller.getMarketInfo);  // 废弃开通市场功能的信息
// router.get("/base", passport.authenticate('jwt', { session: false }), market_controller.getMarketBaseInfo)
// router.get("/account", passport.authenticate('jwt', { session: false }), market_controller.getMarketAccount)
// router.get("/department/list",  passport.authenticate('jwt', { session: false }), market_controller.getDepartmentList)
// router.get("/teamsPeople/list",  passport.authenticate('jwt', { session: false }), market_controller.getTeamsPeopleList)  // 直属会员列表
// router.post("/transfer", passport.authenticate('jwt', { session: false }), market_controller.handelMarketTransfer)
// router.get("/transfer/list",  passport.authenticate('jwt', { session: false }), market_controller.getTransferList)
// router.get("/rewardOrder/list",  passport.authenticate('jwt', { session: false }), market_controller.getMarketRewardOrderList)
// router.get("/testMarket", passport.authenticate('jwt', { session: false }), market_controller.testMarket)
// router.get("/departmentPeople", passport.authenticate('jwt', { session: false }), market_controller.getDepartmentPeople)

module.exports = router;
