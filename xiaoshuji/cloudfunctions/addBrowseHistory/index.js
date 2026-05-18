/**
 * addBrowseHistory 云函数
 * 添加浏览历史（去重：同一用户同一目标只保留最新记录）
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
  if (!openid) {
    return {
      success: false,
      message: '缺少用户身份标识'
    };
  }

  if (!targetId || !targetType) {
    return {
      success: false,
      message: '缺少浏览目标信息'
    };
  }

  // targetType 必须是 heritage 或 scenic
  if (!['heritage', 'scenic'].includes(targetType)) {
    return {
      success: false,
      message: '浏览类型无效'
    };
  }

  try {
    // 查询是否已有浏览记录
    const { data: existing } = await db.collection('browse_history')
      .where({
        userId: openid,
        targetId,
        targetType
      })
      .get();

    if (existing && existing.length > 0) {
      // 已存在，更新浏览时间
      await db.collection('browse_history').doc(existing[0]._id).update({
        data: {
          createTime: db.serverDate()
        }
      });

      return {
        success: true,
        message: '浏览历史已更新',
        historyId: existing[0]._id
      };
    } else {
      // 新增浏览记录
      const { id: historyId } = await db.collection('browse_history').add({
        data: {
          userId: openid,
          targetId,
          targetType,
          createTime: db.serverDate()
        }
      });

      return {
        success: true,
        message: '浏览历史已添加',
        historyId
      };
    }
  } catch (err) {
    console.error('addBrowseHistory error:', err);
    return {
      success: false,
      message: '添加浏览历史失败：' + err.message
    };
  }
};
