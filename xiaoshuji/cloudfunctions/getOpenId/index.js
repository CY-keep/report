/**
 * getOpenId 云函数
 * 静默登录，获取用户 OpenId
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-19
 *
 * 微信登录流程参考：
 * https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
 *
 * 微信云开发优势：无需调用 wx.login() + code2Session，
 * 云函数运行时会自动完成静默登录，无感获取用户身份
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  return {
    success: true,
    openid: wxContext.OPENID,      // 用户唯一标识
    appid: wxContext.APPID,       // 小程序 AppID
    unionid: wxContext.UNIONID || null  // UnionID（需绑定开放平台）
  };
};
