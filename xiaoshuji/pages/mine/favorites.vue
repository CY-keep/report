<!-- pages/mine/favorites.vue -->
<!-- AI辅助重构：WorkBuddy/Coding Copilot, 2026-04-19
     - 重构UI，对标myCheckin.vue设计
     - 添加Tab筛选、红色统计卡片、时间轴列表
     - 修复收藏筛选Bug（传参格式调整）
-->
<template>
	<view class="page-container">
		<!-- 顶部统计 -->
		<view class="stats-header">
			<view class="stats-bg"></view>
			<view class="stats-content">
				<text class="stats-title">我的收藏</text>
				<view class="stats-row">
					<view class="stat-item">
						<text class="stat-num">{{ total }}</text>
						<text class="stat-label">全部</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-num">{{ heritageCount }}</text>
						<text class="stat-label">非遗</text>
					</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-num">{{ scenicCount }}</text>
						<text class="stat-label">景点</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 筛选 Tab -->
		<view class="filter-bar">
			<view
				v-for="tab in tabs"
				:key="tab.value"
				class="filter-tab"
				:class="{ active: activeTab === tab.value }"
				@click="switchTab(tab.value)"
			>
				<text>{{ tab.label }}</text>
			</view>
		</view>

		<!-- 收藏列表 -->
		<scroll-view
			class="list-scroll"
			scroll-y="true"
			:show-scrollbar="false"
			@scrolltolower="onScrollToLower"
			refresher-enabled
			:refresher-triggered="triggered"
			refresher-background="#f4f6f9"
			@refresherrefresh="onRefresh"
		>
			<!-- 加载状态 -->
			<view v-if="isLoading && !favorites.length" class="loading-container">
				<view class="loading-spinner"></view>
				<text>加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-else-if="!favorites.length && !isLoading" class="empty-state">
				<view class="empty-icon">❤️</view>
				<text class="empty-title">暂无收藏</text>
				<text class="empty-tip">收藏的内容会在这里展示</text>
				<button class="explore-btn" @click="goToExplore">去探索</button>
			</view>

			<!-- 收藏卡片列表 -->
			<view v-else class="record-list">
				<view
					v-for="(item, index) in favorites"
					:key="item._id"
					class="record-card"
					@click="navigateToDetail(item)"
				>
					<!-- 时间轴左侧 -->
					<view class="timeline-left">
						<view class="tl-dot" :class="item.targetType === 'heritage' ? 'dot-red' : 'dot-blue'"></view>
						<view v-if="index < favorites.length - 1" class="tl-line"></view>
					</view>

					<!-- 卡片内容 -->
					<view class="card-body">
						<!-- 类型标签 + 时间 -->
						<view class="card-meta">
							<view class="type-badge" :class="item.targetType === 'heritage' ? 'badge-red' : 'badge-blue'">
								<text>{{ item.targetType === 'heritage' ? '非遗' : '景点' }}</text>
							</view>
							<text class="card-time">{{ formatTime(item.createdAt) }}</text>
						</view>

						<!-- 标题 -->
						<text class="card-title">{{ item.title }}</text>

						<!-- 分类 -->
						<view v-if="item.category" class="card-category">
							<text>{{ item.category }}</text>
						</view>

						<!-- 封面图 -->
						<image
							v-if="item.coverImage"
							class="card-cover"
							:src="item.coverImage"
							mode="aspectFill"
						></image>
					</view>

					<!-- 取消收藏按钮 -->
					<view class="card-action" @click.stop="removeSingleFavorite(item, index)">
						<view v-if="!item.loading" class="unfavorite-icon">
							<text>❤️</text>
						</view>
						<view v-else class="action-loading"></view>
					</view>
				</view>

				<!-- 已加载全部 -->
				<view v-if="!hasMore && favorites.length" class="load-more-tip no-more">— 已展示全部收藏 —</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { cloudFn } from '@/utils/cloudFunctionNames.js'
	import { processImageFields } from '@/utils/cloudCall.js'

	export default {
		data() {
			return {
				// 状态控制
				isLoading: true,
				loadingMore: false,
				hasMore: false,
				triggered: false,

				// 筛选
				activeTab: 'all',
				tabs: [
					{ label: '全部', value: 'all' },
					{ label: '非遗', value: 'heritage' },
					{ label: '景点', value: 'scenic' }
				],

				// 数据
				favorites: [],
				page: 1,
				pageSize: 20,
				total: 0,
				heritageCount: 0,
				scenicCount: 0
			};
		},
		onLoad() {
			this.loadFavorites();
		},
		onShow() {
			if (this.favorites.length === 0 && !this.isLoading) {
				this.loadFavorites();
			}
		},
		methods: {
			// 切换 Tab
			switchTab(val) {
				if (this.activeTab === val) return;
				this.activeTab = val;
				this.page = 1;
				this.favorites = [];
				this.loadFavorites();
			},

			// 下拉刷新
			async onRefresh() {
				if (this.isLoading) return;
				this.triggered = true;
				this.page = 1;
				this.favorites = [];
				await this.loadFavorites();
				setTimeout(() => { this.triggered = false; }, 500);
			},

			// 滚动到底部
			async onScrollToLower() {
				if (this.loadingMore || !this.hasMore || this.isLoading) return;
				this.page += 1;
				await this.loadFavorites();
			},

			// 加载收藏列表
			async loadFavorites() {
				if (this.page === 1) this.isLoading = true;
				this.loadingMore = this.page > 1;

				try {
					const res = await cloudFn.getFavoriteList(this.activeTab === 'all' ? null : this.activeTab);
					if (res.success) {
						const data = res.data || [];
						const processedData = await processImageFields(data, ['coverImage']);

						if (this.page === 1) {
							this.favorites = processedData.map(item => ({ ...item, loading: false }));
						} else {
							this.favorites.push(...processedData.map(item => ({ ...item, loading: false })));
						}

						this.total = res.total || 0;
						this.hasMore = data.length >= this.pageSize;

						// 统计
						const allRes = await cloudFn.getFavoriteList(null);
						if (allRes.success) {
							const all = allRes.data || [];
							this.heritageCount = all.filter(i => i.targetType === 'heritage').length;
							this.scenicCount = all.filter(i => i.targetType === 'scenic').length;
						}
					} else {
						throw new Error(res.message || '加载失败');
					}
				} catch (err) {
					console.error('加载收藏失败：', err);
					uni.showToast({ title: err.message || '加载失败', icon: 'none' });
				} finally {
					this.isLoading = false;
					this.loadingMore = false;
				}
			},

			// 格式化时间
			formatTime(timestamp) {
				if (!timestamp) return '';
				const d = new Date(timestamp);
				const now = new Date();
				const diff = now - d;
				if (diff < 60000) return '刚刚';
				if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
				if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
				const pad = n => String(n).padStart(2, '0');
				return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
			},

			// 导航到详情页
			navigateToDetail(item) {
				if (!item || !item.targetId || !item.targetType) return;
				const url = item.targetType === 'heritage'
					? `/pages/heritage/heritageDetail?id=${item.targetId}`
					: `/pages/scenic/scenicDetail?id=${item.targetId}`;
				uni.navigateTo({ url });
			},

			// 取消收藏
			async removeSingleFavorite(item, index) {
				if (item.loading) return;
				this.$set(this.favorites[index], 'loading', true);
				try {
					const res = await cloudFn.removeFavorite(item.targetType, item.targetId);
					if (res.success) {
						this.favorites.splice(index, 1);
						this.total = Math.max(0, this.total - 1);
						// 更新统计
						if (item.targetType === 'heritage') {
							this.heritageCount = Math.max(0, this.heritageCount - 1);
						} else {
							this.scenicCount = Math.max(0, this.scenicCount - 1);
						}
						uni.showToast({ title: '已取消', icon: 'success', duration: 1500 });
					} else {
						throw new Error(res.message || '操作失败');
					}
				} catch (err) {
					console.error('取消收藏失败：', err);
					uni.showToast({ title: err.message || '操作失败', icon: 'none' });
				} finally {
					if (this.favorites[index]) {
						this.$set(this.favorites[index], 'loading', false);
					}
				}
			},

			// 去探索
			goToExplore() {
				uni.switchTab({ url: '/pages/index/index' });
			}
		}
	};
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	background: #f4f6f9;
	display: flex;
	flex-direction: column;
}

