/**
 * getMyCheckin 云函数
 * 获取用户的打卡记录列表
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

  // 分页参数
  const page = event.page || 1;
  const pageSize = event.pageSize || 10;
  const skip = (page - 1) * pageSize;

  // 筛选条件
  const filter = event.filter || {};
  const targetType = filter.targetType; // heritage 或 scenic

  if (!openid) {
    return {
      success: false,
      message: '缺少用户身份标识'
    };
  }

  try {
    // 构建查询条件
    const query = { userId: openid };
    if (targetType) {
      query.targetType = targetType;
    }

    // 查询打卡记录
    const { data: checkins, total } = await db.collection('checkin')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return {
      success: true,
      list: checkins,
      total,
      page,
      pageSize,
      hasMore: skip + checkins.length < total
    };
  } catch (err) {
    console.error('getMyCheckin error:', err);
    return {
      success: false,
      message: '获取打卡记录失败：' + err.message
    };
  }
};
