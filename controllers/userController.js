let { sequelize } = require("../config/db");
const User = sequelize.import("../models/user");     // 用户信息
let Wallet = sequelize.import("../models/wallet"); // 钱包信息
let ProfitBoard = sequelize.import("../models/profit_board"); // 推广信息表
let UserRelate = sequelize.import("../models/user_relate"); // 每天收益信息表
const AlterWallet = sequelize.import("../models/alter_wallet");

const redis = require("../util/redisHelper")
const ErrorCodeHandle = require("../config/ErrorCodeHandle")

const Market = sequelize.import("../models/market");

let jwt = require('jsonwebtoken');

const config = require("../config/database");
const util = require("../util/util")
const Cal = require("../util/calculate");

// register type(String): phone 手机注册 or email 邮箱注册
exports.register = function (req, res) {

  let {
    user_name,
    passwd,
    mail_address,
    phone_num,
    code,
    // location_provice,
    // location_city,
    // location_area,
    parent_code,

  } = req.body
  let { type } = req.params


  // 新增新用户
  function addNewUser(code, user_father_id, f_path) {
    if (code == null || code == "" || code == " ") {
      code = "null"
    }

    // 密码加盐
    util.genSalt(passwd).then(async salt_pwd => {
      let inviteCode = util.createInviteCode()
      // save the user
      let a = await User.findAll({
        order: [
          ['number', 'DESC']
        ]
      })
      User.create(
        {
          user_name,
          passwd: salt_pwd,
          parent_code: code,
          invite_code: inviteCode,
          mail_address: mail_address || "",
          phone_num,
          // location_provice,
          // location_city,
          // location_area,
          // market_id: null,
          wallet: {},
          profit_board: {}
        },
        {
          include: [
            { model: Wallet },
            { model: ProfitBoard },
          ],
        }).then(result => {
          if (result) {
            // 注册用户成功
            UserRelate.create({
              user_id: result.user_id,
              user_father_id,
            }).then(relate => {
              if (relate) {
                // 关系依赖建立成功


                let playload = {
                  user_id: result.user_id,
                  user_name: result.user_name,
                  passwd: result.passwd,
                  type: "app"
                }
                let token = jwt.sign(playload, config.secret);
                // let token = jwt.sign(result.toJSON(), config.secret);
                res.send({ err: false, msg: "注册成功", token: 'JWT ' + token });
              }
            }).catch(err => {
              err && res.send({ err: true, msg: err });
            })
          }
        }).catch(err => {
          err && res.send({ err: true, msg: err });
          // callback(true, err);
        })
    })
  }


  switch (type) {
    case "phone":
      // 手机注册
      //compareSmsCode(phone_num, code, result => {
        if (true) {
          // 用户输入手机验证码正确
          User.findOne({ where: { phone_num } }).then(user => {
            if (user) {
              // 存在用户
              user.passwd = req.body.passwd
              res.status(401).send({ err: true, msg: "手机号已注册" })
              return
            } else if (!user && parent_code) {
              // 有效邀请码
              User.findOne({ where: { invite_code: parent_code } }).then(isCode => {
                if (isCode) {
                  addNewUser(parent_code, isCode.user_id, isCode.path)
                } else {
                  res.status(401).send({ err: true, msg: "邀请码不存在" })
                  return
                }
              })
            } else {
              //addNewUser("", 0,0)
               res.status(401).send({ err: true, msg: "无邀请码" })
              return
            }
          }).catch(err => {
            console.log("not found User err", err)
            return res.send({ err: true, msg: "not found User err", err_msg: err })
          })
        } else {
          // 用户输入手机验证码错误
          res.send(result)
        }
     // })
      break;
    case "email":
      // 邮箱注册
      compareEmailCode(mail_address, code, result => {
        if (!result.err) {
          User.findOne({ where: { mail_address, } }).then(user => {
            if (user) {
              // console.log("user:", user);
              user.passwd = req.body.passwd
              res.status(401).send({ err: true, msg: "邮箱已注册" })
            } else if (!user && parent_code) {
              // 有效邀请码
              User.findOne({ where: { invite_code: parent_code, } }).then(isCode => {
                console.log("isCode", isCode)
                if (isCode) {
                  addNewUser(parent_code, isCode.user_id)
                } else {
                  res.status(401).send({ err: true, msg: "邀请码不存在" })
                }
              })
            } else {
              res.status(401).send({ err: true, msg: "无邀请码" })
            }
          }).catch(err => {
            console.log("not found User err", err)
          })
        } else {
          // 用户输入邮箱验证码错误
          res.send(result)
        }
      })
      break;
    case "root":
      addNewUser(parent_code)
      break;
    default:
      res.status(422).send({ err: true, msg: "type参数错误" })
  }

}

