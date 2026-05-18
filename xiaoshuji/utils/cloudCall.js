/**
 * utils/cloudCall.js
 * 微信云开发调用封装
 * 统一处理错误、loading、重试逻辑
 *
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-08
 * - 添加getTempFileURL批量处理和超时控制
 * - 添加processImageFields云存储图片字段自动转换
 * - 优化错误处理逻辑
 */

/**
 * 调用云函数（带统一错误处理）
 * @param {string} name - 云函数名
 * @param {object} data - 参数
 * @param {object} options - { showLoading, loadingText, silent }
 * @returns {Promise<any>} result
 */
export async function callCloud(name, data = {}, options = {}) {
	const { showLoading = false, loadingText = '加载中...', silent = false } = options;

	if (showLoading) {
		uni.showLoading({ title: loadingText, mask: true });
	}

	try {
		const res = await wx.cloud.callFunction({ name, data });
		if (res.result && res.result.success === false) {
			throw new Error(res.result.message || '操作失败');
		}
		return res.result;
	} catch (err) {
		console.error(`[cloudCall] ${name} 失败:`, err);
		if (!silent) {
			uni.showToast({ title: err.message || '网络错误，请重试', icon: 'none' });
		}
		throw err;
	} finally {
		if (showLoading) {
			uni.hideLoading();
		}
	}
}

/**
 * 云数据库 - 获取单条记录
 * @param {string} collection - 集合名
 * @param {string} id - 文档 ID
 */
export async function dbGet(collection, id) {
	const db = wx.cloud.database();
	const res = await db.collection(collection).doc(id).get();
	return res.data;
}

/**
 * 云数据库 - 分页查询
 * @param {string} collection - 集合名
 * @param {object} where - 查询条件
 * @param {object} options - { page, pageSize, orderBy, orderDir }
 */
export async function dbQuery(collection, where = {}, options = {}) {
	const { page = 0, pageSize = 10, orderBy = 'createTime', orderDir = 'desc' } = options;
	const db = wx.cloud.database();
	const res = await db.collection(collection)
		.where(where)
		.orderBy(orderBy, orderDir)
		.skip(page * pageSize)
		.limit(pageSize)
		.get();
	return res.data;
}

/**
 * 云数据库 - 计数
 * @param {string} collection
 * @param {object} where
 */
export async function dbCount(collection, where = {}) {
	const db = wx.cloud.database();
	const res = await db.collection(collection).where(where).count();
	return res.total;
}

/**
 * 云数据库 - 新增文档
 * @param {string} collection
 * @param {object} data
 */
export async function dbAdd(collection, data) {
	const db = wx.cloud.database();
	const res = await db.collection(collection).add({ data });
	return res._id;
}

/**
 * 云数据库 - 更新文档
 * @param {string} collection
 * @param {string} id
 * @param {object} data
 */
export async function dbUpdate(collection, id, data) {
	const db = wx.cloud.database();
	await db.collection(collection).doc(id).update({ data });
}

/**
 * 云数据库 - 字段自增
 * @param {string} collection
 * @param {string} id
 * @param {string} field
 * @param {number} step
 */
export async function dbIncrement(collection, id, field, step = 1) {
	const db = wx.cloud.database();
	const _ = db.command;
	await db.collection(collection).doc(id).update({
		data: { [field]: _.inc(step) }
	});
}

/**
 * 上传文件到云存储
 * @param {string} localPath - 本地临时路径
 * @param {string} dirPath - 云存储目录（不含文件名）
 * @returns {string} fileID
 */
export async function uploadFile(localPath, dirPath = 'uploads') {
	const ext = localPath.split('.').pop() || 'jpg';
	const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
	const cloudPath = `${dirPath}/${fileName}`;

	const res = await wx.cloud.uploadFile({ cloudPath, filePath: localPath });
	return res.fileID;
}

/**
 * 构建模糊搜索条件（多字段 OR）
 * @param {string} keyword
 * @param {string[]} fields
 */
export function buildSearchCondition(keyword, fields = ['name', 'brief', 'category', 'location']) {
	const db = wx.cloud.database();
	const regexp = db.RegExp({ regexp: keyword, options: 'i' });
	return db.command.or(fields.map(f => ({ [f]: regexp })));
}

/**
 * 获取云存储图片的临时链接（带超时处理）
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-11
 * - 添加批量处理和分批请求逻辑
 * - 添加Promise.race超时控制
 * @param {string|string[]} fileID - 云存储文件ID（cloud://开头）或文件ID数组
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<string|string[]>} 临时链接
 */
