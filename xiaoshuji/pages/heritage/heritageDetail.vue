<!-- pages/heritage/heritageDetail.vue -->
<template>
	<view class="page-container">
		<!-- 移除自定义导航栏，使用原生导航栏 -->

		<scroll-view class="content-scroll" scroll-y="true" :show-scrollbar="false" @scroll="onScroll">
			<!-- 封面图区域 -->
			<view class="cover-container" v-if="heritageDetail">
				<image class="cover-image" :src="heritageDetail.coverImage" mode="aspectFill"></image>
				<view class="cover-overlay"></view>
			</view>

			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-container">
				<text>加载中...</text>
			</view>

			<!-- 错误状态 -->
			<view v-else-if="loadError" class="error-container">
				<uni-icons type="info" size="80" color="#ccc"></uni-icons>
				<text class="error-text">内容加载失败</text>
				<text class="error-tip">{{ errorMessage }}</text>
				<button class="retry-btn" @click="loadHeritageDetail">重试</button>
			</view>

			<!-- 主内容区 -->
			<view v-else-if="heritageDetail" class="main-content">
				<!-- 基本信息卡片 -->
				<view class="info-card">
					<!-- 标题区域 -->
					<view class="title-section">
						<view class="title-row">
							<text class="heritage-title">{{ heritageDetail.name }}</text>
							<view class="title-actions">
								<!-- 收藏按钮 -->
								<view class="action-btn" @click="toggleFavorite" :class="{ disabled: favoriteLoading }">
									<image v-if="!favoriteLoading" class="action-icon"
										:src="isFavorited ? favoriteActiveIcon : favoriteIcon" mode="aspectFit"></image>
									<view v-else class="loading-spinner"></view>
								</view>
								<!-- 分享按钮 -->
								<view class="action-btn" @click="onShare">
									<image class="action-icon" :src="shareIcon" mode="aspectFit"></image>
								</view>
								<!-- 热门标签 -->
								<view v-if="heritageDetail.isHot" class="hot-tag">
									<uni-icons type="fire" size="16" color="#fff"></uni-icons>
									<text>热门</text>
								</view>
							</view>
						</view>
						<text
							class="heritage-subtitle">{{ heritageDetail.englishName || categoryText || '非物质文化遗产' }}</text>
					</view>

					<!-- 元信息网格 -->
					<view class="meta-grid">
						<view class="meta-item">
							<view class="meta-icon">
								<uni-icons type="location-filled" size="20" color="#e64340"></uni-icons>
							</view>
							<view class="meta-content">
								<text class="meta-label">地区</text>
								<text class="meta-value">{{ heritageDetail.location || '四川' }}</text>
							</view>
						</view>
						<view class="meta-item">
							<view class="meta-icon">
								<uni-icons type="eye" size="20" color="#e64340"></uni-icons>
							</view>
							<view class="meta-content">
								<text class="meta-label">浏览</text>
								<text class="meta-value">{{ heritageDetail.viewCount || 0 }} 次</text>
							</view>
						</view>
						<view class="meta-item">
							<view class="meta-icon">
								<uni-icons type="star" size="20" color="#e64340"></uni-icons>
							</view>
							<view class="meta-content">
								<text class="meta-label">分类</text>
								<text class="meta-value">{{ heritageDetail.categoryText || heritageDetail.category || '传统戏剧' }}</text>
							</view>
						</view>
						<view class="meta-item">
							<view class="meta-icon">
								<uni-icons type="flag" size="20" color="#e64340"></uni-icons>
							</view>
							<view class="meta-content">
								<text class="meta-label">级别</text>
								<text class="meta-value">{{ heritageDetail.level || '国家级' }}</text>
							</view>
						</view>
					</view>

					<!-- 简介卡片 -->
					<view class="section-card">
						<view class="section-header">
							<uni-icons type="info" size="20" color="#e64340"></uni-icons>
							<text class="section-title">项目简介</text>
						</view>
						<view class="section-content">
							<text class="content-text">{{ heritageDetail.brief || '暂无简介' }}</text>
						</view>
					</view>

					<!-- 详细描述卡片 -->
					<view v-if="heritageDetail.description" class="section-card">
						<view class="section-header">
							<uni-icons type="compose" size="20" color="#e64340"></uni-icons>
							<text class="section-title">详细描述</text>
						</view>
						<view class="section-content">
							<rich-text class="content-text" :nodes="heritageDetail.description"></rich-text>
						</view>
					</view>

				<!-- 特色技艺 -->
				<view v-if="heritageDetail.features && heritageDetail.features.trim()" class="section-card">
					<view class="section-header">
						<uni-icons type="star" size="20" color="#e64340"></uni-icons>
						<text class="section-title">特色技艺</text>
					</view>
					<view class="section-content">
						<rich-text class="content-text" :nodes="heritageDetail.features"></rich-text>
					</view>
				</view>

					<!-- 图片画廊 -->
					<view v-if="heritageDetail.imageGallery && heritageDetail.imageGallery.length > 0"
						class="section-card">
						<view class="section-header">
							<uni-icons type="image" size="20" color="#e64340"></uni-icons>
							<text class="section-title">图片集锦</text>
						</view>
						<scroll-view class="gallery-scroll" scroll-x="true" :show-scrollbar="false">
							<view class="gallery-list">
								<image v-for="(img, index) in heritageDetail.imageGallery" :key="index"
									class="gallery-image" :src="img" mode="aspectFill" @click="previewImage(index)">
								</image>
							</view>
						</scroll-view>
					</view>

	

				<!-- 传承人信息 -->
				<view v-if="heritageDetail.inheritor" class="section-card">
					<view class="section-header">
						<uni-icons type="person" size="20" color="#e64340"></uni-icons>
						<text class="section-title">传承人</text>
					</view>
					<view class="inheritor-list">
						<view class="inheritor-item">
							<view class="inheritor-avatar">
								<image v-if="heritageDetail.inheritor.avatar" :src="heritageDetail.inheritor.avatar" mode="aspectFill" class="avatar-img"></image>
								<view v-else class="avatar-placeholder">
									<uni-icons type="person" size="30" color="#e64340"></uni-icons>
								</view>
							</view>
							<view class="inheritor-info">
								<text class="inheritor-name">{{ heritageDetail.inheritor.name }}</text>
								<text class="inheritor-level">{{ heritageDetail.inheritor.title || '国家级传承人' }}</text>
								<text v-if="heritageDetail.inheritor.brief" class="inheritor-desc">{{ heritageDetail.inheritor.brief }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 历史渊源 -->
				<view v-if="heritageDetail.history" class="section-card">
					<view class="section-header">
						<uni-icons type="calendar" size="20" color="#e64340"></uni-icons>
						<text class="section-title">历史渊源</text>
					</view>
					<view class="section-content">
						<rich-text class="content-text" :nodes="heritageDetail.history"></rich-text>
					</view>
				</view>

				<!-- 文化价值 -->
				<view v-if="heritageDetail.value" class="section-card">
					<view class="section-header">
						<uni-icons type="gift" size="20" color="#e64340"></uni-icons>
						<text class="section-title">文化价值</text>
					</view>
					<view class="section-content">
						<text class="content-text">{{ heritageDetail.value }}</text>
					</view>
				</view>

				<!-- 底部操作区：语音导览 + 打卡 -->
				<view class="action-bar">
					<!-- 语音导览按钮 -->
					<view class="audio-guide-btn" @click="toggleAudioGuide">
						<view class="audio-icon-wrap" :class="{ playing: isPlaying }">
							<uni-icons :type="isPlaying ? 'sound' : 'sound'" size="24" color="#fff"></uni-icons>
						</view>
						<text class="audio-btn-text">{{ isPlaying ? '停止讲解' : '语音导览' }}</text>
						<view v-if="isPlaying" class="audio-wave">
							<view class="wave-bar"></view>
							<view class="wave-bar"></view>
							<view class="wave-bar"></view>
						</view>
					</view>
					<!-- 打卡按钮 -->
					<view class="checkin-btn" @click="goToCheckin">
						<uni-icons type="location" size="24" color="#fff"></uni-icons>
						<text class="checkin-btn-text">我要打卡</text>
					</view>
				</view>

				<!-- 底部占位 -->
				<view class="bottom-placeholder"></view>
			</view>
		</view>
	</scroll-view>
</view>
</template>

<script>
	import { callCloud, COLLECTIONS, processImageFields } from '@/utils/cloudCall.js'
	import { cloudFn } from '@/utils/cloudFunctionNames.js'

	export default {

		data() {
			return {
				// 页面参数
				heritageId: '',

				// 数据与状态
				heritageDetail: null,
				isLoading: true,
				loadError: false,
				errorMessage: '',

				// 系统信息
				statusBarHeight: 0,
				scrollTop: 0,

				// 收藏相关状态
				isFavorited: false,
				favoriteLoading: false,
				favoriteId: null,

				// 语音导览相关
				isPlaying: false,
				audioContext: null,

				// 单页模式（朋友圈分享进入）
				isSinglePage: false,

				// 自定义图标 - 使用您提供的云存储地址
				favoriteIcon: 'cloud://cloud1-7gabd815fd2c236e.636c-cloud1-7gabd815fd2c236e-1418729882/images/icon/favorite.png',
				favoriteActiveIcon: 'cloud://cloud1-7gabd815fd2c236e.636c-cloud1-7gabd815fd2c236e-1418729882/images/icon/favorite_active.png',
				shareIcon: 'cloud://cloud1-7gabd815fd2c236e.636c-cloud1-7gabd815fd2c236e-1418729882/images/icon/share.png'
			};
		},
		onLoad(options) {
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 0;

			// 检测是否来自朋友圈分享的单页模式
			const { scene } = wx.getLaunchOptionsSync();
			this.isSinglePage = scene === 1154;

			if (options.id) {
				this.heritageId = options.id;
				this.loadHeritageDetail();
			} else {
				this.loadError = true;
				this.errorMessage = '未指定非遗项目';
				this.isLoading = false;
			}
		},
		onUnload() {
			// 离开页面时停止语音播放
			this.stopAudio();
		},
		methods: {
			// 滚动事件
			onScroll(e) {
				this.scrollTop = e.detail.scrollTop;
			},

			// 加载非遗详情
			async loadHeritageDetail() {
				this.isLoading = true;
				this.loadError = false;

				// 分类枚举映射（数字 → 中文）
				const categoryMap = {
					1: '传统技艺',
					2: '传统戏剧',
					3: '传统美术',
					4: '传统音乐',
					5: '传统舞蹈',
					6: '民俗'
				};

				try {
					const db = wx.cloud.database();
					const res = await db.collection('heritage').doc(this.heritageId).get();

					if (res.data) {
						// 处理云存储图片
						this.heritageDetail = await processImageFields(res.data, ['coverImage', 'image', 'gallery']);

						// 处理分类枚举值转中文
						const cat = this.heritageDetail.category;
						if (cat !== undefined) {
							if (Array.isArray(cat)) {
								// 多选情况：数字数组 → 中文文本
								this.heritageDetail.categoryText = cat.map(c => categoryMap[c] || c).join('、');
							} else {
								// 单选情况
								this.heritageDetail.categoryText = categoryMap[cat] || String(cat);
							}
						}

						console.log('非遗详情加载成功：', this.heritageDetail);

						// 更新浏览量
						await this.incrementViewCount();

						// 检查收藏状态
						await this.checkFavoriteStatus();
					} else {
						throw new Error('未找到该非遗项目');
					}
				} catch (err) {
					console.error('加载非遗详情失败：', err);
					this.loadError = true;
					// 检查是否是 ID 不存在错误
					if (err.message && err.message.includes('cannot find document')) {
						this.errorMessage = '该非遗数据不存在，可能轮播图 linkId 配置有误';
					} else {
						this.errorMessage = err.message || '网络错误，请稍后重试';
					}
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				} finally {
					this.isLoading = false;
				}
			},

// 增加浏览量
		async incrementViewCount() {
			try {
				const db = wx.cloud.database();
				const _ = db.command;
				await db.collection('heritage').doc(this.heritageId).update({
					data: {
						viewCount: _.inc(1)
					}
				});
				console.log('非遗浏览量+1');
			} catch (err) {
				console.warn('更新浏览量失败（可能字段不存在或无权限）：', err);
				// 静默失败，不影响用户体验
			}
		},

			// 检查收藏状态
			async checkFavoriteStatus() {
				if (!this.heritageId) return;

				try {
					const db = wx.cloud.database();
					const res = await db.collection('user_favorites')
						.where({
							_openid: '{openid}',
							targetId: this.heritageId,
							targetType: 'heritage'
						})
						.get();

					if (res.data && res.data.length > 0) {
						this.isFavorited = true;
						this.favoriteId = res.data[0]._id;
					} else {
						this.isFavorited = false;
						this.favoriteId = null;
					}
				} catch (err) {
					console.error('检查收藏状态失败：', err);
				}
			},

			// 切换收藏状态
			async toggleFavorite() {
				if (this.favoriteLoading) return;

				if (this.isFavorited) {
					await this.removeFromFavorites();
				} else {
					await this.addToFavorites();
				}
			},

			// 修复后的添加收藏方法
			async addToFavorites() {
				if (this.favoriteLoading) return;

				this.favoriteLoading = true;

				// 显示loading
				uni.showLoading({
					title: '收藏中...',
					mask: true
				});

			try {
				const res = await cloudFn.addFavorite('heritage', this.heritageId, {
					title: this.heritageDetail?.name || '',
					coverImage: this.heritageDetail?.coverImage || '',
					category: this.heritageDetail?.category || ''
				});

				if (res.success) {
					this.isFavorited = true;
					this.favoriteId = res.data?._id || null;
					uni.showToast({
						title: '已收藏',
						icon: 'success',
						duration: 1500
					});
				} else {
					throw new Error(res.message || '收藏失败');
				}
			} catch (err) {
					console.error('添加收藏失败：', err);
					uni.showToast({
						title: err.message || '收藏失败，请重试',
						icon: 'none',
						duration: 2000
					});
				} finally {
					// 确保loading被隐藏
					uni.hideLoading();
					this.favoriteLoading = false;
				}
			},

			// 修复后的取消收藏方法
			async removeFromFavorites() {
				if (this.favoriteLoading) return;

				this.favoriteLoading = true;

				// 显示loading
				uni.showLoading({
					title: '取消中...',
					mask: true
				});

			try {
				const res = await cloudFn.removeFavorite('heritage', this.heritageId);

				if (res.success) {
					this.isFavorited = false;
						this.favoriteId = null;
						uni.showToast({
							title: '已取消收藏',
							icon: 'success',
							duration: 1500
						});
					} else {
						throw new Error(res.result?.message || '取消收藏失败');
					}
				} catch (err) {
					console.error('取消收藏失败：', err);
					uni.showToast({
						title: err.message || '操作失败，请重试',
						icon: 'none',
						duration: 2000
					});
				} finally {
					// 确保loading被隐藏
					uni.hideLoading();
					this.favoriteLoading = false;
				}
			},

// 返回上一页
		goBack() {
			uni.navigateBack();
		},

		// 处理分享点击
		onShare() {
			// 启用分享菜单（同时开启好友和朋友圈分享）
			wx.showShareMenu({
				withShareTicket: true,
				menus: ['shareAppMessage', 'shareTimeline']
			});
			uni.showToast({ title: '请点击右上角分享', icon: 'none', duration: 1500 });
		},

		// 分享给好友 - 使用原生生命周期
		onShareAppMessage(res) {
			let imageUrl = this.heritageDetail ? this.heritageDetail.coverImage : '';
			
			// 如果是云存储路径，暂不处理，留空使用默认图片
			if (imageUrl && imageUrl.startsWith('cloud://')) {
				imageUrl = '';
			}
			
			return {
				title: this.heritageDetail ? this.heritageDetail.name : '四川非遗',
				desc: this.heritageDetail ? this.heritageDetail.brief : '探索四川非物质文化遗产',
				path: `/pages/heritage/heritageDetail?id=${this.heritageId}`,
				imageUrl: imageUrl
			};
		},

		// 分享到朋友圈 - 使用原生生命周期
		onShareTimeline() {
			// 朋友圈分享不支持 imageUrl（只支持网络图片或留空）
			return {
				title: this.heritageDetail ? this.heritageDetail.name : '四川非遗推荐',
				query: `id=${this.heritageId}&type=heritage`
			};
		},

			// 预览图片
			previewImage(current) {
				if (this.heritageDetail.imageGallery && this.heritageDetail.imageGallery.length > 0) {
					uni.previewImage({
						current: this.heritageDetail.imageGallery[current],
						urls: this.heritageDetail.imageGallery
					});
				}
			},

			// ===== 语音导览 =====
			async toggleAudioGuide() {
				if (this.isPlaying) {
					this.stopAudio();
					return;
				}
				await this.startAudioGuide();
			},

			async startAudioGuide() {
				const detail = this.heritageDetail;
				if (!detail) return;

				// 优先使用数据库中的 audioUrl 字段；否则合成文字内容
				const audioUrl = detail.audioUrl;
				if (audioUrl) {
					this.playAudioFromUrl(audioUrl);
				} else {
					// 调用云函数进行文字转语音（百度TTS）
					uni.showLoading({ title: '导览生成中...', mask: true });
					try {
						// 按文档字段顺序拼接：名称 + 项目简介 + 详细介绍 + 特色技艺 + 历史渊源
						const textParts = [
							detail.name,
							detail.brief,
							detail.description,
							detail.features,   // 特色技艺（对应 heritage.features 字段）
							detail.history     // 历史渊源
						].filter(Boolean);
						const text = textParts.join('。');
						const res = await cloudFn.ttsGuide(text.slice(0, 500));
					uni.hideLoading();
					if (res && res.audioUrl) {
						this.playAudioFromUrl(res.audioUrl);
						} else {
							uni.showToast({ title: '语音生成失败', icon: 'none' });
						}
					} catch (e) {
						uni.hideLoading();
						console.error('语音导览失败', e);
						uni.showToast({ title: '语音导览暂不可用', icon: 'none' });
					}
				}
			},

			playAudioFromUrl(url) {
				this.audioContext = wx.createInnerAudioContext();
				this.audioContext.src = url;
				this.audioContext.onPlay(() => { this.isPlaying = true; });
				this.audioContext.onEnded(() => { this.isPlaying = false; });
				this.audioContext.onError(() => {
					this.isPlaying = false;
					uni.showToast({ title: '音频播放失败', icon: 'none' });
				});
				this.audioContext.play();
			},

			stopAudio() {
				if (this.audioContext) {
					this.audioContext.stop();
					this.audioContext.destroy();
					this.audioContext = null;
				}
				this.isPlaying = false;
			},

			// ===== 打卡跳转 =====
			goToCheckin() {
				if (!this.heritageDetail) return;
				uni.navigateTo({
					url: `/pages/checkin/checkin?id=${this.heritageId}&type=heritage&name=${encodeURIComponent(this.heritageDetail.name)}&cover=${encodeURIComponent(this.heritageDetail.coverImage || '')}`
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.page-container {
		background: linear-gradient(180deg, #f8f8f8 0%, #f5f5f5 100%);
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* 内容区域 */
	.content-scroll {
		flex: 1;
		height: 100vh;
	}

	/* 封面图区域 */
	.cover-container {
		position: relative;
		width: 100%;
		height: 500rpx;

		.cover-image {
			width: 100%;
			height: 100%;
			display: block;
		}

		.cover-overlay {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 200rpx;
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
		}
	}

	/* 加载状态 */
	.loading-container {
		padding: 200rpx 0;
		text-align: center;
		font-size: 28rpx;
		color: #999;
	}

	/* 错误状态 */
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 150rpx 30rpx;

		.error-text {
			font-size: 32rpx;
			color: #666;
			margin-top: 30rpx;
			margin-bottom: 15rpx;
		}

		.error-tip {
			font-size: 26rpx;
			color: #999;
			margin-bottom: 40rpx;
			text-align: center;
		}

		.retry-btn {
			background-color: #e64340;
			color: #fff;
			font-size: 28rpx;
			border-radius: 50rpx;
			padding: 20rpx 60rpx;
		}
	}

	/* 主内容区 */
	.main-content {
		position: relative;
		margin-top: -80rpx;
		z-index: 2;

		.info-card {
			background: #fff;
			border-radius: 40rpx 40rpx 0 0;
			padding: 40rpx 30rpx 0;
			box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.05);
		}

		.title-section {
			margin-bottom: 40rpx;

			.title-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 10rpx;

				.heritage-title {
					flex: 1;
					font-size: 48rpx;
					font-weight: 700;
					color: #333;
					line-height: 1.3;
					padding-right: 20rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
				}

				/* 标题操作区域 */
				.title-actions {
					display: flex;
					align-items: center;
					flex-shrink: 0;

					/* 操作按钮通用样式 */
					.action-btn {
						width: 60rpx;
						height: 60rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						margin-left: 20rpx;
						border-radius: 50%;
						transition: all 0.3s;
						background-color: #f8f9fa;

						&:first-child {
							margin-left: 0;
						}

						&:active {
							background-color: #e9ecef;
						}

						&.disabled {
							opacity: 0.5;
						}

						/* 操作图标 */
						.action-icon {
							width: 28rpx;
							height: 28rpx;
						}

						/* 加载动画 */
						.loading-spinner {
							width: 20px;
							height: 20px;
							border: 2px solid #e64340;
							border-top-color: transparent;
							border-radius: 50%;
							animation: rotate 1s linear infinite;
						}
					}

					/* 热门标签 */
					.hot-tag {
						background: linear-gradient(135deg, #ff6b6b 0%, #e64340 100%);
						color: #fff;
						font-size: 20rpx;
						padding: 8rpx 20rpx;
						border-radius: 30rpx;
						display: flex;
						align-items: center;
						margin-left: 20rpx;

						text {
							margin-left: 8rpx;
						}
					}
				}
			}

			.heritage-subtitle {
				font-size: 28rpx;
				color: #999;
				font-style: italic;
			}
		}

		/* 旋转动画 */
		@keyframes rotate {
			from {
				transform: rotate(0deg);
			}

			to {
				transform: rotate(360deg);
			}
		}

		/* 元信息网格 */
		.meta-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 20rpx;
			margin-bottom: 40rpx;

			.meta-item {
				background: #f8f9fa;
				border-radius: 20rpx;
				padding: 20rpx;
				display: flex;
				align-items: center;

				.meta-icon {
					margin-right: 15rpx;
				}

				.meta-content {
					flex: 1;

					.meta-label {
						display: block;
						font-size: 24rpx;
						color: #999;
						margin-bottom: 5rpx;
					}

					.meta-value {
						font-size: 28rpx;
						color: #333;
						font-weight: 500;
					}
				}
			}
		}

		/* 卡片通用样式 */
		.section-card {
			background: #fff;
			border-radius: 20rpx;
			padding: 30rpx;
			margin-bottom: 30rpx;
			box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
			border: 1rpx solid #f0f0f0;

			.section-header {
				display: flex;
				align-items: center;
				margin-bottom: 25rpx;

				.section-title {
					font-size: 32rpx;
					font-weight: 600;
					color: #333;
					margin-left: 15rpx;
				}
			}

			.section-content {
				.content-text {
					font-size: 28rpx;
					color: #666;
					line-height: 1.8;
					display: block;
				}
			}
		}

		/* 特色技艺标签 */
		.features-list {
			display: flex;
			flex-wrap: wrap;
			gap: 15rpx;

			.feature-tag {
				background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
				color: #d63031;
				font-size: 26rpx;
				padding: 12rpx 25rpx;
				border-radius: 30rpx;
			}
		}

		/* 图片画廊 */
		.gallery-scroll {
			.gallery-list {
				display: flex;

				.gallery-image {
					width: 200rpx;
					height: 200rpx;
					border-radius: 15rpx;
					margin-right: 20rpx;

					&:last-child {
						margin-right: 0;
					}
				}
			}
		}



		/* 底部占位 */
		.bottom-placeholder {
			height: 200rpx;
		}
	}

	/* 传承人列表 */
	.inheritor-list {
		.inheritor-item {
			display: flex;
			align-items: flex-start;
			margin-bottom: 30rpx;

			&:last-child { margin-bottom: 0; }

			.inheritor-avatar {
				width: 100rpx;
				height: 100rpx;
				border-radius: 50%;
				overflow: hidden;
				margin-right: 25rpx;
				flex-shrink: 0;
				background: #f5f5f5;
				display: flex;
				align-items: center;
				justify-content: center;

				.avatar-img {
					width: 100%;
					height: 100%;
				}

				.avatar-placeholder {
					width: 100%;
					height: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					background: #ffeaea;
				}
			}

			.inheritor-info {
				flex: 1;

				.inheritor-name {
					display: block;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					margin-bottom: 8rpx;
				}

				.inheritor-level {
					display: block;
					font-size: 24rpx;
					color: #e64340;
					background: #ffeaea;
					padding: 4rpx 16rpx;
					border-radius: 20rpx;
					display: inline-block;
					margin-bottom: 12rpx;
				}

				.inheritor-desc {
					display: block;
					font-size: 26rpx;
					color: #666;
					line-height: 1.6;
				}
			}
		}
	}

	/* 历史时间线 */
	.timeline-list {
		.timeline-item {
			display: flex;
			align-items: flex-start;
			margin-bottom: 10rpx;

			.timeline-left {
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-right: 25rpx;
				width: 24rpx;

				.timeline-dot {
					width: 20rpx;
					height: 20rpx;
					border-radius: 50%;
					background: #ddd;
					flex-shrink: 0;
					margin-top: 8rpx;

					&.dot-active {
						background: #e64340;
						box-shadow: 0 0 0 4rpx rgba(230, 67, 64, 0.2);
					}
				}

				.timeline-line {
					width: 2rpx;
					flex: 1;
					min-height: 40rpx;
					background: #eee;
					margin: 8rpx 0;
				}
			}

			.timeline-content {
				flex: 1;
				padding-bottom: 30rpx;

				.timeline-year {
					display: block;
					font-size: 26rpx;
					font-weight: bold;
					color: #e64340;
					margin-bottom: 8rpx;
				}

				.timeline-event {
					display: block;
					font-size: 27rpx;
					color: #555;
					line-height: 1.7;
				}
			}
		}
	}

	/* 底部操作栏 */
	.action-bar {
		display: flex;
		gap: 20rpx;
		padding: 0 0 30rpx;

		.audio-guide-btn,
		.checkin-btn {
			flex: 1;
			height: 90rpx;
			border-radius: 45rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12rpx;
		}

		.audio-guide-btn {
			background: linear-gradient(135deg, #fd7b4d 0%, #e64340 100%);
			position: relative;
			overflow: hidden;

			.audio-icon-wrap {
				&.playing {
					animation: pulse 1s ease infinite;
				}
			}

			.audio-btn-text {
				font-size: 30rpx;
				color: #fff;
				font-weight: bold;
			}

			.audio-wave {
				display: flex;
				align-items: center;
				gap: 4rpx;
				margin-left: 8rpx;

				.wave-bar {
					width: 4rpx;
					background: rgba(255,255,255,0.8);
					border-radius: 2rpx;
					animation: wave 0.8s ease infinite;

					&:nth-child(1) { height: 20rpx; animation-delay: 0s; }
					&:nth-child(2) { height: 32rpx; animation-delay: 0.2s; }
					&:nth-child(3) { height: 20rpx; animation-delay: 0.4s; }
				}
			}
		}

		.checkin-btn {
			background: linear-gradient(135deg, #55efc4 0%, #00b894 100%);

			.checkin-btn-text {
				font-size: 30rpx;
				color: #fff;
				font-weight: bold;
			}
		}
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.15); }
	}

	@keyframes wave {
		0%, 100% { transform: scaleY(0.5); }
		50% { transform: scaleY(1.2); }
	}
</style>