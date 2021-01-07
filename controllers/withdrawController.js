let { sequelize } = require("../config/db");

let Wallet = sequelize.import("../models/wallet")

let usdtWithdrawOrder = sequelize.import("../models/usdt_withdraw_order")
let filWithdrawOrder = sequelize.import("../models/fil_withdraw_order")
let lambWithdrawOrder = sequelize.import("../models/lamb_withdraw_order")
let Withdraw = sequelize.import("../models/withdraw")
const User = sequelize.import("../models/user")

const Cal = require("../util/calculate")

exports.createOrder = function (req, res) {
  let { withdraw_type, withdraw_num, withdraw_address } = req.body  // 货币类型
  let { user_id } = req.user
  let WithdrawConfig = []
  withdraw_num = parseFloat(withdraw_num)

  Withdraw.findAll().then(result => {
    if (result) {
      WithdrawConfig = result
    }
    Wallet.findOne({ where: { user_id } }).then(user => {
      switch (withdraw_type) {
        case "usdt":
          let usdtConfig = WithdrawConfig.find(item => item.withdraw_type == "usdt")

          // console.log("exports.createOrder -> usdtConfig.withdraw_min_num ", usdtConfig.withdraw_min_num )
          // console.log("exports.createOrder -> withdraw_num", withdraw_num)
          if (usdtConfig.withdraw_min_num > withdraw_num) {
            return res.send({ err: true, msg: withdraw_type + "提现最低额度" + usdtConfig.withdraw_min_num })
          }

          // 手续费减
          // 用户提现数量 + 手续费 <= 钱包 
          if ((withdraw_num + usdtConfig.withdraw_charge_num) <= user.usdt_balance) {
            // 钱包余额减少
            let blance = parseFloat(Cal.keepTwoDecimalFull(Cal.accSub(user.usdt_balance, Cal.accAdd(withdraw_num, usdtConfig.withdraw_charge_num))))
            Wallet.update({ usdt_balance: blance }, { where: { user_id } }).then(result => {
              if (result) {
                // 钱包更新成功
                usdtWithdrawOrder.create({
                  user_id,
                  usdt_withdraw_num: withdraw_num,
                  usdt_withdraw_order_submmit_time: new Date().getTime(),
                  usdt_withdraw_address: withdraw_address,
                  usdt_charge: usdtConfig.withdraw_charge_num
                }).then(order => {
                  if (order) {
                    return res.send({ err: false, msg: "success" })
                  }
                }).catch(err => {
                  return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: err })
                })
              } else {
                // 钱包更新失败
                return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: "钱包余额减少" })
              }
            }).catch(err => {
              return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: err })
            })
          } else {
            return res.send({ err: true, msg: withdraw_type + "提现失败,余额不足" })
          }
          break;
        // case "lamb":
        //   let lambConfig = WithdrawConfig.find(item => item.withdraw_type == "lamb")

        //   if (lambConfig.withdraw_min_num > withdraw_num) {
        //     return res.send({ err: true, msg: withdraw_type + "提现最低额度" + lambConfig.withdraw_min_num })
        //   }
        //   // 用户提现数量 + 手续费 <= 钱包 
        //   if ((withdraw_num + lambConfig.withdraw_charge_num) <= user.lamb_balance) {
        //     // 钱包余额减少
        //     let blance = parseFloat(Cal.keepTwoDecimalFull(Cal.accSub(user.lamb_balance, Cal.accAdd(withdraw_num, lambConfig.withdraw_charge_num))))
        //     Wallet.update({ lamb_balance: blance }, { where: { user_id } }).then(result => {
        //       if (result) {
        //         // 钱包更新成功
        //         lambWithdrawOrder.create({
        //           user_id,
        //           lamb_withdraw_num: withdraw_num,
        //           lamb_withdraw_order_submmit_time: new Date().getTime(),
        //           lamb_withdraw_address: withdraw_address,
        //           lamb_charge: lambConfig.withdraw_charge_num
        //         }).then(order => {
        //           if (order) {
        //             return res.send({ err: false, msg: "success" })
        //           }
        //         }).catch(err => {
        //           return res.send({ err: true, msg: withdraw_type + "提现失败" })
        //         })
        //       } else {
        //         // 钱包更新失败
        //         return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: "钱包余额减少" })
        //       }
        //     }).catch(err => {
        //       return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: err })
        //     })
        //   } else {
        //     return res.send({ err: true, msg: withdraw_type + "提现失败,余额不足" })
        //   }
        //   break;
        case "fil":
          let filConfig = WithdrawConfig.find(item => item.withdraw_type == "fil")
          if (filConfig.withdraw_min_num > withdraw_num) {
            return res.send({ err: true, msg: withdraw_type + "提现最低额度" + filConfig.withdraw_min_num })
          }
          if ((withdraw_num + filConfig.withdraw_charge_num) <= user.fil_balance) {
            // 钱包余额减少
            let blance = parseFloat(Cal.keepTwoDecimalFull(Cal.accSub(user.fil_balance, Cal.accAdd(withdraw_num, filConfig.withdraw_charge_num))))

            Wallet.update({ fil_balance: blance }, { where: { user_id } }).then(result => {
              if (result) {
                // 钱包更新成功
                filWithdrawOrder.create({
                  user_id,
                  fil_withdraw_num: withdraw_num,
                  fil_withdraw_order_submmit_time: new Date().getTime(),
                  fil_withdraw_address: withdraw_address,
                  fil_charge: filConfig.withdraw_charge_num
                }).then(order => {
                  if (order) {
                    return res.send({ err: false, msg: "success" })
                  }
                }).catch(err => {
                  return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: err })
                })
              } else {
                // 钱包更新失败
                return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: "钱包余额减少" })
              }
            }).catch(err => {
              return res.send({ err: true, msg: withdraw_type + "提现失败", err_msg: err })
            })
          } else {
            return res.send({ err: true, msg: withdraw_type + "提现失败,余额不足" })
          }
          break;
        default:
          return res.send({ err: true, msg: "withdraw_type 参数错误" })
      }
      console.log("exports.createOrder -> user", user)
    }).catch(err => {
      console.log("exports.createOrder -> err", err)
      return res.send({ err: true, msg: "找不到用户钱包" })
    })
  }).catch(err => {
    console.log("exports.createOrder -> err", err)
  })
}


