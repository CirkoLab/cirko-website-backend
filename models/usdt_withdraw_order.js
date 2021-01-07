/**
 * usdt提现信息类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("usdt_withdraw_order", {
    usdt_withdraw_order_id: {  // 订单编号
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    user_id :{  // 用户编号
      type: DataTypes.STRING,
      allowNull: false
    },
    admin_id: {
      comment: "审批人id",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    admin_name: {
      comment: "审批人名字",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    usdt_withdraw_num: {
      comment:"usdt提现数量",
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    usdt_charge: {
      comment: "usdt提现手续费",
      type: DataTypes.DOUBLE,
      defaultValue: 0
    },
    usdt_withdraw_order_submmit_time:{ 
      comment:"usdt提现申请提交时间",
      type: DataTypes.DATE(),
      allowNull: false
    },
    usdt_withdraw_order_status:{
      comment:"审批状态(0:已提交,1:已通过,2：未通过,3:已取消)",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:"0"
    },
    usdt_withdraw_order_confirm_time:{
      comment:"usdt提现确认时间",
      type: DataTypes.DATE(),
    },
    usdt_withdraw_address:{
      comment:"usdt提现地址",
      type: DataTypes.STRING,
      allowNull: false    
    },
    usdt_withdraw_order_status_note: {
      comment: "审核备注",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    }
  }, {
    underscored: true, //额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "usdt提现信息类",
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