const { sequelize, Sequelize } = require("../../config/db");
const Op = Sequelize.Op;

const User = sequelize.import("../../models/user");
const Wallet = sequelize.import("../../models/wallet");
const Market = sequelize.import("../../models/market");
const SpaceOrder = sequelize.import("../../models/space_order");
const MarketRelate = sequelize.import("../../models/market_relate")  // 市场关系
const MarketTeam = sequelize.import("../../models/market_team")
const MarketWalletTransfer = sequelize.import("../../models/market_wallet_transfer")
const MarketRewardOrder = sequelize.import("../../models/market_reward_order")

const BaseMarket = sequelize.import("../../models/base_market");
const MarketAlert = sequelize.import("../../models/market_alert");
const MarketAlertWallet = sequelize.import("../../models/market_alert_wallet");
const handleAppAuth = require("../../util/appAuth")

const ErrorCodeHandle = require("../../config/ErrorCodeHandle")
const Cal = require("../../util/calculate")
const Util = require("../../util/util.js")

/****************** admin后台接口 ******************/

// POST 创建市场
exports.createMarket = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let {
    market_name,
    market_type,
    team_list,   // 绑定多个矿主id 	"team_list":[{"user_id":"11","market_id":"asdasd"},{"user_id":"22","market_id":"asdasd"},{"user_id":"33","market_id":"asdasd"},{"user_id":"44","market_id":"asdasd"}]
    market_father_id,
    market_manger,
    market_phone,
    market_address,
  } = req.body

  let account = ""
  if (market_type == "1") {
    // account = "Z" + Util.RangeCode()
    account = Util.RangeCode()
  } else if (market_type == "2") {
    // account = "Y" + Util.RangeCode()
    account = Util.RangeCode()
  }

  Market.findOne({ where: { market_name } }).then(m => {
    if (m) {
      // 重复市场名字
      return res.send(ErrorCodeHandle.ERR_EXEXIS_MARKET)
    } else {
      // 无重复市场名字
      sequelize.transaction(t => {
        // 在这里链接您的所有查询。 确保你返回他们。
        return Market.create({
          market_name,
          market_type,
          market_manger,
          market_phone,
          market_address,
          market_account: account
        },
          { transaction: t }
        ).then(market => {
          if (market) {
            // 市场创建
            return MarketRelate.create({ market_father_id, market_id: market.market_id }, { transaction: t }).then(relate => {
              // 市场关系建立
              if (relate) {
                // 团队成员建立
                team_list.forEach(ele => {
                  ele["market_id"] = market.market_id
                });
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
  }).catch(err => {
    console.error("exports.createMarket Market.findOne err", err)
    res.send(ErrorCodeHandle.ERR_SERVER)
  })
}

// PUT 修改市场信息
exports.alertMarketInfo = async function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let {
    market_id,
    market_name,
    market_type,
    team_list,   // 绑定多个矿主id 	"team_list":[{"user_id":"11"},{"user_id":"22"},{"user_id":"33"},{"user_id":"44"}]
    market_father_id,
    market_manger,
    market_phone,
    market_address,
    note
  } = req.body
  let { user_id: submit_id, name: submit_name } = req.user   // 后台管理员的token

  let create_obj = {}
  market_id && (create_obj.market_id = market_id)
  market_name && (create_obj.market_alert_name = market_name)
  market_type && (create_obj.market_alert_type = market_type)
  // team_list && (create_obj.team_list = team_list)  修改的矿工ID
  market_father_id && (create_obj.market_father_id = market_father_id)
  market_manger && (create_obj.market_alert_manger = market_manger)
  market_phone && (create_obj.market_alert_phone = market_phone)
  market_address && (create_obj.market_alert_address = market_address)
  note && (create_obj.market_alert_submit_note = note)

  submit_id && (create_obj.submit_id = submit_id)
  submit_name && (create_obj.submit_name = submit_name)
  create_obj.market_alert_submit_time = new Date().getTime()
  create_obj.market_alert_status = "4"

  // 必须存在市场
  let market = await Market.findOne({ where: { market_id } })
  if (!market) {
    return res.send({ err: true, msg: "市场market_id不存在" })

  }

  // 挂上的父级市场必须存在
  if (market_father_id && market_father_id !== "0") {
    let market_father = await Market.findOne({ where: { market_id: market_father_id } })
    if (!market_father) {
      return res.send({ err: true, msg: "所选中的市场的父级market_father_id不存在" })
    }
  }

  sequelize.transaction(t => {
    let market_update = {
      market_type,
      market_name,
      market_manger,
      market_phone,
      market_address,
    }

    if (market_father_id) {
      // 同时要修改市场的归属关系 修改市场信息
      return MarketRelate.update({ market_father_id }, { where: { market_id } }, { transaction: t }).then(relate_update => {
        if (relate_update) {
          return Market.update(market_update, { where: { market_id } }, { transaction: t }).then(market_result => {
            if (market_result) {
              return MarketAlert.create(create_obj, { transaction: t })
            }
          })
        }
      })
    } else {
      // 修改市场信息
      return Market.update(market_update, { where: { market_id } }, { transaction: t }).then(market_result => {
        if (market_result) {
          return MarketAlert.create(create_obj, { transaction: t })
        }
      })
    }
  }).then(result => {
    return res.send({ err: false, msg: "success", data: result })
  }).catch(err => {
    console.log("err", err)
    return res.send({ err: true, msg: "PUT 修改市场信息 fail", err_msg: err })
  })
}

// // POST 提交修改市场信息流水记录
// exports.submitMarketAlert = function (req, res) {
//   let {
//     market_id,
//     market_name,
//     market_type,
//     team_list,   // 绑定多个矿主id 	"team_list":[{"user_id":"11"},{"user_id":"22"},{"user_id":"33"},{"user_id":"44"}]
//     market_father_id,
//     market_manger,
//     market_phone,
//     market_address,
//     note
//   } = req.body
//   let { user_id: submit_id, name: submit_name } = req.user   // 后台管理员的token

//   let create_obj = {}
//   market_id && (create_obj.market_id = market_id)
//   market_name && (create_obj.market_alert_name = market_name)
//   market_type && (create_obj.market_alert_type = market_type)
//   // team_list && (create_obj.team_list = team_list)  修改的矿工ID
//   market_father_id && (create_obj.market_father_id = market_father_id)
//   market_manger && (create_obj.market_alert_manger = market_manger)
//   market_phone && (create_obj.market_alert_phone = market_phone)
//   market_address && (create_obj.market_alert_address = market_address)
//   note && (create_obj.market_alert_submit_note = note)

//   submit_id && (create_obj.submit_id = submit_id)
//   submit_name && (create_obj.submit_name = submit_name)
//   create_obj.market_alert_submit_time = new Date().getTime()
//   create_obj.market_alert_status = "0"

//   MarketAlert.create(create_obj).then(result => {
//     if (result) {
//       return res.send({ err: false, msg: "success", data: result })
//     } else {
//       return res.send(ErrorCodeHandle.ERR_CREATE_MARKET_ALERT)
//     }
//   }).catch(err => {
//     console.error("exports.createMarketAlert -> err", err)
//     res.send(ErrorCodeHandle.ERR_CREATE_MARKET_ALERT)
//   })
// }

// PUT 审核修改市场信息流水记录
exports.updateMarketAlert = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { market_alert_id, status } = req.body
  let { user_id: admin_id, name: admin_name } = req.user   // 后台管理员的token


  if (status == "1") {
    // 审核通过
    sequelize.transaction(t => {
      return MarketAlert.findOne({ where: { market_alert_id }, raw: true }, { transaction: t }).then(alert => {
        if (alert) {
          let update_obj = {
            admin_id,
            admin_name,
            market_alert_status: status,
            market_alert_confirm_time: new Date().getTime()
          }
          return MarketAlert.update(update_obj, { where: { market_alert_id } }, { transaction: t }).then(alert_result => {
            if (alert_result) {
              let market_update = {
                market_account: alert.market_account,
                market_type: alert.market_alert_type,
                market_name: alert.market_alert_name,
                market_manger: alert.market_manger,
                market_phone: alert.market_phone,
                market_address: alert.market_address,
                market_father_id: alert.market_father_id
              }
              return Market.update(market_update, { where: { market_id: alert.market_id } }, { transaction: t }).then(market_result => {
                if (market_result) {
                  return MarketRelate.update({ market_father_id: alert.market_account }, { where: { market_id: alert.market_id } }, { transaction: t })
                }
              })
            }
          })
        } else {
          return res.send(ErrorCodeHandle.ERR_NOT_FOUND_MARKET_ALERT)
        }
      })
    }).then(result => {
      console.log("exports.updateMarketAlert -> result", result)
      return res.send({ err: false, msg: "success", data: result })
    }).catch(err => {
      console.log("exports.updateMarketAlert -> err", err)
    })


  } else if (status == "2") {
    // 审核不通过
    MarketAlert.update(update_obj, { where: { market_alert_id } }).then(result => {
      console.log("exports.putMarketAlert -> result", result)
      if (result) {
        return res.send({ err: false, msg: "success", data: result })
      } else {
        return res.send(ErrorCodeHandle.ERR_UPDATE_MARKET_ALERT)
      }
    }).catch(err => {
      console.error("exports.putMarketAlert -> err", err)
      res.send(ErrorCodeHandle.ERR_SERVER)
    })
  } else {
    return res.send({ err: true, msg: "status参数错误", data: status })
  }
}

// POST 提交市场修改钱包流水
exports.submitMarketWallet = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { market_id, sumbit_type, type, balance, note } = req.body
  console.log(req.body)
  let { user_id: submit_id, name: submit_name } = req.user
  let where = {}

  if (!/usdt|fil/i.test(type)) {
    return res.send({ err: true, msg: "type 参数错误" })
  }

  market_id && (where.market_id = market_id)

  Market.findOne({ where }).then(mak => {
    if (mak) {
      let createObj = {
        submit_id,
        submit_name,
        market_alert_wallet_submit_type: sumbit_type,
        market_alert_wallet_submit_note: note,
        market_id: mak.market_id,
        market_alert_wallet_type: type,
        market_alert_wallet_balance: balance,
        market_alert_wallet_submit_time: new Date().getTime()
      }

      MarketAlertWallet.create(createObj).then(result => {
        if (result) {
          return res.send({ err: false, msg: "提交修改市场钱包记录成功，等待审核" })
        } else {
          return res.send({ err: true, msg: "提交修改市场钱包记录失败" })
        }
      }).catch(err => {
        console.error("exports.submitMarketWallet -> err", err)
        return res.send({ err: true, msg: "submitMarketWallet.create fail", msg_err: err })
      })
    } else {
      return res.send({ err: true, msg: "未找到市场" })
    }

  }).catch(err => {
    console.error("exports.submitMarketWallet -> err", err)
    return res.send({ err: true, msg: "exports.submitMarketWallet Market findOne fail", msg_err: err })
  })

}

// 获取修改所有市场信息记录
exports.getMarketAlertBaseInfoList = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  MarketAlert.findAll().then(result => {
    if (result) {
      return res.send({ err: false, msg: "success", data: result })
    }
  }).catch(err => {
    console.log("exports.getMarketAlertBaseInfoList -> err", err)
    return res.send({ err: true, msg: "server error", msg_err: err })
  })
}

// PUT 审核市场修改钱包流水
exports.updateMarketWallet = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { market_alert_wallet_id, status } = req.body
  let { user_id: admin_id, name: admin_name, is_super } = req.user
  let update_data = {}

  if (is_super !== "1") {
    return res.send({ err: true, msg: "此用户无超级权限修改" })
  }


  MarketAlertWallet.findOne({ where: { market_alert_wallet_id } }).then(record => {
    if (record) {
      switch (status) {
        case "1":
          // 审核通过

          Market.findOne({ where: { market_id: record.market_id } }).then(wal => {
            if (wal) {
              if (record.market_alert_wallet_type == "usdt") {
                if (record.market_alert_wallet_submit_type == "add") {
                  update_data.market_wallet_usdt = parseFloat(Cal.accAdd(wal.market_wallet_usdt, record.market_alert_wallet_balance))

                } else if (record.market_alert_wallet_submit_type == "sub") {
                  update_data.market_wallet_usdt = parseFloat(Cal.accSub(wal.market_wallet_usdt, record.market_alert_wallet_balance))
                }

              } else if (record.market_alert_wallet_type == "fil") {
                if (record.market_alert_wallet_submit_type == "add") {
                  update_data.market_wallet_fil = parseFloat(Cal.accAdd(wal.market_wallet_fil, record.market_alert_wallet_balance))

                } else if (record.market_alert_wallet_submit_type == "sub") {
                  update_data.market_wallet_fil = parseFloat(Cal.accSub(wal.market_wallet_fil, record.market_alert_wallet_balance))
                }

              }

              sequelize.transaction(t => {
                // 在这里链接您的所有查询。 确保你返回他们。
                return MarketAlertWallet.update({
                  admin_id,
                  admin_name,
                  market_alert_wallet_confirm_time: new Date().getTime(),
                  market_alert_wallet_status: status
                }, { where: { market_alert_wallet_id }, transaction: t }).then(result => {
                  if (result) {
                    // 市场钱包更新
                    return Market.update(update_data, { where: { market_id: record.market_id }, transaction: t })
                  }
                })
              }).then(function (result) {
                console.log("result", result)
                // 事务已被提交
                // result 是 promise 链返回到事务回调的结果
                return res.send({ err: false, msg: "success", result })
              }).catch(function (err) {
                // 事务已被回滚
                // err 是拒绝 promise 链返回到事务回调的错误
                console.log("exports.updateMarketWallet -> err", err)
                return res.send({ err: true, msg: "updateMarketWallet sequelize.transaction", err_msg: err })
              });

            } else {
              return res.send({ err: true, msg: "查询不到市场的钱包" })
            }

          }).catch(err => {
            console.log("exports.updateMarketWal -> err", err)
            return res.send({ err: true, msg: "查询不到市场的钱包", msg_err: err })
          })
          break;
        case "2":
          // // 审核不通过
          MarketAlertWallet.update({
            admin_id,
            admin_name,
            market_alert_wallet_confirm_time: new Date().getTime(),
            market_alert_wallet_status: status,
          }, { where: { market_alert_wallet_id } }).then(result => {
            if (result) {
              return res.send({ err: false, msg: "success" })
            } else {
              return res.send({ err: true, msg: "fail" })
            }
          }).catch(err => {
            console.log("exports.updateAlterWalletStatus -> err", err)
            return res.send({ err: true, msg: "修改市场钱包记录审核更新失败" })
          })
          break;
        default:
          return res.send({ err: true, msg: "type 参数错误" })
      }

    } else {
      return res.send({ err: true, msg: "MarketAlert.findOne err" })
    }
  }).catch(err => {
    console.log("MarketAlert.findOne err", err)
    return res.send({ err: true, msg: " updateMarketWallet AlterWallet.findOne err", err_msg: err })
  })
}

// GET 获取所有修改市场钱包的金额记录
exports.queryMarketWalletList = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  MarketAlertWallet.findAll().then(list => {
    if (list) {
      return res.send({ err: false, msg: "success", data: list })
    } else {
      return res.send({ err: true, msg: "获取所有修改市场钱包的金额记录失败" })
    }
  }).catch(err => {
    console.log("exports.queryMarketWalletList -> err", err)
    return res.send({ err: true, msg: "exports.queryMarketWalletList AlterWallet findAll fail", msg_err: err })
  })
}

// GET 所有市场信息
exports.getMarketList = function (req, res) {
  
  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  Market.findAll(
    {
      include: [
        {
          model: MarketRelate,
          attributes: ["market_father_id"],
        },
        {
          model: MarketTeam, include: { model: User, attributes: ["user_id", "user_name", "number", "path"], include: { model: Wallet, attributes: ["user_space_num"] } }  // 成员的钱包
        },
      ],
    }
  ).then(async list => {

    // 计算子公司 的直属空间和直属会员列表
    let total_company_list = JSON.parse(JSON.stringify(list)).filter(item => item.market_type == "1")
    if (total_company_list) {
      for (let i = 0; i < total_company_list.length; i++) {
        // relates 下级市场营业部
        let user_list_all = []  // 直属会员列表
        let sum = 0 // 直属空间

        let market_teams_len = total_company_list[i].market_teams.length
        for (let j = 0; j < market_teams_len; j++) {
          // 下级市场的成员合伙人
          let depart_list = await department_user_list(total_company_list[i].market_teams[j].user, total_company_list[i].market_teams[j].user.user_id)  // 每个成员的部门user_list
          user_list_all.push(...depart_list)
          user_list_all = Util.deWeight(user_list_all, "user_id")

          if (depart_list) {
            for (let x = 0; x < depart_list.length; x++) {
              if (depart_list[x].wallet !== null) {
                // console.log(depart_list[x])
                sum += depart_list[x].wallet.user_space_num
              }
            }
          }

          total_company_list[i].user_list_all = user_list_all
          total_company_list[i].total_space_num = sum
        }
      }
    }

    // 计算营业部 的直属空间和直属会员列表
    let total_depart_list = JSON.parse(JSON.stringify(list)).filter(item => item.market_type == "2") // 筛选营业部 // 所有营业部列表

    if (total_depart_list) {
      for (let i = 0; i < total_depart_list.length; i++) {
        // relates 下级市场营业部
        let user_list_all = []  // 直属会员列表
        let sum = 0 // 直属空间

        let market_teams_len = total_depart_list[i].market_teams.length
        for (let j = 0; j < market_teams_len; j++) {
          // 下级市场的成员合伙人
          let depart_list = await department_user_list(total_depart_list[i].market_teams[j].user, total_depart_list[i].market_teams[j].user.user_id)  // 每个成员的部门user_list
          user_list_all.push(...depart_list)
          user_list_all = Util.deWeight(user_list_all, "user_id")

          if (depart_list) {
            for (let x = 0; x < depart_list.length; x++) {
              if (depart_list[x].wallet !== null) {
                // console.log(depart_list[x])
                sum += depart_list[x].wallet.user_space_num
              }
            }
          }

          total_depart_list[i].user_list_all = user_list_all
          total_depart_list[i].total_space_num = sum
        }
      }
    }


    // data = JSON.parse(JSON.stringify(list)).map(item => {
    //   Object.assign(item, item.market_relate)
    //   delete item.market_relate
    //   return item
    // })

    let data = []
    data = [...total_depart_list, ...total_company_list]
    if (data) {

      for (let i = 0; i < data.length; i++) {
        let mk_father_id = data[i].market_relate.market_father_id
        if (mk_father_id && mk_father_id !== "0") {
          let mk_father = await Market.findOne({ attributes: ["market_name"], where: { market_id: mk_father_id }, raw: true })
          data[i].market_relate.market_father_name = mk_father.market_name
        }
        Object.assign(data[i], data[i].market_relate)
        delete data[i].market_relate
      }
    }

    return res.send({ err: false, msg: "success", data })
  }).catch(err => {
    console.error("exports.marketList -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  })

  // 子公司的直属营业部个数
  // MarketRelate.findAll({
  //   where: { market_father_id: user.market_id },
  //   include: [
  //     {
  //       model: Market,
  //       attributes: ["market_id", "market_name", "market_type"]
  //     },
  //     {
  //       model: MarketTeam, include: { model: User, attributes: ["user_id", "user_name", "number", "path", "market_id"], include: { model: Wallet } }  // 成员的钱包
  //     }
  //   ]
  // }).then(async relates => {
  //   obj.department_num = relates.length
  //   // 子公司的关联空间计算

  //   let total_depart_list = JSON.parse(JSON.stringify(relates)).filter(item => item.market.market_type == "2") // 筛选营业部 // 所有营业部列表
  //   let total_depart_list_space_sum = 0
  //   let people_path = []// 营业部合伙人path
  //   let sum = 0 // 营业部直属空间
  //   for (let i = 0; i < total_depart_list.length; i++) {
  //     // relates 下级市场营业部
  //     let user_list_all = []  // 团队下用户列表
  //     for (let j = 0; j < total_depart_list[i].market_teams.length; j++) {
  //       // 下级市场的成员合伙人
  //       people_path.push(total_depart_list[i].market_teams[j].user.path)
  //       let depart_list = await department_user_list(total_depart_list[i].market_teams[j].user, total_depart_list[i].market_teams[j].user.user_id)  // 每个成员的部门user_list
  //       user_list_all.push(...depart_list)
  //       user_list_all = Util.deWeight(user_list_all, "user_id")
  //       total_depart_list[i].market.user_list_all = user_list_all
  //     }
  //   }
  //   // if (user_list_all) {
  //   for (let i = 0; i < total_depart_list.length; i++) {
  //     for (let j = 0; j < total_depart_list[i].market.user_list_all.length; j++) {
  //       sum += total_depart_list[i].market.user_list_all[j].wallet.user_space_num
  //     }
  //   }
  //   // sum += user_list_all[i].wallet.user_space_num
  //   // }

  //   total_depart_list_space_sum = sum
  //   /* 子公司的关联空间计算 end */


  //   // 子公司的直属空间
  //   let company_user_list_all = []  // 团队下用户列表
  //   company_sum = 0 // 子公司的直属空间

  //   for (let i = 0; i < user.market.market_teams.length; i++) {
  //     let depart_list = await department_user_list(user.market.market_teams[i].user, req.user.user_id)  // 每个成员的部门user_list
  //     company_user_list_all.push(...depart_list)
  //   }

  //   if (company_user_list_all) {
  //     for (let i = 0; i < company_user_list_all.length; i++) {
  //       company_sum += company_user_list_all[i].wallet.user_space_num
  //     }
  //   }
  //   obj.total_space_num = company_sum
  //   /* 子公司的直属空间end */

  //   obj.market_relate_total_space_num = total_depart_list_space_sum
  //   obj.team_people_num = company_user_list_all.length   // 直属空间人数
  //   return res.send({ err: false, status: "80000", msg: "success", data: obj, company_user_list_all })
  // }).catch(err => {
  //   console.log("exports.getMarketBaseInfo -> err", err)
  //   res.send(ErrorCodeHandle.ERR_QUERY_USER_MARKET)
  // })  
}

// DELETE 删除市场
exports.removeMarket = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { market_id } = req.body
  sequelize.transaction(t => {
    return Market.destroy({
      where: { market_id },
      include: [
        {
          model: MarketTeam,
          where: { market_id }
        },
        {
          model: MarketRelate,
          where: { market_id }
        }
      ]
    }, { transaction: t }).then((d) => {
      if (d) {
        return MarketRelate.update({ market_father_id: "" }, { where: { market_id } }, { transaction: t }).then(mr => {
          if (mr) {
            return User.findAll({ where: { market_id } }, { transaction: t }).then(users => {
              if (users) {
                users.forEach(async item => {
                  return await User.update({ market_id: null }, { where: { user_id: item.user_id } }, { transaction: t })
                })
              }
            })
          }
        })
      }
    })
  }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "success" })
    } else {
      return res.send({ err: true, msg: "删除市场失败" })
    }
  }).catch(err => {
    console.log("exports.removeMarket 删除市场 -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  })

}

// 增加团队用户
exports.addTeamUser = async function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { user_id, market_id } = req.body

  sequelize.transaction(t => {
    return MarketTeam.findOne({ where: { user_id: user_id } }, { transaction: t }).then(team => {
      if (!team) {
        return User.update({ market_id }, { where: { user_id } }, { transaction: t }).then(user => {
          if (user) {
            return MarketTeam.create({ market_id, user_id }, { transaction: t })
          }
        })
      }
    })
  }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "添加团队用户成功", data: result })
    } else {
      return res.send({ err: true, msg: "添加团队用户失败，请检查用户是否被添加过", data: result })
    }
  }).catch(err => {
    console.log("exports.addTeamUser fail err", err)
    return res.send({ err: true, msg: "exports.addTeamUser fail", err_msg: err })
  })
}

