let express = require('express');
let router = express.Router();
let passport = require('passport');
require('../../config/passport')(passport);

let message_controler = require("../../controllers/admin/messageControler")

router.get("/list", passport.authenticate('jwt', { session: false }), message_controler.getCheckMessage)
// router.post("/market_reward_order", passport.authenticate('jwt', { session: false }), message_controler.craeteMarketRewardOrder)

module.exports = router;
