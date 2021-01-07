var express = require('express');
var router = express.Router();
let passport = require('passport');

let space_order_controller = require("../../controllers/spaceOrderController")

// APP接口
router.post("/", passport.authenticate('jwt', { session: false }), space_order_controller.submit)
// router.post("/", passport.authenticate('jwt', { session: false }), function (req, res) {
//   return res.send({ err: false, msg: "已停止购买, 该订单无效, 请刷新个人钱包" })
// })

// usdt单价
router.get("/price", passport.authenticate('jwt', { session: false }), space_order_controller.getSpacePrice)
router.get("/myOrder", passport.authenticate('jwt', { session: false }), space_order_controller.getMyOrder)
router.get("/product", space_order_controller.getProductList)

// 后台接口
router.get("/search", passport.authenticate('jwt', { session: false }), space_order_controller.query)
router.get("/all", passport.authenticate('jwt', { session: false }), space_order_controller.queryAll)
router.get("/productList", passport.authenticate('jwt', { session: false }), space_order_controller.getProductList)
router.post("/product", passport.authenticate('jwt', { session: false }), space_order_controller.createProduct)
router.put("/product", passport.authenticate('jwt', { session: false }), space_order_controller.updateProduct)
// router.post("/add", passport.authenticate('jwt', { session: false }), space_order_controller.addSpaceOrder)


module.exports = router;