// 登陆接口
exports.login = function (req, res) {
  let { phone, email, passwd, type } = req.body
  let user_where = {}
  //console.log(phone);

  switch (type) {
    case "0":
      // 手机登陆
      if (!util.validatePhone(phone)) {
        
        return res.send({ err: true, msg: "手机号码不符合规范" })
      }
      user_where.phone_num = phone
      break;
    case "1":
      // 邮箱登陆
      if (!util.validateEmail(email)) {
        return res.send({ err: true, msg: "邮箱不符合规范" })
      }
      user_where.mail_address = email
      break;
    default:
      return res.status(422).send({ err: true, msg: "type参数错误" })
  }

  User.findOne({
    where: user_where,
  }).then(user => {
    if (user) {
      if (user.status == "0") {
        // 用户账号正常使用
        util.comparePassword(passwd, user.passwd).then(isMatch => {
          // console.log("****************exports.login -> user****************", isMatch)
          if (isMatch) {
            let playload = {
              user_id: user.user_id,
              user_name: user.user_name,
              phone_num: user.phone_num,
              parent_code: user.parent_code,
              invite_code: user.invite_code,
              mail_address: user.mail_address,
              passwd: user.passwd,
              type: "app"
            }
            let token = jwt.sign(playload, config.secret);
            let obj = { err: false, msg: "success", token: 'JWT ' + token, currentAuthority: "" }
            // if (user.market_id) {
            //   // 存在市场团队
            //   if (user.market.market_type == "1") {
            //     obj.currentAuthority = "compony_admin"
            //   } else if (user.market.market_type == "2") {
            //     obj.currentAuthority = "department_admin"
            //   }
            //   return res.json(obj);
            // } else {
            //   // 不存在市场团队
               return res.json(obj);
            // }
          } else {
            return res.status(401).send({ err: true, msg: '密码错误', wrong: 1 });
          }
        }).catch(err => {
          console.log("Compare Password Error", err)
          return res.send({ err: true, msg: "Compare Password Error" });
        })
      } else if (user.status == "1") {
        // 用户账号冻结
        return res.status(403).send({ err: true, msg: '该用户账号已被冻结, 详细问题请联系客服' })
      } else {
        return res.send({ err: true, msg: 'user status fail' })
      }
    } else {
      return res.status(401).send({ err: true, msg: '该用户未注册', wrong: 0 });
    }

  }).catch(err => {
    console.log("login err", err)
    return res.send({ err: true, msg: "login err" })
  })

}

// 根据parent_code用户关系图
exports.createUsertree = function (req, res) {
  // 递归树形结构
  function fn(data, parent_code) {
    let result = [], temp = []
    for (let i in data) {
      if (data[i].parent_code == parent_code) {
        result.push(data[i])
        temp = fn(data, data[i].invite_code)
        if (temp.length > 0) {
          data[i].children = temp   // 不知道为什么数据库里的数据使用有dataValues属性    
        }
      }
    }
    return result
  }


  User.findAll({
    raw: true,
    attributes: ["user_id", "user_name", "parent_code", "invite_code"]
    // attributes: {
    //   exclude: ["user_lamb_num"]
    // }
  }).then(user => {
    let data = fn(user, 0)
    res.send({ err: false, data })

  }).catch(err => {
    console.log("exports.createUsertree -> err", err)
    res.send({ err: true, err_msg: err })
  })

}

