/**
 * 推广奖励订单表
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("reward_order", {
    reward_order_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
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
    reward_user_id: {
      comment: "购买置换空间的用户id",
      type: DataTypes.STRING,
      allowNull: false, //非空，
    },
    reward_parent_user_id: {
      comment: "奖励给上级用户id",
      type: DataTypes.STRING,
      defaultValue:"",
    },
    reward_space_order_id: {
      comment: "审核通过的置换空间订单id",
      type: DataTypes.STRING,
      allowNull: false, //非空
    },
    reward_num: {
      comment: "奖励数量",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    reward_type: {
      comment: "奖励类型",
      type: DataTypes.STRING,
      allowNull: false, //非空，
      defaultValue: "usdt"
    },
    reward_order_status_note: {
      comment: "奖励订单审核备注",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    reward_order_status: {
      comment: "审批状态(0:已提交，1:已通过，2：未通过，3:已取消)",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    reward_order_confirm_time: {
      comment: "审核用户经历订单时间",
      type: DataTypes.DATE(),
      defaultValue: null
    },
  }, {
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "推广面板表",
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