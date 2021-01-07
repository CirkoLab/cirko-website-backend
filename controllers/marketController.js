const { sequelize } = require("../config/db");

const User = sequelize.import("../models/user");
const Market = sequelize.import("../models/market");
const MarketRelate = sequelize.import("../models/market_relate")  // 市场关系
const MarketTeam = sequelize.import("../models/market_team")

const ErrorCodeHandle = require("../config/ErrorCodeHandle")

// POST 创建市场
exports.createMarket = function (req, res) {
  let {
    market_name,
    market_type,
    team_list,   // 绑定多个矿主id 	"team_list":[{"user_id":"11"},{"user_id":"22"},{"user_id":"33"},{"user_id":"44"}]
    market_father_id,
    market_manger,
    market_phone,
    market_address,
  } = req.body

  Market.findOne({ where: { market_name }}).then(m=>{
    if(m){
      // 重复市场名字
      return res.send(ErrorCodeHandle.ERR_EXEXIS_MARKET)
    }else{
      // 无重复市场名字
      sequelize.transaction(t => {
        // 在这里链接您的所有查询。 确保你返回他们。
        return Market.create({
          market_name,
          market_type,
          market_manger,
          market_phone,
          market_address,
        },
          { transaction: t }
        ).then(market => {
          if (market) {
            // 市场创建
            return MarketRelate.create({ market_father_id, market_id: market.market_id }, { transaction: t }).then(relate => {
              // 市场关系建立
              if (relate) {
                // 团队成员建立
                return MarketTeam.bulkCreate(team_list, { transaction: t }).then(team => {
                  if (team) {
                    // 用户表更新 market_id
                    team_list.forEach(ele => {
                      User.update({ market_id: market.market_id }, { where: { user_id: ele.user_id } }, { transaction: t })
                    });
                  }
                })
              }
            })
          }
        })
      }).then(function (result) {
        // 事务已被提交
        // result 是 promise 链返回到事务回调的结果
        return res.send({ err: false, msg: "success", result })
    
      }).catch(function (err) {
        // 事务已被回滚
        // err 是拒绝 promise 链返回到事务回调的错误
        console.error("exports.createMarket ERR_CREATE_MARKET", err)
        return res.send(ErrorCodeHandle.ERR_FINDALl_MARKET)
      });

    }
  }).catch(err=>{
    console.error("exports.createMarket Market.findOne err", err)
    res.send(ErrorCodeHandle.ERR_SERVER)
  })
}

// PUT 变更市场信流水记录
exports.updateMarket = function (req, res) {
  // TODO
  let { } = req.body
}

// GET 所有市场信息
exports.getMarketList = function (req, res) {
  Market.findAll().then(list => {
    return res.send({ err: false, msg: "success", data: list })
  }).catch(err => {
    console.log("exports.marketList -> err", err)
    return res.send(ErrorCodeHandle.ERR_FINDALl_MARKET)
  })
}