// 查询所有用户
exports.queryAllUsdtOrder = function (req, res) {
  // 查询个人信息和钱包 
  let total = {
    usdt_balance: 0,
    fil_balance: 0,
    lamb_balance: 0,
    user_space_num: 0,
  }
  User.findAll({
    attributes: [
      "user_id",
      "user_name",
      "phone_num",
      "mail_address",
      "level",
      "parent_code",
      "invite_code",
      "act_time",
      "created_at",
      "status",
    ],
    order: [
      ['created_at', 'DESC'],
    ],
    raw: true,
    include: [
      {
        model: Wallet,
      },
    ],
  }).then(users => {
    if (users) {
      // 统计
      for (let i = 0; i < users.length; i++) {
        total.usdt_balance += users[i]["wallet.usdt_balance"]
        total.fil_balance += users[i]["wallet.fil_balance"]
        total.lamb_balance += users[i]["wallet.lamb_balance"]
        total.user_space_num += users[i]["wallet.user_space_num"]
      }

      total.usdt_balance = Cal.keepTwoDecimalFull(total.usdt_balance)
      total.fil_balance = Cal.keepTwoDecimalFull(total.fil_balance)
      total.lamb_balance = Cal.keepTwoDecimalFull(total.lamb_balance)
      total.user_space_num = Cal.keepTwoDecimalFull(total.user_space_num)

      res.send({ err: false, total, data: users })
    }
  }).catch(err => {
    console.log("exports.quertUsers -> err", err)
    res.send({ err: true, err_msg: err, total: null })
  })
}

// 根据user_id修改用户FIL空间|USDT余额|FIL余额|LAMB余额
exports.updateUsers = function (req, res) {
  let update_where = {}
  let { user_id, phone_num, usdt_balance, fil_balance, lamb_balance } = req.body

  usdt_balance && (update_where.usdt_balance = usdt_balance)
  fil_balance && (update_where.fil_balance = fil_balance)
  lamb_balance && (update_where.lamb_balance = lamb_balance)

  Wallet.update(update_where, { where: { user_id } }).then(result => {
    result && res.json({ err: false, msg: "success" })
  }).catch(err => {
    console.log("exports.updateUsers -> err", err)
    res.send({ err: true, err_type: "exports.updateUsers -> err", err_msg: err })
  })

}

// 用户个人信息
exports.queryUserInfo = function (req, res) {
  let { user_id } = req.user
  User.findOne({
    attributes: [
      "user_id",
      "user_name",
      "phone_num",
      // "location_city",
      // "location_provice",
      "invite_code",
      "level",
      "act_time",
      "created_at"
    ],
    where: { user_id }
    // include: [{
    //   model: Wallet,
    // }]
  }).then(user => {
    // console.log("exports.queryUserInfo -> user", typeof(user.wallet.usdt_balance))
    // user.wallet.usdt_balance = parseFloat(Cal.keepTwoDecimalFull(user.wallet.usdt_balance))
    // console.log("exports.queryUserInfo -> user", typeof(user.wallet.usdt_balance))
    res.send({ err: false, msg: "success", data: user })
  }).catch(err => {
    console.log(err)
    res.send({ err: false, msg: "exports queryUserInfo -> err", data: err })
  })

}

// 重置用户密码
exports.resetPassword = function (req, res) {
  let { phone, code, email, password, type } = req.body

  // if (!util.validatePhone(phonenum)) {
  //   res.send({ err: true, msg: "手机号码不符合规范" })
  //   return
  // }
  if (type == "0") {
    User.findOne({ where: { phone_num: phone } }).then(isUser => {
      console.log(isUser);
      if (isUser) {
        // compareSmsCode(phone, code, result => {
          // if (result.msg == "success") {
            // 验证码正确
            util.genSalt(password).then(salt_pwd => {
              // 加盐密码
              if (salt_pwd) {
                User.update({ passwd: salt_pwd }, { where: { phone_num: phone } }).then(user => {
                  if (user) {
                    // 重置成功
                    return res.send({ err: false, msg: "success" })
                  } else {
                    return res.send({ err: true, msg: "重置失败" })
                  }
                }).catch(err => {
                  console.log("resetPassword user update fail", err)
                  return res.send({ err: true, msg: "user update fail", err_msg: err })
                })
              }
            })
          // } else {
          //   res.send(result)
          // }
        // })
      } else {
        return res.send({ err: true, msg: "用户不存在" })
      }
    }).catch(err => {
      console.log("resetPassword user update fail", err)
      return res.send({ err: true, msg: "用户不存在", err_msg: err })
    })
  } else if (type == "1") {
    compareEmailCode(email, code, result => {
      if (result.msg == "success") {
        // 验证码正确
        util.genSalt(password).then(salt_pwd => {
          // 加盐密码
          if (salt_pwd) {
            User.update({ passwd: salt_pwd }, { where: { mail_address: email } }).then(user => {
              if (user) {
                // 重置成功
                res.send({ err: true, msg: "success" })
              } else {
                res.send({ err: true, msg: "user not found" })
              }
            }).catch(err => { res.send({ err: false, msg: "user update fail", err_msg: err }) })
          }
        })
      } else {
        res.send(result)
      }
    })
  }
}

