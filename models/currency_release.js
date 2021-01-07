/**
 * 货币释放类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("currency_release", {
    currency_release_id: {
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
    currency_release_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "fil"
    },
    currency_release_num: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    currency_release_total_space: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    comment: "货币释放类",
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}