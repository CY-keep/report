<!-- pages/route/route.vue -->
<!-- AI辅助生成：Claude, 2025-03
     - 路线规划交互（驾车/公交/步行模式切换）
     - 微信地图组件集成、途经点处理
     - 外部导航App唤起（高德/百度/腾讯/微信内置）
-->
<template>
	<view class="container">
		<!-- 顶部：出行方式切换 -->
		<view class="mode-tabs">
			<view v-for="(item, index) in modes" :key="index"
				:class="['tab', currentMode === item.value ? 'active' : '']" @click="switchMode(item.value)">
				{{ item.label }}
			</view>
		</view>

		<!-- 微信原生地图 -->
		<map id="myMap" :longitude="centerLng" :latitude="centerLat" :markers="markers" :polyline="routeLine"
			:include-points="includePoints" show-location enable-zoom show-scale
			style="width: 100%; height: calc(100vh - 520rpx - env(safe-area-inset-top) - env(safe-area-inset-bottom));"></map>

		<!-- 路线信息栏（规划后显示） -->
		<view v-if="routeInfo.show" class="route-info">
			<text>全程 {{ routeInfo.distance }} 公里，预计 {{ formatDuration(routeInfo.duration) }}</text>
		</view>

		<!-- 选点操作栏 -->
		<view class="bottom-bar">
			<!-- 导航模式：简化显示 -->
			<template v-if="navMode">
				<view class="nav-info-card">
					<view class="nav-dest">
						<text class="nav-label">目的地</text>
						<text class="nav-name">{{ destName }}</text>
					</view>
					<view class="nav-status" :class="{ 'status-locating': isLocating }">
						<text v-if="isLocating" class="locating-text">正在定位...</text>
						<text v-else-if="startName">{{ startName }}</text>
						<text v-else class="locate-tip">点击下方按钮定位</text>
					</view>
				</view>
				<view class="btn-group">
					<button v-if="routeInfo.show" class="nav-app-btn" @click="openExternalNav">
						<text class="nav-app-icon">🚗</text>
						<text class="nav-app-text">选择导航APP</text>
					</button>
					<button type="primary" class="main-btn" :disabled="!canNavigate || isLocating" @click="startNavigation">
						{{ isLocating ? '定位中...' : (routeInfo.show ? '重新规划' : '开始导航') }}
					</button>
				</view>
			</template>

			<!-- 普通路线模式 -->
			<template v-else>
				<view class="input-row">
					<button size="mini" class="action-btn" @click="choosePoint('start')">选起点</button>
					<button size="mini" class="quick-btn" @click="useMyLocationAsStart">我的位置</button>
					<text class="address-text">{{ startName || '请选起点' }}</text>
				</view>

				<!-- 途经点操作栏 -->
				<view class="waypoint-row">
					<button size="mini" type="default" class="waypoint-btn" @click="addWayPoint">+ 添加途经点</button>
					<text v-if="wayPoints.length > 0" class="waypoint-tip">已添加 {{ wayPoints.length }} 个途经点</text>
				</view>

				<view class="input-row">
					<button size="mini" class="action-btn" @click="choosePoint('end')">选终点</button>
					<button size="mini" class="quick-btn" @click="clearPoints">清空</button>
					<text class="address-text">{{ endName || '请选终点' }}</text>
				</view>

				<view class="btn-group">
					<button v-if="routeInfo.show" type="default" class="save-btn" @click="saveRoute">保存路线</button>
					<button v-if="routeInfo.show" class="nav-app-btn" @click="openExternalNav">
						<text class="nav-app-icon">🚗</text>
						<text class="nav-app-text">导航APP</text>
					</button>
					<button type="primary" class="main-btn" @click="planRoute">
						{{ routeInfo.show ? '重新规划' : '开始规划' }}
					</button>
				</view>
			</template>
		</view>
	</view>
</template>

