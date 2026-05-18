/**
 * utils/auth.js
 * 微信小程序完整登录模块
 * 基于微信官方登录流程文档：https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
 *
 * 登录流程：
 * 1. wx.login() 获取 code
 * 2. 发送到开发者服务器（云函数）换取 openid/session_key
 * 3. 自定义登录态（token）返回小程序
 * 4. 后续请求携带 token 验证身份
 */

import { callCloud } from './cloudCall.js'
import { CLOUD_FUNCTIONS } from '../config.js'

// ==================== 常量定义 ====================

// 登录态 key
const AUTH_KEY = 'auth_token'
const USER_INFO_KEY = 'user_info'
const OPENID_KEY = 'openid'
const SESSION_EXPIRE_KEY = 'session_expire'

// session 有效期（默认 7 天）
const SESSION_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000

// ==================== 核心登录流程 ====================

/**
 * 静默登录（自动）
 * 在 App onLaunch 时调用，获取 openid 和会话密钥
 * @returns {Promise<{openid: string, sessionKey: string}>}
 */
export async function silentLogin() {
  try {
    // 1. 调用 wx.login 获取临时登录凭证
    const { code } = await wxLogin()

    // 2. 将 code 发送到云函数，换取 openid 和 session_key
    const res = await callCloud(CLOUD_FUNCTIONS.getOpenId, { code })

    if (!res || !res.openid) {
      throw new Error('获取用户标识失败')
    }

    // 3. 存储 openid（session_key 不下发到小程序，仅用于数据校验）
    wx.setStorageSync(OPENID_KEY, res.openid)

    console.log('✅ 静默登录成功，openid:', res.openid)
    return {
      openid: res.openid,
      sessionKey: res.session_key || ''
    }
  } catch (err) {
    console.error('❌ 静默登录失败:', err)
    throw err
  }
}

/**
 * 获取用户 openid（带缓存）
 * @returns {Promise<string>}
 */
export async function getOpenId() {
  // 优先从缓存读取
  let openid = wx.getStorageSync(OPENID_KEY)
  if (openid) return openid

  // 缓存没有，静默登录获取
  const res = await silentLogin()
  return res.openid
}

/**
 * 用户授权登录（头像+昵称）
 * @param {string} avatarUrl - 用户选择的头像 URL
 * @param {string} nickName - 用户输入的昵称
 * @returns {Promise<object>} 用户信息
 */
export async function authorizeLogin(avatarUrl, nickName) {
  uni.showLoading({ title: '登录中...', mask: true })

  try {
    // 1. 确保静默登录已完成
    const openid = await getOpenId()

    // 2. 调用 user-login 云函数，同步用户信息到数据库
    const res = await callCloud(CLOUD_FUNCTIONS.userLogin, {
      openid,
      avatarUrl,
      nickName: nickName.trim(),
      loginTime: Date.now()
    }, { silent: true })

    // 3. 构建用户信息对象
    const userInfo = {
      openid,
      avatarUrl,
      nickName: nickName.trim(),
      loginTime: Date.now(),
      isRealInfo: true
    }

    // 4. 存储用户信息和登录状态
    wx.setStorageSync(USER_INFO_KEY, userInfo)
    wx.setStorageSync('hasLogin', true)
    wx.setStorageSync('hasUserInfo', true)
    wx.setStorageSync(SESSION_EXPIRE_KEY, Date.now() + SESSION_EXPIRE_TIME)

    // 5. 如果云函数返回了 token，存储自定义登录态
    if (res && res.token) {
      wx.setStorageSync(AUTH_KEY, res.token)
    }

    uni.hideLoading()
    uni.showToast({ title: '登录成功', icon: 'success' })

    return userInfo
  } catch (err) {
    uni.hideLoading()
    console.error('授权登录失败:', err)
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
    throw err
  }
}

// ==================== 登录状态检查 ====================

