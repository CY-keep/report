<!-- pages/route/myRoutes.vue - 我的路线 -->
<template>
	<view class="page-container">
		<!-- 顶部信息栏 -->
		<view class="header-bar">
			<view class="header-info">
				<text class="header-title">我的路线</text>
				<text class="header-count">共 {{ savedRoutes.length }} 条</text>
			</view>
			<view v-if="savedRoutes.length > 0" class="clear-all-btn" @click="confirmClearAll">
				<text>清空</text>
			</view>
		</view>

		<!-- 空状态 -->
		<view v-if="savedRoutes.length === 0" class="empty-state">
			<view class="empty-icon-wrap">
				<text class="empty-emoji">🗺️</text>
			</view>
			<text class="empty-title">暂无保存的路线</text>
			<text class="empty-tip">在路线规划中创建或选择路线后保存</text>
			<view class="go-plan-btn" @click="goPlan">
				<text>去规划路线</text>
			</view>
		</view>

		<!-- 路线列表 -->
		<scroll-view
			v-else
			scroll-y
			class="route-scroll"
			:show-scrollbar="false"
			refresher-enabled
			@refresherrefresh="onRefresh"
			:refresher-triggered="isRefreshing"
		>
			<view class="route-list">
				<view
					v-for="(route, index) in savedRoutes"
					:key="route.id"
					class="route-card"
				>
					<!-- 主内容 -->
					<view class="card-main" @click="useRoute(route)">
						<view class="card-header-row">
							<text class="route-name">{{ route.name }}</text>
							<view class="route-source-tag" :class="route.isCustom ? 'custom' : 'preset'">
								<text>{{ route.isCustom ? '自定义' : '推荐' }}</text>
							</view>
						</view>

						<text class="route-desc" v-if="route.desc">{{ route.desc }}</text>

						<!-- 途经点位预览 -->
						<view class="waypoints-preview" v-if="route.points && route.points.length">
							<view
								class="waypoint-chip"
								v-for="(pt, pi) in route.points.slice(0, 3)"
								:key="pi"
							>
								<view class="wp-dot" :class="pi === 0 ? 'start' : ''"></view>
								<text class="wp-name">{{ pt.name }}</text>
							</view>
							<text v-if="route.points.length > 3" class="more-chip">+{{ route.points.length - 3 }}</text>
						</view>

						<!-- 元信息 -->
						<view class="meta-row">
							<view class="meta-chip">
								<text>📍 {{ (route.points || []).length }} 个点位</text>
							</view>
							<view class="meta-chip" v-if="route.duration">
								<text>⏱ {{ route.duration }}</text>
							</view>
							<view class="meta-chip" v-if="route.distance">
								<text>🛣 {{ route.distance }}</text>
							</view>
						</view>

						<text class="save-time" v-if="route.saveTime">保存于 {{ route.saveTime }}</text>
					</view>

					<!-- 操作按钮 -->
					<view class="card-actions">
						<view class="action-btn use-btn" @click="useRoute(route)">
							<text>导航</text>
						</view>
						<view class="action-btn delete-btn" @click.stop="deleteRoute(index)">
							<text>删除</text>
						</view>
					</view>
				</view>
			</view>

			<view class="footer-space"></view>
		</scroll-view>
	</view>
</template>

<script>
	const STORAGE_KEY = 'my_saved_routes';

	export default {
		data() {
			return {
				savedRoutes: [],
				isRefreshing: false
			};
		},

		onShow() {
			this.loadSavedRoutes();
		},

		methods: {
			// 读取本地存储
			loadSavedRoutes() {
				try {
					const stored = uni.getStorageSync(STORAGE_KEY);
					this.savedRoutes = stored ? JSON.parse(stored) : [];
				} catch (e) {
					console.error('读取路线失败:', e);
					this.savedRoutes = [];
				}
			},

			// 下拉刷新
			onRefresh() {
				this.isRefreshing = true;
				this.loadSavedRoutes();
				setTimeout(() => { this.isRefreshing = false; }, 600);
			},

			// 使用路线
			useRoute(route) {
				uni.navigateTo({
					url: '/pages/route/route?type=preset&data=' + encodeURIComponent(JSON.stringify(route))
				});
			},

			// 删除单条路线
			deleteRoute(index) {
				uni.showModal({
					title: '删除路线',
					content: `确认删除「${this.savedRoutes[index].name}」？`,
					confirmColor: '#E64340',
					success: (res) => {
						if (res.confirm) {
							this.savedRoutes.splice(index, 1);
							this.saveToStorage();
							uni.showToast({ title: '已删除', icon: 'success', duration: 1000 });
						}
					}
				});
			},

			// 清空全部
			confirmClearAll() {
				uni.showModal({
					title: '清空路线',
					content: '确认清空所有保存的路线？此操作不可撤销',
					confirmText: '清空',
					confirmColor: '#E64340',
					success: (res) => {
						if (res.confirm) {
							this.savedRoutes = [];
							this.saveToStorage();
							uni.showToast({ title: '已清空', icon: 'success', duration: 1000 });
						}
					}
				});
			},

			// 保存到本地存储
			saveToStorage() {
				try {
					uni.setStorageSync(STORAGE_KEY, JSON.stringify(this.savedRoutes));
				} catch (e) {
					console.error('保存路线失败:', e);
				}
			},

			// 前往路线规划页
			goPlan() {
				uni.navigateBack();
			}
		}
	};
