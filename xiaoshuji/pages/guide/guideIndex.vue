<!-- pages/guide/guideIndex.vue - 探索导览中心 -->
<template>
	<view class="page-container">
		<!-- 顶部 Banner（纯CSS装饰，无云存储依赖） -->
		<view class="banner">
			<!-- 装饰圆圈（CSS绘制） -->
			<view class="banner-decor-circle banner-circle-1"></view>
			<view class="banner-decor-circle banner-circle-2"></view>
			<view class="banner-decor-circle banner-circle-3"></view>
			<view class="banner-content">
				<text class="banner-title">探索四川</text>
				<text class="banner-subtitle">发现千年文化，感受天府之国</text>
			</view>
			<view class="banner-icon-area">
				<text class="banner-main-emoji">🎭</text>
			</view>
		</view>

		<scroll-view scroll-y class="content-scroll" :show-scrollbar="false"
			refresher-enabled @refresherrefresh="onRefresh" :refresher-triggered="isRefreshing">

			<!-- 统计数据 -->
			<view class="stats-section">
				<view class="stats-card" v-for="item in statsItems" :key="item.label" @click="navTo(item.page)">
					<text class="stats-num">
						<text v-if="item.loading">--</text>
						<text v-else>{{ item.count }}</text>
					</text>
					<text class="stats-label">{{ item.label }}</text>
				</view>
			</view>

			<!-- 主功能分类 -->
			<view class="section-block">
				<view class="section-title-row">
					<text class="block-title">📚 文化探索</text>
				</view>
				<view class="feature-grid">
					<view class="feature-card heritage" @click="navTo('heritage')">
						<view class="feature-top">
							<text class="feature-emoji">🎭</text>
							<view class="feature-badge">{{ statsItems[0].loading ? '' : statsItems[0].count + '项' }}</view>
						</view>
						<text class="feature-name">非遗导览</text>
						<text class="feature-desc">川剧·蜀绣·剪纸·皮影</text>
						<view class="feature-arrow">
							<uni-icons type="arrowright" size="18" color="rgba(230,67,64,0.5)"></uni-icons>
						</view>
					</view>

					<view class="feature-card scenic" @click="navTo('scenic')">
						<view class="feature-top">
							<text class="feature-emoji">🏔️</text>
							<view class="feature-badge scenic-badge">{{ statsItems[1].loading ? '' : statsItems[1].count + '处' }}</view>
						</view>
						<text class="feature-name">景点导览</text>
						<text class="feature-desc">名山大川·历史古迹</text>
						<view class="feature-arrow">
							<uni-icons type="arrowright" size="18" color="rgba(51,153,255,0.5)"></uni-icons>
						</view>
					</view>
				</view>
			</view>

			<!-- 工具功能区 -->
			<view class="section-block">
				<view class="section-title-row">
					<text class="block-title">🧭 实用工具</text>
				</view>
				<view class="tool-list">
					<view class="tool-item" v-for="item in toolItems" :key="item.id" @click="navTo(item.page)">
						<view class="tool-icon-wrap" :style="{ background: item.bgColor }">
							<text class="tool-emoji">{{ item.emoji }}</text>
						</view>
						<view class="tool-info">
							<text class="tool-name">{{ item.name }}</text>
							<text class="tool-desc">{{ item.desc }}</text>
						</view>
						<uni-icons type="arrowright" size="16" color="#CCC"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 非遗分类 -->
			<view class="section-block">
				<view class="section-title-row">
					<text class="block-title">🏷️ 非遗分类</text>
					<text class="section-link" @click="navTo('heritage')">全部</text>
				</view>
				<view class="category-scroll-wrap">
					<scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
						<view class="category-list">
							<view class="category-chip" v-for="cat in categories" :key="cat.name"
								@click="gotoHeritageByCategory(cat.name)">
								<text class="cat-emoji">{{ cat.emoji }}</text>
								<text class="cat-name">{{ cat.name }}</text>
							</view>
						</view>
					</scroll-view>
				</view>
			</view>

			<!-- 浏览历史（已登录） -->
			<view v-if="historyList.length > 0" class="section-block">
				<view class="section-title-row">
					<text class="block-title">🕐 最近浏览</text>
					<text class="section-link" @click="clearHistory">清除</text>
				</view>
				<scroll-view scroll-x class="history-scroll" :show-scrollbar="false">
					<view class="history-list">
						<view class="history-item" v-for="item in historyList" :key="item.id"
							@click="goToDetail(item.type, item.id)">
							<image :src="item.cover" mode="aspectFill" class="history-img" lazy-load></image>
							<view class="history-overlay"></view>
							<text class="history-name">{{ item.name }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<view class="footer-space"></view>
		</scroll-view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				isRefreshing: false,
				statsItems: [
					{ label: '非遗项目', count: 0, loading: true, page: 'heritage' },
					{ label: '推荐景点', count: 0, loading: true, page: 'scenic' },
					{ label: '打卡记录', count: 0, loading: true, page: 'checkin' },
				],
			toolItems: [
				{
					id: 1,
					emoji: '🗺️',
					bgColor: 'rgba(82,196,26,0.12)',
					name: '路线规划',
					desc: '智能规划四川文旅路线',
					page: 'route'
				},
				{
					id: 2,
					emoji: '📍',
					bgColor: 'rgba(24,144,255,0.12)',
					name: '景点打卡',
					desc: '记录每一处到访足迹',
					page: 'checkin'
				},
				{
					id: 3,
					emoji: '🔍',
					bgColor: 'rgba(114,46,209,0.12)',
					name: '搜索发现',
					desc: '找到你感兴趣的内容',
					page: 'search'
				}
			],
			categories: [
				{ emoji: '🧵', name: '传统技艺' },
				{ emoji: '🎭', name: '传统戏剧' },
				{ emoji: '✂️', name: '传统美术' },
				{ emoji: '🎵', name: '传统音乐' },
				{ emoji: '💃', name: '传统舞蹈' },
				{ emoji: '🎪', name: '民俗' }
			],
				historyList: [] // 从本地存储获取
			};
		},

		onShow() {
			this.loadStats();
			this.loadLocalHistory();
		},

		methods: {
			// 加载统计数据
			async loadStats() {
				try {
					const db = wx.cloud.database();
					const [heritageCount, scenicCount] = await Promise.all([
						db.collection('heritage').count(),
						db.collection('scenic').count()
					]);

					this.statsItems[0].count = heritageCount.total;
					this.statsItems[0].loading = false;
					this.statsItems[1].count = scenicCount.total;
					this.statsItems[1].loading = false;

					// 打卡数从本地缓存获取
					const checkinCount = uni.getStorageSync('checkin_count') || 0;
					this.statsItems[2].count = checkinCount;
					this.statsItems[2].loading = false;

				} catch (err) {
					console.error('加载统计失败:', err);
					this.statsItems.forEach(item => {
						item.loading = false;
						item.count = 0;
					});
				}
			},

			// 加载本地浏览历史
			loadLocalHistory() {
				try {
					const history = uni.getStorageSync('browse_history') || [];
					this.historyList = history.slice(0, 8); // 最多显示8条
				} catch (e) {}
			},

			// 清除历史
			clearHistory() {
				uni.showModal({
					title: '提示',
					content: '确认清除浏览历史？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('browse_history');
							this.historyList = [];
						}
					}
				});
			},

			// 下拉刷新
			onRefresh() {
				this.isRefreshing = true;
				this.loadStats();
				setTimeout(() => { this.isRefreshing = false; }, 1000);
			},

			// 导航
			navTo(page) {
				const routes = {
					heritage: '/pages/heritage/heritageList',
					scenic: '/pages/scenic/scenicList',
					route: '/pages/route/routeSelect',
					search: '/pages/search/search',
					checkin: '/pages/checkin/myCheckin'
				};

				const url = routes[page];
				if (!url) return;

				uni.navigateTo({ url });
			},

			// 按分类进入非遗列表
			gotoHeritageByCategory(category) {
				uni.navigateTo({
					url: `/pages/heritage/heritageList?category=${encodeURIComponent(category)}`
				});
			},

			// 跳转详情页
			goToDetail(type, id) {
				const url = type === 'heritage'
					? `/pages/heritage/heritageDetail?id=${id}`
					: `/pages/scenic/scenicDetail?id=${id}`;
				uni.navigateTo({ url });
			}
		}
	};
