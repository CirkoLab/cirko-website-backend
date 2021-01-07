/**
 * 用户类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("user", {
    user_id: {  
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
      
      // 递增id设置
      // type: DataTypes.INTEGER,
      // allowNull: false, //非空
      // primaryKey: true //主键
      // autoIncrement: true, //自动递增
    },
    user_name:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:"默认昵称"      
    },
    name:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:""      
    },
    passwd: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passwd_2: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:"",
    },
    mail_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone_num: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location_coutry:{
      comment: "国家",
      type: DataTypes.STRING,
      defaultValue:"中国"
    },
    location_provice: {
      comment: "省级",
      type: DataTypes.STRING,
    },
    location_city: {
      comment:"市级",
      type: DataTypes.STRING,
    },
    location_area: {
      comment:"县级",
      type: DataTypes.STRING,
    },
    parent_code: {
      comment: "父级的邀请码",
      type: DataTypes.STRING,
      allowNull: true,  
    },
    invite_code: {
      comment: "自身的邀请码",
      type: DataTypes.STRING,
      allowNull: false
    },
    level:{
      comment:"等级",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:"未激活"
    },
    is_active:{
      comment:"是否激活",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:"0"
    },
    act_time:{
      comment: "激活时间",
      type: DataTypes.DATE(),
    },
    status:{
      comment: "用户状态", // 0正常使用 1冻结账号
      type: DataTypes.STRING,
      defaultValue:"0"      
    },
    number: {
      comment: "号码",
      type: DataTypes.INTEGER,
      defaultValue:null
    },
    path: {
      comment: "该节点的路径",
      type: DataTypes.STRING,
      defaultValue: ""
    },
    login_time:{
      comment: "登录时间",
      type: DataTypes.DATE,
      defaultValue: null
    },
    is_senior_manager:{
      comment: "高级客户经理 0-关,1-开",
      type: DataTypes.STRING,
      defaultValue: "0"
    }
  }, {
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "用户信息类",
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}

//静态方法
const classMethods = {
  //根据id查询
  getUserById: function (id) {
    return this.findById(id);
  },
  //获取所有
  getUsers: function (options) {
    return this.findAll(options);
  },
  //根据id更新数据
  updateUserById: function (values, id) {
    return this.update(values, {
      where: {
        id: id
      }
    });
  },
  //根据id删除数据
  deleteById: function (id) {
    return this.destroy({
      where: {
        id: id
      }
    })
  }
}