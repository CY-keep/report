<!-- pages/index/index.vue - 四川非遗文旅首页 -->
<template>
	<view class="page-container">
		<!-- 顶部搜索栏 - 适配刘海屏，居中搜索 -->
		<view class="search-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="search-input-center" @click="goToSearch">
				<text class="search-icon">🔍 </text>
				<text class="search-placeholder">搜索非遗、景点或路线...</text>
			</view>
		</view>

		<!-- 页面内容区域 -->
		<scroll-view class="content-scroll" scroll-y="true" :show-scrollbar="false"
			@scrolltolower="onScrollToLower" refresher-enabled @refresherrefresh="onRefresh"
			:refresher-triggered="isRefreshing">

			<!-- 骨架屏 -->
			<view v-if="isLoading" class="skeleton-container">
				<!-- 轮播图骨架 -->
				<view class="skeleton-swiper skeleton-shimmer"></view>
				<!-- 导航网格骨架 -->
				<view class="skeleton-nav">
					<view v-for="i in 4" :key="i" class="skeleton-nav-item skeleton-shimmer"></view>
				</view>
				<!-- 卡片骨架 -->
				<view class="skeleton-cards">
					<view v-for="i in 2" :key="i" class="skeleton-card">
						<view class="skeleton-img skeleton-shimmer"></view>
						<view class="skeleton-content">
							<view class="skeleton-line skeleton-shimmer" style="width: 70%"></view>
							<view class="skeleton-line skeleton-shimmer" style="width: 90%"></view>
							<view class="skeleton-line skeleton-shimmer" style="width: 60%"></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view v-else-if="!swiperList.length && !heritageList.length && !scenicList.length" class="empty-state">
				<text class="empty-icon">🫙</text>
				<text class="empty-text">锅里还没有菜，先去添几道？</text>
				<view class="empty-btn" @tap="fetchHomePageData">重新加载</view>
			</view>

			<!-- 正常内容 -->
			<view v-else>
				<!-- 轮播图 -->
				<view class="swiper-wrap" v-if="swiperList.length">
				<swiper class="carousel" :indicator-dots="false" :autoplay="true" :interval="4000"
						:circular="true" @change="onSwiperChange">
					<swiper-item v-for="(item, index) in swiperList" :key="index"
						class="carousel-item" @click="onSwiperTap(item)">
						<image class="carousel-img" :src="item.imageUrl" mode="aspectFill" />
						<view class="carousel-gradient"></view>
						<view class="carousel-info">
							<text class="carousel-title">{{ item.title }}</text>
						</view>
					</swiper-item>
				</swiper>
					<!-- 自定义指示器 -->
					<view class="custom-dots">
						<view v-for="(item, index) in swiperList" :key="index"
							:class="['dot', { active: currentSwiperIndex === index }]"></view>
					</view>
				</view>

				<!-- 导航功能网格 -->
			<view class="nav-section">
				<view class="nav-grid">
					<view v-for="item in navItems" :key="item.id" class="nav-item" @tap="navTo(item.page)">
						<view class="nav-icon-wrap" :style="{ background: item.bgColor }">
							<text class="nav-emoji">{{ item.emoji }}</text>
						</view>
						<text class="nav-text">{{ item.text }}</text>
					</view>
				</view>
			</view>

				<!-- 公告栏 -->
				<view class="notice-bar" v-if="noticeText">
					<text style="font-size: 26rpx;">📢</text>
					<scroll-view class="notice-scroll" scroll-x="true">
						<text class="notice-text">{{ noticeText }}</text>
					</scroll-view>
				</view>

				<!-- 热门非遗推荐 -->
				<view class="recommend-section" v-if="heritageList.length">
					<view class="section-header">
						<view class="section-title-wrap">
							<view class="title-accent"></view>
							<text class="section-title">热门非遗</text>
						</view>
						<view class="section-more-btn" @tap="navTo('heritageList')">
							<text class="section-more">查看更多</text>
							<text class="more-arrow">›</text>
						</view>
					</view>
					<view class="recommend-list">
						<view v-for="(item, index) in heritageList" :key="index" class="recommend-card"
							@tap="goToDetail('heritage', item._id)">
							<image class="card-img" :src="item.coverImage || CLOUD_BASE + '/heritage/chuan_ju.jpg'"
								mode="aspectFill" />
							<view class="card-content">
								<text class="card-title">{{ item.name }}</text>
								<text class="card-desc">{{ item.brief || item.description || '' }}</text>
								<view class="card-footer">
									<view class="card-location">
										<text class="location-icon-text">📍</text>
										<text>{{ item.location || '四川' }}</text>
									</view>
								<view class="card-tags">
									<view class="hot-badge" v-if="item.isHot">热门</view>
								</view>
								</view>
							</view>
						</view>
					</view>
				</view>

				<!-- 精选景点推荐 -->
				<view class="recommend-section" v-if="scenicList.length">
					<view class="section-header">
						<view class="section-title-wrap">
							<view class="title-accent"></view>
							<text class="section-title">精选景点</text>
						</view>
						<view class="section-more-btn" @tap="navTo('scenicList')">
							<text class="section-more">查看更多</text>
							<text class="more-arrow">›</text>
						</view>
					</view>
					<scroll-view class="scenic-scroll" scroll-x="true" :show-scrollbar="false">
						<view class="scenic-list">
						<view v-for="(item, index) in scenicList" :key="index" class="scenic-card"
							@tap="goToDetail('scenic', item._id)">
							<image class="scenic-img" :src="item.coverImage || CLOUD_BASE + '/scenic/jiu_zhai_gou.jpg'"
								mode="aspectFill" />
								<view class="scenic-overlay"></view>
								<view class="scenic-info">
									<text class="scenic-name">{{ item.name }}</text>
									<view class="scenic-meta">
										<text class="level-tag" v-if="formattedLevel(item.level)">⭐ {{ formattedLevel(item.level) }}</text>
									</view>
								</view>
							</view>
						</view>
					</scroll-view>
				</view>

				<!-- 底部留白 -->
				<view class="footer-space"></view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { processImageFields } from '../../utils/cloudCall.js';
	
	// 云存储基础路径
	const CLOUD_BASE = 'cloud://cloud1-7gabd815fd2c236e.636c-cloud1-7gabd815fd2c236e-1418729882/images';
	
	// 景区等级映射：数字标识 → 选项值
	const LEVEL_MAP = {
		1: 'AAAAA',
		2: 'AAAA',
		3: 'AAA',
		4: 'AA',
		5: 'A',
		6: '未评级',
		// 兼容字符串形式
		'5A': 'AAAAA',
		'4A': 'AAAA',
		'3A': 'AAA',
		'2A': 'AA',
		'1A': 'A',
	};

	// 开发环境模拟数据
	const MOCK_DATA = {
		swiperList: [
			{ imageUrl: CLOUD_BASE + '/banner/banner1.jpg', title: '四川非遗文化节', subtitle: '感受巴蜀文化魅力' },
			{ imageUrl: CLOUD_BASE + '/banner/banner2.jpg', title: '九寨沟风景区', subtitle: '人间仙境等你来探' },
			{ imageUrl: CLOUD_BASE + '/banner/banner3.jpg', title: '成都大运会', subtitle: '运动与文化交融' }
		],
		heritageList: [
			{ _id: 'h1', name: '川剧变脸', category: '传统戏剧', brief: '川剧特技，极具观赏性', location: '成都市', coverImage: CLOUD_BASE + '/heritage/chuan_ju.jpg', isHot: true },
			{ _id: 'h2', name: '蜀绣', category: '传统美术', brief: '中国四大名绣之一', location: '成都市', coverImage: CLOUD_BASE + '/heritage/shu_jin.jpg', isHot: true },
			{ _id: 'h3', name: '自贡灯会', category: '民俗', brief: '国家级非物质文化遗产', location: '自贡市', coverImage: CLOUD_BASE + '/heritage/yi_qi.jpg', isHot: true },
			{ _id: 'h4', name: '泸州老窖酿制', category: '传统技艺', brief: '浓香型白酒典范', location: '泸州市', coverImage: CLOUD_BASE + '/heritage/gan_zi_ti_ta.jpg', isHot: false }
		],
		scenicList: [
			{ _id: 's1', name: '九寨沟', level: 1, coverImage: CLOUD_BASE + '/scenic/jiu_zhai_gou.jpg' },
			{ _id: 's2', name: '峨眉山', level: 1, coverImage: CLOUD_BASE + '/scenic/ling_quan_si.jpg' },
			{ _id: 's3', name: '乐山大佛', level: 1, coverImage: CLOUD_BASE + '/scenic/le_shan.jpg' },
			{ _id: 's4', name: '都江堰', level: 1, coverImage: CLOUD_BASE + '/scenic/du_jiang_yan.jpg' }
		]
	};

	export default {
		computed: {
			// 格式化景点等级（用于卡片显示）
			formattedLevel() {
				return (level) => {
					if (!level) return '';
					if (LEVEL_MAP[level] !== undefined) {
						return LEVEL_MAP[level] + '级景区';
					}
					return level;
				};
			}
		},
		
		data() {
			return {
				statusBarHeight: 20, // 默认值，会在onLoad时动态获取
				swiperList: [],
				heritageList: [],
				scenicList: [],
			isLoading: true,
			isRefreshing: false,
			currentSwiperIndex: 0,
			noticeText: '',

				navItems: [
					{
						id: 1,
						emoji: '🎭',
						bgColor: 'rgba(217,48,37,0.10)',
						text: '非遗导览',
						page: 'heritageList'
					},
					{
						id: 2,
						emoji: '🏔️',
						bgColor: 'rgba(26,127,100,0.10)',
						text: '景点导览',
						page: 'scenicList'
					},
					{
						id: 3,
						emoji: '🗺️',
						bgColor: 'rgba(201,146,10,0.12)',
						text: '路线规划',
						page: 'route'
					}
				]
			};
		},

		onLoad() {
			// 获取系统状态栏高度，适配刘海屏
			const systemInfo = wx.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 20;
			
			this.fetchHomePageData();
		},

		methods: {
			// 获取首页数据
			async fetchHomePageData() {
				this.isLoading = true;
				try {
					const db = wx.cloud.database();
					const [swiperRes, heritageRes, scenicRes] = await Promise.all([
						db.collection('swiper').orderBy('sortOrder', 'asc').limit(5).get(),
						db.collection('heritage').where({ isHot: true }).limit(4).get(),
						db.collection('scenic').where({ isRecommended: true }).limit(5).get()
					]);

					// 如果云数据库有数据，处理云存储图片URL
					if (swiperRes.data && swiperRes.data.length > 0) {
						this.swiperList = await processImageFields(swiperRes.data, ['imageUrl']);
					} else {
						this.swiperList = MOCK_DATA.swiperList;
					}

					if (heritageRes.data && heritageRes.data.length > 0) {
						this.heritageList = await processImageFields(heritageRes.data, ['coverImage']);
					} else {
						this.heritageList = MOCK_DATA.heritageList;
					}

				if (scenicRes.data && scenicRes.data.length > 0) {
					this.scenicList = await processImageFields(scenicRes.data, ['coverImage']);
				} else {
					this.scenicList = MOCK_DATA.scenicList;
				}
			} catch (err) {
					console.error('首页数据获取失败，使用模拟数据：', err);
					// 获取失败时使用模拟数据
				this.swiperList = MOCK_DATA.swiperList;
				this.heritageList = MOCK_DATA.heritageList;
				this.scenicList = MOCK_DATA.scenicList;
			} finally {
					this.isLoading = false;
					this.isRefreshing = false;
				}
			},
			
		// 下拉刷新
		onRefresh() {
				this.isRefreshing = true;
				this.fetchHomePageData();
			},

			// 滚动到底部
			onScrollToLower() {
				// 可以实现无限加载
			},

			// 轮播切换
			onSwiperChange(e) {
				this.currentSwiperIndex = e.detail.current;
			},

			// 点击轮播
			onSwiperTap(item) {
				if (!item.linkType || !item.linkId) return;
				if (item.linkType === 'heritage') {
					uni.navigateTo({ url: `/pages/heritage/heritageDetail?id=${item.linkId}` });
				} else if (item.linkType === 'scenic') {
					uni.navigateTo({ url: `/pages/scenic/scenicDetail?id=${item.linkId}` });
				}
			},

			// 跳转搜索页
			goToSearch() {
				uni.navigateTo({ url: '/pages/search/search' });
			},

			// 导航跳转
			navTo(page) {
				const routes = {
					heritageList: () => uni.navigateTo({ url: '/pages/heritage/heritageList' }),
					scenicList: () => uni.navigateTo({ url: '/pages/scenic/scenicList' }),
					route: () => uni.navigateTo({ url: '/pages/route/routeSelect' })
				};
				const fn = routes[page];
				if (fn) fn();
				else uni.showToast({ title: '功能开发中', icon: 'none' });
			},

			// 跳转详情
			goToDetail(type, id) {
				if (!id) return;
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
		background-color: #F7F5F2;
		min-height: 100vh;
		box-sizing: border-box;
	}

	/* ===== 搜索栏（居中搜索，川红渐变，紧凑布局）===== */
	.search-bar {
		padding: 10rpx 30rpx 0;
		background: linear-gradient(160deg, #D93025 0%, #A8201A 100%);
		position: sticky;
		top: 0;
		z-index: 99;
		box-sizing: content-box;
	}

	.search-input-center {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255,255,255,0.98);
		border-radius: 50rpx;
		padding: 12rpx 24rpx;
		gap: 10rpx;
		box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.1);
		height: 56rpx;
		box-sizing: border-box;

		.search-icon {
			font-size: 24rpx;
			flex-shrink: 0;
		}

		.search-placeholder {
			font-size: 26rpx;
			color: #B0B0B0;
			flex: 1;
			text-align: center;
		}
	}

	/* ===== 滚动区域 ===== */
	.content-scroll {
		height: calc(100vh - 112rpx - env(safe-area-inset-bottom));
	}

	/* ===== 骨架屏（暖色） ===== */
	.skeleton-container {
		padding: 0 0 30rpx;
	}

	.skeleton-shimmer {
		background: linear-gradient(90deg, #F0EDE8 25%, #E8E4DE 50%, #F0EDE8 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.skeleton-swiper {
		height: 360rpx;
		border-radius: 0;
	}

	.skeleton-nav {
		display: flex;
		justify-content: space-around;
		padding: 30rpx 20rpx;
		background: #fff;
		margin-top: 20rpx;

		.skeleton-nav-item {
			width: 96rpx;
			height: 140rpx;
			border-radius: 28rpx;
		}
	}

	.skeleton-cards {
		padding: 20rpx 30rpx;

		.skeleton-card {
			display: flex;
			background: #fff;
			border-radius: 20rpx;
			padding: 24rpx;
			margin-bottom: 24rpx;

			.skeleton-img {
				width: 190rpx;
				height: 190rpx;
				border-radius: 16rpx;
				flex-shrink: 0;
			}

			.skeleton-content {
				flex: 1;
				margin-left: 24rpx;
				display: flex;
				flex-direction: column;
				justify-content: center;
				gap: 16rpx;

				.skeleton-line {
					height: 32rpx;
					border-radius: 8rpx;
				}
			}
		}
	}

	/* ===== 空状态 ===== */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 60rpx;

		.empty-icon {
			font-size: 120rpx;
			margin-bottom: 30rpx;
		}

		.empty-text {
			font-size: 28rpx;
			color: #999;
			text-align: center;
			margin-bottom: 40rpx;
		}

		.empty-btn {
			background: #D93025;
			color: #fff;
			font-size: 28rpx;
			padding: 20rpx 60rpx;
			border-radius: 40rpx;
		}
	}

	/* ===== 轮播图 ===== */
	.swiper-wrap {
		position: relative;
		width: 100%;
		background: linear-gradient(160deg, #D93025 0%, #A8201A 100%);
	}

	.carousel {
		width: 100%;
		height: 420rpx;
	}

	.carousel-item {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;

		.carousel-img-wrap {
			width: 100%;
			height: 100%;
			overflow: hidden;
		}

		.carousel-img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
		}

		.carousel-gradient {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 180rpx;
			background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
			pointer-events: none;
		}

		.carousel-info {
			position: absolute;
			bottom: 30rpx;
			left: 30rpx;
			right: 30rpx;

			.carousel-title {
				display: block;
				font-size: 34rpx;
				font-weight: 700;
				color: #fff;
				margin-bottom: 8rpx;
				text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.3);
			}

			.carousel-subtitle {
				display: block;
				font-size: 24rpx;
				color: rgba(255,255,255,0.85);
			}
		}
	}

	.custom-dots {
		position: absolute;
		bottom: 20rpx;
		right: 30rpx;
		display: flex;
		gap: 8rpx;
		z-index: 10;

		.dot {
			width: 12rpx;
			height: 12rpx;
			border-radius: 6rpx;
			background: rgba(255,255,255,0.5);
			transition: all 0.3s;

			&.active {
				width: 30rpx;
				background: #fff;
			}
		}
	}

	/* ===== 导航功能网格 ===== */
	.nav-section {
		background: #fff;
		padding: 20rpx 20rpx 24rpx;
	}

	.nav-grid {
		display: flex;
		justify-content: space-around;

		.nav-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 14rpx;
			min-width: 140rpx;
			padding: 10rpx;
			border-radius: 20rpx;
			transition: all 0.2s;

			&:active {
				background: #F7F5F2;
				transform: scale(0.95);
			}

			.nav-icon-wrap {
				width: 96rpx;
				height: 96rpx;
				border-radius: 28rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.nav-emoji {
				font-size: 46rpx;
				line-height: 1;
			}

			.nav-text {
				font-size: 26rpx;
				color: #333;
				font-weight: 500;
			}
		}
	}

	/* ===== 公告栏 ===== */
	.notice-bar {
		display: flex;
		align-items: center;
		background: #FFF7F0;
		padding: 18rpx 30rpx;
		margin-top: 20rpx;
		gap: 12rpx;
		border-left: 6rpx solid #E64340;

		.notice-scroll {
			flex: 1;
			height: 40rpx;

			.notice-text {
				font-size: 26rpx;
				color: #666;
				white-space: nowrap;
			}
		}
	}

	/* ===== 推荐区块 ===== */
	.recommend-section {
		background: #fff;
		margin-top: 20rpx;
		padding: 30rpx;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;

		.section-title-wrap {
			display: flex;
			align-items: center;
			gap: 14rpx;

			.title-accent {
				width: 6rpx;
				height: 32rpx;
				background: #D93025;
				border-radius: 3rpx;
				line-height: 32rpx;
			}

			.section-title {
				font-size: 36rpx;
				font-weight: 700;
				color: #1A1A1A;
				line-height: 1;
			}
		}

		.section-more-btn {
			display: flex;
			align-items: center;
			gap: 2rpx;

			.section-more {
				font-size: 26rpx;
				color: #D93025;
				line-height: 1;
			}
			
			.more-arrow {
				font-size: 24rpx;
				color: #D93025;
				line-height: 1;
			}
		}
	}

	/* ===== 非遗卡片 ===== */
	.recommend-list {
		.recommend-card {
			display: flex;
			background: #fff;
			border-radius: 20rpx;
			margin-bottom: 28rpx;
			overflow: hidden;
			border: 1rpx solid #F0F0F0;
			position: relative;
			box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
			transition: all 0.2s;

			&:last-child { margin-bottom: 0; }

			&:active {
				transform: scale(0.99);
				box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
			}

			.card-img {
				width: 190rpx;
				height: 200rpx;
				flex-shrink: 0;
			}

			.card-badge {
				background: rgba(217,48,37,0.9);
				color: #fff;
				font-size: 20rpx;
				padding: 4rpx 12rpx;
				border-radius: 16rpx;
				font-weight: 600;
			}

			.card-content {
				flex: 1;
				padding: 20rpx 24rpx;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				min-height: 200rpx;
				box-sizing: border-box;

				.card-title {
					font-size: 32rpx;
					font-weight: 700;
					color: #1A1A1A;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 1;
					overflow: hidden;
				}

				.card-desc {
					font-size: 26rpx;
					color: #666;
					line-height: 1.5;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
					flex: 1;
					margin: 10rpx 0;
				}

				.card-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;
					flex-wrap: wrap;
					gap: 10rpx;

					.card-location {
						display: flex;
						align-items: center;
						gap: 6rpx;
						font-size: 24rpx;
						color: #666;
						
						.location-icon-text {
							font-size: 22rpx;
							line-height: 1;
							display: inline-flex;
							vertical-align: middle;
						}
					}

					.hot-badge {
						font-size: 22rpx;
						color: #D4380D;
						background: #FFF1E6;
						padding: 4rpx 12rpx;
						border-radius: 16rpx;
						font-weight: 600;
					}

					.card-tags {
						display: flex;
						gap: 10rpx;
						flex-wrap: wrap;
					}
				}
			}
		}
	}

	/* ===== 横向景点卡片 ===== */
	.scenic-scroll {
		width: 100%;
	}

	.scenic-list {
		display: flex;
		gap: 24rpx;
		padding: 0 2rpx 10rpx;
		width: max-content;

		.scenic-card {
			width: 280rpx;
			height: 360rpx;
			border-radius: 20rpx;
			overflow: hidden;
			position: relative;
			flex-shrink: 0;
			box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
			transition: all 0.2s;

			&:active { transform: scale(0.97); }

			.scenic-img {
				width: 100%;
				height: 100%;
			}

			.scenic-overlay {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				height: 180rpx;
				background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
			}

			.scenic-info {
				position: absolute;
				bottom: 24rpx;
				left: 20rpx;
				right: 20rpx;

				.scenic-name {
					display: block;
					font-size: 30rpx;
					font-weight: 700;
					color: #fff;
					margin-bottom: 10rpx;
				}

				.scenic-meta {
					display: flex;
					gap: 8rpx;

					.level-tag {
						font-size: 20rpx;
						color: #FFD700;
						background: rgba(255,215,0,0.2);
						padding: 3rpx 10rpx;
						border-radius: 10rpx;
						border: 1rpx solid rgba(255,215,0,0.5);
					}
				}
			}
		}
	}

	/* ===== 底部留白 ===== */
	.footer-space {
		height: 60rpx;
	}
</style>
