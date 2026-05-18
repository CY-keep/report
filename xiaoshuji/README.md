# 四川非遗文旅数字导览小程序

> 用科技守护非遗，用地图点亮旅程。

一款基于 uni-app（Vue2）开发的微信小程序，聚焦四川非遗与文旅资源，集成百度语音合成及腾讯地图SDK，实现非遗导览、景点介绍、方言语音导览、文旅打卡及路线规划等功能，助力四川非遗文化数字化传承与智慧文旅体验升级。

![微信小程序](https://img.shields.io/badge/Platform-微信小程序-07C160?style=flat-square)
![uni-app](https://img.shields.io/badge/Framework-uni--app%20(Vue2)-4.0.3?style=flat-square&color=orange)
![Vue](https://img.shields.io/badge/Vue-2.x-4FC08D?style=flat-square&logo=vue.js)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## ✨ 功能特性

| 模块 | 功能 | 说明 |
|:---|:---|:---|
| 🏠 **首页** | 轮播图、快捷导航、热门推荐 | 快速进入各功能模块 |
| 🎭 **非遗导览** | 分类筛选、详情页、语音导览 | 四川话/普通话双语导览 |
| 🏔️ **景点导览** | 等级筛选、详情页、地图导航 | 一键导航到景点 |
| 🗺️ **路线规划** | 地图展示、路线规划、导航 | 腾讯地图SDK驱动 |
| 📸 **文旅打卡** | 位置验证、拍照上传、海报生成 | 打卡留念分享 |
| ❤️ **收藏功能** | 收藏非遗/景点 | 云端同步收藏记录 |
| 🔍 **综合搜索** | 非遗+景点双搜索 | 快速找到目标内容 |
| 👤 **个人中心** | 用户信息、打卡足迹、浏览历史 | 管理个人数据 |

---

## 🛠️ 技术栈

### 前端

| 技术 | 说明 | 版本 |
|:---|:---|:---|
| uni-app | 跨平台开发框架 | ^2.0.0 |
| Vue.js | 前端响应式框架 | 2.x |
| uni-ui | UI组件库 | 内置 |
| 微信小程序 | 目标运行平台 | - |

### 后端 & 云服务

| 服务 | 说明 |
|:---|:---|
| 微信云开发 | 云数据库、云函数、云存储 |
| 腾讯地图SDK | 地图展示、路线规划、地点搜索 |
| 百度语音合成(TTS) | 语音导览音频生成 |

### 开发工具

| 工具 | 说明 |
|:---|:---|
| HBuilderX | uni-app 推荐IDE |
| 微信开发者工具 | 小程序调试与预览 |

---

## 🚀 快速开始

### 环境要求

- Node.js 14+
- HBuilderX（安装 uni-app 插件）
- 微信开发者工具
- 微信云开发环境（免费版足够）

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd SichuanHeritage

# 2. 使用 HBuilderX 打开项目
# 选择 "文件" -> "打开目录" -> 选择本项目根目录

# 3. 初始化云开发环境
# 在微信公众平台创建云开发环境，获取环境ID

# 4. 配置云环境ID
# 编辑 config.js 文件，修改 CLOUD_CONFIG.env 为你的环境ID

# 5. 部署云函数
# 在微信开发者工具中，右键 cloudfunctions/ 文件夹
# 选择「上传并部署：云端安装依赖」
# 部署以下云函数（共14个，代码已在项目中提供）：
# - getOpenId           # 获取用户OpenId
# - user-login           # 用户登录
# - favorite-add         # 添加收藏
# - favorite-remove      # 取消收藏
# - favorite-list        # 获取收藏列表
# - checkin-submit       # 提交打卡
# - checkLocation        # 位置验证
# - getMyCheckin         # 获取打卡记录
# - tts-guide            # 百度TTS语音合成
# - geo-reverse          # 逆地址解析
# - getRoutes            # 获取推荐路线
# - submit-feedback      # 提交反馈
# - addBrowseHistory     # 添加浏览历史
# - initViewCount        # 初始化浏览量

# 6. 导入云数据库数据
# 创建 heritage、scenic、checkin 等集合，导入初始数据

# 7. 配置腾讯地图Key
# 编辑 config.js 文件，修改 MAP_CONFIG.key

# 8. 在 HBuilderX 中运行到微信开发者工具
# 选择 "运行" -> "运行到小程序模拟器" -> "微信开发者工具"
```

---

## 📁 项目结构

```
SichuanHeritage/
├── pages/                    # 页面目录
│   ├── index/               # 首页模块
│   │   └── index.vue        # 首页（轮播+导航+推荐）
│   ├── heritage/            # 非遗导览模块
│   │   ├── heritageList.vue # 非遗列表（分类筛选+搜索）
│   │   └── heritageDetail.vue # 非遗详情（语音导览+时间线）
│   ├── scenic/              # 景点导览模块
│   │   ├── scenicList.vue   # 景点列表（等级筛选+搜索）
│   │   └── scenicDetail.vue # 景点详情（语音导览+地图导航）
│   ├── route/               # 路线规划模块
│   │   └── route.vue       # 地图+路线规划+导航
│   ├── checkin/             # 打卡模块
│   │   ├── checkin.vue     # 打卡页面（定位验证+拍照）
│   │   └── myCheckin.vue   # 我的打卡/足迹
│   ├── search/              # 搜索模块
│   │   └── search.vue      # 综合搜索（非遗+景点）
│   ├── guide/               # 探索导览模块
│   │   └── guideIndex.vue  # 探索页
│   ├── favorites/           # 收藏模块
│   │   └── favorites.vue   # 我的收藏
│   └── mine/                # 个人中心模块
│       └── mine.vue        # 个人中心
├── static/                  # 静态资源
│   └── icon/               # 图标文件（tabBar图标必须本地）
├── utils/                   # 工具函数
│   ├── cloudCall.js        # 云函数调用+云存储图片处理
│   ├── cloudFunctionNames.js # 云函数名称统一管理
│   ├── storage.js          # 本地存储封装
│   ├── tencentMapService.js # 腾讯地图服务
│   └── qqmap-wx-jssdk.js   # 腾讯地图SDK
├── cloudfunctions/          # 云函数目录（本地，共14个）
├── config.js               # 全局配置文件
├── pages.json              # 页面路由配置
├── App.vue                 # 应用入口
├── main.js                 # Vue实例入口
└── manifest.json           # uni-app应用配置
```

---

## 📋 云函数清单

### 用户相关

| 云函数 | 功能 | 参数 |
|:---|:---|:---|
| `getOpenId` | 获取用户OpenId | 无 |
| `user-login` | 用户授权登录 | avatarUrl, nickName |

### 收藏相关

| 云函数 | 功能 | 参数 |
|:---|:---|:---|
| `favorite-add` | 添加收藏 | targetId, targetType |
| `favorite-remove` | 取消收藏 | targetId, targetType |
| `favorite-list` | 获取收藏列表 | filter: { targetType }, page, pageSize |

### 打卡相关

| 云函数 | 功能 | 参数 |
|:---|:---|:---|
| `checkin-submit` | 提交打卡 | targetId, targetType, images, note, location |
| `checkLocation` | 位置验证 | targetId, targetType, userLat, userLon |
| `getMyCheckin` | 获取打卡记录 | filter: { targetType }, page, pageSize |

### 语音与地图

| 云函数 | 功能 | 参数 |
|:---|:---|:---|
| `tts-guide` | 百度TTS语音合成 | text, spd, pit, vol, per |
| `geo-reverse` | 逆地址解析 | latitude, longitude |
| `getRoutes` | 获取推荐路线 | filter: { category, district } |

### 其他

| 云函数 | 功能 | 参数 |
|:---|:---|:---|
| `submit-feedback` | 提交反馈 | type, content, contact, images |
| `addBrowseHistory` | 添加浏览历史 | targetId, targetType |
| `initViewCount` | 初始化浏览量 | 无 |

---

## 🔧 配置文件说明

### config.js 主要配置项

```javascript
// 云开发配置
export const CLOUD_CONFIG = {
  env: 'cloud1-xxxxxx-xxxxx',  // 云环境ID
  enabled: true
}

// 腾讯地图配置
export const MAP_CONFIG = {
  key: 'NV7BZ-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'  // 腾讯地图Key
}

// 百度TTS配置
export const TTS_CONFIG = {
  enabled: true,
  apiKey: 'your_baidu_api_key',
  secretKey: 'your_baidu_secret_key',
  spd: 5,    // 语速
  pit: 5,    // 音调
  vol: 5,    // 音量
  per: 0     // 发音人
}
```

> ⚠️ **重要**：请将 `config.js` 加入 `.gitignore`，避免敏感信息泄露。

---

## 🎯 第三方SDK说明

本小程序使用了以下第三方SDK，需要在隐私保护指引中声明：

### 腾讯地图SDK

| 项目 | 内容 |
|:---|:---|
| SDK名称 | 腾讯地图微信小程序JavaScriptSDK |
| 提供方 | 深圳市腾讯计算机系统有限公司 |
| 官网 | https://lbs.qq.com/ |
| 隐私政策 | https://lbs.qq.com/userAgreements/agreements |
| 功能 | 地图展示、位置定位、路线规划、地点搜索、地理编码 |

### 百度语音合成SDK

| 项目 | 内容 |
|:---|:---|
| SDK名称 | 百度语音合成（TTS） |
| 提供方 | 百度在线网络技术（北京）有限公司 |
| 官网 | https://ai.baidu.com/ |
| 隐私政策 | https://ai.baidu.com/announcement/578 |
| 功能 | 景点语音导览，将文字内容转换为语音播放 |

---

## ⚠️ 隐私保护指引填写要点

在微信公众平台 → 开发管理 → 开发设置 → 隐私保护指引中需要填写：

### 1. 收集的信息

| 信息类型 | 使用目的 |
|:---|:---|
| 位置信息 | 地图导航定位、路线规划 |
| 微信头像/昵称 | 用户身份展示 |
| 相册/相机 | 打卡拍照和图片上传 |
| 浏览记录 | 历史浏览功能 |

### 2. 第三方SDK信息

按上方「第三方SDK说明」中的信息填写。

### 3. 存储期限

建议填写30天固定期限。

### 4. 变更告知方式

填写「弹窗提示」。

---

## 📱 云存储图片处理

> **重要**：云存储返回的 `cloud://` 路径无法直接在小程序 `<image>` 组件中显示。

本项目封装了 `processImageFields` 函数自动处理图片路径转换：

```javascript
import { cloudCall, processImageFields } from '@/utils/cloudCall.js';

// 处理列表数据
const res = await cloudCall('getHeritageList', { page: 1 });
this.list = await processImageFields(res.list, ['coverImage']);

// 处理详情页多个图片字段
const detail = await cloudCall('getScenicDetail', { id });
this.scenic = await processImageFields(detail, ['coverImage', 'gallery']);
```

---

## 🗺️ 地图功能说明

### 地图Key申请

1. 访问 [腾讯位置服务](https://lbs.qq.com/)
2. 注册账号并申请「微信小程序JavaScriptSDK」Key
3. 在 `config.js` 中配置 Key

### API配额限制

| API | 每日配额 | 建议 |
|:---|:---:|:---|
| 地点搜索 | 200次/Key | 提前在数据库录入景点坐标 |
| 路线规划 | 1000次/Key | 正常使用足够 |

### 坐标录入

建议在景点数据中提前录入 `latitude`（纬度）和 `longitude`（经度）字段，避免依赖实时搜索API。

---

## 🐛 常见问题

### Q: tabBar图标不显示？

**A**：tabBar图标必须使用本地路径（`static/icon/`），不能用云存储`cloud://`路径。

### Q: 云存储图片不显示？

**A**：使用 `processImageFields` 函数将 `cloud://` 路径转换为临时链接。

### Q: 定位功能不工作？

**A**：检查 `manifest.json` 中是否配置了 `permission` 节点，以及用户是否授权了位置权限。

### Q: 第三方组件库无法使用？

**A**：uni-app + HBuilderX 项目建议使用 uni-ui（已内置）或原生小程序组件，避免使用复杂npm组件库。



