/**
 * tts-guide 云函数
 * 调用百度TTS文字转语音，上传到微信云存储，返回可直接播放的HTTPS URL
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-08
 * - 调试"parameter error"错误，定位https模块引入顺序问题
 * - 重写Token缓存逻辑（update→set，upsert语义）
 * - 添加自动创建tts_cache集合逻辑
 * - 手写buildQueryString替代URLSearchParams（兼容性）
 *
 * 百度TTS配置（短文本在线合成 - 基础音库）：
 * - API Key / Secret Key 通过环境变量配置（BAIDU_TTS_API_KEY / BAIDU_TTS_SECRET_KEY）
 *
 * 字段名参考：云函数与数据库配置文档.md
 */
const cloud = require('wx-server-sdk');
const https = require('https');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// ============ 百度TTS 密钥配置 ============
const API_KEY = process.env.BAIDU_TTS_API_KEY || 'QjXwlS2aaBXK2Mv1e5C8KAoC';
const SECRET_KEY = process.env.BAIDU_TTS_SECRET_KEY || 'BgSc0CyElAvHfNFxetp5FoPvxnF1PGUV';

// TTS 参数（基础音库）
const TTS_SPD = 5;   // 语速 0~15
const TTS_PIT = 5;   // 音调 0~15
const TTS_VOL = 5;   // 音量 0~15
const TTS_PER = 0;   // 发音人：0=女声 1=男声

// 最大文本长度（百度TTS限制）
const MAX_TEXT_LENGTH = 500;

// tts_cache 集合名
const TTS_CACHE_COLLECTION = 'tts_cache';

// ============ 工具函数 ============

