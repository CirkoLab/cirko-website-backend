/**
 * 月光宝盒用户类
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("user_moon", {
    user_moon_id: {
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
    user_id: {
      comment: "用户ID",
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:""
    },
    direct_num: {
      comment: "直推有效人数(个)",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue:0
    },
    relate_total_space: {
      comment: "关联总空间(T)",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    member_level: {
      comment: "会员等级(0-普通会员, 1-星月, 2-星光, 3-星宝, 4-星河)",
      type: DataTypes.STRING,
      defaultValue: "0"
    },
    moon_space: {
      comment: "个人总空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    direct_moon_space: {
      comment: "直推空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    indirect_moon_space: {
      comment: "间推空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    member_moon_space: {
      comment: "星月团队总空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    member_moon_peers_space: {
      comment: "星月团队平级总空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    member_light_space: {
      comment: "星光团队总空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    member_treasure_space: {
      comment: "星宝团队总空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    member_river_space: {
      comment: "星河团队总空间（T）",
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    comment: "月光宝盒用户类",
    underscored: true, //额外字段以下划线来分割
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamps: false, //取消默认生成的createdAt、updatedAt字段
    freezeTableName: true, // Model 对应的表名将与model名相同
    //静态方法，即user模型自带的方法
    // paranoid: true      //虚拟删除
    //实例方法
    // instanceMethods: instanceMethods
  });
}