// GET 查询所有提现订单并分页
exports.queryAll = function (req, res) {
  let { withdraw_type } = req.query

  let currentPage = parseInt(req.query.currentPage) || 1
  let pageSize = parseInt(req.query.pageSize) || 2
  let model = null
  let total = {
    withdraw_order_num: 0
  }

  switch (withdraw_type) {
    case "usdt":
      model = usdtWithdrawOrder
      break;
    case "lamb":
      model = lambWithdrawOrder;
      break;
    case "fil":
      model = filWithdrawOrder
      break;
    default:
      return res.send({ err: true, msg: "withdraw_type 参数错误" })
  }

  switch (req.query.type) {
    case "0":
      model.findAndCountAll({
        offset: (currentPage - 1) * pageSize,
        limit: pageSize
      }).then(orders => {
        res.json({ err: false, data: orders })
      }).catch(err => {
        console.log("exports.queryAllUsdtOrder -> err", err)
        res.json({ err: true, msg: "exports.queryAllUsdtOrder", err_msg: err })
      })
      break;
    case "1":
      model.findAll({
        raw: true,
        include: [{
          model: User,
          attributes: ["user_name", "phone_num"]
        }],
      }).then(orders => {
        if (orders) {
          let list = orders.filter(item => { return item.usdt_withdraw_order_status == "1" || item.fil_withdraw_order_status == "1" || item.lamb_withdraw_order_status == "1" })
          list.forEach(ele => {
            total.withdraw_order_num += (ele.usdt_withdraw_num || ele.fil_withdraw_num || ele.lamb_withdraw_num)
          });
          total.withdraw_order_num = Cal.keepTwoDecimalFull(total.withdraw_order_num)
          res.json({ err: false, total, data: orders })
        }
      }).catch(err => {
        console.log("exports.queryAllUsdtOrder  -> err", err)
        res.json({ err: true, msg: "exports.queryAllUsdtOrder ", err_msg: err })
      })
      break;
    default:
      res.send({ err: false, msg: "type参数错误，type参数‘0’为分页,‘1’为全部数据" })
  }

}

