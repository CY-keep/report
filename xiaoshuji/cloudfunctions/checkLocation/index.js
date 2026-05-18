/**
 * checkLocation 云函数
 * 验证用户打卡位置是否在有效范围内
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-19
 *
 * 打卡范围配置（米）
 */
const cloud = require('wx-server-sdk');
const cloudConfig = require('config');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 默认打卡范围 500 米
const DEFAULT_RADIUS = 500;

// 计算两点之间的距离（单位：米）
// 使用 Haversine 公式
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.main = async (event, context) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const {
    targetId,
    targetType,
    userLat,
    userLon
  } = event;

  // 参数校验
  if (!openid || !targetId || !targetType) {
    return {
      success: false,
      message: '缺少必要参数'
    };
  }

  if (typeof userLat !== 'number' || typeof userLon !== 'number') {
    return {
      success: false,
      message: '缺少用户位置信息'
    };
  }

  try {
    // 查询目标坐标
    let targetCoords = null;
    const targetCollection = targetType === 'heritage' ? 'heritage' : 'scenic';

    const { data: targets } = await db.collection(targetCollection)
      .field({ coordinates: true })
      .where({ _id: targetId })
      .get();

    if (!targets || targets.length === 0) {
      return {
        success: false,
        message: '未找到目标位置'
      };
    }

    targetCoords = targets[0].coordinates;

    if (!targetCoords || !targetCoords.latitude || !targetCoords.longitude) {
      return {
        success: false,
        message: '目标位置坐标不完整'
      };
    }

    // 计算距离
    const distance = getDistance(
      userLat,
      userLon,
      targetCoords.latitude,
      targetCoords.longitude
    );

    // 打卡范围（可配置）
    const checkinRadius = DEFAULT_RADIUS;

    // 判断是否在范围内
    const isValid = distance <= checkinRadius;

    return {
      success: true,
      isValid,
      distance: Math.round(distance),
      checkinRadius,
      message: isValid ? '位置验证通过' : `距离目标${Math.round(distance)}米，超出打卡范围`
    };
  } catch (err) {
    console.error('checkLocation error:', err);
    return {
      success: false,
      message: '位置验证失败：' + err.message
    };
  }
};