function compareSmsCode(phone, code, callback) {
  if (!code) {
    callback({ err: true, msg: "请输入验证码" })
  }

  const KEY = phone
  console.log("compareSmsCode -> KEY", KEY)
  console.log("compareSmsCode -> code", code)
  redis.GetString(KEY).then(code_obj => {
    console.log("compareSmsCode -> code_obj", code_obj)
    if (code_obj) {
      // 验证未过期code
      if (code_obj.code == code) {
        // 输入正确
        callback({ err: false, msg: "success" })
      } else {
        callback({ err: true, msg: "验证码输入错误" })
      }
    } else {
      callback({ err: true, msg: "手机验证码过期, 有效期5分钟以内, 请重新点击获取验证码哦" })
    }
  }).catch(err => {
    callback({ err: true, msg: "smsControler compareSmsCode err", err_msg: err })
  })
}

function compareEmailCode(email, code, callback) {
  if (!util.validateEmail(email)) {
    callback({ err: true, msg: "邮箱地址不符合规范" })
  }

  if (!code) {
    callback({ err: true, msg: "请输入验证码" })
  }

  const KEY = email
  redis.GetString(KEY).then(code_obj => {
    if (code_obj) {
      // 验证未过期code
      if (code_obj.code == code) {
        // 输入正确
        callback({ err: false, msg: "success" })
      } else {
        callback({ err: true, msg: "验证码输入错误" })
      }
    } else {
      callback({ err: true, msg: "邮箱验证码过期, 有效期3分钟以内, 请重新点击获取验证码哦" })
    }
  }).catch(err => {
    callback({ err: true, msg: "smsControler compareEmailCode err", err_msg: err })
  })
}

// PUT 修改用户账号的状态
exports.updateStatus = function (req, res) {
  let { status, user_id, phone_num } = req.body
  let where = {}

  user_id && (where.user_id = user_id)
  phone_num && (where.phone_num = phone_num)

  if (!user_id && !phone_num) {
    return res.send({ err: true, msg: "user_id phone_num 必须选择其中一个传参" })
  }
  // console.log("exports.updateStatus -> req.body", req.body)
  User.update({ status }, { where }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "修改用户账号状态成功" })
    } else {
      console.log("exports.updateStatus -> req.body", req.body)
      return res.send({ err: true, msg: "修改用户账号失败" })
    }
  }).catch(err => {
    console.log("exports.updateStatus -> err", err)
    return res.send({ err: false, msg: "User exports.updateStatus err", msg_err: err })
  })
}

// PUT 修改用户账号的等级
exports.updateLevel = function (req, res) {
  let { level, user_id, phone_num } = req.body
  let where = {}
  let act_time = new Date()

  user_id && (where.user_id = user_id)
  phone_num && (where.phone_num = phone_num)

  if (!user_id && !phone_num) {
    return res.send({ err: true, msg: "user_id phone_num 必须选择其中一个传参" })
  }
  // console.log("exports.updateStatus -> req.body", req.body)
  User.update({ level,act_time }, { where }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "修改用户账号等级成功" })
    } else {
      console.log("exports.updateStatus -> req.body", req.body)
      return res.send({ err: true, msg: "修改用户等级失败" })
    }
  }).catch(err => {
    console.log("exports.updateStatus -> err", err)
    return res.send({ err: false, msg: "User exports.updateStatus err", msg_err: err })
  })
}

