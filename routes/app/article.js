var express = require('express');
var router = express.Router();

const article_controller = require("../../controllers/articleController")


router.get('/list', article_controller.getAricleList)

module.exports = router;
