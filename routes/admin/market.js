let express = require('express');
let router = express.Router();
let passport = require('passport');
require('../../config/passport')(passport);

const market_controller = require("../../controllers/admin/marketController")

router.post('/create', passport.authenticate('jwt', { session: false }), market_controller.createMarket);
router.get('/list', passport.authenticate('jwt', { session: false }), market_controller.getMarketList);
router.delete("/remove", passport.authenticate('jwt', { session: false }), market_controller.removeMarket)
router.get("/query", passport.authenticate('jwt', { session: false }), market_controller.queryMarketInfo)

// 暂时待确定 提交  修改市场基本信息 // router.post('/alert', passport.authenticate('jwt', { session: false }), market_controller.submitMarketAlert);
// 暂时待确定 审核 修改市场基本信息 // router.put('/alert', passport.authenticate('jwt', { session: false }), market_controller.updateMarketAlert);

// 提交修改市场基本信息 
router.put('/alert', passport.authenticate('jwt', { session: false }), market_controller.alertMarketInfo);
router.get("/alert/list", passport.authenticate('jwt', { session: false }), market_controller.getMarketAlertBaseInfoList)

// 提交 审核 修改钱包基本信息
router.post('/wallet', passport.authenticate('jwt', { session: false }), market_controller.submitMarketWallet);
router.put('/wallet', passport.authenticate('jwt', { session: false }), market_controller.updateMarketWallet);
router.get('/wallet', passport.authenticate('jwt', { session: false }), market_controller.queryMarketWalletList);


// 增删团队用户 
router.post('/user/create', passport.authenticate('jwt', { session: false }), market_controller.addTeamUser);
router.delete('/user/remove', passport.authenticate('jwt', { session: false }), market_controller.removeTeamUser);

// 控制团队用户的转账和查看权限
router.put("/teamsPeople/auth", passport.authenticate('jwt', { session: false }), market_controller.updateTeamPeopleAuth)

router.get("/rewardOrder/all", passport.authenticate('jwt', { session: false }), market_controller.queryMarketRewardOrderAll)
router.put("/rewardOrder/status", passport.authenticate('jwt', { session: false }), market_controller.checkMarketRewardOrderStatus)

router.get("/walletTransfer", passport.authenticate('jwt', { session: false }), market_controller.checkMarketTansferList)


module.exports = router;