// POST 添加修改用户的钱包的金额记录
exports.updateWallet = function (req, res) {
  let { balance, type, note, user_id, phone, sumbit_type } = req.body
  // console.log("exports.updateWal -> req.body", req.body)
  let { user_id: submit_id, name: submit_name } = req.user
  let where = {}

  if (!/usdt|fil|lamb|user_space|moon_space/i.test(type)) {
    return res.send({ err: true, msg: "type 参数错误" })
  }

  // 如果输入空间类型 数值一定正整数
  if ((type == "user_space" || type == "moon_space") && !/^[0-9]*[1-9][0-9]*$/.test(balance)) {
    return res.send({ err: true, msg: "输入的空间一定要大于0的整数" })
  }

  user_id && (where.user_id = user_id)
  phone && (where.phone_num = phone)

  User.findOne({ where }).then(user => {
    if (user) {

      let createObj = {
        submit_id,
        submit_name,
        user_id: user.user_id,
        alter_wallet_type: type,
        alter_wallet_balance: balance,
        alter_wallet_submit_type: sumbit_type,
        alter_wallet_submit_note: note,
        alter_wallet_submit_time: new Date().getTime()
      }

      AlterWallet.create(createObj).then(result => {
        if (result) {
          return res.send({ err: false, msg: "提交修改用户钱包记录成功，等待审核" })
        } else {
          return res.send({ err: true, msg: "提交修改用户钱包记录失败" })
        }
      }).catch(err => {
        console.log("exports.updateWallet -> err", err)
        return res.send({ err: true, msg: "AlterWallet.create fail", msg_err: err })
      })

    } else {
      return res.send({ err: true, msg: "未找到该用户" })
    }

  }).catch(err => {
    console.log("exports.updateWallet -> err", err)
    return res.send({ err: true, msg: "exports.updateWallet User findOne fail", msg_err: err })

  })
}

// GET 获取所有修改用户钱包的金额记录
exports.queryAlertWalletList = function (req, res) {
  AlterWallet.findAll({
    include: [
      {
        attributes: ["user_name"],
        model: User
      }
    ],
    order: [
      ["alter_wallet_submit_time", "DESC"]
    ]
  }).then(list => {
    if (list) {
      let data = JSON.parse(JSON.stringify(list)).map(item => {
        Object.assign(item, item.user)
        delete item.user
        return item
      })
      return res.send({ err: false, msg: "success", data: data })
    } else {
      return res.send({ err: true, msg: "获取所有修改用户钱包的金额记录失败" })
    }
  }).catch(err => {
    console.log("exports.queryAlertWalletList -> err", err)
    return res.send({ err: true, msg: "exports.queryAlertWalletList AlterWallet findAll fail", msg_err: err })
  })
}