</script>

<style lang="scss" scoped>
	.page-container {
		background: #F7F5F2;
		min-height: 100vh;
	}

	/* ===== 顶部 Banner（纯CSS） ===== */
	.banner {
		background: linear-gradient(150deg, #D93025 0%, #A8201A 100%);
		padding: 50rpx 40rpx 70rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		overflow: hidden;
		position: relative;

		/* 装饰圆圈 */
		.banner-decor-circle {
			position: absolute;
			border-radius: 50%;
			background: rgba(255,255,255,0.07);
			pointer-events: none;
		}
		.banner-circle-1 {
			width: 260rpx;
			height: 260rpx;
			top: -80rpx;
			right: -60rpx;
		}
		.banner-circle-2 {
			width: 160rpx;
			height: 160rpx;
			top: 40rpx;
			right: 100rpx;
			background: rgba(255,255,255,0.05);
		}
		.banner-circle-3 {
			width: 100rpx;
			height: 100rpx;
			bottom: -20rpx;
			right: 200rpx;
			background: rgba(255,255,255,0.06);
		}

		.banner-content {
			z-index: 1;
			.banner-title {
				display: block;
				font-size: 52rpx;
				font-weight: 800;
				color: #fff;
				margin-bottom: 12rpx;
				letter-spacing: 4rpx;
			}

			.banner-subtitle {
				display: block;
				font-size: 26rpx;
				color: rgba(255,255,255,0.8);
			}
		}

		.banner-icon-area {
			z-index: 1;
			.banner-main-emoji {
				font-size: 80rpx;
				opacity: 0.85;
			}
		}
	}

	/* ===== 内容滚动 ===== */
	.content-scroll {
		height: calc(100vh - 220rpx - env(safe-area-inset-top));
		margin-top: -40rpx;
	}

	/* ===== 统计数据 ===== */
	.stats-section {
		display: flex;
		background: #fff;
		border-radius: 30rpx 30rpx 0 0;
		margin: 0 20rpx;
		padding: 40rpx 20rpx;
		box-shadow: 0 -8rpx 30rpx rgba(0,0,0,0.1);

		.stats-card {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			position: relative;

			&:not(:last-child)::after {
				content: '';
				position: absolute;
				right: 0;
				top: 20%;
				height: 60%;
				width: 1rpx;
				background: #F0F0F0;
			}

			.stats-num {
				font-size: 40rpx;
				font-weight: 800;
				color: #D93025;
				line-height: 1.2;
			}

			.stats-label {
				font-size: 24rpx;
				color: #999;
				margin-top: 8rpx;
			}
		}
	}

	/* ===== 通用区块 ===== */
	.section-block {
		background: #fff;
		margin-top: 20rpx;
		padding: 30rpx;
	}

	.section-title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 28rpx;

		.block-title {
			font-size: 34rpx;
			font-weight: 700;
			color: #1A1A1A;
		}

		.section-link {
			font-size: 26rpx;
			color: #D93025;
		}
	}

	/* ===== 主功能大卡片 ===== */
	.feature-grid {
		display: flex;
		gap: 24rpx;
	}

	.feature-card {
		flex: 1;
		padding: 30rpx 24rpx;
		border-radius: 24rpx;
		position: relative;
		overflow: hidden;
		transition: all 0.2s;
		min-height: 200rpx;

		&:active { transform: scale(0.97); }

		&.heritage {
			background: linear-gradient(135deg, #FFF0EE 0%, #FFE5E3 100%);
			border: 1rpx solid rgba(217,48,37,0.15);

			.feature-name { color: #D93025; }
		}

		&.scenic {
			background: linear-gradient(135deg, #F0F7FF 0%, #E5EFFF 100%);
			border: 1rpx solid rgba(51,153,255,0.15);

			.feature-name { color: #3399FF; }
		}

		.feature-top {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 20rpx;

			.feature-emoji {
				font-size: 52rpx;
				line-height: 1;
			}

		.feature-badge {
			font-size: 20rpx;
			color: #D93025;
			background: rgba(217,48,37,0.12);
			padding: 4rpx 12rpx;
			border-radius: 20rpx;
			font-weight: 600;

			&.scenic-badge {
				color: #3399FF;
				background: rgba(51,153,255,0.12);
			}
		}
		}

		.feature-name {
			display: block;
			font-size: 34rpx;
			font-weight: 700;
			margin-bottom: 10rpx;
		}

		.feature-desc {
			display: block;
			font-size: 24rpx;
			color: #999;
		}

		.feature-arrow {
			position: absolute;
			bottom: 24rpx;
			right: 24rpx;
		}
	}

	/* ===== 工具列表 ===== */
	.tool-list {
		.tool-item {
			display: flex;
			align-items: center;
			padding: 24rpx 0;
			border-bottom: 1rpx solid #F5F5F5;
			gap: 24rpx;
			transition: all 0.2s;

			&:last-child { border-bottom: none; }

			&:active { background: #FAFAFA; }

			.tool-icon-wrap {
				width: 90rpx;
				height: 90rpx;
				border-radius: 24rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;

				.tool-emoji {
					font-size: 40rpx;
				}
			}

			.tool-info {
				flex: 1;

				.tool-name {
					display: block;
					font-size: 32rpx;
					font-weight: 600;
					color: #1A1A1A;
					margin-bottom: 8rpx;
				}

				.tool-desc {
					display: block;
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}

	/* ===== 分类滚动 ===== */
	.category-scroll-wrap {
		overflow: hidden;
	}

	.category-scroll {
		width: 100%;
	}

	.category-list {
		display: flex;
		gap: 20rpx;
		padding: 0 2rpx 4rpx;
		width: max-content;

		.category-chip {
			display: flex;
			align-items: center;
			gap: 10rpx;
			background: #F7F5F2;
			padding: 16rpx 24rpx;
			border-radius: 40rpx;
			border: 1rpx solid #E8E4DE;
			flex-shrink: 0;
			transition: all 0.2s;

			&:active {
				background: #FFF0EE;
				border-color: #D93025;
				transform: scale(0.97);
			}

			.cat-emoji { font-size: 30rpx; }
			.cat-name { font-size: 28rpx; color: #333; font-weight: 500; }
		}
	}

	/* ===== 浏览历史 ===== */
	.history-scroll { width: 100%; }

	.history-list {
		display: flex;
		gap: 20rpx;
		padding: 0 2rpx 4rpx;
		width: max-content;

		.history-item {
			width: 160rpx;
			height: 200rpx;
			border-radius: 16rpx;
			overflow: hidden;
			position: relative;
			flex-shrink: 0;

			.history-img {
				width: 100%;
				height: 100%;
			}

			.history-overlay {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 100rpx;
				background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
			}

			.history-name {
				position: absolute;
				bottom: 16rpx;
				left: 12rpx;
				right: 12rpx;
				font-size: 22rpx;
				color: #fff;
				font-weight: 600;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
			}
		}
	}

	.footer-space { height: 60rpx; }
</style>