/**
 * 检查用户是否已登录
 * @returns {{isLoggedIn: boolean, hasUserInfo: boolean, userInfo: object|null}}
 */
export function checkLoginStatus() {
  const userInfo = wx.getStorageSync(USER_INFO_KEY)
  const hasLogin = wx.getStorageSync('hasLogin') || false
  const hasUserInfo = wx.getStorageSync('hasUserInfo') || false
  const sessionExpire = wx.getStorageSync(SESSION_EXPIRE_KEY) || 0

  // 检查 session 是否过期
  const isSessionValid = sessionExpire > Date.now()

  return {
    isLoggedIn: hasLogin && isSessionValid,
    hasUserInfo: hasUserInfo && !!userInfo,
    hasRealInfo: hasUserInfo,
    userInfo: userInfo || null,
    isSessionValid
  }
}

/**
 * 检查登录态是否有效（用于需要登录的操作）
 * @returns {boolean}
 */
export function isLoggedIn() {
  const { isLoggedIn } = checkLoginStatus()
  return isLoggedIn
}

/**
 * 检查是否需要完善用户信息
 * @returns {boolean}
 */
export function needsUserInfo() {
  const { isLoggedIn, hasRealInfo } = checkLoginStatus()
  return isLoggedIn && !hasRealInfo
}

// ==================== 登出 ====================

/**
 * 退出登录
 * 清除本地存储的登录态和用户信息
 */
export function logout() {
  // 清除所有登录相关数据
  const keysToRemove = [
    AUTH_KEY,
    USER_INFO_KEY,
    OPENID_KEY,
    SESSION_EXPIRE_KEY,
    'hasLogin',
    'hasUserInfo',
    'auth_token',
    'fav_count',
    'checkin_count',
    'browse_history'
  ]

  keysToRemove.forEach(key => {
    wx.removeStorageSync(key)
  })

  console.log('✅ 已退出登录')
}

// ==================== 微信原生 API 封装 ====================

/**
 * wx.login 封装（Promise 化）
 * @returns {Promise<{code: string, errMsg: string}>}
 */
export function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res)
        } else {
          reject(new Error('wx.login 未返回 code'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 检查登录态是否有效
 * 可用于检测 session_key 是否过期
 * @returns {Promise<boolean>}
 */
export function checkSession() {
  return new Promise((resolve) => {
    wx.checkSession({
      success: () => {
        resolve(true)
      },
      fail: () => {
        // session 过期，需要重新登录
        resolve(false)
      }
    })
  })
}

/**
 * 确保登录态有效（检查 + 自动续期）
 * 在需要登录的操作前调用
 * @returns {Promise<boolean>}
 */
export async function ensureLogin() {
  // 1. 先检查 session 是否过期
  const isValid = await checkSession()

  if (!isValid) {
    console.log('Session 已过期，正在重新登录...')
    // 2. 过期则静默登录续期
    await silentLogin()
    return true
  }

  // 3. session 有效，检查本地登录状态
  const { isLoggedIn } = checkLoginStatus()
  return isLoggedIn
}

// ==================== 便捷方法 ====================

/**
 * 获取当前用户信息
 * @returns {object|null}
 */
export function getUserInfo() {
  return wx.getStorageSync(USER_INFO_KEY) || null
}

/**
 * 获取用户 openid
 * @returns {string|null}
 */
export function getOpenid() {
  return wx.getStorageSync(OPENID_KEY) || null
}

/**
 * 提示用户登录
 * @param {string} [message] - 自定义提示文字
 */
export function requireLogin(message = '请先登录') {
  uni.showToast({ title: message, icon: 'none' })
}

// ==================== 导出全部方法 ====================
export default {
  silentLogin,
  authorizeLogin,
  checkLoginStatus,
  isLoggedIn,
  needsUserInfo,
  logout,
  getOpenId,
  wxLogin,
  checkSession,
  ensureLogin,
  getUserInfo,
  getOpenid,
  requireLogin
}
