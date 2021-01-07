var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let release_controller = require("../../controllers/admin/releaseController")

router.post("/moon", passport.authenticate('jwt', { session: false }), release_controller.releaseMoon)


module.exports = router;
