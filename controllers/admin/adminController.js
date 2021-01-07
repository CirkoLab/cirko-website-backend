const { sequelize } = require("../../config/db");
const Admin = sequelize.import("../../models/admin");
const Role = sequelize.import("../../models/role");
const jwt = require('jsonwebtoken');
const config = require("../../config/database")
const uitl = require("../../util/util")

class AdminController {
  // 注册
  async register(req, res, next) {
    try{
      let { loginName, loginPassword, roleName , name} = req.body
      let role = await Role.findOne({
        where: { 
          name: roleName 
        }
      })
      if (role) {
        // console.log("AdminController -> register -> role", role)
        let salt_pwd = await uitl.genSalt(loginPassword)
        let user = await Admin.create({
          name,
          login_name: loginName,
          login_password: salt_pwd,
          role_id: role.id
        })
        if (user) {
          res.send({err:false, msg:"success"})
        }else{
          res.send({ err: true, msg: "register user fail" })
        }
      }else{
        res.send({ err: true, msg: "role is not found" })
      }
    }catch(err){
      // console.log("AdminController -> register -> err", err)
      res.send({ err: true, msg: "AdminController -> register -> err"+err})
    }
  }

  /** 执行登录 */
  async login(req, res, next) {
    try{
      let loginName = req.body.loginName
      let loginPassword = req.body.loginPassword
      const user = await Admin.findOne({
        where: {
          login_name: loginName
        }
      });
      if (!user) {
        return res.send({
          status: 'error',
          msg: "用户名或密码错误！"
        })
      }

      if (user.dataValues.is_enabled == 0) {
        return res.send({
          status: 'error',
          msg: "禁止登录，请联系管理员！"
        })
      }

      let isPasswd = await uitl.comparePassword(loginPassword, user.dataValues.login_password)
      let { name: role_name} = await Role.findOne({ where: { id: user.role_id}})
      if (isPasswd) {
        let playload = {
          type: "manger",
          user_id: user.id,
          name: user.name,
          login_name: user.login_name,
          login_password: user.login_password,
          is_super: user.is_super,
          role_name,
        }
        let token = 'JWT ' + jwt.sign(playload, config.secret);

        // req.session.user = user.dataValues;

        // logger.info("用户：" + loginname + "登录成功！");
        return res.send({
          status: "ok",
          msg: "登录成功！",
          data: {
            token,
            currentAuthority: role_name,
            name: user.name,
          }
        })
      } else {
        return res.send({
          status: 'error',
          msg: "用户名或密码错误！"
        })
      }
    }catch(err){
      console.log("async login err",err)
      res.send({ err:true,status: "error", msg:"manger 未知错误", err_msg:err})
    }
  }

  /** 退出登录 */
  async logout(req, res, next) {
    req.session.destroy(function () {
      res.redirect('/login');
    });
  }

  // 超级管理员修改密码
  reset(req, res, next){
    let { is_super } = req.user
    let { loginName, password} = req.body
    console.log("req.user", req.user)
    if (!is_super == "1"){
      return res.send({ err: true, msg: "此用户无超级权限修改" })
    }

    uitl.genSalt(password).then(pwd=>{
      if (pwd){
        Admin.update({
          login_password: pwd
        }, { where: { login_name: loginName}}).then(result=>{
          return res.send({ err: false, msg:"密码修改更新成功", result})
        }).catch(err=>{
          console.log("AdminController -> 密码修改失败 -> err", err)
          return res.send({err:true,msg:"密码修改更新失败",msg_msg:err})
        })
      }
    }).catch(err=>{
      console.log("AdminController -> 密码加密失败 -> err", err)
      return res.send({err:true,msg:"密码加密失败"})
    })
  }
}

module.exports = new AdminController();