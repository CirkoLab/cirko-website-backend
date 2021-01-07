/**
 * 提现配置类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("withdraw", {
    withdraw_id: {
      // 递增id设置
      type: DataTypes.INTEGER,
      allowNull: false, //非空
      primaryKey: true, //主键
      autoIncrement: true, //自动递增
    },
    withdraw_type: {
      comment: "配置货币类型",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "", // usdt lamb fil 
    },
    withdraw_charge_num: {
      comment: "配置手续费",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    withdraw_min_num: {
      comment: "配置提现最低额度",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    // classMethods: classMethods,
    comment: "提现手续费配置",
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}
