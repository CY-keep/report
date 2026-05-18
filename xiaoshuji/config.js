/**
 * 配置文件 - 集中管理所有敏感信息和配置
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-08
 * - 重构配置结构，集中管理云环境、地图Key、TTS配置
 * 请勿将此文件提交到公开仓库！
 */

// ============== 云开发配置 ==============
export const CLOUD_CONFIG = {
  // 云开发环境ID
  env: 'cloud1-7gabd815fd2c236e',
  // 是否启用云开发
  enabled: true
}

// ============== 腾讯地图配置 ==============
export const MAP_CONFIG = {
  // 腾讯地图 Key（请在腾讯位置服务官网申请）
  key: 'NV7BZ-KHFCV-S4SPF-5ULSS-OVVNT-D4FMA',
  // 地图默认缩放级别
  defaultZoom: 12,
  // 打卡范围（米）
  checkinRadius: 500,
  // 定位模式：gcj02 为国测局坐标（国内标准）
  coordType: 'gcj02'
}

// ============== 百度语音合成配置 ==============
export const TTS_CONFIG = {
  // 是否启用语音导览
  enabled: true,
  // 百度云密钥（从 https://ai.baidu.com/tech/speech/tts 获取）
  apiKey: 'QjXwlS2aaBXK2Mv1e5C8KAoC',
  secretKey: 'BgSc0CyElAvHfNFxetp5FoPvxnF1PGUV',
  // 默认语速 (0-15)
  spd: 5,
  // 默认音调 (0-15)
  pit: 5,
  // 默认音量 (0-15)
  vol: 5,
  // 默认发音人：0为女声，1为男声，3为情感男声，4为情感女声
  per: 0,
  // 语音文本最大字符数
  maxTextLength: 500
}

// ============== 应用配置 ==============
export const APP_CONFIG = {
  // 小程序名称
  name: '四川非遗文旅',
  // 版本号
  version: '1.0.0',
  // 版本代码
  versionCode: '100',
  // 开发模式（生产环境应设为 false）
  debug: false,
  // 是否显示调试按钮
  showDebug: false,
  // 热门搜索关键词
  hotSearchKeywords: ['川剧', '蜀绣', '三星堆', '九寨沟', '峨眉山', '大熊猫'],
  // 每页加载数量
  pageSize: 10,
  // 搜索防抖延迟（毫秒）
  searchDebounce: 500,
  // 数据缓存时间（毫秒）
  cacheExpireTime: 5 * 60 * 1000 // 5分钟
}

// ============== 云存储路径配置 ==============
export const STORAGE_PATHS = {
  // 非遗封面图
  heritage: 'images/heritage/',
  // 景点封面图
  scenic: 'images/scenic/',
  // 打卡图片
  checkin: 'images/checkin/',
  // 打卡海报
  poster: 'images/poster/',
  // 轮播图
  banner: 'images/banner/',
  // 语音导览音频
  audio: 'images/audio/',
  // 应用图标
  icon: 'icon/'
}

// ============== 云函数名称配置 ==============
export const CLOUD_FUNCTIONS = {
  // 用户相关
  getOpenId: 'getOpenId',
  userLogin: 'user-login',
  
  // 收藏相关
  favoriteAdd: 'favorite-add',
  favoriteRemove: 'favorite-remove',
  favoriteList: 'favorite-list',
  
  // 打卡相关
  checkinSubmit: 'checkin-submit',
  checkLocation: 'checkLocation',
  addCheckin: 'addCheckin',
  getMyCheckin: 'getMyCheckin',
  
  // 语音相关
  ttsGuide: 'tts-guide',
  
  // 位置相关
  geoReverse: 'geo-reverse',
  
  // 路线相关
  getRoutes: 'getRoutes',

  // 反馈相关
  submitFeedback: 'submit-feedback',

  // 浏览历史
  addBrowseHistory: 'addBrowseHistory',

  // 数据初始化
  initViewCount: 'initViewCount'
}

// ============== 云数据库集合配置 ==============
export const COLLECTIONS = {
  // 非遗项目
  heritage: 'heritage',
  // 景点
  scenic: 'scenic',
  // 轮播图
  swiper: 'swiper',
  // 用户收藏
  favorites: 'user_favorites',
  // 打卡记录
  checkin: 'checkin',
  // 浏览历史
  browseHistory: 'browse_history',
  // 用户反馈
  feedback: 'feedback',
  // 路线
  routes: 'routes',
  // 用户信息
  users: 'users'
}

// ============== 导出全部配置 ==============
export default {
  CLOUD_CONFIG,
  MAP_CONFIG,
  TTS_CONFIG,
  APP_CONFIG,
  STORAGE_PATHS,
  CLOUD_FUNCTIONS,
  COLLECTIONS
}
