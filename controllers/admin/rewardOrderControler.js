let { sequelize } = require("../../config/db");
let RewardOrder = sequelize.import("../../models/reward_order") 
let UserRelate = sequelize.import("../../models/user_relate")
let Wallet = sequelize.import("../../models/wallet")  // 钱包
const Cal = require("../../util/calculate")
const User = sequelize.import("../../models/user")
const SpaceOrder = sequelize.import("../../models/space_order")
const Market = sequelize.import("../../models/market")
// 获取所有订单并分页
exports.queryAll = function (req, res) {

  let total= {
    reward_num:0
  }
  switch(req.query.type){
    case "0":
      let currentPage = parseInt(req.query.currentPage) || 1
      let pageSize = parseInt(req.query.pageSize) || 2
    
      RewardOrder.findAndCountAll({
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
      }).then(orders => {
        console.log("exports.queryAll -> order", orders)
        return res.json({ err: false, data: orders })
      }).catch(err => {
        console.log("reward_order exports.queryAll -> err", err)
        return res.json({ err: true, msg: "reward_order exports.queryAll -> err", err_msg: err })
      })
      break;
    case "1":
      RewardOrder.findAll({
        raw: true,
        include: [
          {
            model: User,
            attributes: ["user_id","user_name", "phone_num"]
          },
          {
            model: SpaceOrder,
            attributes: ["space_order_number", "space_num", "space_order_money_total","space_order_submmit_time"],
            include: [
              {
                model: User,
                attributes: ["user_id", "user_name", "phone_num"],
                include: [
                  {
                    model: Market,
                    attributes: ["market_id", "market_account", "market_type"]
                  }
                ]
              },]
          }, 
        ],
      }).then(orders => {
        if (orders) {
          let list = orders.filter(item => { return item.reward_order_status == "1" })
          list.forEach(ele => {
            total.reward_num += ele.reward_num
          });
          total.reward_num = Cal.keepTwoDecimalFull(total.reward_num)
          res.json({ err: false, total, data: orders })
        }
      }).catch(err => {
        console.log("RewardOrder exports.queryAll -> err", err)
        res.json({ err: true, msg: "RewardOrder exports.queryAll", err_msg: err })
      })
      break;
    default:
      res.send({ err: false, msg: "type参数错误，type参数‘0’为分页,‘1’为全部数据" })
  }
}


// 修改审核通过的置换空间订单
// 事务回滚 审批状态(0:已提交，1:已通过，2：未通过，3:已取消)
exports.updateStatus = async function (req, res) {
  try {
    let { rewardOrderId, status, note } = req.body
    let {name,user_id} =req.user
    let { reward_user_id, reward_parent_user_id, reward_num, reward_order_status} = await RewardOrder.findOne({ where: { reward_order_id: rewardOrderId } }) // 下单用户
    if (reward_order_status == "1" || reward_order_status == "2") {
      return res.send({ err: true, msg: "已经审核过该用户奖励订单，请刷新一下" })
    }
    if (status == "1") {
      // 审核通过
      let reward_order_update = await RewardOrder.update({ admin_name: name, admin_id: user_id, reward_order_status: status, reward_order_status_note: note || "", reward_order_confirm_time: new Date().getTime() }, { where: { reward_order_id: rewardOrderId } })
      let father_wallet = await Wallet.findOne({ where: { user_id: reward_parent_user_id } })

      // 父级用户的usdt钱包增加奖励
      let father_wallet_update = await Wallet.update({
        usdt_balance: parseFloat(Cal.keepTwoDecimalFull(Cal.accAdd(parseFloat(father_wallet.usdt_balance), reward_num))) // 小数相加
      }, { where: { user_id: reward_parent_user_id } })
      
      if (reward_order_update && father_wallet_update){
        return res.send({ err: false, msg: "success" })
      }else{
        return res.send({ err: true, msg: "数据库更新失败" })
      }
    } else if (status == "2") {
      // 审核不通过
      let result = await RewardOrder.update({ 
        admin_id: user_id,
        admin_name: name, 
        reward_order_status: status, 
        reward_order_status_note: note || "",
        reward_order_confirm_time: new Date().getTime()
      }, { where: { reward_order_id: rewardOrderId } })
      
      if (result) {
        return res.send({ err: false, msg: "success" })
      } else {
        return res.send({ err: true, msg: "数据库更新失败" })
      }
    } else{
      return res.send({ err: true, msg: "status 参数错误" })
    }

  } catch (e) {
    console.log("error", e)
    return res.send({ err: true, msg: "数据库更新失败", err_msg: e})
  }
}