// PUT 修改提现审核状态 "审批状态(0:已提交,1:已通过,2：未通过,3:已取消)"
exports.updateStatus = async function (req, res) {
  try {

    let { withdraw_status, withdraw_type, withdraw_id, note } = req.body
    let { name: admin_name, user_id: admin_id } = req.user
    let Model = null, Model_where = null, Model_update = null, Wallet_update_data = null

    // 提现表更新规则
    switch (withdraw_type) {
      case "usdt":
        Model = usdtWithdrawOrder
        Model_where = {
          usdt_withdraw_order_id: withdraw_id
        }
        Model_update = {
          admin_id,
          admin_name,
          usdt_withdraw_order_status: withdraw_status,
          usdt_withdraw_order_confirm_time: new Date().getTime(),
          usdt_withdraw_order_status_note: note
        }

        break;
      case "lamb":
        Model = lambWithdrawOrder;
        Model_where = {
          lamb_withdraw_order_id: withdraw_id
        }
        Model_update = {
          admin_id,
          admin_name,
          lamb_withdraw_order_status: withdraw_status,
          lamb_withdraw_order_confirm_time: new Date().getTime(),
          lamb_withdraw_order_status_note: note
        }

        break;
      case "fil":
        Model = filWithdrawOrder
        Model_where = {
          fil_withdraw_order_id: withdraw_id
        }
        Model_update = {
          admin_id,
          admin_name,
          fil_withdraw_order_status: withdraw_status,
          fil_withdraw_order_confirm_time: new Date().getTime(),
          fil_withdraw_order_status_note: note
        }

        break;
      default:
        return res.send({ err: true, msg: "withdraw_type 参数错误" })
    }

    // 提现钱包减少

    // 提现订单审核记录更新
    let WithdrawOrderList = await Model.findAll()
    if (withdraw_type == "usdt") {
      WithdrawOrder = WithdrawOrderList.find(item => item.usdt_withdraw_order_id == withdraw_id)
      if (WithdrawOrder.usdt_withdraw_order_status == "1" || WithdrawOrder.usdt_withdraw_order_status == "2") {
        return res.send({ err: true, msg: "已经审核过该usdt提现订单，请刷新一下" })
      }
    } else if (withdraw_type == "fil") {
      WithdrawOrder = WithdrawOrderList.find(item => item.fil_withdraw_order_id == withdraw_id)
      if (WithdrawOrder.fil_withdraw_order_status == "1" || WithdrawOrder.fil_withdraw_order_status == "2") {
        return res.send({ err: true, msg: "已经审核过该fil提现订单，请刷新一下" })
      }
    } else if (withdraw_type == "lamb") {
      WithdrawOrder = WithdrawOrderList.find(item => item.lamb_withdraw_order_id == withdraw_id)
      console.log("WithdrawOrder", WithdrawOrder.lamb_withdraw_order_status)
      if (WithdrawOrder.lamb_withdraw_order_status == "1" || WithdrawOrder.lamb_withdraw_order_status == "2") {
        return res.send({ err: true, msg: "已经审核过该lamb提现订单，请刷新一下" })
      }
    }
    let UserWallet = await Wallet.findOne({ where: { user_id: WithdrawOrder.user_id } })
    // console.log("**************Model**********", Model)
    // console.log("**************Model_where**********", Model_where)
    // let WithdrawOrder = await Model.findOne(Model_where)
    // console.log("**************WithdrawOrder**********", WithdrawOrder)

    if (withdraw_status == "1") {
      // 审核通过
      if (UserWallet) {
        // 提现订单更新
        await Model.update(Model_update, { where: Model_where })
        Model = null, Model_where = null, Model_update = null, Wallet_update_data = null, withdraw_id = ""
        return res.send({ err: false, msg: "审核状态修改通过" })
      } else {
        Model = null, Model_where = null, Model_update = null, Wallet_update_data = null, withdraw_id = ""
        return res.send({ err: true, msg: "数据库更新失败", err_msg: err })
      }


    } else if (withdraw_status == "2") {
      // 审核不通过
      let result = await Model.update(Model_update, { where: Model_where })

      if (result) {
        // 提现失败 钱包加回去
        switch (withdraw_type) {
          case "usdt":
            Wallet_update_data = {
              usdt_balance: parseFloat(Cal.keepTwoDecimalFull(Cal.accAdd(UserWallet.usdt_balance, WithdrawOrder.usdt_withdraw_num))), // 小数相加,
            }
            break;
          case "lamb":
            Wallet_update_data = {
              lamb_balance: parseFloat(Cal.keepTwoDecimalFull(Cal.accAdd(UserWallet.lamb_balance, WithdrawOrder.lamb_withdraw_num))) // 小数相加
            }
            break;
          case "fil":
            Wallet_update_data = {
              fil_balance: parseFloat(Cal.keepTwoDecimalFull(Cal.accAdd(UserWallet.fil_balance, WithdrawOrder.fil_withdraw_num))), // 小数相加,
            }
            break;
        }
        await Wallet.update(Wallet_update_data, { where: { user_id: WithdrawOrder.user_id } })
        Model = null, Model_where = null, Model_update = null, Wallet_update_data = null, withdraw_id = ""
        return res.send({ err: false, msg: "审核状态修改不通过" })
      } else {
        Model = null, Model_where = null, Model_update = null, Wallet_update_data = null, withdraw_id = ""
        return res.send({ err: true, msg: "数据库更新失败" })
      }
    }

  } catch (err) {
    Model = null, Model_where = null, Model_update = null, Wallet_update_data = null, withdraw_id = ""
    console.log("withdraw_status updateStatus err", err)
    return res.send({ err: false, msg: "审核状态修改失败", err_msg: err })

  }
}

