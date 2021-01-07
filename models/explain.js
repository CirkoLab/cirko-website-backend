/**
 * 规则说明内容类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("explain", {
    id: {
      // 递增id设置
      type: DataTypes.INTEGER,
      allowNull: false, //非空
      primaryKey: true, //主键
      autoIncrement: true, //自动递增
    },
    type: {
      comment: "规则说明类型 0-充值申请规则 1-优惠说明",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    content: {
      comment: "规则说明内容",
      type: DataTypes.STRING(2048),
      allowNull: false,
      defaultValue: "",
    },
  }, {
    comment: "规则说明内容类",
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    // classMethods: classMethods,
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}
