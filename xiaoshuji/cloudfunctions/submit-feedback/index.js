/**
 * submit-feedback 云函数
 * 提交用户反馈
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
    type,
    content,
    contact = '',
    images = []
  } = event;

  // 参数校验
  if (!openid) {
    return {
      success: false,
      message: '缺少用户身份标识'
    };
  }

  if (!type || !content) {
    return {
      success: false,
      message: '缺少反馈类型或内容'
    };
  }

  // 反馈类型白名单
  const validTypes = ['功能建议', '问题反馈', '内容纠错', '其他'];
  if (!validTypes.includes(type)) {
    return {
      success: false,
      message: '反馈类型无效'
    };
  }

  // 内容长度限制
  if (content.length > 500) {
    return {
      success: false,
      message: '反馈内容不能超过500字'
    };
  }

  try {
    // 添加反馈记录
    const { id: feedbackId } = await db.collection('feedback').add({
      data: {
        userId: openid,
        type,
        content,
        contact,
        images,
        status: '待处理',
        createTime: db.serverDate()
      }
    });

    return {
      success: true,
      message: '反馈提交成功',
      feedbackId
    };
  } catch (err) {
    console.error('submit-feedback error:', err);
    return {
      success: false,
      message: '反馈提交失败：' + err.message
    };
  }
};
