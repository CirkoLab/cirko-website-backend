/**
 *  产品套餐
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("product", {
    product_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    name: {
      comment: "产品每年T",
      type: DataTypes.DOUBLE,
      defaultValue: 0
    },
    price: {
      comment: "产品价格",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    params:{
      comment: "产品参数",
      type: DataTypes.STRING,
      defaultValue: "0,0,0"
    },
    term: {
      comment: "期限",
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 3
    },
  }, {
    comment: "产品套餐",
    underscored: true, //额外字段以下划线来分割
    createdAt: "create_time",
    updatedAt: "updated_at",
    // timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}