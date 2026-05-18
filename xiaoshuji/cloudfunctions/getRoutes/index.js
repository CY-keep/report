/**
 * getRoutes 云函数
 * 获取推荐路线列表
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-19
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const db = cloud.database();

  // 筛选参数
  const filter = event.filter || {};
  const category = filter.category; // 如：一日游、两日游、自驾等
  const district = filter.district; // 如：成都、阿坝等

  try {
    // 构建查询条件
    const query = {};
    if (category) {
      query.category = category;
    }
    if (district) {
      query.district = district;
    }

    // 查询路线列表
    let queryBuilder = db.collection('routes');

    if (category || district) {
      queryBuilder = queryBuilder.where(query);
    }

    const { data: routes } = await queryBuilder
      .orderBy('priority', 'desc')
      .get();

    return {
      success: true,
      list: routes,
      total: routes.length
    };
  } catch (err) {
    console.error('getRoutes error:', err);
    return {
      success: false,
      message: '获取路线失败：' + err.message
    };
  }
};
