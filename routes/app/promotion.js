var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let promotion_controler = require("../../controllers/promotionControler")


router.get('/rewardList', passport.authenticate('jwt', { session: false }), promotion_controler.getRewardOrderList);
router.get('/count', passport.authenticate('jwt', { session: false }), promotion_controler.getPromotion);
router.get('/usdtOrder', passport.authenticate('jwt', { session: false }), promotion_controler.getUsdtOrder);
router.get('/mymember', passport.authenticate('jwt', { session: false }), promotion_controler.getMymember);


module.exports = router;