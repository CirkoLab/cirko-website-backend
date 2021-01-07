/**
 * 修改钱包类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("alter_wallet", {
    alter_wallet_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    user_id: {
      comment: "用户编号",
      type: DataTypes.STRING,
      allowNull: false
    },
    alter_wallet_balance: {
      comment: "修改钱包余额",
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    alter_wallet_type: {
      comment: "修改钱包余额类型(usdt,fil,lamb, user_space, moon_space)",
      type: DataTypes.STRING,
      defaultValue: ""
    },
    submit_id:{
      comment: "提交人id",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    submit_name:{
      comment: "提交人id",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
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
    alter_wallet_submit_time: {
      commit: "修改钱包余额提交时间",
      type: DataTypes.DATE(),
      allowNull: false
    },
    alter_wallet_status: {
      comment: "审批状态(0:已提交，1:已通过，2：未通过，3:已取消)",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0"
    },
    alter_wallet_submit_type:{
      comment: "修改余额的类型加减",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    alter_wallet_submit_note: {
      comment: "提出修改钱包余额记录备注",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    alter_wallet_confirm_time: {
      comment: "修改钱包余额审核时间",
      type: DataTypes.DATE(),
    },
  }, {
    underscored: true, // 额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "修改钱包类",
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