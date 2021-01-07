/**
 * 钱包信息类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("wallet", {
    wallet_id: {  
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
    usdt_balance:{ // usdt余额
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0     
    },
    fil_balance:{  // fil余额
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,     
    },
    lamb_balance:{  // lamb余额
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,    
    },
    user_space_num: { // 置换空间数量
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    // moon_space: {
    //   comment: "月光宝盒空间",
    //   type: DataTypes.DOUBLE,
    //   defaultValue: 0
    // },
    // moon_relate_space: {
    //   comment: "月光宝盒各种奖励制度造成的等效空间",
    //   type: DataTypes.DOUBLE,
    //   defaultValue: 0
    // },
  }, {
    underscored: true, //额外字段以下划线来分割
    // createdAt: "created_at",
    // updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    classMethods: classMethods,
    comment: "钱包信息类",
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