// 删除团队用户
exports.removeTeamUser = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { user_id, market_id } = req.body

  sequelize.transaction(t => {
    return MarketTeam.findOne({ where: { user_id: user_id } }, { transaction: t }).then(team => {
      if (team) {
        return User.update({ market_id: null }, { where: { user_id } }, { transaction: t }).then(user => {
          if (user) {
            return MarketTeam.destroy({ where: { market_id, user_id } }, { transaction: t })
          }
        })
      }
    })
  }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "删除团队用户成功", data: result })
    } else {
      return res.send({ err: true, msg: "删除团队用户失败，请检查用户是否被添加过", data: result })
    }
  }).catch(err => {
    console.log("exports.removeTeamUser fail err", err)
    return res.send({ err: true, msg: "exports.removeTeamUser fail", err_msg: err })
  })
}

// 修改APP团队用户的转账和查看权限
exports.updateTeamPeopleAuth = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let { user_id, auth_type, status } = req.body
  let update = {}

  if (status !== "0" && status !== "1") {
    return res.send({ err: true, msg: "staus参数错误", data: { type: typeof status, value: status } })
  }
  if (!user_id || !auth_type || !status) {
    return res.send({ err: true, msg: "信息请填写完整" })
  }
  switch (auth_type) {
    case "0":
      update = {
        auth_market_transfer: status
      }
      break;
    case "1":
      update = {
        auth_market_check: status
      }
      break
    default:
      return res.send({ err: true, msg: "auth_type参数错误", data: { type: typeof auth_type, value: auth_type } })
  }
  MarketTeam.update(update, { where: { user_id } }).then(update_result => {
    if (update_result) {
      update.auth_type = auth_type
      return res.send({ err: false, msg: "success", data: update })
    } else {
      return res.send({ err: true, msg: "更改权限失败" })
    }
  }).catch(err => {
    console.log("exports.updateTeamPeopleAuth 修改APP团队用户的转账和查看权限 -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  })
}

// 市场的奖励订单
// 获取所有订单并分页
exports.queryMarketRewardOrderAll = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  let total = {
    market_reward_num: 0
  }
  switch (req.query.type) {
    case "0":
      let currentPage = parseInt(req.query.currentPage) || 1
      let pageSize = parseInt(req.query.pageSize) || 2

      MarketRewardOrder.findAndCountAll({
        offset: (currentPage - 1) * pageSize,
        limit: pageSize,
      }).then(orders => {
        console.log("MarketRewardOrder exports.queryAll -> order", orders)
        return res.json({ err: false, data: orders })
      }).catch(err => {
        console.log("MarketRewardOrder exports.queryAll -> err", err)
        return res.json({ err: true, msg: "MarketRewardOrder exports.queryAll -> err", err_msg: err })
      })
      break;
    case "1":
      MarketRewardOrder.findAll({
        raw: true,
        include: [
          {
            model: Market,
            attributes: ["market_id", "market_name", "market_type"]
          },
          {
            model: SpaceOrder,
            attributes: ["space_order_number", "space_num", "space_order_money_total", "space_order_submmit_time"],
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
          let list = orders.filter(item => { return item.market_reward_order_status == "1" })
          list.forEach(ele => {
            total.market_reward_num += ele.market_reward_num
          });
          total.market_reward_num = Cal.keepTwoDecimalFull(total.market_reward_num)
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


// 修改审核通过的市场奖励订单
// 事务回滚 审批状态(0:已提交，1:已通过，2：未通过，3:已取消)
exports.checkMarketRewardOrderStatus = async function (req, res) {
  try {

    if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
      return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
    }

    let { marketRewardOrderId, status, note } = req.body
    let { name, user_id } = req.user
    let { reward_user_id, reward_parent_market_id, market_reward_num, market_reward_order_status } = await MarketRewardOrder.findOne({ where: { market_reward_order_id: marketRewardOrderId } }) // 下单用户

    if (market_reward_order_status == "1" || market_reward_order_status == "2") {
      return res.send({ err: true, msg: "已经审核过该市场奖励订单，请刷新一下" })
    }

    if (status == "1") {
      // 审核通过
      let reward_order_update = await MarketRewardOrder.update({ admin_name: name, admin_id: user_id, market_reward_order_status: status, market_reward_order_status_note: note || "", market_reward_order_confirm_time: new Date().getTime() }, { where: { market_reward_order_id: marketRewardOrderId } })
      let father_wallet = await Market.findOne({ where: { market_id: reward_parent_market_id } })

      // 父级用户的usdt钱包增加奖励
      let father_wallet_update = await Market.update({
        market_wallet_usdt: parseFloat(Cal.keepTwoDecimalFull(Cal.accAdd(parseFloat(father_wallet.market_wallet_usdt), market_reward_num))) // 小数相加
      }, { where: { market_id: reward_parent_market_id } })

      if (reward_order_update && father_wallet_update) {
        return res.send({ err: false, msg: "success" })
      } else {
        return res.send({ err: true, msg: "服务器错误 数据库更新失败" })
      }
    } else if (status == "2") {
      // 审核不通过
      let result = await MarketRewardOrder.update({
        admin_id: user_id,
        admin_name: name,
        market_reward_order_status: status,
        market_reward_order_status_note: note || "",
        market_reward_order_confirm_time: new Date().getTime()
      }, { where: { market_reward_order_id: marketRewardOrderId } })

      if (result) {
        return res.send({ err: false, msg: "success" })
      } else {
        return res.send({ err: true, msg: "服务器错误 数据库更新失败" })
      }
    } else {
      return res.send({ err: true, msg: "status 参数错误" })
    }

  } catch (e) {
    console.log("error", e)
    return res.send({ err: true, msg: "数据库更新失败", err_msg: e })
  }
}

// 查询单个市场
exports.queryMarketInfo = function (req, res) {
  let { market_id } = req.query
  
  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  Market.findOne({
    where: { market_id },
    include: [
      { model: MarketTeam, include: [{ model: User, attributes: ["user_name", "phone_num"] }] }
    ]
  }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "success", data: result })
    } else {
      return res.send({ err: true, msg: "未找到市场" })
    }
  }).catch(err => {
    console.log("exports.queryMarketInfo -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  })
}

// 后台管理员的查看所有市场流水
exports.checkMarketTansferList = function (req, res) {

  if (is_check_auth_role_name(req.user.role_name, ["support_user"])) {
    return res.send({ err: true, msg: `该用户的角色${req.user.role_name}无权限` })
  }

  MarketWalletTransfer.findAll({
    order: [
      ['transfer_time', 'DESC'],
    ],
    include: [
      {
        model: Market
      },
      {
        model: MarketTeam, include: [{ model: User, attributes: ["user_name", "phone_num"] }]
      }
    ]
  }).then(Transfer => {
    if (Transfer) {
      // 格式化数据
      let data = []
      // data = JSON.parse(JSON.stringify(user.market.market_wallet_transfers)).map(item => {
      //   Object.assign(item, item.market_team.user)
      //   delete item.market_team.user
      //   delete item.market_team
      //   return item
      // })

      return res.send({ err: false, msg: "success", data: Transfer })
    } else {
      return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
    }
  }).catch(err => {
    console.log("exports.getTeamsPeopleList 转账流水 -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  })
}




/******************************************************************** admin后台接口结束 ******************************************************************************************/



/********************************************** app接口 ********************************************/

// // 获取市场开通市场功能的空间大小
// exports.getMarketInfo = function (req, res) {
//   BaseMarket.findAll().then(result => {
//     if (result) {
//       return res.send({ err: true, msg: "success", data: { base_market_switch_num: result[0].base_market_switch_num } })
//     } else {
//       return res.send(ErrorCodeHandle.ERR_NOT_FOUND_BASE_MARKET)
//     }
//   }).catch(err => {
//     console.error("exports.getMarketInfo -> err", err)
//     return res.send(ErrorCodeHandle.ERR_NOT_FOUND_BASE_MARKET)
//   });

// }


/**
 * 用户的市场信息
 * {
    "err": false,
    "msg": "success",
    "data": {
        "team_people_num": 1,
        "total_space_num": 0,
        "department_num": 1,
        "market_id": "01d35b00-a3b8-11ea-8b5a-a19681951b3f",
        "market_name": "深圳子公司",
        "market_account": "Z666472",
        "is_closed": "0",
        "market_wallet_usdt": 0,
        "market_wallet_fil": 8.01,
        "market_wallet_lamb": 0,
        "market_reward_space_num": 0,
        "market_relate_total_space_num": 80
    }
}
 * 
 * 
*/
// status 80000 80001 80002
exports.getMarketBaseInfo = async function (req, res) {
  let { user_id } = req.user
  let current_user = await User.findOne({ where: { user_id } });
  console.log("current_user", current_user)

  if (current_user.market_id) {
    // 是市场合伙人
    // $like: 'hat%',
    handleAppAuth(req.user.user_id).then(result => {
      if (result.msg == "success") {
        User.findOne({
          attributes: ["is_market", "market_id", "user_name", "number", "path"],
          where: { user_id },
          include: [
            {
              model: Market,
              include: [
                {
                  model: MarketTeam, include: { model: User, attributes: ["user_id", "user_name", "number", "path"], include: { model: Wallet } }  // 成员的钱包
                }
              ]
            }
          ]
        }).then(async user => {
          if (user) {

            if (!user.market_id) {
              return res.send(ErrorCodeHandle.ERR_USER_NOT_FOUND_MARKET)
            }

            let obj = {
              team_people_num: 0, //直属会员
              total_space_num: 0, // 直属空间
              department_num: null,
              market_id: user.market.market_id,
              market_name: user.market.market_name,
              market_account: user.market.market_account,
              market_type: user.market.market_type,
              is_closed: user.market.is_closed,
              market_reward_space_num: user.market.market_reward_space_num,
              market_relate_total_space_num: null,
              market_wallet: {
                market_wallet_usdt: user.market.market_wallet_usdt,
                market_wallet_fil: user.market.market_wallet_fil,
                market_wallet_lamb: user.market.market_wallet_lamb,
                market_reward_space_num: user.market.market_reward_space_num
              }
            }

            // // 查询出其中一个市场成员的下线（其中可能包含其他子公司或营业部的成员）
            // async function department_user_list(teamPeople) {
            //   let user_list_1 = []
            //   user_list_1 = await User.findAll({
            //     attributes: ["user_id", "user_name", "number", "path", "market_id"],
            //     where: {
            //       path: { [Op.like]: `${teamPeople.path}%` }
            //     },
            //     include: [
            //       { model: Wallet, attributes: ["user_space_num"] }
            //     ]
            //   })

            //   let user_list_2 = user_list_1.filter(item => item.market_id !== "")  // 提取其marketID不为空的成员（这些成员属于其他的营业部）生成用户列表USER2[]；
            //   // console.log("user_list_11111111", user_list_1) // RD RE
            //   // console.log("user_list_22222222", user_list_2) // RB
            //   let user_list_3 = []  // 隶属于其他市场团队的人和他们下面的成员

            //   for (let i = 0; i < user_list_2.length; i++) {
            //     let arr = []
            //     arr = await User.findAll({
            //       attributes: ["user_id", "user_name", "number", "path", "market_id"],
            //       where: {
            //         path: { [Op.like]: `${user_list_2[i].path}%` }
            //       },
            //       include: [
            //         { model: Wallet, attributes: ["user_space_num"] }
            //       ]
            //     })
            //     user_list_3.concat(arr)
            //   }
            //   // console.log("user_list_33333333", user_list_3) // []

            //   function array_remove_repeat(a) { // 去重
            //     let r = [];
            //     for (let i = 0; i < a.length; i++) {
            //       let flag = true;
            //       let temp = a[i];
            //       for (let j = 0; j < r.length; j++) {
            //         if (temp === r[j]) {
            //           flag = false;
            //           break;
            //         }
            //       }
            //       if (flag) {
            //         r.push(temp);
            //       }
            //     }
            //     return r;
            //   }

            //   function array_difference(a, b) { // 差集 a - b
            //     //clone = a
            //     var clone = a.slice(0);
            //     for (var i = 0; i < b.length; i++) {
            //       var temp = b[i];
            //       for (var j = 0; j < clone.length; j++) {
            //         if (temp === clone[j]) {
            //           //remove clone[j]
            //           clone.splice(j, 1);
            //         }
            //       }
            //     }
            //     return array_remove_repeat(clone);
            //   }

            //   // console.log("array_difference", user_list_1) // RD，RE - []
            //   return array_difference(user_list_1, user_list_3)
            // }

            // // 该用户团队的直属空间
            // user.market.market_teams.forEach(ele => {
            //   obj.total_space_num += ele.user.wallet.user_space_num
            // })

            if (user.market.market_type == "1") {
              // 子公司的直属营业部个数
              MarketRelate.findAll({
                where: { market_father_id: user.market_id },
                include: [
                  {
                    model: Market,
                    attributes: ["market_id", "market_name", "market_type"]
                  },
                  {
                    model: MarketTeam, include: { model: User, attributes: ["user_id", "user_name", "number", "path", "market_id"], include: { model: Wallet } }  // 成员的钱包
                  }
                ]
              }).then(async relates => {
                obj.department_num = relates.length
                // 子公司的关联空间计算

                let total_depart_list = JSON.parse(JSON.stringify(relates)).filter(item => item.market.market_type == "2") // 筛选营业部 // 所有营业部列表
                let total_depart_list_space_sum = 0
                let people_path = []// 营业部合伙人path
                let sum = 0 // 营业部直属空间
                for (let i = 0; i < total_depart_list.length; i++) {
                  // relates 下级市场营业部
                  let user_list_all = []  // 团队下用户列表
                  for (let j = 0; j < total_depart_list[i].market_teams.length; j++) {
                    // 下级市场的成员合伙人
                    people_path.push(total_depart_list[i].market_teams[j].user.path)
                    let depart_list = await department_user_list(total_depart_list[i].market_teams[j].user, total_depart_list[i].market_teams[j].user.user_id)  // 每个成员的部门user_list
                    user_list_all.push(...depart_list)
                    user_list_all = Util.deWeight(user_list_all, "user_id")
                    total_depart_list[i].market.user_list_all = user_list_all
                  }
                }
                // if (user_list_all) {
                for (let i = 0; i < total_depart_list.length; i++) {
                  for (let j = 0; j < total_depart_list[i].market.user_list_all.length; j++) {
                    sum += total_depart_list[i].market.user_list_all[j].wallet.user_space_num
                  }
                }
                // sum += user_list_all[i].wallet.user_space_num
                // }

                total_depart_list_space_sum = sum
                /* 子公司的关联空间计算 end */


                // 子公司的直属空间
                let company_user_list_all = []  // 团队下用户列表
                company_sum = 0 // 子公司的直属空间

                for (let i = 0; i < user.market.market_teams.length; i++) {
                  let depart_list = await department_user_list(user.market.market_teams[i].user, req.user.user_id)  // 每个成员的部门user_list
                  company_user_list_all.push(...depart_list)
                }

                if (company_user_list_all) {
                  for (let i = 0; i < company_user_list_all.length; i++) {
                    company_sum += company_user_list_all[i].wallet.user_space_num
                  }
                }
                obj.total_space_num = company_sum
                /* 子公司的直属空间end */

                obj.market_relate_total_space_num = total_depart_list_space_sum
                obj.team_people_num = company_user_list_all.length   // 直属空间人数
                return res.send({ err: false, status: "80000", msg: "success", data: obj })
              }).catch(err => {
                console.log("exports.getMarketBaseInfo -> err", err)
                res.send(ErrorCodeHandle.ERR_QUERY_USER_MARKET)
              })
            } else if (user.market.market_type == "2") {
              // 营业部直属空间

              let user_list_all = [],  // 团队下用户列表
                sum = 0 // 营业部直属空间
              for (let i = 0; i < user.market.market_teams.length; i++) {
                let depart_list = await department_user_list(user.market.market_teams[i].user, req.user.user_id)  // 每个成员的部门user_list
                user_list_all.push(...depart_list)
              }

              if (user_list_all) {
                for (let i = 0; i < user_list_all.length; i++) {
                  sum += user_list_all[i].wallet.user_space_num
                }
              }

              obj.total_space_num = sum
              obj.team_people_num = user_list_all.length
              return res.send({ err: false, status: "80000", msg: "success", data: obj })
            }

          } else {
            return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
          }
        }).catch(err => {
          console.log("exports.getMarketBaseInfo -> err", err)
          return res.send(ErrorCodeHandle.ERR_QUERY_MARKET_RELATE)
        })
      } else {
        return res.send(result)
      }

    }).catch(err => {
      return res.send(err)
    })

  } else {

    // 不是合伙人的下线用户
    // 切割循环向上遍历

    let father_user_list = current_user['path'].split("/").filter(item => item !== "0" && item !== "" && item !== current_user.number).reverse()
    let fuser_marker = null // 合伙人的市场
    // let arr = []
    for (let i = 0; i < father_user_list.length; i++) {
      let fuser = await User.findOne({
        where: { number: father_user_list[i] },
        include: [
          { model: Market }
        ]
      })
      // arr.push(fuser)
      if (fuser.market_id !== null) {
        fuser_marker = fuser
      }
    }
    if (fuser_marker) {
      // 下线用户有上面用户有市场时
      return res.send({ err: false, status: "80001", msg: "success", data: fuser_marker.market })
    } else {
      // 下线用户无市场
      return res.send({ err: false, status: "80002", msg: "该用户没有上层市场" })
    }
  }

}

/**
 * 市场账号钱包
 * {
    "err": false,
    "msg": "success",
    "data": {
        "market_account": "Z666472",
        "market_wallet_usdt": 0,
        "market_wallet_fil": 8.01
    }
}}
}
 * 
 * 
*/
exports.getMarketAccount = function (req, res) {
  let { user_id } = req.user
  handleAppAuth(req.user.user_id).then(result => {
    if (result.msg == "success") {
      User.findOne({
        where: { user_id },
        include: [
          { model: Market }
        ]
      }).then(result => {
        if (result) {
          let obj = {
            market_type: result.market.market_type,
            market_account: result.market.market_account,
            market_wallet_usdt: result.market.market_wallet_usdt,
            market_wallet_fil: result.market.market_wallet_fil,
          }
          return res.send({ err: false, msg: "success", data: obj })
        }
      }).catch(err => {
        console.log("exports.getMarketAccount -> err", err)
      })
    } else {
      return res.send(result)
    }
  }).catch(err => {
    return res.send(err)
  });
}

// 市场转账 - 个人 市场
exports.handelMarketTransfer = function (req, res) {
  let { user_id } = req.user
  let {
    transfer_address,
    address_type,
    transfer_num,
    transfer_type
  } = req.body

  MarketTeam.findOne({ where: { user_id } }).then(p => {
    // "0" 拒绝 "1" 允许
    if (p) {
      if (p.auth_market_transfer == "1") {
        // 有转账权限的用户
        let market_update = {}
        let to_market_update = {}
        let to_user_update = {}

        switch (address_type) {
          case "0":
            // 根据手机号转账
            if (!Util.validatePhone(transfer_address)) {
              return res.send(ErrorCodeHandle.ERR_VALIDATE_PHONE)
            }

            User.findOne({ where: { phone_num: transfer_address }, include: [{ model: Wallet }] }).then(to_user => {
              if (to_user) {
                sequelize.transaction(t => {
                  return User.findOne({
                    where: { user_id },
                    include: [
                      { model: Market }
                    ]
                  }, { transaction: t }).then(user => {
                    if (user) {

                      // 转账地址与自身市场ID重复
                      if (user.market.market_account == transfer_address) {
                        return res.send({ err: true, msg: "转账地址与自身市场ID重复" })
                      }

                      // 转账金额不允许为零
                      if (transfer_num == 0) {
                        return res.send({ err: true, msg: "转账金额不允许为零" })
                      }

                      // 判断市场钱包是否充足
                      if (transfer_type == "usdt" && (user.market.market_wallet_usdt < transfer_num)) {
                        return res.send({ err: true, msg: "市场钱包usdt余额不足" })
                      } else if (transfer_type == "fil" && (user.market.market_wallet_fil < transfer_num)) {
                        return res.send({ err: true, msg: "市场钱包fil余额不足" })
                      }

                      // 市场钱包转账后变动结果
                      if (transfer_type == "usdt") {
                        market_update.market_wallet_usdt = parseFloat(Cal.accSub(user.market.market_wallet_usdt, transfer_num))
                        to_user_update.usdt_balance = parseFloat(Cal.accAdd(to_user.wallet.usdt_balance, transfer_num))
                      } else if (transfer_type == "fil") {
                        market_update.market_wallet_fil = parseFloat(Cal.accSub(user.market.market_wallet_fil, transfer_num))
                        to_user_update.fil_balance = parseFloat(Cal.accAdd(to_user.wallet.fil_balance, transfer_num))
                      }

                      // 市场钱包变动和生成转账流水
                      return Market.update(market_update, { where: { market_id: user.market.market_id } }, { transaction: t }).then(market_update_result => {
                        if (market_update_result) {
                          return Wallet.update(to_user_update, { where: { user_id: to_user.user_id } }, { transaction: t }).then(to_market_update_result => {
                            if (to_market_update_result) {
                              return MarketWalletTransfer.create({
                                user_id,
                                market_id: user.market.market_id,
                                transfer_num,
                                transfer_order_number: Util.dateFormat(new Date(), "YYYYMMDD") + Util.RangeCode(8),
                                transfer_time: new Date().getTime(),
                                address_type: address_type,
                                to_balance_type: transfer_type,
                                to_transfer_name: to_user.user_name,
                                to_transfer_address: transfer_address,
                                to_transfer_id: to_user.user_id
                              }, { transaction: t })
                            }
                          })
                        }
                      }, { transaction: t })
                    }
                  })
                }).then(result => {
                  if (result) {
                    // console.log("exports.handelMarketTransfer -> result", result)
                    return res.send({ err: false, msg: "success", data: market_update })
                  } else {
                    return res.send({ err: true, msg: "转账失败" })
                  }
                }).catch(err => {
                  console.log("exports.handelMarketTransfer -> err", err)

                })
              } else {
                return res.send({ err: true, msg: "市场账号不存在" })
              }
            }).catch(err => {
              console.log("exports.handelMarketTransfer -> err", err)
              return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
            })


            break;
          case "1":
            // 转账到市场
            if (!Util.validateMarketAccount(transfer_address)) {
              return res.send(ErrorCodeHandle.ERR_VALIDATE_MARKET_ADDRESS)
            }
            transfer_address = transfer_address.split(/[A-Za-z]{1}/i)[1]  // 去除用户首字母 
            Market.findOne({ where: { market_account: transfer_address } }).then(to_market => {
              if (to_market) {
                sequelize.transaction(t => {
                  return User.findOne({
                    where: { user_id },
                    include: [
                      { model: Market }
                    ]
                  }, { transaction: t }).then(user => {
                    if (user) {

                      // 转账地址与自身市场ID重复
                      if (user.market.market_account == transfer_address) {
                        return res.send({ err: true, msg: "转账地址与自身市场ID重复" })
                      }

                      // 转账金额不允许为零
                      if (transfer_num == 0) {
                        return res.send({ err: true, msg: "转账金额不允许为零" })
                      }

                      // 判断市场钱包是否充足
                      if (transfer_type == "usdt" && (user.market.market_wallet_usdt < transfer_num)) {
                        return res.send({ err: true, msg: "市场钱包usdt余额不足" })
                      } else if (transfer_type == "fil" && (user.market.market_wallet_fil < transfer_num)) {
                        return res.send({ err: true, msg: "市场钱包fil余额不足" })
                      }

                      // 市场钱包转账后变动结果
                      if (transfer_type == "usdt") {
                        market_update.market_wallet_usdt = parseFloat(Cal.accSub(user.market.market_wallet_usdt, transfer_num))
                        to_market_update.market_wallet_usdt = parseFloat(Cal.accAdd(to_market.market_wallet_usdt, transfer_num))
                      } else if (transfer_type == "fil") {
                        market_update.market_wallet_fil = parseFloat(Cal.accSub(user.market.market_wallet_fil, transfer_num))
                        to_market_update.market_wallet_fil = parseFloat(Cal.accAdd(to_market.market_wallet_fil, transfer_num))
                      }

                      // 市场钱包变动和生成转账流水
                      return Market.update(market_update, { where: { market_id: user.market.market_id } }, { transaction: t }).then(market_update_result => {
                        if (market_update_result) {
                          return Market.update(to_market_update, { where: { market_id: to_market.market_id } }, { transaction: t }).then(to_market_update_result => {
                            if (to_market_update_result) {
                              return MarketWalletTransfer.create({
                                user_id,
                                market_id: user.market.market_id,
                                transfer_num,
                                transfer_order_number: Util.dateFormat(new Date(), "YYYYMMDD") + Util.RangeCode(8),
                                transfer_time: new Date().getTime(),
                                address_type: address_type,
                                to_balance_type: transfer_type,
                                to_transfer_address: transfer_address,
                                to_transfer_name: to_market.market_name,
                                to_transfer_id: to_market.market_id
                              }, { transaction: t })
                            }
                          })
                        }
                      }, { transaction: t })
                    }
                  })
                }).then(result => {
                  if (result) {
                    return res.send({ err: false, msg: "success", data: market_update, })
                  } else {
                    return res.send({ err: true, msg: "转账失败" })
                  }
                }).catch(err => {
                  console.log("exports.handelMarketTransfer -> err", err)

                })
              } else {
                return res.send({ err: true, msg: "市场账号不存在" })
              }
            }).catch(err => {
              console.log("exports.handelMarketTransfer -> err", err)
              return res.send(ErrorCodeHandle.ERR_NOT_FOUND_MARKET)
            })

            break;
          default:
            return res.send({ err: true, msg: "address_type参数错误", data: address_type })
        }
      } else if (p.auth_market_transfer == "0") {
        // 无转账权限用户
        return res.send(ErrorCodeHandle.ERR_NOT_AUTH_MARKET_TRANSFER)
      }
    } else {
      return res.send({ err: true, msg: "市场团队中无该用户" })
    }
  }).catch(err => {
    console.log("exports.handelMarketTransfer 查询团队成员失败 -> err", err)
    // return res.send({ err: true, msg: "查询团队成员失败", err_msg: err })
    return res.send(ErrorCodeHandle.ERR_SERVER)

  })
}


/**
 * 子公司获取营业部列表
 * {
    "err": false,
    "msg": "success",
    "data": [
        {
            "market_relate_id": "441de020-a3b8-11ea-8b5a-a19681951b3f",
            "market_father_id": "01d35b00-a3b8-11ea-8b5a-a19681951b3f",
            "market_id": "441d43e0-a3b8-11ea-8b5a-a19681951b3f",
            "market_teams": [
                {
                    "market_team_id": "441e5550-a3b8-11ea-8b5a-a19681951b3f",
                    "market_id": "441d43e0-a3b8-11ea-8b5a-a19681951b3f",
                    "user_id": "50d35050-9fbe-11ea-ba6c-b9dd2776424c",
                    "auth_market_transfer": "1",
                    "auth_market_check": "0",
                    "created_at": "2020-06-01T03:30:40.000Z",
                    "updated_at": "2020-06-01T03:30:40.000Z",
                    "user_name": "ROOT_C1",
                    "phone_num": "13758423204"
                }
            ],
            "market_account": "Y565478",
            "market_name": "罗湖区营业2",
            "is_closed": "0"
        }
    ]
}
 * 
 * **/
exports.getDepartmentList = function (req, res) {
  handleAppAuth(req.user.user_id).then(result => {
    if (result.msg == "success") {
      User.findOne({
        attributes: ["user_id", "user_name", "market_id"],
        where: { user_id: req.user.user_id },
        include: [
          {
            model: Market,
            include: [
              { model: MarketRelate }
            ]
          }
        ]
      }).then(user => {
        if (user) {
          if (user.market.market_type = "1") {
            // 子公司的直属营业部个数
            MarketRelate.findAll({
              where: { market_father_id: user.market_id },
              include: [
                {
                  attributes: ["market_account", "market_name", "created_at", "market_address", "market_manger", "market_phone", "market_type", "is_closed"],
                  model: Market
                },
                {
                  model: MarketTeam,
                  include: [
                    {
                      model: User, attributes: ["user_id", "phone_num", "user_name", "number", "path", "market_id"],
                      include: { model: Wallet, attributes: ["user_space_num"] }
                    },
                  ],
                }
              ]
            }).then(async relates => {
              if (relates) {

                // 子公司的关联空间计算

                let total_depart_list = JSON.parse(JSON.stringify(relates)).filter(item => item.market.market_type == "2") // 筛选营业部 // 所有营业部列表
                let total_depart_list_space_sum = 0
                let people_path = []// 营业部合伙人path
                for (let i = 0; i < total_depart_list.length; i++) {
                  // relates 下级市场营业部
                  let user_list_all = []  // 团队下用户列表
                  for (let j = 0; j < total_depart_list[i].market_teams.length; j++) {
                    // 下级市场的成员合伙人
                    people_path.push(total_depart_list[i].market_teams[j].user.path)
                    let depart_list = await department_user_list(total_depart_list[i].market_teams[j].user, total_depart_list[i].market_teams[j].user.user_id)  // 每个成员的部门user_list
                    user_list_all.push(...depart_list)
                    user_list_all = Util.deWeight(user_list_all, "user_id")
                    // total_depart_list[i].market.user_list_all = user_list_all
                    let depart_sum = 0
                    for (let x = 0; x < user_list_all.length; x++) {
                      depart_sum += user_list_all[x].wallet.user_space_num
                    }
                    total_depart_list[i].market.depart_space_sum = depart_sum
                    total_depart_list[i].market.depart_people_len = user_list_all.length
                  }
                }

                /* 子公司的关联空间计算 end */

                // 数据格式化
                let data = JSON.parse(JSON.stringify(total_depart_list)).map(item => {
                  Object.assign(item, item.market)
                  delete item.market
                  for (let i = 0; i < item.market_teams.length; i++) {
                    // total_space_num += item.market_teams[i].user.wallet.user_space_num
                    Object.assign(item.market_teams[i], item.market_teams[i].user)
                    delete item.market_teams[i].wallet
                    delete item.market_teams[i].user
                  }
                  return item
                })

                return res.send({ err: false, msg: "success", data: data })
              }
            }).catch(err => {
              console.log("exports.getDepartmentList -> err", err)
            })
          } else {
            // 营业部
            return res.send({ err: true, msg: "该用户的市场是营业部类型", data: [] })
          }
        } else {
          return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
        }
      }).catch(err => {
        console.log("exports.getDepartmentList 子公司获取营业部列表 -> err", err)
        return res.send(ErrorCodeHandle.ERR_SERVER)
      })
    } else {
      return res.send(result)
    }
  }).catch(err => {
    return res.send(err)
  });
}

// 子公司点击营业部获取会员列表
exports.getDepartmentPeople = function (req, res) {

  handleAppAuth(req.user.user_id).then(result => {
    let { department_market_id, user_id } = req.query
    if (result.msg == "success") {
      User.findOne({
        attributes: ["user_id", "user_name", "market_id"],
        where: { user_id: req.user.user_id },
        include: [
          {
            model: Market,
            include: [
              { model: MarketRelate }
            ]
          }
        ]
      }).then(user => {
        if (user) {
          if (user.market.market_type = "1") {
            // 子公司的直属营业部个数
            MarketRelate.findAll({
              where: { market_father_id: user.market_id },
              include: [
                {
                  attributes: ["market_account", "market_name", "created_at", "market_address", "market_manger", "market_phone", "market_type", "is_closed"],
                  model: Market
                },
                {
                  model: MarketTeam,
                  include: [
                    {
                      model: User, attributes: ["user_id", "user_name", "number", "path", "market_id"],
                      include: { model: Wallet, attributes: ["user_space_num"] }
                    },
                  ],
                }
              ]
            }).then(async relates => {
              if (relates) {
                // 子公司的关联空间计算

                let total_depart_list = JSON.parse(JSON.stringify(relates)).filter(item => item.market.market_type == "2") // 筛选营业部 // 所有营业部列表
                for (let i = 0; i < total_depart_list.length; i++) {
                  // relates 下级市场营业部
                  let user_list_all = []  // 团队下用户列表
                  for (let j = 0; j < total_depart_list[i].market_teams.length; j++) {
                    // 下级市场的成员合伙人
                    let depart_list = await department_user_list(total_depart_list[i].market_teams[j].user, total_depart_list[i].market_teams[j].user.user_id)  // 每个成员的部门user_list
                    user_list_all.push(...depart_list)
                    user_list_all = Util.deWeight(user_list_all, "user_id")
                    // total_depart_list[i].market.user_list_all = user_list_all
                    let depart_sum = 0
                    for (let x = 0; x < user_list_all.length; x++) {
                      depart_sum += user_list_all[x].wallet.user_space_num
                    }
                    total_depart_list[i].market.depart_space_sum = depart_sum
                    total_depart_list[i].market.depart_people_len = user_list_all.length
                    total_depart_list[i].user_list_all = user_list_all
                  }
                }

                /* 子公司的关联空间计算 end */

                // 数据格式化
                let data = JSON.parse(JSON.stringify(total_depart_list)).map(item => {
                  Object.assign(item, item.market)
                  delete item.market
                  delete item.market_teams
                  // for (let i = 0; i < item.market_teams.length; i++) {
                  //   // total_space_num += item.market_teams[i].user.wallet.user_space_num
                  //   Object.assign(item.market_teams[i], item.market_teams[i].user)
                  //   delete item.market_teams[i].wallet
                  //   delete item.market_teams[i].user
                  // }
                  return item
                })
                data = data.find(item => item.market_id == department_market_id)
                return res.send({ err: false, msg: "success", data: data })
              }
            }).catch(err => {
              console.log("exports.getDepartmentList -> err", err)
            })
          } else {
            // 营业部
            return res.send({ err: true, msg: "该用户的市场是营业部类型", data: [] })
          }
        } else {
          return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
        }
      }).catch(err => {
        console.log("exports.getDepartmentList 子公司获取营业部列表 -> err", err)
        return res.send(ErrorCodeHandle.ERR_SERVER)
      })
    } else {
      return res.send(result)
    }
  }).catch(err => {
    return res.send(err)
  });
}
/**
 * 直属会员列表
 * 
 * {
    "err": false,
    "msg": "success",
    "data": [
        {
            "market_team_id": "441e5550-a3b8-11ea-8b5a-a19681951b3f",
            "market_id": "441d43e0-a3b8-11ea-8b5a-a19681951b3f",
            "user_id": "50d35050-9fbe-11ea-ba6c-b9dd2776424c",
            "auth_market_transfer": "1",
            "auth_market_check": "0",
            "created_at": "2020-06-01T03:30:40.000Z",
            "updated_at": "2020-06-01T03:30:40.000Z",
            "market_name": "罗湖区营业2",
            "user_name": "ROOT_C1",
            "phone_num": "13758423204"
        }
    ]
}
 * 
 * 
*/
exports.getTeamsPeopleList = function (req, res) {
  handleAppAuth(req.user.user_id).then(result => {
    if (result.msg == "success") {
      User.findOne({
        where: {
          user_id: req.user.user_id
        },
        include: [
          {
            model: Market,
            include: [
              {
                model: MarketTeam,
                include: [
                  { model: Market, attributes: ["market_name"] },
                  {
                    model: User, attributes: ["user_id", "user_name", "phone_num", "parent_code", "invite_code", "number", "path"],
                    include: { model: Wallet, attributes: ["user_space_num"] }
                  }
                ]
              }
            ]
          }
        ]
      }).then(async user => {
        if (user) {
          // 数据格式化
          if (user.market.market_type == "1") {
            // 子公司的直属营业部个数

            // 子公司的直属空间用户列表
            let company_user_list_all = []  // 团队下用户列表
            company_sum = 0 // 子公司的直属空间

            for (let i = 0; i < user.market.market_teams.length; i++) {
              let depart_list = await department_user_list(user.market.market_teams[i].user, req.user.user_id)  // 每个成员的部门user_list
              company_user_list_all.push(...depart_list)
            }

            /* 子公司的直属空间end */

            // let list = JSON.parse(JSON.stringify(company_user_list_all)).map(item => {
            //   Object.assign(item, item.wallet)
            //   delete item.wallet
            //   return item
            // })
            return res.send({ err: false, msg: "success", data: company_user_list_all })

          } else if (user.market.market_type == "2") {
            // 营业部直属空间

            let user_list_all = []  // 团队下用户列表
            for (let i = 0; i < user.market.market_teams.length; i++) {
              let depart_list = await department_user_list(user.market.market_teams[i].user, req.user.user_id)  // 每个成员的部门user_list
              user_list_all.push(...depart_list)
            }

            // let arr2 = user_list_all.filter((item, index) => {
            //   let temArr = []
            //   arr.forEach(item2 => temArr.push(item2.name))
            //   return temArr.indexOf(item.name) == index
            // })

            // let list = JSON.parse(JSON.stringify(arr2)).map(item => {
            //   Object.assign(item, item.wallet)
            //   delete item.wallet
            //   return item
            // })
            // user_list_all
            return res.send({ err: false, msg: "success", data: user_list_all })
          }

        } else {
          return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
        }
      })
        .catch(err => {
          console.log("exports.getTeamsPeopleList 直属会员列表 -> err", err)
          return res.send(ErrorCodeHandle.ERR_SERVER)
        })
    } else {
      return res.send(result)
    }
  }).catch(err => {
    return res.send(err)
  });

}

/**
 * 转账流水
 * {
    "err": false,
    "msg": "success",
    "data": [
        {
            "market_wallet_transfer_id": "05f83450-a55f-11ea-834b-2565a7c316bc",
            "user_id": "50d35050-9fbe-11ea-ba6c-b9dd2776424c",
            "market_id": "441d43e0-a3b8-11ea-8b5a-a19681951b3f",
            "transfer_num": 5,
            "transfer_order_number": "2020060314437168",
            "transfer_time": "2020-06-03T05:56:52.000Z",
            "address_type": "0",
            "to_transfer_name": "ROOT_C1",
            "to_transfer_address": "13758423204",
            "to_balance_type": "usdt",
            "to_transfer_id": "50d35050-9fbe-11ea-ba6c-b9dd2776424c"
        },
        {
            "market_wallet_transfer_id": "7286d7d0-a55e-11ea-bbf5-3f34ec450663",
            "user_id": "50d35050-9fbe-11ea-ba6c-b9dd2776424c",
            "market_id": "441d43e0-a3b8-11ea-8b5a-a19681951b3f",
            "transfer_num": 5,
            "transfer_order_number": "2020060334129884",
            "transfer_time": "2020-06-03T05:52:45.000Z",
            "address_type": "1",
            "to_transfer_name": "深圳子公司",
            "to_transfer_address": "Z666472",
            "to_balance_type": "usdt",
            "to_transfer_id": "01d35b00-a3b8-11ea-8b5a-a19681951b3f"
        },    
      ]
 *}
 * 
 * 
*/
exports.getTransferList = function (req, res) {
  handleAppAuth(req.user.user_id).then(result => {
    if (result.msg == "success") {
      User.findOne({
        where: {
          user_id: req.user.user_id
        },
        include: [
          {
            model: Market,
            include: [
              {
                model: MarketWalletTransfer,
                include: [{ model: MarketTeam, include: [{ model: User, attributes: ["user_name", "phone_num"] }] }]
              }
            ]
          }
        ]
      }).then(user => {
        if (user) {
          // 格式化数据
          let data = []
          data = JSON.parse(JSON.stringify(user.market.market_wallet_transfers)).map(item => {
            Object.assign(item, item.market_team.user)
            item.market_name = user.market.market_name
            delete item.market_team.user
            delete item.market_team
            return item
          })
          
          // 降序
          data.sort((a, b) => new Date(b["transfer_time"]).getTime() - new Date(a['transfer_time']).getTime())

          return res.send({ err: false, msg: "success", data })
        } else {
          return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
        }
      }).catch(err => {
        console.log("exports.getTeamsPeopleList 转账流水 -> err", err)
        return res.send(ErrorCodeHandle.ERR_SERVER)
      })
    } else {
      return res.send(result)
    }
  }).catch(err => {
    return res.send(err)
  });
}

// 市场的奖励订单流水
/***
 * 
 * 
 * {
    "err": false,
    "msg": "success",
    "data": [
        {
            "market_reward_order_id": "6f135bd0-a475-11ea-a203-49e57d9dab2d",
            "admin_id": "",
            "admin_name": "",
            "reward_user_id": "8a1d9aa0-9fbe-11ea-ba6c-b9dd2776424c",
            "reward_parent_market_id": "441d43e0-a3b8-11ea-8b5a-a19681951b3f",
            "reward_space_order_id": "6efc9f80-a475-11ea-a203-49e57d9dab2d",
            "market_reward_num": 56.43,
            "market_reward_type": "fil",
            "market_reward_order_status_note": "",
            "market_reward_order_status": "0",
            "market_reward_order_type": "2",
            "created_at": "2020-06-02T02:04:46.000Z",
            "updated_at": "2020-06-02T02:04:46.000Z"
        }
    ]
}
 * 
 * 
*/
exports.getMarketRewardOrderList = function (req, res) {
  let { market_reward_type } = req.query
  handleAppAuth(req.user.user_id).then(result => {
    if (result.msg == "success") {
      User.findOne({
        where: {
          user_id: req.user.user_id
        },
        include: [
          {
            model: Market,
            include: [
              {
                where: { market_reward_type },
                model: MarketRewardOrder
              }
            ]
          }
        ]
      }).then(user => {
        if (user) {
          let data = []

          if (!/usdt|fil/i.test(market_reward_type)) {
            return res.send({ err: true, msg: "market_reward_type的参数错误", data: `你的参数值为${market_reward_type}` })
          }
          if (user.market == null) {
            data = []
          } else {
            data = user.market.market_reward_orders.filter(item => {
              if (item.market_reward_type == market_reward_type && item.reward_parent_market_id == user.market_id) {
                return item
              }
            })
          }
          
          // 降序
          data.sort((a, b) => new Date(b["created_at"]).getTime() - new Date(a['created_at']).getTime())
          return res.send({ err: false, msg: "success", data })
        } else {
          return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
        }
      }).catch(err => {
        console.log("exports.getTeamsPeopleList 直属会员列表 -> err", err)
        return res.send(ErrorCodeHandle.ERR_SERVER)
      })
    } else {
      res.send(result)
    }
  }).catch(err => {
    return res.send(err)
  });
}


exports.testMarket = function (req, res) {
  handleAppAuth(req.user.user_id).then(result => {
    if (result.msg == "success") {

    }
    res.send(result)
  }).catch(err => {
    res.send(err)
  });
}
/*********************** app接口结束 *********************/




// 查询出其中一个市场成员的下线（其中可能包含其他子公司或营业部的成员）
async function department_user_list(teamPeople, my_user_id = "") {
  let user_list_1 = []
  user_list_1 = await User.findAll({
    attributes: ["user_id", "phone_num", "user_name", "number", "path", "market_id", "created_at"],
    where: {
      path: { [Op.like]: `${teamPeople.path}/%` }
    },
    include: [
      { model: Wallet, attributes: ["user_space_num"] }
    ]
  })

  let user_list_2 = user_list_1.filter(item => item.market_id !== null)  // 提取其marketID不为空的成员（这些成员属于其他的营业部）生成用户列表USER2[]；

  // console.log("user_list_11111111", user_list_1) // RD RE
  // console.log("***************************user_list_22222222***************************:/n", user_list_2.length) // RB
  let user_list_3 = []  // 隶属于其他市场团队的人和他们下面的成员

  for (let i = 0; i < user_list_2.length; i++) {
    let arr = []
    arr = await User.findAll({
      attributes: ["user_id", "user_name", "number", "path", "market_id", "created_at"],
      where: {
        path: { [Op.like]: `${user_list_2[i].path}/%` }
      },
      include: [
        { model: Wallet, attributes: ["user_space_num"] }
      ]
    })
    // console.log("*************user_list_33333333********", arr) // []
    user_list_3.push(...arr)
  }

  function array_remove_repeat(a) { // 去重
    let r = [];
    for (let i = 0; i < a.length; i++) {
      let flag = true;
      let temp = a[i];
      for (let j = 0; j < r.length; j++) {
        if (temp === r[j]) {
          flag = false;
          break;
        }
      }
      if (flag) {
        r.push(temp);
      }
    }
    return r;
  }
  function array_difference(a, b) { // 差集 a - b
    //clone = a
    var clone = a.slice(0);
    for (var i = 0; i < b.length; i++) {
      var temp = b[i];
      for (var j = 0; j < clone.length; j++) {
        if (temp === clone[j]) {
          //remove clone[j]
          clone.splice(j, 1);
        }
      }
    }
    return array_remove_repeat(clone);
  }

  // 求交集
  let number_list_1 = user_list_1.map(item => item.number)
  let number_list_3 = user_list_3.map(item => item.number)
  let s1 = new Set(number_list_1);
  let s3 = new Set(number_list_3);
  let difference = new Set([...s1].filter(x => !s3.has(x)));
  difference = Array.from(difference)


  // 子公司计算直属空间 去除营业部方法
  let result = []
  for (let i = 0; i < user_list_1.length; i++) {
    for (let j = 0; j < difference.length; j++) {
      if (difference[j] == user_list_1[i].number) {
        result.push(user_list_1[i])
      }
    }
  }

  // console.log("array_difference", user_list_1) // RD，RE - []
  // let arr = array_difference(user_list_1, user_list_3)
  return Util.deWeight(result, "user_id")
  // return arr.filter(item => item.user_id !== my_user_id) // 过滤自身
}



// 查询出其中一个市场成员的下线（其中可能包含其他子公司或营业部的成员）
async function com_space_user_list(teamPeople, my_user_id = "") {
  let user_list_1 = []
  user_list_1 = await User.findAll({
    attributes: ["user_id", "phone_num", "user_name", "number", "path", "market_id"],
    where: {
      path: { [Op.like]: `${teamPeople.path}/%` }
    },
    include: [
      { model: Wallet, attributes: ["user_space_num"] }
    ]
  })

  let user_list_2 = user_list_1.filter(item => item.market_id !== "")  // 提取其marketID不为空的成员（这些成员属于其他的营业部）生成用户列表USER2[]；

  // console.log("user_list_11111111", user_list_1) // RD RE
  // console.log("user_list_22222222", user_list_2) // RB
  let user_list_3 = []  // 隶属于其他市场团队的人和他们下面的成员

  for (let i = 0; i < user_list_2.length; i++) {
    let arr = []
    arr = await User.findAll({
      attributes: ["user_id", "user_name", "number", "path", "market_id"],
      where: {
        path: { [Op.like]: `${user_list_2[i].path}%` }
      },
      include: [
        { model: Wallet, attributes: ["user_space_num"] }
      ]
    })
    user_list_3.concat(arr)
  }

  function array_remove_repeat(a) { // 去重
    let r = [];
    for (let i = 0; i < a.length; i++) {
      let flag = true;
      let temp = a[i];
      for (let j = 0; j < r.length; j++) {
        if (temp === r[j]) {
          flag = false;
          break;
        }
      }
      if (flag) {
        r.push(temp);
      }
    }
    return r;
  }

  function array_difference(a, b) { // 差集 a - b
    //clone = a
    var clone = a.slice(0);
    for (var i = 0; i < b.length; i++) {
      var temp = b[i];
      for (var j = 0; j < clone.length; j++) {
        if (temp === clone[j]) {
          //remove clone[j]
          clone.splice(j, 1);
        }
      }
    }
    return array_remove_repeat(clone);
  }

  // console.log("array_difference", user_list_1) // RD，RE - []
  let arr = array_difference(user_list_1, user_list_3)

  return arr.filter(item => item.user_id !== my_user_id) // 过滤自身
}


function is_check_auth_role_name(current_role_name = "", back_role_name_list = []){
  // 后台角色鉴别
  let result = back_role_name_list.find(item => item == current_role_name)
  if (result){
    return true
  }
  return false
}