let { sequelize, Sequelize } = require("../../config/db");
const User = sequelize.import("../../models/user");
const Admin = sequelize.import("../../models/admin");
const Wallet = sequelize.import("../../models/wallet");
const ProfitBoard = sequelize.import("../../models/profit_board");
const MoonRelease = sequelize.import("../../models/moon_release");
const UserMoon = sequelize.import("../../models/user_moon");
const Op = Sequelize.Op;

const Cal = require("../../util/calculate")

// 1.FIL挖矿奖励分发,填入分发额度，一键分发
// 每日挖矿奖励
exports.rewardFill = async function (req, res) {
  let { reward } = req.body
  let { role_name } = req.user

  if (!reward) {
    res.send({ err: true, msg: "reward, 分发额度为无" })
    return
  }

  // if (role_name == "admin") {
  //   // 派发给所有用户钱包
  //   Wallet.findAll().then(users => {
  //     if (users) {
  //       for (let i = 0; i < users.length; i++) {
  //         // 钱包的用户id
  //         Wallet.update({ fil_balance: Number(users[i].fil_balance) + Number(reward) }, { where: { wallet_id: users[i].wallet_id } }).then(wallet => {
  //           if (wallet) {
  //           } else {
  //             res.send({ err: true, msg: "派发失败,稍后重试", err_msg: err })
  //           }
  //         }).catch((err) => {
  //           console.log("exports.rewardFill -> err", err)
  //           res.send({ err: true, msg: "派发失败,稍后重试", err_msg: err })
  //           return
  //         });
  //         ProfitBoard.findAll({ where: { user_id: users[i].user_id } }).then(profits => {
  //           if (profits) {
  //             for (let i = 0; i < profits.length; i++) {
  //               console.log("exports.profits.profits profitsprofits ", profits[i])
  //               ProfitBoard.update({
  //                 mining_profit_today: Number(reward), // 挖矿今日收益
  //                 mining_profit_total: Number(profits[i].mining_profit_total) + Number(reward), // 挖矿总收益,
  //                 mining_profit_history: `${profits[i].mining_profit_history},${reward}`, // 挖矿总收益,
  //                 mining_profit_data: `${profits[i].mining_profit_data},${profits[i].updated_at}`
  //               },
  //                 { where: { user_id: users[i].user_id } }).then(result => {
  //                   if (result) {
  //                     console.log("exports.ProfitBoard.update ", result)
  //                     // res.send({ err: false, msg: "ProfitBoard update success" })
  //                   } else {
  //                     res.send({ err: true, msg: "派发失败,稍后重试", err_msg: err })
  //                   }
  //                 }).catch(err => {
  //                   console.log("exports.ProfitBoard.update -> err", err)
  //                   res.send({ err: true, msg: "派发失败,稍后重试", err_msg: err })
  //                   return
  //                 })
  //             }
  //           }
  //         }).catch(err => {
  //           console.log("exports.ProfitBoard.findAll -> err", err)
  //           res.send({ err: true, msg: "派发失败,稍后重试", err_msg: err })
  //           return
  //         })
  //       }
  //       res.send({ err: true, msg: 'success' })
  //     } else {
  //       res.send({ err: true, msg: '无用户, 派发失败' })
  //     }
  //   }).catch(err => {
  //     console.log(err)
  //   })
  // } else {
  //   res.send({ err: true, msg: "当前用户权限不足" })
  // }

  function getemp(date) {
    return new Date(date).getTime()
  }
  try {
    if (role_name == "admin") {
      let users = await Wallet.findAll()
      let profits = await ProfitBoard.findAll()
      if (users) {
        for (let i = 0; i < users.length; i++) {
          // 更新所有用户钱包的fill
          await Wallet.update({ fil_balance: Number(users[i].fil_balance) + Number(reward) }, { where: { wallet_id: users[i].wallet_id } })
        }

        for (let j = 0; j < profits.length; j++) {
          //更新所有用户的收益

          await ProfitBoard.update(
            {
              mining_profit_today: Number(reward),                                            // 挖矿今日收益
              mining_profit_total: Number(profits[j].mining_profit_total) + Number(reward),   // 挖矿总收益,
              mining_profit_history: `${profits[j].mining_profit_history},${reward}`,         // 挖矿历史收益,
              // mining_profit_data: `${profits[j].mining_profit_data},${profits[j].updated_at}` // 历史收益时间
              mining_profit_data: `${profits[j].mining_profit_data},${getemp(profits[j].updated_at)}`,
            },
            { where: { user_id: users[j].user_id } }
          )
        }
      } else {
        return res.send({ err: true, msg: "当前无用户" })
      }
    } else {
      // 后台用户不是admin
      return res.send({ err: true, msg: "当前用户权限不足" })
    }
    return res.send({ err: false, msg: "success" })
  } catch (err) {
    console.log("err", err)
    return res.send({ err: true, msg: "server fail", err_msg: err })
  }

}