// PUt 审核修改用户钱包的金额记录
// 只有超级权限的用户才可以admin.is_super == "1"
exports.updateAlterWalletStatus = function (req, res) {

  let { alter_wallet_id, status } = req.body
  let { user_id: admin_id, name: admin_name, is_super } = req.user
  let update_data = {}

  if (is_super !== "1") {
    return res.send({ err: true, msg: "此用户无超级权限修改" })
  }


  AlterWallet.findOne({ where: { alter_wallet_id } }).then(record => {
    if (record) {
      // console.log("w.alter_wallet_type ", record.alter_wallet_type)
      if (record.alter_wallet_status == "1" || record.alter_wallet_status == "2") {
        return res.send({ err: true, msg: "已经审核过该钱包记录, 请刷新一下" })
      }
      switch (status) {
        case "1":
          // 审核通过

          Wallet.findOne({ where: { user_id: record.user_id } }).then(wal => {
            if (wal) {
              if (record.alter_wallet_type == "usdt") {
                if (record.alter_wallet_submit_type == "add") {
                  update_data.usdt_balance = parseFloat(Cal.accAdd(wal.usdt_balance, record.alter_wallet_balance))

                } else if (record.alter_wallet_submit_type == "sub") {
                  update_data.usdt_balance = parseFloat(Cal.accSub(wal.usdt_balance, record.alter_wallet_balance))
                }

              } else if (record.alter_wallet_type == "fil") {
                if (record.alter_wallet_submit_type == "add") {
                  update_data.fil_balance = parseFloat(Cal.accAdd(wal.fil_balance, record.alter_wallet_balance))

                } else if (record.alter_wallet_submit_type == "sub") {
                  update_data.fil_balance = parseFloat(Cal.accSub(wal.fil_balance, record.alter_wallet_balance))
                }

              } else if (record.alter_wallet_type == "lamb") {
                if (record.alter_wallet_submit_type == "add") {
                  update_data.lamb_balance = parseFloat(Cal.accAdd(wal.lamb_balance, record.alter_wallet_balance))

                } else if (record.alter_wallet_submit_type == "sub") {
                  update_data.lamb_balance = parseFloat(Cal.accSub(wal.lamb_balance, record.alter_wallet_balance))
                }

              } else if (record.alter_wallet_type == "user_space") {
                // 修改用户空间
                if (record.alter_wallet_submit_type == "add") {
                  update_data.user_space_num = parseInt(wal.user_space_num + record.alter_wallet_balance)

                } else if (record.alter_wallet_submit_type == "sub") {
                  update_data.user_space_num = parseInt(wal.user_space_num - record.alter_wallet_balance)
                }
              }

              sequelize.transaction(t => {
                // 在这里链接您的所有查询。 确保你返回他们。
                return AlterWallet.update({
                  admin_id,
                  admin_name,
                  alter_wallet_confirm_time: new Date().getTime(),
                  alter_wallet_status: status
                }, { where: { alter_wallet_id }, transaction: t }).then(result => {
                  if (result) {
                    // 用户钱包更新
                    return Wallet.update(update_data, { where: { user_id: record.user_id }, transaction: t })
                  }
                })
              }).then(function (result) {
                // console.log("result", result)
                // 事务已被提交
                // result 是 promise 链返回到事务回调的结果
                return res.send({ err: false, msg: "success", result })
              }).catch(function (err) {
                // 事务已被回滚
                // err 是拒绝 promise 链返回到事务回调的错误
                console.log("updateAlterWalletStatus sequelize.transaction err", err)
                return res.send({ err: true, msg: "updateAlterWalletStatus sequelize.transaction", err_msg: err })
              });

            } else {
              return res.send({ err: true, msg: "查询不到用户的钱包" })
            }

          }).catch(err => {
            console.log("exports.updateAlterWalletStatus -> err", err)
            return res.send({ err: true, msg: "查询不到用户的钱包", msg_err: err })
          })
          break;
        case "2":
          // // 审核不通过
          AlterWallet.update({
            admin_id,
            admin_name,
            alter_wallet_confirm_time: new Date().getTime(),
            alter_wallet_status: status,
          }, { where: { alter_wallet_id } }).then(result => {
            if (result) {
              return res.send({ err: false, msg: "success" })
            } else {
              return res.send({ err: true, msg: "fail" })
            }
          }).catch(err => {
            console.log("exports.updateAlterWalletStatus -> err", err)
            return res.send({ err: true, msg: "修改钱包记录审核更新失败" })
          })
          break;
        default:
          return res.send({ err: true, msg: "type 参数错误" })
      }

    } else {
      return res.send({ err: true, msg: "AlterWallet.findOne err" })
    }
  }).catch(err => {
    console.log("AlterWallet.findOne err", err)
    return res.send({ err: true, msg: " updateAlterWalletStatus AlterWallet.findOne err", err_msg: err })
  })
}

exports.updatePhone = function (req, res) {
  let { oldPhone, newPhone, code } = req.body
  // if (!util.validatePhone(oldPhone)) {
  //   return res.send({ err: true, msg: "原来手机号不符合规范" })
  // }

  // if (!util.validatePhone(newPhone)) {
  //   return res.send({ err: true, msg: "新手机号不符合规范" })
  // }
  User.findOne({ where: { phone_num: newPhone } }).then(newUser => {
    if (newUser) {
      return res.send({ err: true, msg: "新手机号已注册过" })
    } else {
      // 新手机号未注册
      if (req.user.phone_num == oldPhone) {
        compareSmsCode(newPhone, code, result => {
          if (result.msg == "success") {
            // 验证码正确
            User.update({ phone_num: newPhone }, { where: { user_id: req.user.user_id } }).then(up => {
              if (up) {
                return res.send({ err: false, msg: "修改手机号成功" })
              }
            }).catch(err => {
              console.log("exports.updatePhone -> err", err)
              return res.send({ err: true, msg: "exports.updatePhone User.update", msg_err: err })
            })
          } else {
            return res.send(result)
          }
        })

      } else {
        return res.send({ err: true, msg: "原来手机号错误" })
      }
    }
  }).catch(error => {
    console.log("exports.updatePhone -> error", error)
    return res.send({ err: true, msg: "updatePhone server error", error })
  })

}

// GET 查询个人用户信息
exports.getUserInfo = function (req, res) {
  let { user_id } = req.query

  User.findOne({
    attributes: ["user_id", "user_name"],
    where: { user_id },
    order: [
      ['created_at', 'DESC']
    ]
  })
    .then(result => {
      if (result) {
        return res.send({ err: false, msg: "success", data: result })
      } else {
        return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
      }
    }).catch(err => {
      console.log("exports.createMarket ERR_NOT_FOUND_USER", err)
      return res.send(ErrorCodeHandle.ERR_NOT_FOUND_USER)
    })

}

