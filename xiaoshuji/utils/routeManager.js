// utils/routeManager.js

// 本地默认路线数据
const defaultRoutes = [{
		_id: 'preset1',
		id: 'preset1',
		name: '成都非遗一日游',
		description: '体验成都非遗文化精髓，感受蜀地风情',
		bgColor: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
		icon: '🏮',
		points: [{
				id: 1,
				name: '宽窄巷子',
				latitude: 30.666667,
				longitude: 104.066667
			},
			{
				id: 2,
				name: '锦里古街',
				latitude: 30.650000,
				longitude: 104.050000
			},
			{
				id: 3,
				name: '杜甫草堂',
				latitude: 30.670000,
				longitude: 104.030000
			},
			{
				id: 4,
				name: '文殊院',
				latitude: 30.674167,
				longitude: 104.068889
			}
		],
		duration: '一天',
		tags: ['传统建筑', '蜀锦', '茶文化']
	},
	{
		_id: 'preset2',
		id: 'preset2',
		name: '川西非遗之旅',
		description: '探索川西非遗文化，感受少数民族风情',
		bgColor: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
		icon: '🏔️',
		points: [{
				id: 1,
				name: '都江堰',
				latitude: 31.001550,
				longitude: 103.606651
			},
			{
				id: 2,
				name: '青城山',
				latitude: 30.901000,
				longitude: 103.569000
			}
		],
		duration: '两天',
		tags: ['水利工程', '道教文化', '羌族文化']
	},
	{
		_id: 'preset3',
		id: 'preset3',
		name: '川菜美食之旅',
		description: '探寻正宗川菜，品味麻辣鲜香',
		bgColor: 'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)',
		icon: '🍲',
		points: [{
				id: 1,
				name: '陈麻婆豆腐',
				latitude: 30.680000,
				longitude: 104.060000
			},
			{
				id: 2,
				name: '龙抄手',
				latitude: 30.670000,
				longitude: 104.070000
			},
			{
				id: 3,
				name: '钟水饺',
				latitude: 30.675000,
				longitude: 104.055000
			}
		],
		duration: '一天',
		tags: ['川菜', '美食', '麻辣']
	},
	{
		_id: 'preset4',
		id: 'preset4',
		name: '成都茶馆文化游',
		description: '品味成都茶馆文化，体验慢生活',
		bgColor: 'linear-gradient(135deg, #74B816 0%, #5C940D 100%)',
		icon: '🍵',
		points: [{
				id: 1,
				name: '人民公园茶馆',
				latitude: 30.668000,
				longitude: 104.060000
			},
			{
				id: 2,
				name: '文殊院香园',
				latitude: 30.674167,
				longitude: 104.068889
			},
			{
				id: 3,
				name: '宽窄巷子茶馆',
				latitude: 30.666667,
				longitude: 104.066667
			}
		],
		duration: '半天',
		tags: ['茶馆', '慢生活', '茶文化']
	}
]

class RouteManager {
	constructor() {
		this.hasCloud = false
		this.initialized = false
	}

	// 初始化云开发
	async initCloud() {
		try {
			// 检查是否支持云开发
			if (wx && wx.cloud && wx.cloud.init) {
				// 初始化云开发，不指定环境ID
				wx.cloud.init({
					traceUser: true
				})

				console.log('云开发初始化成功')
				this.hasCloud = true
				return true
			} else {
				console.warn('当前环境不支持云开发')
				this.hasCloud = false
				return false
			}
		} catch (err) {
			console.warn('云开发初始化失败:', err)
			this.hasCloud = false
			return false
		}
	}