<script>
	// 引入本地腾讯地图SDK
	import QQMapWX from '../../utils/qqmap-wx-jssdk.js'
	
	// 你的腾讯地图Key
	const TENCENT_MAP_KEY = 'NV7BZ-KHFCV-S4SPF-5ULSS-OVVNT-D4FMA'
	// 本地存储的Key
	const STORAGE_KEY = 'my_saved_routes'

	export default {
		data() {
			return {
				// 腾讯地图SDK实例
				qqmapsdk: null,
				// 默认中心点：成都市
				centerLat: 30.67,
				centerLng: 104.06,
				// 地图视野适配点
				includePoints: [],
				// 出行方式
modes: [{
					label: '驾车',
					value: 'driving'
				},
				{
					label: '步行',
					value: 'walking'
				}
			],
				currentMode: 'driving',
				// 起点终点
				startPoint: null,
				endPoint: null,
				startName: '',
				endName: '',
				// 新增：途经点数组
				wayPoints: [],
				// 地图标记和路线
				markers: [],
				routeLine: [],
				// 路线信息
				routeInfo: {
					show: false,
					distance: '',
					duration: ''
				},
				// 当前路线数据
				currentRouteData: null,
				// 导航模式：景点导航
				navMode: false,
				destName: '',
				destAddress: '',
				isLocating: false
			}
		},
		computed: {
			canNavigate() {
				return this.startPoint && !this.isLocating
			}
		},
		created() {
			// 初始化腾讯地图SDK
			this.qqmapsdk = new QQMapWX({
				key: TENCENT_MAP_KEY
			})
		},
		
		onLoad(options) {
			this.initMap()

			// 接收上一页传的参数
			if (options.type) {
				if (options.type === 'navigate') {
					// 导航模式：导航到景点
					this.navMode = true
					this.destName = decodeURIComponent(options.name || '景点')
					this.destAddress = decodeURIComponent(options.address || '')
					console.log('导航模式接收参数:', options)
					console.log('destName:', this.destName, 'destAddress:', this.destAddress)
					
					const destLat = parseFloat(options.lat)
					const destLng = parseFloat(options.lng)
					console.log('解析坐标:', destLat, destLng, 'isNaN:', isNaN(destLat), isNaN(destLng))
					
					if (destLat && destLng && !isNaN(destLat) && !isNaN(destLng)) {
						// 有坐标，直接使用
						console.log('使用直接坐标设置终点')
						this.endPoint = { lat: destLat, lng: destLng }
						this.endName = this.destName
						this.centerLat = destLat
						this.centerLng = destLng
						this.updateMarkers()
						// 自动获取用户位置
						this.autoLocateUser()
					} else {
						console.log('无坐标，调用searchDestination')
						// 没有坐标，根据景点名称搜索定位
						this.searchDestination()
					}
			} else if (options.type === 'preset' && options.data) {
				const route = JSON.parse(decodeURIComponent(options.data))
				this.loadPresetRoute(route)
			} else if (options.type === 'custom') {
				this.clearPoints()
				// 自定义路线模式：自动定位到用户当前位置
				this.locateUserAndCenter()
			}
			}
		},
		
		methods: {
			// 格式化预计时间：不超过1小时显示分钟，超过1小时显示小时+分钟
			formatDuration(duration) {
				if (duration === undefined || duration === null || duration === '') {
					return '0分钟'
				}
				const minutes = parseInt(duration) || 0
				if (minutes < 60) {
					return `${minutes}分钟`
				} else {
					const hours = Math.floor(minutes / 60)
					const mins = minutes % 60
					return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
				}
			},

			// 1. 初始化地图
			initMap() {
				this.updateMarkers()
			},

			// 1.5 自动获取用户位置（导航模式）
			autoLocateUser() {
				this.isLocating = true
				uni.getLocation({
					type: 'gcj02',
					timeout: 5000,
					success: (res) => {
						console.log('自动定位成功：', res)
						this.startPoint = {
							lat: res.latitude,
							lng: res.longitude
						}
						this.startName = '当前位置'
						this.centerLat = res.latitude
						this.centerLng = res.longitude
						this.updateMarkers()
						this.adjustMapView()
						
						// 定位成功后自动规划路线
						this.$nextTick(() => {
							this.planRoute()
						})
					},
					fail: (err) => {
						console.log('自动定位失败：', err)
						uni.showToast({
							title: '定位失败，请手动定位',
							icon: 'none'
						})
					},
					complete: () => {
						this.isLocating = false
					}
				})
			},

			// 1.5 根据景点名称搜索定位（当没有坐标时）
			searchDestination() {
				const keyword = this.destName || this.destAddress || ''
				console.log('searchDestination 关键词:', keyword)
				if (!keyword) {
					uni.showToast({ title: '无法获取景点位置信息', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '正在定位景点...' })
				
				// 使用腾讯地图关键词搜索
				this.qqmapsdk.getSuggestion({
					keyword: keyword,
					region: '四川省',  // 限定四川省范围提高准确性
					success: (res) => {
						uni.hideLoading()
						console.log('地点搜索结果：', JSON.stringify(res.data))
						
						if (res.data && res.data.length > 0) {
							// 取第一个结果
							const location = res.data[0]
							const lat = parseFloat(location.lat)
							const lng = parseFloat(location.lng)
							
							console.log('设置终点坐标:', lat, lng)
							this.endPoint = { lat, lng }
							this.endName = location.title || this.destName
							this.centerLat = lat
							this.centerLng = lng
							
							// 先更新标记点
							this.updateMarkers()
							console.log('标记点已更新，endPoint:', this.endPoint, 'markers:', this.markers)
							
							uni.showToast({
								title: `已定位：${this.endName}`,
								icon: 'success',
								duration: 1500
							})
							
							// 获取用户位置
							this.autoLocateUser()
						} else {
							console.log('搜索无结果，尝试用地区+名称搜索')
							// 搜索无结果，尝试更广泛的搜索
							this.qqmapsdk.getSuggestion({
								keyword: this.destName,
								policy: 1,  // 宽范围搜索
								success: (res2) => {
									console.log('第二次搜索结果：', JSON.stringify(res2.data))
									if (res2.data && res2.data.length > 0) {
										const location = res2.data[0]
										const lat = parseFloat(location.lat)
										const lng = parseFloat(location.lng)
										this.endPoint = { lat, lng }
										this.endName = location.title || this.destName
										this.centerLat = lat
										this.centerLng = lng
										this.updateMarkers()
										console.log('第二次搜索后标记点已更新')
										this.autoLocateUser()
									} else {
										uni.showToast({ title: '未找到该景点位置', icon: 'none' })
									}
								},
								fail: (err2) => {
									console.error('第二次搜索失败：', err2)
									uni.showToast({ title: '定位失败，请稍后重试', icon: 'none' })
								}
							})
						}
					},
					fail: (err) => {
						uni.hideLoading()
						console.error('地点搜索失败：', err)
						uni.showToast({ title: '定位失败，请稍后重试', icon: 'none' })
					}
				})
			},

			// 1.6 开始导航（导航模式）- 直接打开外部导航APP选择
			startNavigation() {
				if (!this.startPoint || !this.endPoint) {
					uni.showToast({ title: '请先设置起点', icon: 'none' })
					return
				}
				// 直接打开外部导航APP选择
				this.openExternalNav()
			},

			// 2. 加载预设路线（支持多途经点）
			loadPresetRoute(route) {
				this.currentRouteData = route
				// 第一个点位设为起点
				this.startPoint = {
					lat: route.points[0].lat,
					lng: route.points[0].lng
				}
				this.startName = route.points[0].name
				// 最后一个点位设为终点
				this.endPoint = {
					lat: route.points[route.points.length - 1].lat,
					lng: route.points[route.points.length - 1].lng
				}
				this.endName = route.points[route.points.length - 1].name
				// 中间点位设为途经点
				this.wayPoints = route.points.slice(1, route.points.length - 1)

			this.updateMarkers()
			this.adjustMapView()

			setTimeout(() => {
				this.planRoute()
			}, 500)
		},

		// 2.5 定位用户当前位置并设为起点（自定义路线模式）
		locateUserAndCenter() {
			uni.getLocation({
				type: 'gcj02',
				timeout: 5000,
				success: (res) => {
					console.log('自定义路线-定位成功：', res)
					this.startPoint = {
						lat: res.latitude,
						lng: res.longitude
					}
					this.startName = '当前位置'
					this.centerLat = res.latitude
					this.centerLng = res.longitude
					this.updateMarkers()
					this.adjustMapView()
				},
				fail: (err) => {
					console.log('自定义路线-定位失败：', err)
					uni.showToast({
						title: '定位失败，请手动选点',
						icon: 'none'
					})
				}
			})
		},

		// 3. 尝试获取定位（保留供"我的位置"按钮使用）
			tryGetLocation() {
				uni.getLocation({
					type: 'gcj02',
					timeout: 3000,
					success: (res) => {
						console.log('定位成功：', res)
						this.startPoint = {
							lat: res.latitude,
							lng: res.longitude
						}
						this.startName = '当前位置'
						this.centerLat = res.latitude
						this.centerLng = res.longitude
						this.updateMarkers()
						this.adjustMapView()
					},
					fail: (err) => {
						console.log('定位失败/超时：', err)
						uni.showToast({
							title: '定位失败，请手动选点',
							icon: 'none'
						})
					}
				})
			},

			// 4. 快捷：用我的位置作为起点
			useMyLocationAsStart() {
				uni.getLocation({
					type: 'gcj02',
					success: (res) => {
						this.startPoint = {
							lat: res.latitude,
							lng: res.longitude
						}
						this.startName = '当前位置'
						this.centerLat = res.latitude
						this.centerLng = res.longitude
						this.updateMarkers()
						this.adjustMapView()
						uni.showToast({
							title: '已设为起点',
							icon: 'success'
						})
					},
					fail: () => {
						uni.showToast({
							title: '定位失败，请手动选点',
							icon: 'none'
						})
					}
				})
			},

			// 5. 选择起点/终点
			choosePoint(type) {
				uni.chooseLocation({
					success: (res) => {
						const point = {
							lat: res.latitude,
							lng: res.longitude
						}
						if (type === 'start') {
							this.startPoint = point
							this.startName = res.name
						} else {
							this.endPoint = point
							this.endName = res.name
						}
						this.updateMarkers()
						this.adjustMapView()
					}
				})
			},

			// 6. 新增：添加途经点
			addWayPoint() {
				uni.chooseLocation({
					success: (res) => {
						this.wayPoints.push({
							id: Date.now(),
							name: res.name,
							lat: res.latitude,
							lng: res.longitude
						})
						this.updateMarkers()
						this.adjustMapView()
						uni.showToast({
							title: '已添加途经点',
							icon: 'success'
						})
					}
				})
			},

			// 7. 清空选点（含途经点）
			clearPoints() {
				this.endPoint = null
				this.endName = ''
				this.wayPoints = []
				this.routeLine = []
				this.routeInfo = {
					show: false,
					distance: '',
					duration: ''
				}
				this.currentRouteData = null
				this.updateMarkers()
				this.adjustMapView()
			},

			// 8. 更新地图标记点（含途经点）
			updateMarkers() {
				console.log('updateMarkers 被调用, startPoint:', this.startPoint, 'endPoint:', this.endPoint)
				let markers = []
				// 起点
				if (this.startPoint) {
					markers.push({
						id: 1,
						latitude: this.startPoint.lat,
						longitude: this.startPoint.lng,
						width: 30,
						height: 30,
						label: {
							content: '起',
							color: '#fff',
							fontSize: 12,
							bgColor: '#007AFF',
							borderRadius: 15,
							anchorX: 0.5,
							anchorY: 0.5
						},
						callout: {
							content: '起点',
							display: 'ALWAYS',
							bgColor: '#ffffff',
							padding: 5,
							borderRadius: 5
						}
					})
				}
				// 途经点
				this.wayPoints.forEach((item, index) => {
					markers.push({
						id: 100 + index,
						latitude: item.lat,
						longitude: item.lng,
						width: 30,
						height: 30,
						label: {
							content: `${index+1}`,
							color: '#fff',
							fontSize: 12,
							bgColor: '#FF9500',
							borderRadius: 15,
							anchorX: 0.5,
							anchorY: 0.5
						},
						callout: {
							content: item.name,
							display: 'ALWAYS',
							bgColor: '#ffffff',
							padding: 5,
							borderRadius: 5
						}
					})
				})
				// 终点
				if (this.endPoint) {
					markers.push({
						id: 2,
						latitude: this.endPoint.lat,
						longitude: this.endPoint.lng,
						width: 30,
						height: 30,
						label: {
							content: '终',
							color: '#fff',
							fontSize: 12,
							bgColor: '#FF4D4F',
							borderRadius: 15,
							anchorX: 0.5,
							anchorY: 0.5
						},
						callout: {
							content: '终点',
							display: 'ALWAYS',
							bgColor: '#ffffff',
							padding: 5,
							borderRadius: 5
						}
					})
				}
				this.markers = markers
				console.log('markers 已设置:', markers.length, '个标记')
			},

			// 9. 自动调整地图视野（含途经点）
			adjustMapView() {
				let points = []
				if (this.startPoint) points.push({
					latitude: this.startPoint.lat,
					longitude: this.startPoint.lng
				})
				// 途经点加入视野适配
				this.wayPoints.forEach(item => {
					points.push({
						latitude: item.lat,
						longitude: item.lng
					})
				})
				if (this.endPoint) points.push({
					latitude: this.endPoint.lat,
					longitude: this.endPoint.lng
				})
				this.includePoints = points
			},

			// 10. 切换出行方式
			switchMode(mode) {
				this.currentMode = mode
				if (this.startPoint && this.endPoint && this.routeInfo.show) {
					this.planRoute()
				}
			},

// 11. 核心：调用腾讯地图路线规划API（多段规划实现途经点）
		planRoute() {
			console.log('planRoute 被调用，途经点数量:', this.wayPoints.length)
			if (!this.startPoint || !this.endPoint) {
				uni.showToast({
					title: '请先选择起点和终点',
					icon: 'none'
				})
				return
			}

			uni.showLoading({ title: '规划中...' })

			// 构建所有分段：起点→途经点1→途经点2→...→终点
			const allPoints = [this.startPoint, ...this.wayPoints, this.endPoint]
			const totalSegments = allPoints.length - 1
			
			console.log('总段数:', totalSegments, '分段点:', allPoints)
			
			// 如果有途经点，分多段规划
			if (this.wayPoints.length > 0) {
				this.planMultiSegmentRoute(allPoints, totalSegments)
			} else {
				// 无途经点，直接规划
				this.planSingleSegment(this.startPoint, this.endPoint)
			}
		},
		
		// 11.1 多段路线规划（用于途经点）
		planMultiSegmentRoute(allPoints, totalSegments) {
			let completedSegments = 0
			let allCoords = []
			let totalDistance = 0
			let totalDuration = 0
			
			// 清空之前的路线
			this.routeLine = []
			this.routeCoords = []
			
			// 分段规划
			const planNextSegment = (fromIndex) => {
				if (fromIndex >= allPoints.length - 1) {
					// 所有分段规划完成
					this.finishMultiSegmentRoute(allCoords, totalDistance, totalDuration)
					return
				}
				
				const from = allPoints[fromIndex]
				const to = allPoints[fromIndex + 1]
				
				console.log(`规划第 ${fromIndex + 1}/${totalSegments} 段:`, from, '->', to)
				
				this.qqmapsdk.direction({
					mode: this.currentMode,
					from: { latitude: from.lat, longitude: from.lng },
					to: { latitude: to.lat, longitude: to.lng },
					success: (res) => {
						completedSegments++
						
						if (res.status === 0 && res.result && res.result.routes && res.result.routes.length > 0) {
							const route = res.result.routes[0]
							const coords = this.extractPolylineCoords(route.polyline)
							
							// 累加路线数据
							if (coords.length > 0) {
								allCoords = allCoords.concat(coords)
							}
							totalDistance += route.distance || 0
							totalDuration += route.duration || 0
						}
						
						// 继续规划下一段
						planNextSegment(fromIndex + 1)
					},
					fail: (err) => {
						completedSegments++
						console.error(`第 ${fromIndex + 1} 段规划失败:`, err)
						// 即使失败也继续尝试规划后续段
						planNextSegment(fromIndex + 1)
					}
				})
			}
			
			planNextSegment(0)
		},
		
		// 11.2 单段路线规划（无途经点）
		planSingleSegment(start, end) {
			this.qqmapsdk.direction({
				mode: this.currentMode,
				from: { latitude: start.lat, longitude: start.lng },
				to: { latitude: end.lat, longitude: end.lng },
				success: (res) => {
					uni.hideLoading()
					console.log('腾讯地图返回：', JSON.stringify(res, null, 2))

					if (res.status === 0 && res.result && res.result.routes && res.result.routes.length > 0) {
						this.drawRouteOnMap(res)
					} else if (res.status === 0 && res.data && res.data.result && res.data.result.routes) {
						this.drawRouteOnMap(res.data)
					} else {
						uni.showToast({
							title: res.message || '规划失败，请检查网络',
							icon: 'none',
							duration: 2000
						})
					}
				},
				fail: (err) => {
					uni.hideLoading()
					uni.showToast({
						title: '网络超时，请稍后重试',
						icon: 'none'
					})
					console.error('腾讯地图API请求失败：', err)
				}
			})
		},
		
		// 11.3 提取 polyline 坐标
		extractPolylineCoords(polyline) {
			const coords = []
			if (!polyline || !Array.isArray(polyline) || polyline.length < 2) {
				return coords
			}
			
			let currentLat = polyline[0]
			let currentLng = polyline[1]
			
			if (typeof currentLat === 'number' && typeof currentLng === 'number' &&
				currentLat >= 15 && currentLat <= 55 && currentLng >= 73 && currentLng <= 136) {
				coords.push({ latitude: currentLat, longitude: currentLng })
			}
			
			for (let i = 2; i < polyline.length - 1; i += 2) {
				const dlat = polyline[i]
				const dlng = polyline[i + 1]
				
				if (typeof dlat === 'number' && typeof dlng === 'number') {
					currentLat += dlat / 1e6
					currentLng += dlng / 1e6
					
					if (currentLat >= 15 && currentLat <= 55 && currentLng >= 73 && currentLng <= 136) {
						coords.push({ latitude: currentLat, longitude: currentLng })
					}
				}
			}
			
			return coords
		},
		
		// 11.4 完成多段路线绘制
		finishMultiSegmentRoute(allCoords, totalDistance, totalDuration) {
			uni.hideLoading()
			
			if (allCoords.length < 2) {
				uni.showToast({ title: '路线规划失败', icon: 'none' })
				return
			}
			
			// 限制坐标点数量
			if (allCoords.length > 500) {
				allCoords = this.simplifyRoute(allCoords, 500)
			}
			
			// 更新路线信息（使用 $set 确保响应式更新）
			this.$set(this.routeInfo, 'show', true)
			this.$set(this.routeInfo, 'distance', (totalDistance / 1000).toFixed(1))
			this.$set(this.routeInfo, 'duration', totalDuration)
			
			// 绘制完整路线
			this.routeLine = [{
				points: allCoords,
				color: '#007AFF',
				width: 6,
				dottedLine: false
			}]
			
			this.adjustMapView()
			console.log('多段路线绘制成功，总距离:', totalDistance, '米，总时间:', totalDuration, '分钟')
		},

// 12. 绘制路线并显示信息
			drawRouteOnMap(data) {
				let routeCoords = []

				try {
					// 获取路线数据
					const route = data.result && data.result.routes ? data.result.routes[0] : data.route

					if (!route) {
						uni.showToast({
							title: '未找到可行路线',
							icon: 'none'
						})
						console.warn('路线数据为空:', JSON.stringify(data).substring(0, 500))
						return
					}

					// 解析 polyline 坐标点
					if (route.polyline) {
						// 使用通用方法提取坐标
						routeCoords = this.extractPolylineCoords(route.polyline)
					} else if (route.steps) {
						// 旧版API：steps 数组
						route.steps.forEach(step => {
							if (step.polyline) {
								let pl = this.decodePolyline(step.polyline)
								if (Array.isArray(pl)) {
									routeCoords = routeCoords.concat(pl)
								}
							}
						})
					}

					// 更新路线信息（使用 $set 确保响应式更新）
					this.$set(this.routeInfo, 'show', true)
					this.$set(this.routeInfo, 'distance', route.distance ? (route.distance / 1000).toFixed(1) : '0')
					this.$set(this.routeInfo, 'duration', route.duration || 0)

					// 如果没有坐标点，提示用户
					if (routeCoords.length < 2) {
						uni.showToast({
							title: '路线数据解析失败',
							icon: 'none'
						})
						console.warn('路线坐标点不足，数据结构:', JSON.stringify(data).substring(0, 500))
						return
					}

					// 限制坐标点数量以提升性能（超过500点只保留关键点）
					if (routeCoords.length > 500) {
						routeCoords = this.simplifyRoute(routeCoords, 500)
						console.log('路线坐标过多，已简化至:', routeCoords.length)
					}

					// 绘制路线
					this.routeLine = [{
						points: routeCoords,
						color: '#007AFF',
						width: 6,
						dottedLine: false
					}]

					// 调整地图视野
					this.adjustMapView()

					console.log('路线绘制成功，坐标点数:', routeCoords.length)
				} catch (e) {
					console.error('路线解析失败:', e)
					uni.showToast({
						title: '路线解析异常',
						icon: 'none'
					})
					// 清空错误的路线
					this.routeLine = []
				}
			},

		// 13. 选择外部导航APP
			openExternalNav() {
				if (!this.endPoint) {
					uni.showToast({ title: '请先设置终点', icon: 'none' })
					return
				}
				
				const lat = this.endPoint.lat
				const lng = this.endPoint.lng
				const name = this.endName || '目的地'
				const address = this.destAddress || name
				
				uni.showActionSheet({
					itemList: ['高德地图', '百度地图', '腾讯地图', '微信内置地图'],
					success: (res) => {
						const navInfo = `目的地：${name}\n坐标：${lat.toFixed(6)},${lng.toFixed(6)}`

						// 根据选择的APP打开对应的导航方式
						if (res.tapIndex === 3) {
							// 微信内置地图导航（最稳定的方式）
							wx.openLocation({
								latitude: lat,
								longitude: lng,
								name: name,
								address: address,
								scale: 18,
								success: () => {
									console.log('微信内置地图打开成功')
								},
								fail: (err) => {
									console.error('微信内置地图打开失败:', err)
									uni.showToast({ title: '打开失败，请尝试其他方式', icon: 'none' })
								}
							})
						} else {
							// 外部导航APP
							let scheme = ''
							switch (res.tapIndex) {
								case 0: // 高德地图
									scheme = `androidamap://navi?sourceApplication=四川非遗导览&keyword=${encodeURIComponent(name)}&lat=${lat}&lon=${lng}&dev=1&style=2`
									break
								case 1: // 百度地图
									scheme = `bdmap://direction?origin=name:我的位置|latlng:${this.startPoint?.lat || 0},${this.startPoint?.lng || 0}&destination=name:${encodeURIComponent(name)}|latlng:${lat},${lng}&coord_type=gcj02&mode=driving`
									break
								case 2: // 腾讯地图
									scheme = `qqmap://map/routeplan?type=drive&from=我的位置&to=${encodeURIComponent(name)},latlng:${lat},${lng}&referer=四川非遗导览`
									break
							}
							
							// 微信小程序环境提示
							uni.showModal({
								title: '即将打开导航APP',
								content: `${name}\n坐标：${lat.toFixed(6)}, ${lng.toFixed(6)}\n\n请长按复制以下链接到浏览器打开，或使用「微信内置地图」直接导航`,
								confirmText: '复制坐标',
								cancelText: '用微信地图',
								success: (modalRes) => {
									if (modalRes.confirm) {
										uni.setClipboardData({
											data: `${lat},${lng}`,
											success: () => {
												uni.showToast({
													title: '坐标已复制，可在导航APP中使用',
													icon: 'none',
													duration: 2500
												})
											}
										})
									} else {
										// 使用微信内置地图
										wx.openLocation({
											latitude: lat,
											longitude: lng,
											name: name,
											address: address,
											scale: 18
										})
									}
								}
							})
						}
					}
				})
			},

			// 14. 保存路线到本地（含途经点）
			saveRoute() {
				if (!this.startPoint || !this.endPoint) {
					uni.showToast({
						title: '请先规划路线',
						icon: 'none'
					})
					return
				}

				// 构建完整的路线数据（含途经点）
				let allPoints = [{
					name: this.startName,
					lat: this.startPoint.lat,
					lng: this.startPoint.lng
				}]
				// 加入途经点
				this.wayPoints.forEach(item => {
					allPoints.push({
						name: item.name,
						lat: item.lat,
						lng: item.lng
					})
				})
				// 加入终点
				allPoints.push({
					name: this.endName,
					lat: this.endPoint.lat,
					lng: this.endPoint.lng
				})

				const routeToSave = {
id: Date.now().toString(),
				name: this.startName + ' → ' + this.endName,
				desc: this.wayPoints.length > 0 ? `含${this.wayPoints.length}个途经点` : '自定义路线',
				duration: this.formatDuration(this.routeInfo.duration),
				points: allPoints,
				saveTime: new Date().toLocaleString()
				}

				let savedRoutes = []
				try {
					const stored = uni.getStorageSync(STORAGE_KEY)
					if (stored) {
						savedRoutes = JSON.parse(stored)
					}
				} catch (e) {
					console.error('读取本地存储失败：', e)
				}

				savedRoutes.unshift(routeToSave)

				try {
					uni.setStorageSync(STORAGE_KEY, JSON.stringify(savedRoutes))
					uni.showToast({
						title: '路线保存成功',
						icon: 'success'
					})
				} catch (e) {
					uni.showToast({
						title: '保存失败，请重试',
						icon: 'none'
					})
					console.error('保存失败：', e)
				}
			},

			// 19. 简化路线点（抽稀算法，防止坐标点过多导致渲染卡顿）
			simplifyRoute(points, maxPoints) {
				if (!Array.isArray(points) || points.length <= maxPoints) {
					return points
				}

				// 计算抽稀间隔
				const step = Math.ceil(points.length / maxPoints)
				const simplified = []

				// 始终保留起点和终点
				simplified.push(points[0])

				for (let i = step; i < points.length - step; i += step) {
					simplified.push(points[i])
				}

				simplified.push(points[points.length - 1])
				return simplified
			},

			// 20. 腾讯地图polyline解压算法
			decodePolyline(str) {
				let points = []
				let index = 0,
					len = str.length
				let lat = 0,
					lng = 0
				while (index < len) {
					let b, shift = 0,
						result = 0
					do {
						b = str.charCodeAt(index++) - 63
						result |= (b & 0x1f) << shift
						shift += 5
					} while (b >= 0x20)
					let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
					lat += dlat
					shift = 0
					result = 0
					do {
						b = str.charCodeAt(index++) - 63
						result |= (b & 0x1f) << shift
						shift += 5
					} while (b >= 0x20)
					let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
					lng += dlng
					points.push({
						lat: lat * 1e-6,
						lng: lng * 1e-6
					})
				}
				return points
			}
		}
	}
</script>

<style scoped>
	.container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100vh;
		background-color: #f5f5f5;
		overflow: hidden;
	}

	/* 顶部Tab栏 */
	.mode-tabs {
		display: flex;
		justify-content: space-around;
		padding: 20rpx 30rpx;
		padding-top: calc(20rpx + env(safe-area-inset-top));
		background: #fff;
		border-bottom: 1px solid #eee;
		z-index: 10;
		flex-shrink: 0;
	}

	.tab {
		padding: 12rpx 40rpx;
		border-radius: 40rpx;
		background: #f5f5f5;
		font-size: 28rpx;
		color: #333;
		transition: all 0.3s;
	}

	.tab.active {
		background: #007AFF;
		color: #fff;
		font-weight: bold;
	}

	/* 路线信息栏 */
	.route-info {
		padding: 15rpx 30rpx;
		background: #fff;
		border-bottom: 1px solid #eee;
		text-align: center;
		font-size: 28rpx;
		color: #007AFF;
		font-weight: bold;
		flex-shrink: 0;
	}

	/* 底部操作栏 */
	.bottom-bar {
		padding: 25rpx 30rpx;
		padding-bottom: calc(25rpx + env(safe-area-inset-bottom));
		background: #fff;
		border-top: 1px solid #eee;
		flex-shrink: 0;
	}

	.input-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	/* 新增：途经点行 */
	.waypoint-row {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.waypoint-btn {
		background: #f0f0f0;
		color: #333;
		font-size: 24rpx;
		margin-right: 15rpx;
		flex-shrink: 0;
	}

	.waypoint-tip {
		font-size: 24rpx;
		color: #999;
	}

	.action-btn {
		background: #007AFF;
		color: #fff;
		font-size: 24rpx;
		margin-right: 15rpx;
		flex-shrink: 0;
	}

	.quick-btn {
		background: #f0f0f0;
		color: #333;
		font-size: 22rpx;
		margin-right: 15rpx;
		flex-shrink: 0;
	}

	.address-text {
		flex: 1;
		font-size: 26rpx;
		color: #333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.btn-group {
		display: flex;
		gap: 20rpx;
		margin-top: 10rpx;
	}

	.save-btn {
		flex: 1;
		background: #f0f0f0;
		color: #333;
		font-size: 28rpx;
		border-radius: 12rpx;
	}

	.main-btn {
		flex: 2;
		background: #007AFF;
		color: #fff;
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 12rpx;
		padding: 20rpx 0;
	}

	.nav-app-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		flex: 1.5;
		background: linear-gradient(135deg, #43d39e 0%, #00b094 100%);
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		border-radius: 12rpx;
		padding: 20rpx 0;
	}

	.nav-app-icon {
		font-size: 32rpx;
	}

	.nav-app-text {
		font-size: 26rpx;
	}

	/* 导航模式：简化UI */
	.nav-info-card {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		border: 1rpx solid #dee2e6;
	}

	.nav-dest {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 16rpx;
	}

	.nav-label {
		font-size: 22rpx;
		color: #6c757d;
		background: #e9ecef;
		padding: 6rpx 16rpx;
		border-radius: 20rpx;
	}

	.nav-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #212529;
		flex: 1;
	}

	.nav-status {
		display: flex;
		align-items: center;
		gap: 12rpx;
		font-size: 26rpx;
		color: #495057;
		padding-left: 8rpx;
	}

	.nav-status .locate-tip {
		color: #868e96;
		font-size: 24rpx;
	}

	.nav-status.status-locating .locating-text {
		color: #007AFF;
		animation: blink 1s ease infinite;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>