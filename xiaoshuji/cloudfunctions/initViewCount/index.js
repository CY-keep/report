/**
 * initViewCount 云函数
 * 批量初始化 heritage 和 scenic 集合的浏览量字段
 *
 * AI辅助生成：Claude, 2025-03
 * - 分批处理逻辑（云开发限制每次最多100条）
 * - 批量更新数据库字段
 */
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;

  try {
    const results = {
      heritage: { total: 0, success: 0 },
      scenic: { total: 0, success: 0 }
    };

    // 初始化 heritage 集合
    const heritageRes = await db.collection('heritage').count();
    results.heritage.total = heritageRes.total;
    
    // 分批处理 heritage（云开发限制每次最多100条）
    let heritageSkip = 0;
    while (heritageSkip < heritageRes.total) {
      const heritageBatch = await db.collection('heritage')
        .skip(heritageSkip)
        .limit(100)
        .get();
      
      for (const doc of heritageBatch.data) {
        // 如果没有 viewCount 字段或值为 undefined，则设置为 0
        if (doc.viewCount === undefined) {
          await db.collection('heritage').doc(doc._id).update({
            data: { viewCount: 0 }
          });
          results.heritage.success++;
        }
      }
      heritageSkip += 100;
    }

    // 初始化 scenic 集合
    const scenicRes = await db.collection('scenic').count();
    results.scenic.total = scenicRes.total;

    let scenicSkip = 0;
    while (scenicSkip < scenicRes.total) {
      const scenicBatch = await db.collection('scenic')
        .skip(scenicSkip)
        .limit(100)
        .get();
      
      for (const doc of scenicBatch.data) {
        if (doc.viewCount === undefined) {
          await db.collection('scenic').doc(doc._id).update({
            data: { viewCount: 0 }
          });
          results.scenic.success++;
        }
      }
      scenicSkip += 100;
    }

    return {
      success: true,
      message: '浏览量字段初始化完成',
      data: results
    };
  } catch (err) {
    console.error('初始化浏览量失败', err);
    return {
      success: false,
      message: err.message || '初始化失败'
    };
  }
};
