var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let sms_controller = require("../../controllers/smsControler")

router.post('/send', sms_controller.sendSMSCode);
router.post('/compare', sms_controller.compareSmsCode);
router.post('/send/email', sms_controller.sendEmailCode);
router.post('/compare/email', sms_controller.compareEmailCode);

module.exports = router;