var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let profit_controller = require("../../controllers/profitController")

router.get('/', passport.authenticate('jwt', { session: false }), profit_controller.getProfitInfo);
router.get('/moonList', passport.authenticate('jwt', { session: false }), profit_controller.getMoonProfitList);

module.exports = router;