// 手动拼接 URLSearchParams（兼容旧版 Node.js）
function buildQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// HTTP GET 请求
function httpGet(hostname, path) {
  return new Promise((resolve, reject) => {
    console.log(`[httpGet] ${hostname}${path}`);
    const options = {
      hostname,
      port: 443,
      path,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      console.log(`[httpGet] statusCode=${res.statusCode}, content-type=${res.headers['content-type']}`);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[httpGet] response length=${data.length}, preview=${data.slice(0, 200)}`);
        resolve(data);
      });
    });

    req.on('error', (e) => {
      console.error('[httpGet] network error:', e.message);
      reject(e);
    });
    req.end();
  });
}

// HTTP POST 请求
function httpPost(hostname, path, postData) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(
      Object.entries(postData)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    );

    console.log(`[httpPost] ${hostname}${path}, body length=${body.length}`);

    const options = {
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      console.log(`[httpPost] statusCode=${res.statusCode}, content-type=${res.headers['content-type']}`);
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        resolve({ buffer, contentType });
      });
    });

    req.on('error', (e) => {
      console.error('[httpPost] network error:', e.message);
      reject(e);
    });
    req.write(body);
    req.end();
  });
}

// 确保 tts_cache 集合存在
async function ensureTtsCacheCollection() {
  try {
    await db.createCollection(TTS_CACHE_COLLECTION);
    console.log('[tts_cache] 集合创建成功');
  } catch (e) {
    // 集合已存在，忽略错误
    if (e.errCode !== -502005) { // -502005 = 集合已存在
      console.warn('[tts_cache] 集合检查异常:', e.errMsg);
    }
  }
}

// 获取百度 Access Token（带缓存）
async function getBaiduAccessToken() {
  console.log('[Token] 开始获取百度 Access Token');
  console.log(`[Token] API_KEY=${API_KEY ? '已配置' : '未配置'}, SECRET_KEY=${SECRET_KEY ? '已配置' : '未配置'}`);

  if (!API_KEY || !SECRET_KEY) {
    throw new Error('百度TTS API配置未设置，请检查环境变量 BAIDU_TTS_API_KEY 和 BAIDU_TTS_SECRET_KEY');
  }

  // 先查缓存
  try {
    const cacheRes = await db.collection(TTS_CACHE_COLLECTION).doc('access_token').get();
    if (cacheRes.data) {
      const expiresTime = new Date(cacheRes.data.expiresTime).getTime();
      console.log(`[Token] 缓存 expiresTime=${cacheRes.data.expiresTime}, now=${new Date().toISOString()}`);
      // 提前10分钟判断过期
      if (expiresTime > Date.now() + 10 * 60 * 1000) {
        console.log('[Token] 使用缓存的 Token');
        return cacheRes.data.token;
      }
      console.log('[Token] Token 已过期或即将过期，重新获取');
    } else {
      console.log('[Token] 缓存无数据');
    }
  } catch (e) {
    console.log(`[Token] 缓存查询失败: ${e.errMsg}，继续获取新Token`);
  }

  // 获取新 Token
  console.log('[Token] 请求新的百度TTS Token...');
  const params = {
    grant_type: 'client_credentials',
    client_id: API_KEY,
    client_secret: SECRET_KEY,
  };

  const queryString = buildQueryString(params);
  const res = await httpGet('aip.baidubce.com', `/oauth/2.0/token?${queryString}`);
  console.log(`[Token] 原始响应: ${res.slice(0, 300)}`);

  let result;
  try {
    result = JSON.parse(res);
  } catch (e) {
    console.error('[Token] JSON解析失败，原始响应:', res);
    throw new Error('百度Token接口响应格式错误');
  }

  if (!result.access_token) {
    console.error('[Token] 获取Token失败:', result);
    throw new Error(result.error_description || result.error || '获取百度Token失败');
  }

  console.log('[Token] 获取成功，开始写入缓存');
  console.log(`[Token] access_token=${result.access_token.slice(0, 20)}..., expires_in=${result.expires_in}`);

  // 写入缓存
  await ensureTtsCacheCollection();
  try {
    await db.collection(TTS_CACHE_COLLECTION).add({
      data: {
        _id: 'access_token',
        token: result.access_token,
        expiresTime: new Date(Date.now() + result.expires_in * 1000).toISOString(),
      },
    });
    console.log('[Token] 缓存写入成功');
  } catch (e) {
    console.warn(`[Token] add 失败 (${e.errCode}: ${e.errMsg})，尝试 update`);
    try {
      await db.collection(TTS_CACHE_COLLECTION).doc('access_token').set({
        data: {
          token: result.access_token,
          expiresTime: new Date(Date.now() + result.expires_in * 1000).toISOString(),
        },
      });
      console.log('[Token] update 成功');
    } catch (e2) {
      console.warn(`[Token] update 也失败: ${e2.errCode}: ${e2.errMsg}`);
    }
  }

  return result.access_token;
}

// 调用百度TTS（短文本在线合成）
async function callBaiduTTS(text, accessToken) {
  const postData = {
    tex: text,
    tok: accessToken,
    spd: TTS_SPD,
    pit: TTS_PIT,
    vol: TTS_VOL,
    per: TTS_PER,
    ctp: 1,     // 客户端类型：1=web
    aue: 3,     // 3=mp3 格式
  };

  console.log(`[TTS] 开始合成，文本长度=${text.length}, token=${accessToken.slice(0, 20)}...`);

  const { buffer, contentType } = await httpPost('tsn.baidu.com', '/text2audio', postData);
  console.log(`[TTS] 响应 contentType=${contentType}, buffer大小=${buffer.length}`);

  // 如果是 JSON，说明返回了错误
  if (contentType.includes('application/json')) {
    const errStr = buffer.toString();
    console.error('[TTS] 返回JSON错误:', errStr);
    try {
      const err = JSON.parse(errStr);
      throw new Error(err.err_msg || err.err_msg || '语音合成失败');
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes('JSON')) {
        throw e;
      }
      throw new Error('百度TTS返回格式错误: ' + errStr);
    }
  }

  console.log(`[TTS] 合成成功，音频大小=${buffer.length} 字节`);
  return buffer;
}

// 上传到微信云存储（返回 HTTPS 临时链接）
async function uploadToCloudStorage(buffer, filename) {
  console.log(`[Upload] 开始上传 ${filename}, 大小=${buffer.length} 字节`);

  const res = await cloud.uploadFile({
    cloudPath: `images/audio/${filename}`,
    fileContent: buffer,
  });

  console.log(`[Upload] 上传成功, fileID=${res.fileID}`);

  const tempRes = await cloud.getTempFileURL({
    fileList: [res.fileID],
  });

  const tempURL = tempRes.fileList[0]?.tempFileURL;
  if (!tempURL) {
    console.error('[Upload] 获取临时链接失败:', tempRes);
    throw new Error('获取临时链接失败');
  }

  console.log(`[Upload] 获取临时链接成功: ${tempURL.slice(0, 50)}...`);
  return {
    fileID: res.fileID,
    audioUrl: tempURL,
  };
}

// ============ 主入口 ============
exports.main = async (event, context) => {
  const { text } = event;

  console.log('[TTS-Guider] 云函数被调用, event.text长度=', text ? text.length : 'undefined');

  // 参数校验
  if (!text || typeof text !== 'string') {
    console.error('[TTS-Guider] 参数校验失败: text=', text, 'type=', typeof text);
    return { success: false, message: '缺少文本参数' };
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return { success: false, message: '文本内容为空' };
  }
  if (trimmedText.length > MAX_TEXT_LENGTH) {
    console.warn(`[TTS-Guider] 文本超过${MAX_TEXT_LENGTH}字限制，自动截取`);
  }

  const finalText = trimmedText.slice(0, MAX_TEXT_LENGTH);

  try {
    console.log(`[TTS-Guider] TTS合成开始，文本长度：${finalText.length}`);

    // ① 获取 Token
    const accessToken = await getBaiduAccessToken();

    // ② 调用百度 TTS
    const audioBuffer = await callBaiduTTS(finalText, accessToken);

    // ③ 上传到微信云存储
    const filename = `tts_${Date.now()}.mp3`;
    const uploadResult = await uploadToCloudStorage(audioBuffer, filename);

    console.log(`[TTS-Guider] 全部完成，返回 audioUrl`);
    return {
      success: true,
      audioUrl: uploadResult.audioUrl,
    };
  } catch (err) {
    console.error('[TTS-Guider] 执行失败:', err.message, err.stack);
    return {
      success: false,
      message: err.message || '语音生成失败',
    };
  }
};