export async function getTempFileURL(fileID, timeout = 5000) {
	if (!fileID) return '';
	
	// 如果是数组，批量处理
	if (Array.isArray(fileID)) {
		if (fileID.length === 0) return [];
		const validIds = fileID.filter(id => id && id.startsWith('cloud://'));
		if (validIds.length === 0) return fileID;
		
		// 分批处理，每批最多10个，避免超时
		const batchSize = 10;
		const results = [];
		
		for (let i = 0; i < validIds.length; i += batchSize) {
			const batch = validIds.slice(i, i + batchSize);
			try {
				const res = await Promise.race([
					wx.cloud.getTempFileURL({ fileList: batch }),
					new Promise((_, reject) => setTimeout(() => reject(new Error('获取图片超时')), timeout))
				]);
				results.push(...res.fileList);
			} catch (err) {
				console.warn('批量获取临时链接失败，使用原路径:', err.message);
				// 超时时返回原ID
				batch.forEach(id => results.push({ fileID: id, tempFileURL: '' }));
			}
		}
		
		const urlMap = {};
		results.forEach(item => {
			urlMap[item.fileID] = item.tempFileURL || item.fileID;
		});
		return fileID.map(id => urlMap[id] || id);
	}
	
	// 单个文件ID处理
	if (!fileID.startsWith('cloud://')) {
		return fileID; // 已经是http链接或本地路径
	}
	
	try {
		const res = await Promise.race([
			wx.cloud.getTempFileURL({ fileList: [fileID] }),
			new Promise((_, reject) => setTimeout(() => reject(new Error('获取图片超时')), timeout))
		]);
		if (res.fileList[0] && res.fileList[0].tempFileURL) {
			return res.fileList[0].tempFileURL;
		}
		return fileID;
	} catch (err) {
		console.warn('获取临时链接失败，使用原路径:', err.message);
		return fileID;
	}
}

/**
 * 处理数据中的云存储图片字段（带超时处理）
 * AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-11
 * - 支持单图和数组字段批量转换
 * - 添加分批处理避免云存储API超时
 * @param {object} data - 数据对象
 * @param {string[]} imageFields - 需要处理的图片字段名数组
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<object>} 处理后的数据
 */
export async function processImageFields(data, imageFields = ['coverImage', 'image', 'imageUrl', 'avatar'], timeout = 8000) {
	if (!data) return data;
	
	const result = Array.isArray(data) ? [...data] : { ...data };
	const fieldsToProcess = imageFields.filter(f => result[f]);

	if (fieldsToProcess.length === 0) return result;
	
	// 收集所有需要转换的fileID
	const fileIDs = [];
	const fieldMap = [];
	
	fieldsToProcess.forEach(field => {
		const value = result[field];
		if (Array.isArray(value)) {
			value.forEach((v, i) => {
				if (v && v.startsWith && v.startsWith('cloud://')) {
					fileIDs.push(v);
					fieldMap.push({ field, index: i, isArray: true });
				}
			});
		} else if (value && value.startsWith && value.startsWith('cloud://')) {
			fileIDs.push(value);
			fieldMap.push({ field, isArray: false });
		}
	});
	
	if (fileIDs.length === 0) return result;
	
	// 限制单次请求数量，避免超时
	const batchSize = 10;
	
	for (let i = 0; i < fieldMap.length; i += batchSize) {
		const batch = fieldMap.slice(i, i + batchSize);
		const batchIds = batch.map(({ field, index, isArray }) => 
			isArray ? result[field][index] : result[field]
		);
		
		try {
			const res = await Promise.race([
				wx.cloud.getTempFileURL({ fileList: batchIds }),
				new Promise((_, reject) => setTimeout(() => reject(new Error('图片处理超时')), timeout))
			]);
			
			const urlMap = {};
			res.fileList.forEach(item => {
				urlMap[item.fileID] = item.tempFileURL || item.fileID;
			});
			
			// 应用转换后的URL
			batch.forEach(({ field, index, isArray }) => {
				const originalId = isArray ? result[field][index] : result[field];
				const newUrl = urlMap[originalId] || originalId;
				if (isArray) {
					result[field][index] = newUrl;
				} else {
					result[field] = newUrl;
				}
			});
		} catch (err) {
			console.warn('处理图片字段失败，使用原路径:', err.message);
			// 超时时保留原 cloud:// 路径，图片组件会显示失败占位图
		}
	}
	
	return result;
}
