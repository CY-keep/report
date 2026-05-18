/**
 * checkin-submit 云函数
 * 提交打卡记录
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-19
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const {
    targetId,
    targetType,
    targetName,
    targetCover,
    images = [],
    note = '',
    location
  } = event;

  // 参数校验
  if (!openid) {
    return {
      success: false,
      message: '缺少用户身份标识'
    };
  }

  if (!targetId || !targetType) {
    return {
      success: false,
      message: '缺少打卡目标信息'
    };
  }

  // targetType 必须是 heritage 或 scenic
  if (!['heritage', 'scenic'].includes(targetType)) {
    return {
      success: false,
      message: '打卡类型无效'
    };
  }

  try {
    // 添加打卡记录
    const { id: checkinId } = await db.collection('checkin').add({
      data: {
        userId: openid,
        targetId,
        targetType,
        targetName: targetName || '',
        targetCover: targetCover || '',
        images,
        note,
        location: location || null,
        createTime: db.serverDate()
      }
    });

    return {
      success: true,
      message: '打卡成功',
      checkinId
    };
  } catch (err) {
    console.error('checkin-submit error:', err);
    return {
      success: false,
      message: '打卡失败：' + err.message
    };
  }
};