// 按照月光宝盒分发奖励
exports.releaseMoon = async function (req, res) {
  try {
    let { every_release_num } = req.body // 每T释放
    let { is_super } = await Admin.findOne({ where: { id: req.user.user_id } })

    if (is_super == "0") {
      return res.send({ err: true, msg: "该用户无权限分发" })
    }

    let result_arry = []
    let users = await User.findAll({
      attributes: ["user_id"],
      include: [
        {
          model: UserMoon,
          attributes: {
            exclude: ["user_id"]
          },
        },
        {
          model: Wallet,
          attributes: ["fil_balance"]
        }
      ]
    })
    // 生成分发对象
    function createMoonReleaseObj(user_id, release_type = "0", release_currency_type = "fil", every_release_num, space) {
      const personal_income_ratio = 0.5 // 个人收益比例
      let release_num = every_release_num * space * personal_income_ratio

      switch (release_type) {
        case "100":
          // 个人收益
          release_num = every_release_num * space * personal_income_ratio
          break;

        case "101":
          // 直推
          release_num = every_release_num * space * personal_income_ratio * 0.1
          break;

        case "102":
          // 间推
          release_num = every_release_num * space * personal_income_ratio * 0.2
          break;

        case "113":
          // 星月等级
          release_num = every_release_num * space * personal_income_ratio * 0.06
          break;

        case "114":
          // 星月平级等级
          release_num = every_release_num * space * personal_income_ratio * 0.02
          break;

        case "115":
          // 星光等级
          release_num = every_release_num * space * personal_income_ratio * 0.12
          break;
      }
      return {
        user_id,
        release_type,
        release_currency_type,
        release_num: Number(Cal.keepTwoDecimalFull(release_num))
      }
    }

    // 过滤不是月光宝盒的用户
    users.filter(item => item.user_moon !== null).forEach(item => {
      let user_obj = {
        user_id: item.user_id,
        fil_balance: item.wallet.fil_balance,
        sum_balance: 0,
        child: []  // 用户的分发订单的数组
      }

      // 个人收益空间
      if (item.user_moon.moon_space > 0) {
        let obj = createMoonReleaseObj(item.user_id, "100", "fil", every_release_num, item.user_moon.moon_space)
        user_obj.sum_balance += obj.release_num
        user_obj.child.push(obj)
      }

      // 直推奖励
      if (item.user_moon.direct_moon_space > 0) {
        let obj = createMoonReleaseObj(item.user_id, "101", "fil", every_release_num, item.user_moon.direct_moon_space)
        user_obj.sum_balance += obj.release_num
        user_obj.child.push(obj)
      }

      // 间接奖励
      if (item.user_moon.direct_num >= 3) {
        let obj = createMoonReleaseObj(item.user_id, "102", "fil", every_release_num, item.user_moon.indirect_moon_space)
        user_obj.sum_balance += obj.release_num
        user_obj.child.push(obj)
      }

      // 月光宝盒奖励
      switch (item.user_moon.member_level) {
        case "1":
          // 星月等级
          let member_moon_obj = createMoonReleaseObj(item.user_id, "113", "fil", every_release_num, item.user_moon.member_moon_space)
          user_obj.sum_balance += member_moon_obj.release_num
          user_obj.child.push(member_moon_obj)

          if (item.user_moon.member_moon_peers_space > 0) {
            // 存在星月团队平级总空间（T）
            let obj = createMoonReleaseObj(item.user_id, "114", "fil", every_release_num, item.user_moon.member_moon_peers_space)
            user_obj.sum_balance += obj.release_num
            user_obj.child.push(obj)
          }

          break;
        case "2":
          // 星光等级

          // 星光节点收益
          let member_light_obj = createMoonReleaseObj(item.user_id, "115", "fil", every_release_num, item.user_moon.member_light_space)
          user_obj.sum_balance += member_light_obj.release_num
          user_obj.child.push(member_light_obj)

          // 星月节点收益
          let obj = createMoonReleaseObj(item.user_id, "113", "fil", every_release_num, item.user_moon.member_moon_space)
          user_obj.sum_balance += obj.release_num
          user_obj.child.push(obj)

          break;
      }
      result_arry.push(user_obj)  // 集合
    })

    let len = result_arry.length
    let result
    for (let i = 0; i < len; i++) {
      let { user_id, fil_balance, sum_balance, child } = result_arry[i]
      result = await sequelize.transaction(t => {
        return Wallet.update({ fil_balance: Number(Cal.keepTwoDecimalFull(Cal.accAdd(fil_balance, sum_balance))) }, { where: { user_id }, transaction: t }).then(update_wallet => {
          if (update_wallet) {
            return MoonRelease.bulkCreate(child, { transaction: t })
          }
        })
      })
    }
    if (result) {
      return res.send({ err: false, msg: "success" })
    } else {
      return res.send({ err: true, msg: "月光宝盒奖励发放失败", result })
    }
  } catch (error) {
    console.log("error", error)
    return res.send({ err: true, msg: "服务器错误", error })
  }
}

