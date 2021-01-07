
let { sequelize } = require("../config/db");
const smsConfig = require("../config/smsConfig")
const Core = require('@alicloud/pop-core');
const utiltools = require("../util/util")
const redis = require("../util/redisHelper")
const User = sequelize.import("../models/user");     // 用户信息
const mailer = require("../util/mailer")


class smsControler {

  async sendSMSCode(req, res, next) {
    let { phonenum,codeType } = req.body
    try {
      if (!utiltools.validatePhone(phonenum)) {
        res.send({ err: true, msg: "手机号码不符合规范" })
        return
      }
      // 生成短信码
      let code = utiltools.RangeCode(6)

      // redis_key
      let KEY = phonenum
      let TemplateCode = "SMS_203015461" // 验证码模板
      switch (codeType){
        case "0":
          TemplateCode = "SMS_203015461" // 用户注册验证码
          break;
        case "1":
          TemplateCode = "SMS_204747124" // 置换订单的验证码
          break;
        case "2":
          TemplateCode = "SMS_204895041" // 提币申请验证码
          break;
        case "3":
          TemplateCode = "SMS_203015460" // 修改密码验证码
          break;
        case "4":
          TemplateCode = "SMS_203015459" // 信息变更验证码
          break;
        default:
          TemplateCode = "SMS_203015464";  // 身份验证验证码
      }
      //初始化sms_client配置
      var smsClient = new Core({
        accessKeyId: smsConfig.accessKeyId,
        accessKeySecret: smsConfig.accessKeySecret,
        endpoint: smsConfig.endpoint,
        apiVersion: smsConfig.apiVersion
      })

      // 限制用户发送短信频率
      let redisTemp = await redis.GetPttl(KEY)
      if (redisTemp && new Date().getTime() - redisTemp < 1000) {
        console.log("获取Redis缓存手机时间:" + redisTemp);
        res.send({ err: true, msg: "用户发送短信过于频繁！" });
        return;
      }

      // 短信请求参数
      let params = {
        "RegionId": smsConfig.RegionId,
        "PhoneNumbers": phonenum,
        "SignName": smsConfig.SignName,
        "TemplateCode": TemplateCode,
        "TemplateParam": `{ \"code\":\"${code}\"}`
      }

      // post请求
      let requestOption = {
        method: 'POST'
      };

      // 发送短信
      smsClient.request('SendSms', params, requestOption).then(function (result) {
        let { Code } = result;
        // console.log("smsControler -> sendSMSCode -> result", result)
        if (Code === 'OK') {
          //处理返回参数
          let codeobj = { code, phonenum, expireTime: ((new Date()).getTime() + 5 * 60 * 1000) };
          req.codeobj = codeobj

          // 设置验证码过期时间3min
          redis.SetString(KEY, codeobj, 5 * 60)

          res.send({ err: false, data: null, msg: "success" });
        } else {
          res.send({ err: true, data: { phonenum, code }, msg: "smsClient request params fail" });
        }
      }).catch(err => {
        console.log("smsControler -> SendSMSCode request -> err", err)
        res.send({ err: true, data: { phonenum, code }, msg: "smsClient request fail", err_msg: err });
      })

    } catch (Exception) {
      console.log("Exception: ", Exception);
      res.send({ err: true, data: "Exception", err_msg: Exception });
    }
  };

  async sendEmailCode(req, res, next) {
    try {
      const { email } = req.body
      if (!utiltools.validateEmail(email)) {
        return res.send({ err: true, msg: "邮箱不符合规范" })
      }

      // 生成短信码
      let code = utiltools.RangeCode(6)

      // redis_key
      let KEY = email

      // 限制用户发送短信频率
      let redisTemp = await redis.GetPttl(KEY)
      if (redisTemp && new Date().getTime() - redisTemp < 1000) {
        console.log("获取Redis缓存邮箱时间:" + redisTemp);
        res.send({ err: true, msg: "用户发送邮箱过于频繁！" });
        return;
      } 
      mailer.sendMail(email,code).then(result => {
        if (result == "250 OK: queued as.") {
          //处理返回参数
          let codeobj = { code, email, expireTime: ((new Date()).getTime() + 5 * 60 * 1000) };
          req.codeobj = codeobj

          // 设置验证码过期时间3min
          redis.SetString(KEY, codeobj, 5 * 60)

          res.send({ err: false, data: null, msg: "success", result});
        } else {
          res.send({ err: true, data: { email, code }, msg: "smsClient request params fail" });
        }        
      }).catch(err => {
        console.log("sendEmailCode -> err", err)
        res.send({ err: true, data: { email, code }, msg: "emailClient request fail", err_msg: err });
      })
    } catch (err) {
      console.log("sendEmailCode -> err", err)
      return res.send({ err: true, msg: "server fail", err_msg: err })
    }

  }

  compareSmsCode(req, res, next) {
    let { phonenum, code } = req.body
    if (!utiltools.validatePhone(phonenum)) {
      res.send({ err: true, msg: "手机号码不符合规范" })
      return
    }

    if (!code) {
      res.send({ err: true, msg: "请输入验证码" })
      return
    }

    const KEY = phonenum
    redis.GetString(KEY).then(code_obj => {
      if (code_obj) {
        // 验证未过期code
        if (code_obj.code == code) {
          // 输入正确
          res.send({ err: false, msg: "success" })
        } else {
          res.send({ err: true, msg: "验证码输入错误" })
        }
      } else {
        res.send({ err: true, msg: "手机验证码过期, 有效期5分钟以内, 请重新点击获取验证码哦" })
      }
    }).catch(err => {
      res.send({ err: true, msg: "smsControler compareSmsCode err", err_msg: err })
    })
  }

  compareEmailCode(req, res, next) {
    let { email, code } = req.body
    if (!utiltools.validateEmail(email)) {
      res.send({ err: true, msg: "邮箱不符合规范" })
      return
    }

    if (!code) {
      res.send({ err: true, msg: "请输入验证码" })
      return
    }

    const KEY = email
    redis.GetString(KEY).then(code_obj => {
      if (code_obj) {
        // 验证未过期code
        if (code_obj.code == code) {
          // 输入正确
          res.send({ err: false, msg: "success" })
        } else {
          res.send({ err: true, msg: "验证码输入错误" })
        }
      } else {
        res.send({ err: true, msg: "邮箱验证码过期, 有效期5分钟以内, 请重新点击获取验证码哦" })
      }
    }).catch(err => {
      res.send({ err: true, msg: "smsControler compareEmailCode err", err_msg: err })
    })
  }


  // SetSMSArray(smsmodel) {
  //   // 定义全局存手机号和验证码
  //   var i = global.SMScodearray.length;
  //   let isexist = false;
  //   while (i--) {
  //     if (global.SMScodearray[i].getPhonum() == smsmodel.getPhonum()) {
  //       global.SMScodearray[i].setTimes(global.SMScodearray[i].getTimes() + 1);
  //       global.SMScodearray[i].setCode(smsmodel.getCode());
  //       global.SMScodearray[i].setExpireTime(smsmodel.getExpireTime());
  //       isexist = true;
  //     }
  //   }
  //   if (!isexist) {
  //     global.SMScodearray.push(smsmodel);
  //   }
  //   //动态存手机号
  //   redis.SetString(smsmodel.getPhonum(), new Date().getTime())
  // }
}



module.exports = new smsControler();