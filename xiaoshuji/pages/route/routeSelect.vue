<!-- pages/route/routeSelect.vue - 路线规划选择页 -->
<template>
	<view class="page-container">
		<!-- 顶部 Hero -->
		<view class="hero-section">
			<view class="hero-bg">
				<view class="hero-circle c1"></view>
				<view class="hero-circle c2"></view>
			</view>
			<view class="hero-content">
				<text class="hero-title">路线规划</text>
				<text class="hero-subtitle">探索四川文旅精华路线</text>
			</view>
			<!-- 我的路线入口 -->
			<view class="my-routes-btn" @click="goToMyRoutes">
				<text class="my-routes-icon">📁</text>
				<text class="my-routes-text">我的路线</text>
				<text class="my-routes-arrow">›</text>
			</view>
		</view>

		<!-- 标签筛选 -->
		<view class="filter-bar">
			<scroll-view scroll-x class="filter-scroll">
				<view class="filter-tags">
					<view 
						v-for="(tag, idx) in filterTags"
						:key="idx"
						:class="['filter-tag', currentFilter === idx ? 'active' : '']"
						@click="switchFilter(idx)"
					>
						<text>{{ tag.emoji }}</text>
						<text class="tag-name">{{ tag.name }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 路线列表 -->
		<scroll-view
			scroll-y
			class="route-scroll"
			:show-scrollbar="false"
			refresher-enabled
			@refresherrefresh="onRefresh"
			:refresher-triggered="isRefreshing"
		>
			<!-- 加载骨架 -->
			<view v-if="isLoading" class="skeleton-wrap">
				<view class="skeleton-card" v-for="i in 3" :key="i">
					<view class="skeleton-img"></view>
					<view class="skeleton-body">
						<view class="skeleton-line long"></view>
						<view class="skeleton-line medium"></view>
						<view class="skeleton-line short"></view>
					</view>
				</view>
			</view>

			<!-- 路线卡片 -->
			<view v-else class="route-list">
				<view
					v-for="(route, index) in filteredRoutes"
					:key="route.id"
					class="route-card"
					@click="selectRoute(route)"
				>
					<!-- 封面图 -->
					<view class="card-cover">
						<image
							v-if="route.coverImage"
							:src="route.coverImage"
							mode="aspectFill"
							class="cover-img"
							lazy-load
						></image>
						<view v-else class="cover-placeholder">
							<text class="placeholder-emoji">🗺️</text>
						</view>
						<!-- 标签 -->
						<view class="cover-tags">
							<view class="cover-tag" v-if="route.tag">{{ route.tag }}</view>
							<view class="cover-tag hot" v-if="route.isHot">🔥 热门</view>
						</view>
						<!-- 时长 -->
						<view class="cover-duration">
							<text>⏱ {{ route.duration }}</text>
						</view>
					</view>

					<!-- 路线信息 -->
					<view class="card-body">
						<view class="card-header-row">
							<text class="route-name">{{ route.name }}</text>
							<view class="route-rating" v-if="route.rating">
								<text class="rating-star">★</text>
								<text class="rating-num">{{ route.rating }}</text>
							</view>
						</view>
						<text class="route-desc">{{ route.desc }}</text>

						<!-- 途经点位 -->
						<view class="waypoints-row">
							<view class="waypoint-item" v-for="(pt, pi) in route.points.slice(0, 3)" :key="pi">
								<view class="waypoint-dot" :class="pi === 0 ? 'start' : pi === route.points.length - 1 ? 'end' : ''"></view>
								<text class="waypoint-name">{{ pt.name }}</text>
							</view>
							<text v-if="route.points.length > 3" class="more-points">+{{ route.points.length - 3 }}处</text>
						</view>

						<!-- 底部操作行 -->
						<view class="card-footer">
							<view class="route-meta">
								<view class="meta-chip">
									<text>📍</text>
									<text>{{ route.points.length }} 个点位</text>
								</view>
								<view class="meta-chip" v-if="route.distance">
									<text>🛣️</text>
									<text>{{ route.distance }}</text>
								</view>
							</view>
						<view class="use-btn" @click.stop="selectRoute(route)">
							<text>查看路线</text>
						</view>
						</view>
					</view>
				</view>

				<!-- 空状态 -->
				<view v-if="!filteredRoutes.length" class="empty-state">
					<text class="empty-icon">📭</text>
					<text class="empty-text">暂无路线，换个筛选试试吧</text>
				</view>
			</view>

			<view class="list-footer-space"></view>
		</scroll-view>

		<!-- 底部自定义按钮 -->
		<view class="bottom-bar">
			<view class="custom-route-btn" @click="createCustomRoute">
				<text class="btn-icon">+</text>
				<text class="btn-text">创建自定义路线</text>
			</view>
		</view>
	</view>
</template>

<script>
	// 预设非遗文旅路线数据（本地兜底）
	const PRESET_ROUTES = [
		{
			id: '001',
			name: '都江堰非遗一日游',
			desc: '含3个非遗点位+2个核心景点，深度体验蜀地水利文化与非遗技艺',
			duration: '约6小时',
			distance: '约35km',
			tag: '一日游',
			isHot: true,
			rating: '4.9',
			category: 'culture',
			coverImage: '',
			points: [
				{ name: '都江堰景区', lat: 31.0066, lng: 103.6146 },
				{ name: '都江堰非遗体验馆', lat: 31.0021, lng: 103.6182 },
				{ name: '青城山', lat: 30.9066, lng: 103.5746 }
			]
		},
		{
			id: '002',
			name: '蜀地文博专线',
			desc: '博物馆+非遗工坊，一站式了解四川历史文化精髓',
			duration: '约4小时',
			distance: '约8km',
			tag: '半日游',
			isHot: false,
			rating: '4.7',
			category: 'museum',
			coverImage: '',
			points: [
				{ name: '四川博物院', lat: 30.6573, lng: 103.9996 },
				{ name: '蜀锦织绣博物馆', lat: 30.6579, lng: 104.0294 },
				{ name: '宽窄巷子', lat: 30.6710, lng: 104.0621 }
			]
		},
		{
			id: '003',
			name: '峨眉山朝圣之旅',
			desc: '世界文化与自然双重遗产，感受千年佛教文化与壮美山川',
			duration: '约8小时',
			distance: '约180km',
			tag: '深度游',
			isHot: true,
			rating: '4.8',
			category: 'nature',
			coverImage: '',
			points: [
				{ name: '峨眉山大佛禅院', lat: 29.5998, lng: 103.4839 },
				{ name: '报国寺', lat: 29.5942, lng: 103.4827 },
				{ name: '峨眉山金顶', lat: 29.5103, lng: 103.3297 }
			]
		},
		{
			id: '004',
			name: '锦里·宽窄巷子民俗游',
			desc: '成都最具代表性的历史文化街区，体验川蜀民俗风情',
			duration: '约3小时',
			distance: '约5km',
			tag: '休闲游',
			isHot: false,
			rating: '4.6',
			category: 'folk',
			coverImage: '',
			points: [
				{ name: '锦里古街', lat: 30.6416, lng: 104.0553 },
				{ name: '武侯祠', lat: 30.6408, lng: 104.0481 },
				{ name: '宽窄巷子', lat: 30.6621, lng: 104.0482 }
			]
		}
	];

	export default {
		data() {
			return {
				isLoading: false,
				isRefreshing: false,
				currentFilter: 0,
				filterTags: [
					{ emoji: '🌟', name: '全部', key: 'all' },
					{ emoji: '🔥', name: '热门', key: 'hot' },
					{ emoji: '🏛️', name: '文博', key: 'museum' },
					{ emoji: '🌿', name: '自然', key: 'nature' },
					{ emoji: '🎭', name: '文化', key: 'culture' },
					{ emoji: '🎪', name: '民俗', key: 'folk' }
				],
				allRoutes: [],
			};
		},

		computed: {
			filteredRoutes() {
				const tag = this.filterTags[this.currentFilter];
				if (tag.key === 'all') return this.allRoutes;
				if (tag.key === 'hot') return this.allRoutes.filter(r => r.isHot);
				return this.allRoutes.filter(r => r.category === tag.key);
			}
		},

		onLoad() {
			this.loadRoutes();
		},

		methods: {
			// 加载路线（优先云数据库，失败用本地预设）
			async loadRoutes() {
				this.isLoading = true;
				try {
					const db = wx.cloud.database();
					const res = await db.collection('routes')
						.orderBy('sort', 'asc')
						.limit(20)
						.get();
					if (res.data && res.data.length > 0) {
						// 云数据库数据，转换字段
						this.allRoutes = res.data.map(item => ({
							id: item._id,
							name: item.name || '未命名路线',
							desc: item.desc || '',
							duration: item.duration || '若干小时',
							distance: item.distance || '',
							tag: item.tag || '',
							isHot: item.isHot || false,
							rating: item.rating || '',
							category: item.category || 'culture',
							coverImage: item.coverImage || '',
							points: item.spots || item.points || []
						}));
					} else {
						this.allRoutes = PRESET_ROUTES;
					}
				} catch (err) {
					console.warn('从云端加载路线失败，使用预设数据:', err);
					this.allRoutes = PRESET_ROUTES;
				} finally {
					this.isLoading = false;
				}
			},

			// 切换筛选标签
			switchFilter(e) {
				this.currentFilter = typeof e === 'number' ? e : e.detail.value;
			},

			// 选择预设路线，跳转到地图页
			selectRoute(route) {
				uni.navigateTo({
					url: '/pages/route/route?type=preset&data=' + encodeURIComponent(JSON.stringify(route))
				});
			},

			// 创建自定义路线
			createCustomRoute() {
				uni.navigateTo({
					url: '/pages/route/route?type=custom'
				});
			},

			// 跳转我的路线
			goToMyRoutes() {
				uni.navigateTo({
					url: '/pages/route/myRoutes'
				});
			},

			// 下拉刷新
			onRefresh() {
				this.isRefreshing = true;
				this.loadRoutes().finally(() => {
					this.isRefreshing = false;
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #F5F6FA;
	}

	/* ===== Hero ===== */
	.hero-section {
		background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
		padding: 50rpx 36rpx 70rpx;
		position: relative;
		overflow: hidden;

		.hero-bg {
			position: absolute;
			inset: 0;
			pointer-events: none;

			.hero-circle {
				position: absolute;
				border-radius: 50%;
				background: rgba(255,255,255,0.08);

				&.c1 {
					width: 300rpx;
					height: 300rpx;
					right: -60rpx;
					top: -80rpx;
				}

				&.c2 {
					width: 200rpx;
					height: 200rpx;
					right: 80rpx;
					bottom: -60rpx;
				}
			}
		}

		.hero-content {
			margin-bottom: 28rpx;

			.hero-title {
				display: block;
				font-size: 52rpx;
				font-weight: 800;
				color: #fff;
				margin-bottom: 10rpx;
				letter-spacing: 2rpx;
			}

			.hero-subtitle {
				display: block;
				font-size: 26rpx;
				color: rgba(255,255,255,0.85);
			}
		}

		.my-routes-btn {
			display: inline-flex;
			align-items: center;
			gap: 12rpx;
			background: rgba(255,255,255,0.2);
			backdrop-filter: blur(8px);
			border: 1rpx solid rgba(255,255,255,0.3);
			border-radius: 40rpx;
			padding: 16rpx 30rpx;

			.my-routes-icon { font-size: 30rpx; }

			.my-routes-text {
				font-size: 28rpx;
				color: #fff;
				font-weight: 600;
			}

			.my-routes-arrow {
				font-size: 32rpx;
				color: rgba(255,255,255,0.8);
				font-weight: 300;
			}
		}
	}

	/* ===== 筛选 ===== */
	.filter-bar {
		background: #fff;
		padding: 0 20rpx;
		margin-top: -24rpx;
		border-radius: 24rpx 24rpx 0 0;
		box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06);
		position: relative;
		z-index: 10;
	}

	.filter-scroll {
		width: 100%;
		white-space: nowrap;
	}

	.filter-tags {
		display: inline-flex;
		gap: 16rpx;
		padding: 24rpx 16rpx;
	}

	.filter-tag {
		display: flex;
		align-items: center;
		gap: 6rpx;
		padding: 14rpx 24rpx;
		background: #F5F6FA;
		border-radius: 40rpx;
		border: 2rpx solid transparent;
		white-space: nowrap;
		transition: all 0.2s;

		&.active {
			background: rgba(17, 153, 142, 0.08);
			border-color: #11998e;

			.tag-name {
				color: #11998e;
			}
		}

		.tag-name {
			font-size: 26rpx;
			color: #666;
			font-weight: 500;
		}
	}

	/* ===== 路线列表 ===== */
	.route-scroll {
		flex: 1;
		overflow: hidden;
	}

	.route-list {
		padding: 20rpx 24rpx 0;
	}

	/* ===== 路线卡片 ===== */
	.route-card {
		background: #fff;
		border-radius: 24rpx;
		margin-bottom: 24rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
		transition: all 0.2s;

		&:active { transform: scale(0.99); box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.04); }

		/* ===== 封面图 ===== */
		.card-cover {
			height: 260rpx;
			position: relative;
			background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);

			.cover-img {
				width: 100%;
				height: 100%;
			}

			.cover-placeholder {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;

				.placeholder-emoji { font-size: 80rpx; opacity: 0.5; }
			}

			.cover-tags {
				position: absolute;
				top: 20rpx;
				left: 20rpx;
				display: flex;
				gap: 12rpx;
			}

			.cover-tag {
				font-size: 22rpx;
				color: #fff;
				background: rgba(0,0,0,0.4);
				padding: 8rpx 18rpx;
				border-radius: 20rpx;
				backdrop-filter: blur(4px);

				&.hot {
					background: rgba(230,67,64,0.8);
				}
			}

			.cover-duration {
				position: absolute;
				bottom: 16rpx;
				right: 20rpx;
				font-size: 22rpx;
				color: #fff;
				background: rgba(0,0,0,0.45);
				padding: 8rpx 18rpx;
				border-radius: 20rpx;
				backdrop-filter: blur(4px);
			}
		}

		/* ===== 内容体 ===== */
		.card-body {
			padding: 28rpx 28rpx 24rpx;
		}

		.card-header-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12rpx;

			.route-name {
				font-size: 34rpx;
				font-weight: 700;
				color: #1A1A1A;
				flex: 1;
			}

			.route-rating {
				display: flex;
				align-items: center;
				gap: 4rpx;

				.rating-star { color: #FFB300; font-size: 26rpx; }
				.rating-num { font-size: 26rpx; color: #FFB300; font-weight: 600; }
			}
		}

		.route-desc {
			font-size: 26rpx;
			color: #888;
			line-height: 1.6;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
			margin-bottom: 20rpx;
		}

		/* 途经点位 */
		.waypoints-row {
			display: flex;
			align-items: center;
			gap: 0;
			margin-bottom: 20rpx;
			flex-wrap: nowrap;
			overflow: hidden;

			.waypoint-item {
				display: flex;
				align-items: center;
				gap: 8rpx;
				flex-shrink: 0;

				&:not(:first-child) {
					&::before {
						content: '→';
						font-size: 20rpx;
						color: #CCC;
						margin: 0 8rpx;
					}
				}

				.waypoint-dot {
					width: 16rpx;
					height: 16rpx;
					border-radius: 50%;
					background: #DDD;
					flex-shrink: 0;

					&.start { background: #11998e; }
					&.end { background: #E64340; }
				}

				.waypoint-name {
					font-size: 22rpx;
					color: #666;
					max-width: 120rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}

			.more-points {
				font-size: 22rpx;
				color: #11998e;
				margin-left: 12rpx;
				flex-shrink: 0;
			}
		}

		/* 底部操作行 */
		.card-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.route-meta {
				display: flex;
				gap: 16rpx;

				.meta-chip {
					display: flex;
					align-items: center;
					gap: 6rpx;
					font-size: 22rpx;
					color: #999;
					background: #F5F6FA;
					padding: 8rpx 16rpx;
					border-radius: 20rpx;
				}
			}

			.use-btn {
				background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
				color: #fff;
				font-size: 26rpx;
				font-weight: 600;
				padding: 18rpx 36rpx;
				border-radius: 40rpx;
				box-shadow: 0 4rpx 16rpx rgba(17,153,142,0.3);

				&:active { transform: scale(0.95); }
			}
		}
	}

	/* ===== 骨架屏 ===== */
	.skeleton-wrap {
		padding: 20rpx 24rpx;
	}

	.skeleton-card {
		background: #fff;
		border-radius: 24rpx;
		margin-bottom: 24rpx;
		overflow: hidden;

		.skeleton-img {
			height: 260rpx;
			background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
		}

		.skeleton-body {
			padding: 28rpx;

			.skeleton-line {
				height: 28rpx;
				border-radius: 14rpx;
				background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
				background-size: 200% 100%;
				animation: shimmer 1.5s infinite;
				margin-bottom: 16rpx;

				&.long { width: 75%; }
				&.medium { width: 55%; }
				&.short { width: 35%; }
			}
		}
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* ===== 空状态 ===== */
	.empty-state {
		text-align: center;
		padding: 80rpx 0;

		.empty-emoji { font-size: 80rpx; display: block; margin-bottom: 20rpx; }
		.empty-text { font-size: 28rpx; color: #BDBDBD; }
	}

	.list-footer-space { height: 160rpx; }

	/* ===== 底部按钮 ===== */
	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
		background: rgba(255,255,255,0.95);
		backdrop-filter: blur(20px);
		border-top: 1rpx solid rgba(0,0,0,0.06);
		z-index: 100;
	}

	.custom-route-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16rpx;
		height: 96rpx;
		background: linear-gradient(135deg, #E64340 0%, #c62c2a 100%);
		border-radius: 48rpx;
		box-shadow: 0 8rpx 24rpx rgba(230,67,64,0.3);
		transition: all 0.2s;

		&:active { transform: scale(0.98); box-shadow: 0 4rpx 12rpx rgba(230,67,64,0.2); }

		.btn-icon {
			font-size: 36rpx;
			color: #fff;
			font-weight: 300;
			line-height: 1;
		}

		.btn-text {
			font-size: 32rpx;
			font-weight: 600;
			color: #fff;
		}
	}
</style>
