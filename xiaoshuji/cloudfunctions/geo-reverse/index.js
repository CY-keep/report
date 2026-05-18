/**
 * geo-reverse 云函数
 * 逆地址解析（坐标转地址）
 * 使用腾讯地图 WebService API
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-19
 */
const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 腾讯地图 Key（通过环境变量配置）
const TENCENT_MAP_KEY = process.env.TENCENT_MAP_KEY || '';

/**
 * 发送 HTTP 请求
 */
function httpRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

exports.main = async (event, context) => {
  const { latitude, longitude } = event;

  // 参数校验
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return {
      success: false,
      message: '缺少坐标参数'
    };
  }

  if (!TENCENT_MAP_KEY) {
    return {
      success: false,
      message: '未配置腾讯地图Key'
    };
  }

  try {
    // 调用腾讯地图逆地址解析 API
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${TENCENT_MAP_KEY}&get_poi=1`;
    const result = await httpRequest(url);

    if (result.status !== 0) {
      return {
        success: false,
        message: result.message || '逆地址解析失败'
      };
    }

    const address = result.result;

    return {
      success: true,
      data: {
        address: address.address || '',
        formatted_addresses: address.formatted_addresses || {},
        address_component: address.address_component || {},
        pois: address.pois || []
      }
    };
  } catch (err) {
    console.error('geo-reverse error:', err);
    return {
      success: false,
      message: '逆地址解析失败：' + err.message
    };
  }
};