	// 获取路线数据
	async getRoutes() {
		console.log('开始获取路线数据...')

		if (!this.initialized) {
			this.initialized = true
			await this.initCloud()
		}

		let cloudRoutes = []

		// 尝试从云开发获取
		if (this.hasCloud) {
			try {
				console.log('尝试从云开发获取数据...')
				cloudRoutes = await this.getFromCloud()
				console.log('从云开发获取到', cloudRoutes.length, '条数据')
			} catch (err) {
				console.warn('从云开发获取数据失败，使用本地数据:', err)
				cloudRoutes = []
			}
		} else {
			console.log('云开发不可用，使用本地数据')
		}

		// 合并数据：云开发数据 + 本地默认数据
		const allRoutes = []

		// 添加云开发数据
		if (cloudRoutes && Array.isArray(cloudRoutes)) {
			cloudRoutes.forEach(route => {
				if (route && route.name) {
					allRoutes.push(this.formatRoute(route, 'cloud'))
				}
			})
		}

		// 添加本地默认数据
		defaultRoutes.forEach(route => {
			allRoutes.push(this.formatRoute(route, 'local'))
		})

		console.log('最终路线数据数量:', allRoutes.length)
		return allRoutes
	}

	// 从云开发获取数据
	async getFromCloud() {
		return new Promise((resolve, reject) => {
			// 检查云函数是否存在
			if (!wx.cloud || !wx.cloud.callFunction) {
				console.warn('云函数调用不可用')
				resolve([])
				return
			}

			wx.cloud.callFunction({
				name: 'getRoutes',
				data: {},
				success: (res) => {
					console.log('云函数调用成功，返回结果:', res)

					if (res.result && res.result.code === 0 && res.result.data) {
						const routes = res.result.data.map((route, index) => {
							if (!route) return null

							// 确保有必要的字段
							const formattedRoute = {
								...route,
								_id: route._id || route.id || 'cloud_' + index +
									'_' + Date.now(),
								id: route.id || route._id || 'cloud_' + index +
									'_' + Date.now(),
								name: route.name || '未命名路线',
								description: route.description || '暂无描述',
								bgColor: route.bgColor || this.getRandomColor(),
								icon: route.icon || this.getRandomIcon(),
								points: Array.isArray(route.points) ? route.points :
									[],
								duration: route.duration || '半天',
								tags: Array.isArray(route.tags) ? route.tags : []
							}

							return formattedRoute
						}).filter(route => route !== null)

						console.log('处理后的云数据:', routes)
						resolve(routes)
					} else {
						console.log('云数据返回异常，使用空数据')
						resolve([])
					}
				},
				fail: (err) => {
					console.warn('云函数调用失败，使用本地数据:', err)
					// 这里不 reject，而是返回空数组
					resolve([])
				}
			})
		})
	}

	// 格式化路线
	formatRoute(route, source = 'local') {
		return {
			_id: route._id || route.id || source + '_' + Date.now(),
			id: route.id || route._id || source + '_' + Date.now(),
			name: route.name || '未命名路线',
			description: route.description || '暂无描述',
			bgColor: route.bgColor || this.getRandomColor(),
			icon: route.icon || this.getRandomIcon(),
			points: Array.isArray(route.points) ? route.points : [],
			duration: route.duration || '半天',
			tags: Array.isArray(route.tags) ? route.tags : [],
			source: source, // 标记数据来源
			isFeatured: route.isFeatured || false,
			viewCount: route.viewCount || 0,
			likeCount: route.likeCount || 0
		}
	}

	// 获取随机颜色
	getRandomColor() {
		const colors = [
			'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
			'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
			'linear-gradient(135deg, #FF4E50 0%, #F9D423 100%)',
			'linear-gradient(135deg, #74B816 0%, #5C940D 100%)',
			'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
			'linear-gradient(135deg, #f46b45 0%, #eea849 100%)'
		]
		return colors[Math.floor(Math.random() * colors.length)]
	}

	// 获取随机图标
	getRandomIcon() {
		const icons = ['🏮', '🏔️', '🍲', '🍵', '🎭', '🎨', '📚', '🎵', '🎪', '🔮']
		return icons[Math.floor(Math.random() * icons.length)]
	}

	// 刷新路线数据
	async refreshRoutes() {
		console.log('刷新路线数据...')
		// 重置初始化状态，强制重新检查云开发
		this.initialized = false
		this.hasCloud = false
		return await this.getRoutes()
	}
}

export default new RouteManager()