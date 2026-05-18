/**
 * 云函数名称统一导出
 * 所有云函数名称在此集中管理，方便维护和修改
 *
 * AI辅助生成/修复：WorkBuddy/Coding Copilot, 2026-04-19
 * - 修复getFavoriteList传参格式（{targetType} → {filter:{targetType}}）
 * - 统一云函数调用封装
 */

import { CLOUD_FUNCTIONS } from '../config.js'

// 导出云函数调用方法
export default {
  // 用户相关
  getOpenId: () => CLOUD_FUNCTIONS.getOpenId,
  userLogin: () => CLOUD_FUNCTIONS.userLogin, // 对应云函数名：user-login
  
  // 收藏相关
  favoriteAdd: () => CLOUD_FUNCTIONS.favoriteAdd,
  favoriteRemove: () => CLOUD_FUNCTIONS.favoriteRemove,
  favoriteList: () => CLOUD_FUNCTIONS.favoriteList,
  
  // 打卡相关
  checkinSubmit: () => CLOUD_FUNCTIONS.checkinSubmit,
  checkLocation: () => CLOUD_FUNCTIONS.checkLocation,
  addCheckin: () => CLOUD_FUNCTIONS.addCheckin,
  getMyCheckin: () => CLOUD_FUNCTIONS.getMyCheckin,
  
  // 语音相关
  ttsGuide: () => CLOUD_FUNCTIONS.ttsGuide,
  
  // 位置相关
  geoReverse: () => CLOUD_FUNCTIONS.geoReverse,
  
  // 路线相关
  getRoutes: () => CLOUD_FUNCTIONS.getRoutes,
  
  // AR相关
  getARResult: () => CLOUD_FUNCTIONS.getARResult,

  // 反馈相关
  submitFeedback: () => CLOUD_FUNCTIONS.submitFeedback,

  // 浏览历史
  addBrowseHistory: () => CLOUD_FUNCTIONS.addBrowseHistory,
}

// 便捷调用方法（内部使用 cloudCall.js）
import { callCloud } from './cloudCall.js'

export const cloudFn = {
  // 获取用户 openId
  async getOpenId() {
    return callCloud(CLOUD_FUNCTIONS.getOpenId, {})
  },
  
  // 用户登录（授权登录，同步用户信息到数据库）
  // @param {object} params - { avatarUrl, nickName }
  async userLogin(params) {
    return callCloud(CLOUD_FUNCTIONS.userLogin, params)
  },
  
  // 添加收藏
  async addFavorite(targetType, targetId, targetInfo) {
    return callCloud(CLOUD_FUNCTIONS.favoriteAdd, {
      targetType,
      targetId,
      title: targetInfo?.title || '',
      coverImage: targetInfo?.coverImage || '',
      category: targetInfo?.category || ''
    })
  },
  
  // 取消收藏
  async removeFavorite(targetType, targetId) {
    return callCloud(CLOUD_FUNCTIONS.favoriteRemove, { targetType, targetId })
  },
  
  // 获取收藏列表
  async getFavoriteList(targetType) {
    return callCloud(CLOUD_FUNCTIONS.favoriteList, { 
      filter: targetType ? { targetType } : {} 
    })
  },
  
  // 语音合成
  async ttsGuide(text) {
    return callCloud(CLOUD_FUNCTIONS.ttsGuide, { text })
  },
  
  // 逆地址解析
  async geoReverse(lat, lng) {
    return callCloud(CLOUD_FUNCTIONS.geoReverse, { latitude: lat, longitude: lng })
  },
  
  // 获取路线列表
  async getRoutes(type) {
    return callCloud(CLOUD_FUNCTIONS.getRoutes, { type })
  },
  
  // 打卡位置验证
  async checkLocation(type, targetId, userLat, userLng) {
    return callCloud(CLOUD_FUNCTIONS.checkLocation, {
      type,
      id: targetId,
      userLocation: { latitude: userLat, longitude: userLng }
    })
  },
  
  // 提交打卡
  async submitCheckin(data) {
    return callCloud(CLOUD_FUNCTIONS.addCheckin, data)
  },
  
  // 获取打卡记录
  async getMyCheckin(params) {
    return callCloud(CLOUD_FUNCTIONS.getMyCheckin, params)
  },
  
  // AR识别结果
  async getARResult(target, type, id) {
    return callCloud(CLOUD_FUNCTIONS.getARResult, { target, type, id })
  },

  // 提交反馈
  async submitFeedback(data) {
    return callCloud(CLOUD_FUNCTIONS.submitFeedback, data)
  },

  // 添加浏览历史
  async addBrowseHistory(type, id, name, cover) {
    return callCloud(CLOUD_FUNCTIONS.addBrowseHistory, { type, id, name, cover })
  }
}
