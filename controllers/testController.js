let { sequelize } = require("../config/db");
const User = sequelize.import("../models/user");     // 用户信息
const util = require("../util/util")
// 测试 重置手机号的密码
exports.testResetPassword = function (req, res) {
  let { phone, code, email, password, type } = req.body

  // if (!util.validatePhone(phonenum)) {
  //   res.send({ err: true, msg: "手机号码不符合规范" })
  //   return
  // }
  if (type == "0") {
    User.findOne({ where: { phone_num: phone } }).then(isUser => {
      if (isUser) {
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