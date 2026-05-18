/**
 * utils/storage.js
 * 本地存储封装
 * 统一处理 JSON 序列化/反序列化、过期时间、命名空间
 */

const NS = 'sichuanHeritage_'; // 命名空间前缀，避免 key 冲突

/**
 * 存储键常量
 */
export const KEYS = {
	USER_INFO:      NS + 'userInfo',
	SEARCH_HISTORY: NS + 'searchHistory',
	FAVORITE_IDS:   NS + 'favoriteIds',
	ROUTE_LIST:     NS + 'routeList',
	AR_TIPS_SHOWN:  NS + 'arTipsShown',
	CHECKIN_DRAFT:  NS + 'checkinDraft'
};

/**
 * 设置缓存（可选过期时间）
 * @param {string} key
 * @param {any} value
 * @param {number} expireMs - 过期毫秒数（0 = 永不过期）
 */
export function setCache(key, value, expireMs = 0) {
	const item = {
		value,
		timestamp: Date.now(),
		expire: expireMs > 0 ? Date.now() + expireMs : 0
	};
	try {
		uni.setStorageSync(key, JSON.stringify(item));
	} catch (e) {
		console.warn('[storage] setCache 失败:', key, e);
	}
}

/**
 * 获取缓存（过期自动返回 null）
 * @param {string} key
 * @param {any} defaultVal - 缓存不存在或过期时的默认值
 */
export function getCache(key, defaultVal = null) {
	try {
		const raw = uni.getStorageSync(key);
		if (!raw) return defaultVal;
		const item = JSON.parse(raw);
		if (item.expire > 0 && Date.now() > item.expire) {
			uni.removeStorageSync(key);
			return defaultVal;
		}
		return item.value;
	} catch (e) {
		console.warn('[storage] getCache 失败:', key, e);
		return defaultVal;
	}
}

/**
 * 删除缓存
 */
export function removeCache(key) {
	try {
		uni.removeStorageSync(key);
	} catch (e) {
		console.warn('[storage] removeCache 失败:', key, e);
	}
}

/**
 * 清空所有本命名空间缓存
 */
export function clearAllCache() {
	try {
		const info = uni.getStorageInfoSync();
		(info.keys || [])
			.filter(k => k.startsWith(NS))
			.forEach(k => uni.removeStorageSync(k));
	} catch (e) {
		console.warn('[storage] clearAllCache 失败:', e);
	}
}

// ========== 业务封装 ==========

/**
 * 搜索历史
 */
export const searchHistory = {
	get() {
		return getCache(KEYS.SEARCH_HISTORY, []);
	},
	add(keyword) {
		if (!keyword) return;
		let list = this.get();
		list = list.filter(k => k !== keyword);
		list.unshift(keyword);
		if (list.length > 10) list = list.slice(0, 10);
		setCache(KEYS.SEARCH_HISTORY, list);
		return list;
	},
	clear() {
		removeCache(KEYS.SEARCH_HISTORY);
	}
};

/**
 * 用户信息
 */
export const userInfoStorage = {
	get() {
		return getCache(KEYS.USER_INFO, null);
	},
	set(info) {
		setCache(KEYS.USER_INFO, info);
	},
	clear() {
		removeCache(KEYS.USER_INFO);
	}
};

/**
 * 路线列表（自定义保存路线）
 */
export const routeStorage = {
	getAll() {
		return getCache(KEYS.ROUTE_LIST, []);
	},
	save(route) {
		const list = this.getAll();
		const idx = list.findIndex(r => r.id === route.id);
		if (idx >= 0) {
			list[idx] = route;
		} else {
			list.unshift({ ...route, id: Date.now().toString() });
		}
		setCache(KEYS.ROUTE_LIST, list);
		return list;
	},
	remove(id) {
		const list = this.getAll().filter(r => r.id !== id);
		setCache(KEYS.ROUTE_LIST, list);
		return list;
	}
};

/**
 * AR 使用引导是否已展示
 */
export const arTipsStorage = {
	hasShown() {
		return getCache(KEYS.AR_TIPS_SHOWN, false);
	},
	markShown() {
		setCache(KEYS.AR_TIPS_SHOWN, true);
	}
};

/**
 * 打卡草稿（防止意外退出丢失）
 */
export const checkinDraftStorage = {
	get() {
		return getCache(KEYS.CHECKIN_DRAFT, null);
	},
	set(draft) {
		setCache(KEYS.CHECKIN_DRAFT, draft, 24 * 60 * 60 * 1000); // 24h 过期
	},
	clear() {
		removeCache(KEYS.CHECKIN_DRAFT);
	}
};
