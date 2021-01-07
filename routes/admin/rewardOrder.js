var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let reward_order_controler = require("../../controllers/admin/rewardOrderControler")

router.put("/status", passport.authenticate('jwt', { session: false }), reward_order_controler.updateStatus)
router.get("/all", passport.authenticate('jwt', { session: false }), reward_order_controler.queryAll)


module.exports = router;