/* 顶部统计 */
.stats-header {
	position: relative;
	height: 260rpx;
	overflow: hidden;

	.stats-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #e64340 0%, #c0392b 100%);
	}

	.stats-content {
		position: relative;
		z-index: 1;
		padding: 50rpx 40rpx 30rpx;

		.stats-title {
			display: block;
			font-size: 38rpx;
			font-weight: bold;
			color: #fff;
			margin-bottom: 30rpx;
		}

		.stats-row {
			display: flex;
			align-items: center;

			.stat-item {
				flex: 1;
				display: flex;
				flex-direction: column;
				align-items: center;

				.stat-num {
					font-size: 52rpx;
					font-weight: 900;
					color: #fff;
					line-height: 1;
					margin-bottom: 8rpx;
				}

				.stat-label {
					font-size: 24rpx;
					color: rgba(255, 255, 255, 0.7);
				}
			}

			.stat-divider {
				width: 1rpx;
				height: 70rpx;
				background: rgba(255, 255, 255, 0.3);
			}
		}
	}
}

/* 筛选 Tab */
.filter-bar {
	display: flex;
	background: #fff;
	border-bottom: 1rpx solid #f0f0f0;

	.filter-tab {
		flex: 1;
		text-align: center;
		padding: 28rpx 0;
		font-size: 28rpx;
		color: #999;
		position: relative;

		&.active {
			color: #e64340;
			font-weight: bold;

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 50rpx;
				height: 4rpx;
				background: #e64340;
				border-radius: 2rpx;
			}
		}
	}
}

