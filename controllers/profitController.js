let { sequelize } = require("../config/db");

let User = sequelize.import("../models/user");                    // 用户信息
let Wallet = sequelize.import("../models/wallet");                // 钱包
let ProfitBoard = sequelize.import("../models/profit_board");     // 收益
const MoonRelease = sequelize.import("../models/moon_release")    // 月光宝盒收益

exports.getProfitInfo = function (req, res) {
  let { user_id } = req.user
  User.findOne({
    attributes: [],
    where: { user_id },
    include: [
      {
        model: Wallet,
        attributes: ["fil_balance"]
      },
      {
        model: ProfitBoard,
        attributes: ["profit_board_id", "miner_space", "mining_profit_today", "mining_profit_date"]
      },
    ],
  }).then(user => {
    res.send({ err: false, msg: 'success', data: user })
  }).catch(err => {
    res.send({ err: true, msg: 'exports.getProfitInfo -> err', data: err })
  })
}

exports.getMoonProfitList = function (req, res) {
  MoonRelease.findAll({ raw:true, where: { user_id: req.user.user_id } }).then(result=>{
    return res.send({ err: false, msg: "success", data: result})
  }).catch(error=>{
    console.log("exports.getMoonReleaseList -> error", error)
    return req.send({ err: true, msg: '服务器错误', error})  
  })
}