</script>

<style lang="scss" scoped>
	.page-container {
		min-height: 100vh;
		background: #F5F6FA;
		display: flex;
		flex-direction: column;
	}

	/* ===== 顶部信息栏 ===== */
	.header-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 30rpx 20rpx;
		background: #fff;
		border-bottom: 1rpx solid #F0F0F0;

		.header-info {
			display: flex;
			align-items: baseline;
			gap: 16rpx;

			.header-title {
				font-size: 34rpx;
				font-weight: 700;
				color: #1A1A1A;
			}

			.header-count {
				font-size: 24rpx;
				color: #BDBDBD;
			}
		}

		.clear-all-btn {
			font-size: 28rpx;
			color: #E64340;
			padding: 8rpx 0;
		}
	}

	/* ===== 空状态 ===== */
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 40rpx;

		.empty-icon-wrap {
			width: 180rpx;
			height: 180rpx;
			background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 36rpx;

			.empty-emoji { font-size: 80rpx; }
		}

		.empty-title {
			font-size: 34rpx;
			font-weight: 600;
			color: #555;
			margin-bottom: 16rpx;
		}

		.empty-tip {
			font-size: 26rpx;
			color: #BDBDBD;
			text-align: center;
			margin-bottom: 48rpx;
			line-height: 1.6;
		}

		.go-plan-btn {
			background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
			color: #fff;
			font-size: 30rpx;
			font-weight: 600;
			padding: 22rpx 70rpx;
			border-radius: 48rpx;
			box-shadow: 0 8rpx 24rpx rgba(17,153,142,0.3);

			&:active { transform: scale(0.97); }
		}
	}

	/* ===== 路线列表 ===== */
	.route-scroll {
		flex: 1;
	}

	.route-list {
		padding: 20rpx 24rpx 0;
	}

	/* ===== 路线卡片 ===== */
	.route-card {
		background: #fff;
		border-radius: 24rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
		transition: all 0.2s;

		&:active { transform: scale(0.99); }

		.card-main {
			padding: 28rpx 28rpx 20rpx;

			.card-header-row {
				display: flex;
				align-items: center;
				gap: 16rpx;
				margin-bottom: 12rpx;

				.route-name {
					flex: 1;
					font-size: 32rpx;
					font-weight: 700;
					color: #1A1A1A;
				}

				.route-source-tag {
					font-size: 20rpx;
					padding: 6rpx 16rpx;
					border-radius: 20rpx;
					flex-shrink: 0;

					&.preset {
						background: rgba(17,153,142,0.1);
						text { color: #11998e; }
					}

					&.custom {
						background: rgba(230,67,64,0.1);
						text { color: #E64340; }
					}
				}
			}

			.route-desc {
				display: block;
				font-size: 26rpx;
				color: #888;
				line-height: 1.6;
				margin-bottom: 18rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
			}

			/* 途经点位 */
			.waypoints-preview {
				display: flex;
				align-items: center;
				gap: 0;
				margin-bottom: 18rpx;
				flex-wrap: nowrap;
				overflow: hidden;

				.waypoint-chip {
					display: flex;
					align-items: center;
					gap: 8rpx;
					flex-shrink: 0;

					&:not(:first-child) {
						&::before {
							content: '→';
							font-size: 18rpx;
							color: #CCC;
							margin: 0 8rpx;
						}
					}

					.wp-dot {
						width: 14rpx;
						height: 14rpx;
						border-radius: 50%;
						background: #DDD;
						flex-shrink: 0;

						&.start { background: #11998e; }
					}

					.wp-name {
						font-size: 22rpx;
						color: #666;
						max-width: 110rpx;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}

				.more-chip {
					font-size: 20rpx;
					color: #11998e;
					margin-left: 10rpx;
					flex-shrink: 0;
				}
			}

			/* 元信息 */
			.meta-row {
				display: flex;
				gap: 12rpx;
				flex-wrap: wrap;
				margin-bottom: 12rpx;

				.meta-chip {
					font-size: 22rpx;
					color: #999;
					background: #F5F6FA;
					padding: 6rpx 16rpx;
					border-radius: 16rpx;
				}
			}

			.save-time {
				font-size: 22rpx;
				color: #CCC;
			}
		}

		/* 操作按钮 */
		.card-actions {
			display: flex;
			border-top: 1rpx solid #F5F5F5;

			.action-btn {
				flex: 1;
				text-align: center;
				padding: 22rpx 0;
				font-size: 28rpx;
				font-weight: 500;
				transition: all 0.15s;

				&:active { opacity: 0.7; }

				&.use-btn text { color: #11998e; }

				&.delete-btn {
					border-left: 1rpx solid #F5F5F5;
					text { color: #E64340; }
				}
			}
		}
	}

	.footer-space { height: 60rpx; }
</style>
