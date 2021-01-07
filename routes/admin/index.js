var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

const admin_controller = require("../../controllers/admin/adminController")
const user_controller = require("../../controllers/userController")

//登录
// router.get('/login', login.showLogin);
router.post('/login', admin_controller.login);
router.get('/logout', admin_controller.logout);
router.post('/register', admin_controller.register);

router.post('/reset', passport.authenticate('jwt', { session: false }),admin_controller.reset);
// 后台 查询用户信息

router.get("/users", passport.authenticate('jwt', { session: false }), user_controller.getUserInfo)    // 校验矿工ID
router.get("/users/all", passport.authenticate('jwt', { session: false }), user_controller.queryAllUsdtOrder)  // 所有用户信息
router.get("/users/tree", passport.authenticate('jwt', { session: false }), user_controller.createUsertree)    // 矿工关系树
router.put("/users/status", passport.authenticate('jwt', { session: false }), user_controller.updateStatus)    // 修改用户账号状态 0正常 1冻结 
router.put("/users/level", passport.authenticate('jwt', { session: false }), user_controller.updateLevel)    // 修改用户账号状态 0正常 1冻结 
// router.put("/users/", passport.authenticate('jwt', { session: false }), user_controller.updateUsers)        // 根据user_id修改用户FIL空间|USDT余额|FIL余额|LAMB余额

router.get('/users/wallet/list', passport.authenticate('jwt', { session: false }), user_controller.queryAlertWalletList)  // 查询所有钱包记录
router.post('/users/wallet', passport.authenticate('jwt', { session: false }), user_controller.updateWallet)              // 修改钱包记录
router.put('/users/wallet/status', passport.authenticate('jwt', { session: false }), user_controller.updateAlterWalletStatus)    // 审核修改钱包记录
router.get('/users/createPath', passport.authenticate('jwt', { session: false }), user_controller.createPath)    
// router.put('/users/alterPhone', passport.authenticate('jwt', { session: false }), user_controller.alterAppUserPhone)   // 后台直接修改APP用户手机号

router.put('/users/seniorManager', passport.authenticate('jwt', { session: false }), user_controller.updateSeniorManager) 


module.exports = router;


