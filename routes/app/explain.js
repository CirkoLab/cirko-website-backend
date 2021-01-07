var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../../config/passport')(passport);

let explain_controller = require("../../controllers/admin/explainController")

router.get("/list", explain_controller.getExplainList)


module.exports = router;