// GET 获取提现额度和手续费信息
exports.getwindrawInfo = function (req, res) {
  Withdraw.findAll({
    attributes: ["withdraw_type", "withdraw_charge_num", "withdraw_min_num"],    //  需要查询出的字段
  }).then(result => {
    if (result) {
      return res.send({ err: false, msg: 'success', data: result })
    } else {
      let data = [
        {
          "withdraw_type": "usdt",
          "withdraw_charge_num": 0,
          "withdraw_min_num": 0,
        },
        {
          "withdraw_type": "lamb",
          "withdraw_charge_num": 0,
          "withdraw_min_num": 0,
        },
        {
          "withdraw_type": "fil",
          "withdraw_charge_num": 0,
          "withdraw_min_num": 0,
        }
      ]
      return res.send({ err: false, msg: "success", data })
    }
  }).catch(err => {
    console.log("exports.getwindrawInfo -> err", err)
    res.send({ err: true, msg: "getwindrawInfo fail" })
  })
}

// GET 查询个人用户提现流水
exports.getUserWindrawList = async function (req, res) {
  let { withdraw_type } = req.query

  let currentPage = parseInt(req.query.currentPage) || 1
  let pageSize = parseInt(req.query.pageSize) || 2
  let model = null
  let order_by = null

  switch (withdraw_type) {
    case "usdt":
      model = usdtWithdrawOrder
      order_by = {
        "key": "usdt_withdraw_order_submmit_time"
      }
      break;
    case "lamb":
      model = lambWithdrawOrder;
      order_by = {
        key: "lamb_withdraw_order_submmit_time"
      }
      break;
    case "fil":
      model = filWithdrawOrder
      order_by = {
        key: "fil_withdraw_order_submmit_time"
      }
      break;
    default:
      return res.send({ err: true, msg: "withdraw_type 参数错误" })
  }

  model.findAndCountAll({
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    where: { user_id: req.user.user_id }
  }).then(orders => {
    orders.rows.sort((a, b) => new Date(b[order_by.key]).getTime() - new Date(a[order_by.key]).getTime())
    // console.log("exports.queryAllUsdtOrder -> order", orders)
    res.json({ err: false, data: orders })
  }).catch(err => {
    console.log("exports.queryAllUsdtOrder -> err", err)
    res.json({ err: true, msg: "exports.queryAllUsdtOrder", err_msg: err })
  })
}