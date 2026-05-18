/**
 * favorite-list 云函数
 * 获取收藏列表（支持筛选）
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

    // 查询收藏列表
    const { data: favorites, total } = await db.collection('user_favorites')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取详情
    const heritageIds = [];
    const scenicIds = [];
    favorites.forEach(fav => {
      if (fav.targetType === 'heritage') {
        heritageIds.push(fav.targetId);
      } else {
        scenicIds.push(fav.targetId);
      }
    });

    // 查询非遗详情
    const heritageList = heritageIds.length > 0
      ? (await db.collection('heritage').field({
          _id: true,
          name: true,
          category: true,
          coverImage: true,
          location: true
        }).where({
          _id: db.command.in(heritageIds)
        }).get()).data
      : [];

    // 查询景点详情
    const scenicList = scenicIds.length > 0
      ? (await db.collection('scenic').field({
          _id: true,
          name: true,
          coverImage: true,
          location: true,
          rating: true
        }).where({
          _id: db.command.in(scenicIds)
        }).get()).data
      : [];

    // 合并详情
    const result = favorites.map(fav => {
      const detail = fav.targetType === 'heritage'
        ? heritageList.find(h => h._id === fav.targetId)
        : scenicList.find(s => s._id === fav.targetId);

      return {
        ...fav,
        detail: detail || null
      };
    });

    return {
      success: true,
      list: result,
      total,
      page,
      pageSize,
      hasMore: skip + favorites.length < total
    };
  } catch (err) {
    console.error('favorite-list error:', err);
    return {
      success: false,
      message: '获取收藏列表失败：' + err.message
    };
  }
};
