<!-- pages/checkin/myCheckin.vue -->
<template>
	<view class="page-container">
		<!-- 顶部统计 -->
		<view class="stats-header">
			<view class="stats-bg"></view>
			<view class="stats-content">
				<text class="stats-title">我的打卡足迹</text>
				<view class="stats-row">
					<view class="stat-item">
						<text class="stat-num">{{ totalCount }}</text>
						<text class="stat-label">总打卡</text>
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

		<!-- 打卡记录列表 -->
		<scroll-view
			class="list-scroll"
			scroll-y="true"
			:show-scrollbar="false"
			@scrolltolower="loadMore"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<!-- 空状态 -->
			<view v-if="checkinList.length === 0" class="empty-state">
				<view class="empty-icon">🗺️</view>
				<text class="empty-title">还没有打卡记录</text>
				<text class="empty-tip">去探索非遗和景点吧</text>
				<button class="explore-btn" @click="goExplore">去探索</button>
			</view>

			<!-- 记录列表 -->
			<view v-else class="record-list">
				<view
					v-for="(item, index) in checkinList"
					:key="index"
					class="record-card"
					@click="viewCheckinDetail(item)"
				>
					<!-- 时间轴左侧 -->
					<view class="timeline-left">
						<view class="tl-dot" :class="item.targetType === 'heritage' ? 'dot-red' : 'dot-blue'"></view>
						<view v-if="index < checkinList.length - 1" class="tl-line"></view>
					</view>

					<!-- 卡片内容 -->
					<view class="card-body">
						<!-- 类型标签 + 时间 -->
						<view class="card-meta">
							<view class="type-badge" :class="item.targetType === 'heritage' ? 'badge-red' : 'badge-blue'">
								<text>{{ item.targetType === 'heritage' ? '非遗' : '景点' }}</text>
							</view>
							<text class="card-time">{{ item.dateStr || formatTime(item.createTime) }}</text>
						</view>

						<!-- 标题 -->
						<text class="card-title">{{ item.targetName }}</text>

						<!-- 打卡照片（优先打卡照，无则用封面） -->
						<image
							v-if="item.photoUrl || item.coverImage"
							class="card-cover"
							:src="item.photoUrl || item.coverImage"
							mode="aspectFill"
							@click.stop="previewCheckinPhoto(item)"
						></image>

						<!-- 打卡备注 -->
						<text v-if="item.note" class="card-note">💬 {{ item.note }}</text>
					</view>
				</view>

				<!-- 加载更多 -->
				<view v-if="!hasMore && checkinList.length > 0" class="load-more-tip no-more">— 已展示全部打卡 —</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			activeTab: 'all',
			tabs: [
				{ label: '全部', value: 'all' },
				{ label: '非遗', value: 'heritage' },
				{ label: '景点', value: 'scenic' }
			],

			checkinList: [],
			isLoading: false,
			isRefreshing: false,
			hasMore: false,

			// 统计
			totalCount: 0,
			heritageCount: 0,
			scenicCount: 0
		};
	},

	onLoad() {
		this.loadLocalCheckins();
	},

	onShow() {
		// 每次显示时刷新（从打卡页返回后同步新数据）
		this.loadLocalCheckins();
	},

	methods: {
		// 切换 Tab
		switchTab(val) {
			if (this.activeTab === val) return;
			this.activeTab = val;
			this.loadLocalCheckins();
		},

		// 加载本地打卡记录
		loadLocalCheckins() {
			const allList = uni.getStorageSync('localCheckins') || [];

			// 过滤
			let filtered = allList;
			if (this.activeTab !== 'all') {
				filtered = allList.filter(item => item.targetType === this.activeTab);
			}

			this.checkinList = filtered;
			this.hasMore = false;

			// 更新统计
			this.totalCount = allList.length;
			this.heritageCount = allList.filter(item => item.targetType === 'heritage').length;
			this.scenicCount = allList.filter(item => item.targetType === 'scenic').length;
		},

		// 下拉刷新
		onRefresh() {
			this.isRefreshing = true;
			this.loadLocalCheckins();
			this.isRefreshing = false;
		},

		// 上拉加载更多（本地数据不需要分页）
		loadMore() {
			// 本地数据一次性加载完毕
		},

		// 查看打卡详情
		viewCheckinDetail(item) {
			// 跳转到详情页
			const url = item.targetType === 'heritage'
				? `/pages/heritage/heritageDetail?id=${item.targetId}`
				: `/pages/scenic/scenicDetail?id=${item.targetId}`;
			uni.navigateTo({ url });
		},

		// 去探索
		goExplore() {
			uni.switchTab({ url: '/pages/index/index' });
		},

		// 预览打卡照片
		previewCheckinPhoto(item) {
			const urls = item.photoUrls && item.photoUrls.length > 0
				? item.photoUrls
				: (item.photoUrl ? [item.photoUrl] : (item.coverImage ? [item.coverImage] : []));
			if (!urls.length) return;
			wx.previewImage({ current: urls[0], urls });
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
					color: rgba(255,255,255,0.7);
				}
			}

			.stat-divider {
				width: 1rpx;
				height: 70rpx;
				background: rgba(255,255,255,0.3);
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

/* 记录列表 */
.record-list {
	padding: 30rpx 30rpx 40rpx;

	.record-card {
		display: flex;
		margin-bottom: 10rpx;

		/* 时间轴 */
		.timeline-left {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 40rpx;
			flex-shrink: 0;
			margin-right: 20rpx;

			.tl-dot {
				width: 20rpx;
				height: 20rpx;
				border-radius: 50%;
				flex-shrink: 0;
				margin-top: 18rpx;

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
				margin-bottom: 18rpx;
			}

			.card-cover {
				width: 100%;
				height: 200rpx;
				border-radius: 12rpx;
				margin-top: 10rpx;
			}

			.card-note {
				display: block;
				font-size: 24rpx;
				color: #888;
				margin-top: 14rpx;
				line-height: 1.6;
				background: #F7F5F2;
				border-radius: 12rpx;
				padding: 14rpx 18rpx;
			}
		}
	}
}

.load-more-tip {
	text-align: center;
	font-size: 26rpx;
	color: #999;
	padding: 30rpx 0 50rpx;

	&.no-more { color: #ccc; }
}
</style>
