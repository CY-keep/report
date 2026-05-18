/**
 * 地图工具函数
 */

// 计算两点间距离（米）
export function calculateDistance(lat1, lng1, lat2, lng2) {
	const R = 6371000 // 地球半径（米）
	const dLat = (lat2 - lat1) * Math.PI / 180
	const dLng = (lng2 - lng1) * Math.PI / 180
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

// 格式化距离
export function formatDistance(meters) {
	if (meters < 1000) {
		return `${Math.round(meters)}米`
	} else {
		return `${(meters / 1000).toFixed(1)}公里`
	}
}

// 格式化时间
export function formatDuration(seconds) {
	if (seconds < 60) {
		return `${seconds}秒`
	} else if (seconds < 3600) {
		return `${Math.ceil(seconds / 60)}分钟`
	} else {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.ceil((seconds % 3600) / 60)
		if (minutes === 0) {
			return `${hours}小时`
		} else {
			return `${hours}小时${minutes}分`
		}
	}
}

// 检查是否安装地图APP
export function checkMapAppInstalled(app) {
	return new Promise((resolve) => {
		if (uni.canIUse('getProvider')) {
			uni.getProvider({
				service: 'oauth',
				success: (res) => {
					resolve(res.provider.includes(app))
				},
				fail: () => {
					resolve(false)
				}
			})
		} else {
			resolve(false)
		}
	})
}

// 生成外部地图URL
export function generateMapURL(start, end, mode, mapType) {
	const {
		latitude: slat,
		longitude: slon
	} = start
	const {
		latitude: dlat,
		longitude: dlon
	} = end
	const dname = encodeURIComponent(end.name || '目的地')
	const sname = encodeURIComponent('我的位置')

	switch (mapType) {
		case 'gaode':
			// 高德地图
			const gaodeMode = mode === 'drive' ? 0 : mode === 'walk' ? 2 : 1
			return `amapuri://route/plan/?slat=${slat}&slon=${slon}&sname=${sname}&dlat=${dlat}&dlon=${dlon}&dname=${dname}&dev=0&t=${gaodeMode}`

		case 'tencent':
			// 腾讯地图
			const tencentMode = mode === 'drive' ? 'drive' : mode === 'walk' ? 'walk' : 'bike'
			return `qqmap://map/routeplan?type=${tencentMode}&from=${sname}&fromcoord=${slat},${slon}&to=${dname}&tocoord=${dlat},${dlon}`

		case 'baidu':
			// 百度地图
			const baiduMode = mode === 'drive' ? 'driving' : mode === 'walk' ? 'walking' : 'riding'
			return `baidumap://map/direction?origin=${sname}&origin_poi=${slat},${slon}&destination=${dname}&destination_poi=${dlat},${dlon}&mode=${baiduMode}&src=yourAppName`

		default:
			return ''
	}
}

// 计算地图边界中心
export function calculateBoundsCenter(bounds) {
	if (!bounds || !bounds.northeast || !bounds.southwest) {
		return null
	}

	return {
		latitude: (bounds.northeast.lat + bounds.southwest.lat) / 2,
		longitude: (bounds.northeast.lng + bounds.southwest.lng) / 2
	}
}

// 计算合适的缩放级别
export function calculateZoomLevel(bounds) {
	if (!bounds) return 16

	const latDiff = Math.abs(bounds.northeast.lat - bounds.southwest.lat)
	const lngDiff = Math.abs(bounds.northeast.lng - bounds.southwest.lng)
	const maxDiff = Math.max(latDiff, lngDiff)

	if (maxDiff > 0.2) return 11
	if (maxDiff > 0.1) return 12
	if (maxDiff > 0.05) return 13
	if (maxDiff > 0.02) return 14
	if (maxDiff > 0.01) return 15
	return 16
}

// 坐标转换（如果需要）
export function coordinateTransform(lat, lng, fromType = 'wgs84', toType = 'gcj02') {
	// 这里实现坐标转换逻辑
	// 实际项目中可能需要根据不同的地图服务进行坐标转换
	return {
		latitude: lat,
		longitude: lng
	}
}

// 获取当前位置
export function getCurrentLocation() {
	return new Promise((resolve, reject) => {
		uni.getLocation({
			type: 'gcj02',
			isHighAccuracy: true,
			success: resolve,
			fail: reject
		})
	})
}

// 检查定位权限
export function checkLocationPermission() {
	return new Promise((resolve, reject) => {
		uni.getSetting({
			success: (res) => {
				if (!res.authSetting['scope.userLocation']) {
					uni.authorize({
						scope: 'scope.userLocation',
						success: resolve,
						fail: reject
					})
				} else {
					resolve(true)
				}
			},
			fail: reject
		})
	})
}

export default {
	calculateDistance,
	formatDistance,
	formatDuration,
	checkMapAppInstalled,
	generateMapURL,
	calculateBoundsCenter,
	calculateZoomLevel,
	coordinateTransform,
	getCurrentLocation,
	checkLocationPermission
}