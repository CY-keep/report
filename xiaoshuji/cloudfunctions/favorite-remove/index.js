/**
 * favorite-remove 云函数
 * 取消收藏
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

  try {
    // 查找收藏记录
    const { data: existing } = await db.collection('user_favorites')
      .where({
        userId: openid,
        targetId,
        targetType
      })
      .get();

    if (!existing || existing.length === 0) {
      return {
        success: false,
        message: '未收藏',
        isFavorite: false
      };
    }

    // 删除收藏记录
    await db.collection('user_favorites').doc(existing[0]._id).remove();

    return {
      success: true,
      message: '取消收藏成功',
      isFavorite: false
    };
  } catch (err) {
    console.error('favorite-remove error:', err);
    return {
      success: false,
      message: '取消收藏失败：' + err.message
    };
  }
};
