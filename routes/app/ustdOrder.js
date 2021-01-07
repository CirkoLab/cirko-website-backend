var express = require('express');
var router = express.Router();
let passport = require('passport');
const multer = require('multer')
const config = require("../../config/host")
let usdt_order_controller = require("../../controllers/usdtOrderController")
const fs = require("fs")
// /* GET users listing. */
// router.get('/', function (req, res, next) {
//   res.send('respond with a resource');
// });

// router.get("/all", usdt_order_controller.queryAllUsdtOrder)
// router.get("/", usdt_order_controller.queryUsdtOrder)
// router.put("/", usdt_order_controller.updateUsdtOrder)

router.post("/", passport.authenticate('jwt', { session: false }), usdt_order_controller.submitUsdtOrder)  // 提交usdt充值
// router.post("/", passport.authenticate('jwt', { session: false }), function (req, res) {
//   return res.send({ err: true, msg: "停止提交usdt充值" })
// })
// router.get("/usdt_upload", passport.authenticate('jwt', { session: false }), usdt_order_controller.getAliOssSts) // 提交凭据图的sts

// 本地上传图片
router.post('/usdt_upload', multer({
  //设置文件存储路径，upload文件如果不存在则会自己创建一个。
  dest: 'usdt_upload'
}).single('file'), function (req, res, next) {
  if (req.file.length === 0) {  //判断一下文件是否存在，也可以在前端代码中进行判断。
    res.send({ err: true, msg: "上传文件不能为空！" })
    return
  } else {
    let file = req.file;
    let fileInfo = {};
    console.log(file);
    fs.renameSync('./usdt_upload/' + file.filename, './usdt_upload/' + file.filename+".png");//这里修改文件名字，比较随意。
    // 获取文件信息
    fileInfo.mimetype = file.mimetype;
    fileInfo.originalname = file.originalname;
    fileInfo.size = file.size;
    fileInfo.path = file.path;
    // // 设置响应类型及编码
    res.set({
      'content-type': 'application/json; charset=utf-8'
    });
    // let url = `http://${config.host}:${config.port}/${fileInfo.path}.png`
    let url = `http://server.hemaminingpool.com:3001/${fileInfo.path}.png`
    res.send({ err: false, data: { url }, msg: "success" });
  }
});

module.exports = router;