exports.createPath = function (req, res) {
  // 递归树形结构
  function fn(data, parent_code) {
    let result = [], temp = []
    for (let i in data) {
      if (data[i].parent_code == parent_code) {
        result.push(data[i])
        temp = fn(data, data[i].invite_code)
        if (temp.length > 0) {
          data[i].children = temp   // 不知道为什么数据库里的数据使用有dataValues属性    
        }
      }
    }
    return result
  }

  function pathData(data, parent_code, number) {
    let result = [], temp = []
    for (let i in data) {
      if (data[i].parent_code == parent_code) {
        result.push(data[i])

        if (data[i].parent_code == "0") {
          User.update({ path: `/${data[i].number}` }, { where: { user_id: data[i].user_id } }).then(res => {
            if (res) {
              return
            }
          }).catch(err => {
            console.log("pathData -> err", err)
          })
        }

        if (!data[i].path) {
          data[i].path = `/${data[i].number}`;
        }

        if (number !== undefined) {
          data[i].path = `${number}${data[i].path}`;
          User.update({ path: data[i].path }, { where: { user_id: data[i].user_id } }).then(res => {
            if (res) {
              return
            }
          }).catch(err => {
            console.log("pathData -> err", err)
          })
        }
        temp = pathData(data, data[i].invite_code, data[i].path)
        if (temp.length > 0) {
          data[i].children = temp
        }
      }
    }
    return result
  }

  User.findAll({
    order: [
      ['created_at', 'DESC']
    ],
    raw: true,
    attributes: ["user_id", "user_name", "parent_code", "invite_code", "number", "path", "created_at"]
    // attributes: {
    //   exclude: ["user_lamb_num"]
    // }
  }).then(user => {
    let data = pathData(user, "0")
    // let data = fn(user, "0")
    res.send({ err: false, data })
    
    // let data = fn(user, "0")
    // res.send({ err: false, data })
    //   if(req.query.type == "1"){
    //   //   // 1号矿用户路径 moon
    //   // let time = new Date('2020-05-15 00:00').getTime() 
    //   // let data = pathData(user, "0")

    //   return res.send("Aa")
    // } else if (req.query.type == "2"){
    //   // 2号矿用户路径
    //   // let data = fn(user, "0")
    //   let data = pathData(user, "0")
    //   res.send({ err: false, data })
    // }

  }).catch(err => {
    console.log("exports.createUsertree -> err", err)
    res.send({ err: true, err_msg: err })
  })
}

// PUT 修改用户信息
exports.updateUserInfo = function (req, res) {
  let = { user_name } = req.body
  let { user_id } = req.user
  User.update({ user_name }, { where: { user_id } }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "success", data: { user_name } })
    } else {
      return res.send({ err: true, msg: "修改用户呢称失败" })
    }
  }).catch(err => {
    console.log("exports.updateUserInfo -> err", err)
    return res.send(ErrorCodeHandle.ERR_SERVER)
  })
}

// 后台直接修改APP用户手机号
exports.alterAppUserPhone = async function (req, res) {
  let { oldPhone, newphone } = req.body
  try {
    let user = await User.findOne({ where: { phone_num: oldPhone } })
    if (!user) {
      return res.send({ err: true, msg: "数据库中未找到该用户的手机号" })
    }
    let user_update = await user.update({ phone_num: newphone }, { where: { phone_num: user.phone_num } })
    if (user_update) {
      return res.send({ err: false, msg: "success" })
    }
  } catch (error) {
    return res.send({ err: true, msg: "server fail", error })
  }

}

// 修改高级客户经理 0-关,1-开
exports.updateSeniorManager = function (req, res) {
  let { user_id, is_senior_manager } = req.body

  if (is_senior_manager !== "0" && is_senior_manager !== "1") {
    return res.send({ err: true, msg: "参数错误" })
  }

  if (req.user.role_name !== "admin") {
    return res.send({ err: true, msg: "你的权限不足" })
  }

  User.update({ is_senior_manager }, { where: { user_id } }).then(result => {
    if (result) {
      return res.send({ err: false, msg: "success" })
    }
  }).catch(error => {
    console.log("exports.updateSeniorManager -> error", error)
    return res.send({ err: true, msg: "服务器错误" })
  })

}