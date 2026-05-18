/**
 * favorite-add 云函数
 * 添加收藏
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

  const { targetId, targetType } = event;

  // 参数校验
  if (!openid || !targetId || !targetType) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  // targetType 必须是 heritage 或 scenic
  if (!['heritage', 'scenic'].includes(targetType)) {
    return {
      success: false,
      message: '收藏类型无效'
    };
  }

  try {
    // 检查是否已经收藏
    const { data: existing } = await db.collection('user_favorites')
      .where({
        userId: openid,
        targetId,
        targetType
      })
      .get();

    if (existing && existing.length > 0) {
      return {
        success: false,
        message: '已收藏',
        isFavorite: true
      };
    }

    // 添加收藏
    const { id } = await db.collection('user_favorites').add({
      data: {
        userId: openid,
        targetId,
        targetType,
        createTime: db.serverDate()
      }
    });

    return {
      success: true,
      message: '收藏成功',
      favoriteId: id,
      isFavorite: true
    };
  } catch (err) {
    console.error('favorite-add error:', err);
    return {
      success: false,
      message: '收藏失败：' + err.message
    };
  }
};