/* 列表滚动区 */
.list-scroll {
	flex: 1;
}

/* 加载状态 */
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 150rpx 0;

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f0f0f0;
		border-top-color: #e64340;
		border-radius: 50%;
		margin-bottom: 20rpx;
		animation: rotate 1s linear infinite;
	}

	text {
		font-size: 28rpx;
		color: #999;
	}
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 40rpx;

	.empty-icon { font-size: 100rpx; margin-bottom: 30rpx; }

	.empty-title {
		font-size: 34rpx;
		color: #666;
		margin-bottom: 12rpx;
	}

	.empty-tip {
		font-size: 26rpx;
		color: #999;
		margin-bottom: 40rpx;
	}

	.explore-btn {
		background: linear-gradient(135deg, #fd7b4d, #e64340);
		color: #fff;
		font-size: 28rpx;
		border-radius: 50rpx;
		padding: 20rpx 70rpx;
		border: none;
	}
}

/* 收藏卡片列表 */
.record-list {
	padding: 30rpx 30rpx 50rpx;

	.record-card {
		display: flex;
		align-items: flex-start;
		margin-bottom: 10rpx;
		position: relative;

		/* 时间轴 */
		.timeline-left {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 40rpx;
			flex-shrink: 0;
			margin-right: 20rpx;
			padding-top: 18rpx;

			.tl-dot {
				width: 20rpx;
				height: 20rpx;
				border-radius: 50%;
				flex-shrink: 0;

				&.dot-red { background: #e64340; box-shadow: 0 0 0 4rpx rgba(230,67,64,0.15); }
				&.dot-blue { background: #0984e3; box-shadow: 0 0 0 4rpx rgba(9,132,227,0.15); }
			}

			.tl-line {
				flex: 1;
				width: 2rpx;
				background: #eee;
				margin: 8rpx 0;
				min-height: 30rpx;
			}
		}

		/* 卡片主体 */
		.card-body {
			flex: 1;
			background: #fff;
			border-radius: 20rpx;
			padding: 25rpx;
			margin-bottom: 20rpx;
			box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);

			.card-meta {
				display: flex;
				align-items: center;
				margin-bottom: 14rpx;

				.type-badge {
					padding: 5rpx 18rpx;
					border-radius: 20rpx;
					font-size: 22rpx;
					margin-right: 15rpx;

					&.badge-red  { background: #ffeaea; color: #e64340; }
					&.badge-blue { background: #e8f4ff; color: #0984e3; }
				}

				.card-time {
					font-size: 24rpx;
					color: #bbb;
				}
			}

			.card-title {
				display: block;
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 10rpx;
			}

			.card-category {
				font-size: 24rpx;
				color: #999;
				margin-bottom: 14rpx;
			}

			.card-cover {
				width: 100%;
				height: 200rpx;
				border-radius: 12rpx;
				margin-top: 8rpx;
			}
		}

		/* 取消收藏按钮 */
		.card-action {
			position: absolute;
			top: 25rpx;
			right: 25rpx;
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;

			.unfavorite-icon {
				font-size: 36rpx;
			}

			.action-loading {
				width: 20px;
				height: 20px;
				border: 2px solid #e64340;
				border-top-color: transparent;
				border-radius: 50%;
				animation: rotate 1s linear infinite;
			}
		}
	}
}

.load-more-tip {
	text-align: center;
	font-size: 26rpx;
	color: #999;
	padding: 10rpx 0 30rpx;

	&.no-more { color: #ccc; }
}

/* 旋转动画 */
@keyframes rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
</style>