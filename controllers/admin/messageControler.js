let { sequelize } = require("../../config/db");

const UsdtOrder = sequelize.import("../../models/usdt_order")
const RewardOrder = sequelize.import("../../models/reward_order")
const UsdtWithdrawOrder = sequelize.import("../../models/usdt_withdraw_order")
const FilWithdrawOrder = sequelize.import("../../models/fil_withdraw_order")
const LambWithdrawOrder = sequelize.import("../../models/lamb_withdraw_order")

const Util = require("../../util/util")
// exports.getCheckMessage = function (req, res) {
//   let arr = []
//   sequelize.transaction(t => {
//     return UsdtOrder.count({ where: { usdt_confirm_status: 0 }, transaction: t }).then(order => {
//       if (order){
//         arr.push(order)
//         return RewardOrder.count({ where: { reward_order_status: 0 }, transaction: t }).then(reward => {
//           if (reward){
//             arr.push(reward)
//             return UsdtWithdrawOrder.count({ where: { usdt_withdraw_order_status: 0 }, transaction: t }).then(usdtWorder => {
//               arr.push(usdtWorder)
//               return FilWithdrawOrder.count({ where: { fil_withdraw_order_status: 0 }, transaction: t }).then(filWorder => {
//                 arr.push(filWorder)
//                 return LambWithdrawOrder.count({ where: { lamb_withdraw_order_status: 0 }, transaction: t }).then(lambWorder=>{
//                   arr.push(lambWorder)
//                 })
//               })
//             })
//           }
//         })
//       }
//     })

//   }).then(result => {
//     console.log("exports.getCheckMessage -> result", result)
//     return res.send({ err: false, msg: "asd", arr, result})
//   }).catch(err => {
//     console.log("exports.getCheckMessage -> err", err)
//     return res.send({ err: true, msg: "err" })

//   })

// } 

exports.getCheckMessage = async function (req, res) {
  try {
    let usdtOrder = await UsdtOrder.count({ where: { usdt_confirm_status: "0" } })
    let reward = await RewardOrder.count({ where: { reward_order_status: "0" } })
    let usdtWorder = await UsdtWithdrawOrder.count({ where: { usdt_withdraw_order_status: "0" } })
    let filWorder = await FilWithdrawOrder.count({ where: { fil_withdraw_order_status: "0" } })
    let lambWorder = await LambWithdrawOrder.count({ where: { lamb_withdraw_order_status: "0" } })
    let marketRewardOrder = await MarketRewardOrder.count({ where: { market_reward_order_status: "0" } })
    let obj = {}

    if (req.user.role_name == "admin") {
      obj = {
        err: false,
        msg: "success",
        data: [
          { type: "usdtOrder", num: usdtOrder, },
          { type: "reward", num: reward, },
          { type: "usdt", num: usdtWorder },
          { type: "fil", num: filWorder },
          { type: "lamb", num: lambWorder },
          { type: "marketRewardOrder", num: marketRewardOrder }
        ]
      }
    } else if (req.user.role_name == "support_user") {
      obj = {
        err: false,
        msg: "success",
        data: [
          { type: "usdtOrder", num: usdtOrder, },
          { type: "reward", num: reward, },
          { type: "usdt", num: usdtWorder },
          { type: "fil", num: filWorder },
          { type: "lamb", num: lambWorder },
        ]
      }
    }
    return res.send(obj)
  } catch (err) {
    console.log("exports.getCheckMessage err", err)
    return res.send({ err: true, msg: "服务错误", err_msg: err })
  }
}

exports.craeteMarketRewardOrder = async function (req, res) {
  let {
    reward_space_order_id,
    reward_user_id,
    created_at,
    market_reward_order_type,
    market_reward_num,
    reward_parent_market_id
  } = req.body

  await MarketRewardOrder.create({
    reward_user_id,
    reward_parent_market_id,
    reward_space_order_id,
    market_reward_num,
    market_reward_order_type,
    market_reward_order_number: Util.dateFormat(new Date(created_at), "YYYYMMDD") + Util.RangeCode(8),
    created_at: new Date(created_at),
  })
  return res.send({ msg: "success" })
}