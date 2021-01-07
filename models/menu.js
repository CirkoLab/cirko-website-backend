/**
 * 权限类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("menu", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    /**菜单名称 */
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    /**页面地址 */
    page_url: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    /**控件地址 */
    control_url: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    /**上一级菜单id */
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    /**层级 */
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    /**排序 */
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    /**图标 */
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    /**是否显示：0否 1是*/
    is_show: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    /**是否启用：0禁用 1正常*/
    is_enabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
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