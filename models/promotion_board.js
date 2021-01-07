/**
 * 推广面板表
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("promotion_board", {
    promotion_board_id: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV1, // 根据时间戳生成唯一
      allowNull: false, //非空
      primaryKey: true //主键
    },
    user_id: {
      type: DataTypes.STRING,
      field: "user_id",
      comment: "用户id",
    },
    promotion_space: {
      comment: "推广空间",
      type: DataTypes.INTEGER,
      defaultValue:0,
      allowNull: false
    },
    promotion_people: {
      comment: "推广人数",
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    promotion_profit: {
      comment: "推广收益",
      type: DataTypes.DOUBLE,
      defaultValue: 0,
      allowNull: false
    },
    promotion_self_code: {
      comment: "自身推广码",
      type: DataTypes.STRING,
      defaultValue:"",
      allowNull: false
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