var express = require('express');
var router = express.Router();
let passport = require('passport');

let free_order_controller = require("../../controllers/freeOrderController")


// 后台接口
router.get("/all", passport.authenticate('jwt', { session: false }), free_order_controller.queryAll)
router.post("/create", passport.authenticate('jwt', { session: false }), free_order_controller.createFreeOrder)


module.exports = router;
