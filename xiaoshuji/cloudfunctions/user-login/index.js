/**
 * user-login 云函数
 * 用户授权登录，数据同步到云数据库
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-19
 *
 * 微信登录流程参考：
 * https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext();

  // openid 由微信云开发自动提供
  const openid = wxContext.OPENID;
  const { avatarUrl, nickName } = event;

  // 参数校验
  if (!openid) {
    return {
      success: false,
      message: '缺少用户身份标识'
    };
  }

  try {
    // 查询用户是否已存在
    const { data: existingUser } = await db.collection('users')
      .where({ openid })
      .get();

    if (existingUser && existingUser.length > 0) {
      // 用户已存在，更新信息
      await db.collection('users').doc(existingUser[0]._id).update({
        data: {
          avatarUrl: avatarUrl || existingUser[0].avatarUrl,
          nickName: nickName || existingUser[0].nickName,
          updateTime: db.serverDate()
        }
      });

      return {
        success: true,
        message: '登录成功',
        userId: existingUser[0]._id,
        isNew: false
      };
    } else {
      // 新用户，创建记录
      const { id: userId } = await db.collection('users').add({
        data: {
          openid,
          avatarUrl: avatarUrl || '',
          nickName: nickName || '微信用户',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });

      return {
        success: true,
        message: '注册成功',
        userId,
        isNew: true
      };
    }
  } catch (err) {
    console.error('user-login error:', err);
    return {
      success: false,
      message: '登录失败：' + err.message
    };
  }
};
