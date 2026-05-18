<!-- pages/scenic/scenicDetail.vue -->
<template>
	<view class="page-container">
		<scroll-view class="content-scroll" scroll-y="true" :show-scrollbar="false" @scroll="onScroll">

			<!-- ① 封面图区域（含标题叠层） -->
			<view class="cover-container" v-if="scenicDetail || isLoading">
				<image v-if="scenicDetail" class="cover-image" :src="scenicDetail.coverImage" mode="aspectFill" />
				<view class="cover-image skeleton-cover" v-else />
				<!-- 渐变遮罩 -->
				<view class="cover-overlay" />
				<!-- 封面标题（加载完成后显示） -->
				<view v-if="scenicDetail" class="cover-title-block">
					<view class="cover-badges">
						<view v-if="scenicDetail.isRecommended" class="badge-recommend">⭐ 推荐</view>
						<view v-if="formattedLevel" class="badge-level">{{ formattedLevel }}</view>
					</view>
					<text class="cover-title">{{ scenicDetail.name }}</text>
					<text class="cover-subtitle">{{ scenicDetail.englishName || scenicDetail.category || '自然与人文景点' }}</text>
				</view>
			</view>

			<!-- ② 加载状态 -->
			<view v-if="isLoading" class="loading-container">
				<view class="loading-dots">
					<view class="ld"></view>
					<view class="ld"></view>
					<view class="ld"></view>
				</view>
				<text class="loading-text">景点信息加载中...</text>
			</view>

			<!-- ③ 错误状态 -->
			<view v-else-if="loadError" class="error-container">
				<text class="error-emoji">😢</text>
				<text class="error-text">内容加载失败</text>
				<text class="error-tip">{{ errorMessage }}</text>
				<view class="retry-btn" @click="loadScenicDetail">重新加载</view>
			</view>

			<!-- ④ 主内容区 -->
			<view v-else-if="scenicDetail" class="main-content">

				<!-- 信息主卡（圆角上托） -->
				<view class="info-card">

					<!-- 标题行（操作按钮） -->
					<view class="title-actions-row">
						<view class="action-btn" @click="toggleFavorite" :class="{ disabled: favoriteLoading }">
							<text v-if="!favoriteLoading" class="action-icon-text">{{ isFavorited ? '❤️' : '🤍' }}</text>
							<view v-else class="loading-spinner" />
						</view>
						<view class="action-btn" @click="onShare">
							<text class="action-icon-text">📤</text>
						</view>
					</view>

					<!-- 元信息网格 -->
					<view class="meta-grid">
						<!-- 第一行：详细地址（跨两列，居左） -->
						<view class="meta-item meta-item-wide">
							<text class="meta-emoji">📍</text>
							<view class="meta-content">
								<text class="meta-label">详细地址</text>
								<text class="meta-value address-value">{{ scenicDetail.address || '四川' }}</text>
							</view>
						</view>
						<view class="meta-item">
							<text class="meta-emoji">🏆</text>
							<view class="meta-content">
								<text class="meta-label">等级</text>
								<text class="meta-value">{{ formattedLevel }}级</text>
							</view>
						</view>
						<view class="meta-item">
							<text class="meta-emoji">👁️</text>
							<view class="meta-content">
								<text class="meta-label">浏览</text>
								<text class="meta-value">{{ scenicDetail.viewCount || 0 }} 次</text>
							</view>
						</view>
						<view class="meta-item">
							<text class="meta-emoji">🏔️</text>
							<view class="meta-content">
								<text class="meta-label">类型</text>
								<text class="meta-value">{{ scenicDetail.category || '自然风光' }}</text>
							</view>
						</view>
					</view>

					<!-- 三宫格功能区 -->
					<view class="action-grid">
						<!-- 语音导览 -->
						<view class="grid-item" @click="toggleAudioGuide">
							<view class="grid-icon-wrap audio-wrap" :class="{ playing: isPlaying }">
								<text class="grid-emoji">{{ isPlaying ? '⏹️' : '🔊' }}</text>
								<view v-if="isPlaying" class="wave-dots">
									<view class="dot" />
									<view class="dot" />
									<view class="dot" />
								</view>
							</view>
							<text class="grid-label">{{ isPlaying ? '停止' : '语音导览' }}</text>
						</view>
						<!-- 地图导航 -->
						<view class="grid-item" @click="openMapNavigation">
							<view class="grid-icon-wrap nav-wrap">
								<text class="grid-emoji">🗺️</text>
							</view>
							<text class="grid-label">地图导航</text>
						</view>
						<!-- 打卡 -->
						<view class="grid-item" @click="goToCheckin">
							<view class="grid-icon-wrap checkin-wrap">
								<text class="grid-emoji">📍</text>
							</view>
							<text class="grid-label">我要打卡</text>
						</view>
					</view>
				</view>

				<!-- 景点简介 -->
				<view class="section-card">
					<view class="section-header">
						<text class="section-icon">📖</text>
						<text class="section-title">景点简介</text>
					</view>
					<rich-text class="content-text" :nodes="scenicDetail.brief || '暂无简介'"></rich-text>
				</view>

				<!-- 详细描述 -->
				<view v-if="scenicDetail.description" class="section-card">
					<view class="section-header">
						<text class="section-icon">📝</text>
						<text class="section-title">详细描述</text>
					</view>
					<rich-text class="content-text" :nodes="scenicDetail.description"></rich-text>
				</view>

				<!-- 主要看点 -->
				<view v-if="scenicDetail.highlights" class="section-card">
					<view class="section-header">
						<text class="section-icon">✨</text>
						<text class="section-title">主要看点</text>
					</view>
					<rich-text class="content-text" :nodes="scenicDetail.highlights"></rich-text>
				</view>

				<!-- 历史沿革 -->
				<view v-if="scenicDetail.history" class="section-card">
					<view class="section-header">
						<text class="section-icon">🏛️</text>
						<text class="section-title">历史沿革</text>
					</view>
					<rich-text class="content-text" :nodes="scenicDetail.history"></rich-text>
				</view>

				<!-- 游览贴士 -->
				<view v-if="scenicDetail.tips" class="section-card tips-card">
					<view class="section-header">
						<text class="section-icon">💡</text>
						<text class="section-title">游览贴士</text>
					</view>
					<rich-text class="content-text tips-text" :nodes="scenicDetail.tips"></rich-text>
				</view>

				<!-- 图片集锦 -->
				<view v-if="scenicDetail.imageGallery && scenicDetail.imageGallery.length > 0" class="section-card">
					<view class="section-header">
						<text class="section-icon">🖼️</text>
						<text class="section-title">图片集锦</text>
						<text class="section-count">{{ scenicDetail.imageGallery.length }}张</text>
					</view>
					<scroll-view class="gallery-scroll" scroll-x="true" :show-scrollbar="false">
						<view class="gallery-list">
							<image v-for="(img, i) in scenicDetail.imageGallery" :key="i"
								class="gallery-image" :src="img" mode="aspectFill" @click="previewImage(i)" />
						</view>
					</scroll-view>
				</view>

				<!-- 景点标签 -->
				<view v-if="scenicDetail.tags && scenicDetail.tags.length > 0" class="section-card">
					<view class="section-header">
						<text class="section-icon">🏷️</text>
						<text class="section-title">景点标签</text>
					</view>
					<view class="tags-container">
						<view v-for="(tag, i) in scenicDetail.tags" :key="i" class="culture-tag">
							<text>{{ tag }}</text>
						</view>
					</view>
				</view>

				<!-- 底部占位 -->
				<view class="bottom-placeholder" />
			</view>

		</scroll-view>
	</view>
</template>

<script>
	import { callCloud, COLLECTIONS, processImageFields, getTempFileURL } from '@/utils/cloudCall.js'
	import { cloudFn } from '@/utils/cloudFunctionNames.js'

	// 景区等级映射：数字标识 → 选项值（与腾讯云枚举配置对应）
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

	export default {
		data() {
			return {
				scenicId: '',
				scenicDetail: null,
				isLoading: true,
				loadError: false,
				errorMessage: '',
				scrollTop: 0,

				// 收藏
				isFavorited: false,
				favoriteLoading: false,
				favoriteId: null,

				// 语音导览
				isPlaying: false,
				audioContext: null,

				// 单页模式（朋友圈分享进入）
				isSinglePage: false,
			};
		},

		computed: {
			// 格式化景区等级显示
			formattedLevel() {
				if (!this.scenicDetail?.level) return 'AAAAA';
				const level = this.scenicDetail.level;
				// 优先从映射表中查找
				if (LEVEL_MAP[level] !== undefined) {
					return LEVEL_MAP[level];
				}
				// 如果是数字，尝试转换
				if (typeof level === 'number') {
					return LEVEL_MAP[level] || 'AAAAA';
				}
				// 直接返回原始值
				return level;
			}
		},

		onLoad(options) {
			// 检测是否来自朋友圈分享的单页模式
			const { scene } = wx.getLaunchOptionsSync();
			this.isSinglePage = scene === 1154;

			if (options.id) {
				this.scenicId = options.id;
				this.loadScenicDetail();
			} else {
				this.loadError = true;
				this.errorMessage = '未指定景点';
				this.isLoading = false;
			}
		},

		onUnload() {
			this.stopAudio();
		},

		methods: {
			onScroll(e) {
				this.scrollTop = e.detail.scrollTop;
			},

			async loadScenicDetail() {
				this.isLoading = true;
				this.loadError = false;
				try {
					const db = wx.cloud.database();
					const res = await db.collection('scenic').doc(this.scenicId).get();
					if (res.data) {
						this.scenicDetail = await processImageFields(res.data, ['coverImage', 'image', 'gallery']);
						await this.incrementViewCount();
						await this.checkFavoriteStatus();
					} else {
						throw new Error('未找到该景点');
					}
				} catch (err) {
					console.error('加载景点详情失败：', err);
					this.loadError = true;
					this.errorMessage = err.message?.includes('cannot find document')
						? '该景点数据不存在，可能 linkId 配置有误'
						: (err.message || '网络错误，请稍后重试');
					uni.showToast({ title: '加载失败', icon: 'none' });
				} finally {
					this.isLoading = false;
				}
			},

async incrementViewCount() {
			try {
				const db = wx.cloud.database();
				await db.collection('scenic').doc(this.scenicId).update({
					data: { viewCount: db.command.inc(1) }
				});
				console.log('景点浏览量+1');
			} catch (e) {
				console.warn('更新浏览量失败（可能字段不存在或无权限）：', e);
				// 静默失败，不影响用户体验
			}
		},

			async checkFavoriteStatus() {
				try {
					const db = wx.cloud.database();
					const res = await db.collection('user_favorites')
						.where({ _openid: '{openid}', targetId: this.scenicId, targetType: 'scenic' })
						.get();
					if (res.data && res.data.length > 0) {
						this.isFavorited = true;
						this.favoriteId = res.data[0]._id;
					}
				} catch (e) { /* 静默 */ }
			},

			async toggleFavorite() {
				if (this.favoriteLoading) return;
				this.isFavorited ? await this.removeFromFavorites() : await this.addToFavorites();
			},

			async addToFavorites() {
				this.favoriteLoading = true;
				uni.showLoading({ title: '收藏中...', mask: true });
				try {
					const res = await cloudFn.addFavorite('scenic', this.scenicId, {
						title: this.scenicDetail?.name || '',
						coverImage: this.scenicDetail?.coverImage || '',
						category: this.scenicDetail?.category || ''
					});
					if (res.success) {
						this.isFavorited = true;
						this.favoriteId = res.data?._id || null;
						uni.showToast({ title: '已收藏 ❤️', icon: 'none', duration: 1500 });
					} else {
						throw new Error(res.message || '收藏失败');
					}
				} catch (err) {
					uni.showToast({ title: err.message || '收藏失败，请重试', icon: 'none' });
				} finally {
					setTimeout(() => { uni.hideLoading(); this.favoriteLoading = false; }, 100);
				}
			},

			async removeFromFavorites() {
				this.favoriteLoading = true;
				uni.showLoading({ title: '取消中...', mask: true });
				try {
					const res = await cloudFn.removeFavorite('scenic', this.scenicId);
					if (res.success) {
						this.isFavorited = false;
						this.favoriteId = null;
						uni.showToast({ title: '已取消收藏', icon: 'none', duration: 1500 });
					} else {
						throw new Error(res.message || '操作失败');
					}
				} catch (err) {
					uni.showToast({ title: err.message || '操作失败，请重试', icon: 'none' });
				} finally {
					setTimeout(() => { uni.hideLoading(); this.favoriteLoading = false; }, 100);
				}
			},

			previewImage(current) {
				if (this.scenicDetail.imageGallery?.length > 0) {
					uni.previewImage({
						current: this.scenicDetail.imageGallery[current],
						urls: this.scenicDetail.imageGallery
					});
				}
			},

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
			// 如果是系统自动分享，使用传入的参数
			let imageUrl = this.scenicDetail?.coverImage || '';
			
			// 如果是云存储路径，转换为临时链接
			if (imageUrl && imageUrl.startsWith('cloud://')) {
				// 云存储路径暂不处理，留空使用默认图片
				imageUrl = '';
			}
			
			return {
				title: this.scenicDetail?.name || '四川景点',
				desc: this.scenicDetail?.brief || '探索四川美景',
				path: `/pages/scenic/scenicDetail?id=${this.scenicId}`,
				imageUrl: imageUrl
			};
		},

		// 分享到朋友圈 - 使用原生生命周期
		onShareTimeline() {
			// 朋友圈分享不支持 imageUrl（只支持网络图片或留空）
			// query 参数使用 & 分隔多个参数
			return {
				title: this.scenicDetail?.name || '四川景点推荐',
				query: `id=${this.scenicId}&type=scenic`
			};
		},

			// ===== 语音导览 =====
			async toggleAudioGuide() {
				if (this.isPlaying) { this.stopAudio(); return; }
				await this.startAudioGuide();
			},

			async startAudioGuide() {
				const detail = this.scenicDetail;
				if (!detail) return;
				if (detail.audioUrl) { this.playAudioFromUrl(detail.audioUrl); return; }
				uni.showLoading({ title: '导览生成中...', mask: true });
				try {
					// 按文档字段顺序拼接：名称 + 简介 + 详细介绍 + 主要看点 + 历史沿革 + 游览贴士
					const textParts = [
						detail.name,
						detail.brief,
						detail.description,
						detail.highlights,  // 主要看点
						detail.history,     // 历史沿革
						detail.tips         // 游览贴士
					].filter(Boolean);
					const text = textParts.join('。');
					const res = await cloudFn.ttsGuide(text.slice(0, 500));
					uni.hideLoading();
					if (res?.audioUrl) {
						this.playAudioFromUrl(res.audioUrl);
					} else {
						uni.showToast({ title: '语音生成失败', icon: 'none' });
					}
				} catch (e) {
					uni.hideLoading();
					uni.showToast({ title: '语音导览暂不可用', icon: 'none' });
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

			// ===== 地图导航 =====
			openMapNavigation() {
				if (!this.scenicDetail) return;
				const { latitude, longitude, name, address, location } = this.scenicDetail;
				// 构建搜索关键词：优先用完整地址，其次用"地区+名称"
				const searchAddress = address || (location ? `${location}${name || ''}` : name) || '景点';
				// 跳转到路线页面，传递景点信息（坐标可选，没有会自动搜索）
				uni.navigateTo({
					url: `/pages/route/route?type=navigate&name=${encodeURIComponent(name || '景点')}&address=${encodeURIComponent(searchAddress)}&lat=${latitude || ''}&lng=${longitude || ''}`
				});
			},

			// ===== 打卡跳转 =====
			goToCheckin() {
				if (!this.scenicDetail) return;
				uni.navigateTo({
					url: `/pages/checkin/checkin?id=${this.scenicId}&type=scenic&name=${encodeURIComponent(this.scenicDetail.name)}&cover=${encodeURIComponent(this.scenicDetail.coverImage || '')}`
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	/* ===== 基础容器 ===== */
	.page-container {
		background: #F7F5F2;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.content-scroll {
		flex: 1;
		height: 100vh;
	}

	/* ===== 封面图 ===== */
	.cover-container {
		position: relative;
		width: 100%;
		height: 520rpx;

		.cover-image {
			width: 100%;
			height: 100%;
			display: block;
		}

		.skeleton-cover {
			width: 100%;
			height: 100%;
			background: linear-gradient(135deg, #e8e4de, #d4cfc9);
		}

		/* 渐变遮罩：干净的双向渐变 */
		.cover-overlay {
			position: absolute;
			inset: 0;
			background: linear-gradient(
				to bottom,
				transparent 0%,
				transparent 40%,
				rgba(0,0,0,0.65) 100%
			);
		}

		/* 封面标题块 */
		.cover-title-block {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			padding: 0 30rpx 36rpx;

			.cover-badges {
				display: flex;
				gap: 12rpx;
				margin-bottom: 14rpx;

				.badge-recommend, .badge-level {
					font-size: 20rpx;
					padding: 6rpx 16rpx;
					border-radius: 20rpx;
					font-weight: 600;
				}

				.badge-recommend {
					background: rgba(217, 48, 37, 0.85);
					color: #fff;
				}

				.badge-level {
					background: rgba(255,255,255,0.25);
					color: #fff;
					border: 1rpx solid rgba(255,255,255,0.6);
					backdrop-filter: blur(4px);
				}
			}

			.cover-title {
				display: block;
				font-size: 48rpx;
				font-weight: 700;
				color: #fff;
				line-height: 1.3;
				text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.4);
				margin-bottom: 8rpx;
			}

			.cover-subtitle {
				font-size: 26rpx;
				color: rgba(255,255,255,0.82);
				font-style: italic;
			}
		}
	}

	/* ===== 加载状态 ===== */
	.loading-container {
		padding: 120rpx 0 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24rpx;

		.loading-dots {
			display: flex;
			gap: 12rpx;

			.ld {
				width: 14rpx;
				height: 14rpx;
				border-radius: 50%;
				background: #D93025;
				animation: ldBounce 1s ease infinite;

				&:nth-child(2) { animation-delay: 0.15s; }
				&:nth-child(3) { animation-delay: 0.3s; }
			}
		}

		.loading-text {
			font-size: 26rpx;
			color: #999;
		}
	}

	@keyframes ldBounce {
		0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
		40% { transform: scale(1); opacity: 1; }
	}

	/* ===== 错误状态 ===== */
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 30rpx;

		.error-emoji { font-size: 80rpx; margin-bottom: 20rpx; }

		.error-text {
			font-size: 32rpx;
			color: #555;
			font-weight: 600;
			margin-bottom: 12rpx;
		}

		.error-tip {
			font-size: 26rpx;
			color: #999;
			text-align: center;
			margin-bottom: 40rpx;
			line-height: 1.6;
		}

		.retry-btn {
			background: linear-gradient(135deg, #D93025, #A8201A);
			color: #fff;
			font-size: 28rpx;
			font-weight: 600;
			border-radius: 50rpx;
			padding: 22rpx 70rpx;
		}
	}

	/* ===== 主内容 ===== */
	.main-content {
		position: relative;
		margin-top: -60rpx;
		z-index: 2;
		padding: 0 24rpx;
	}

	/* 信息主卡 */
	.info-card {
		background: #fff;
		border-radius: 40rpx 40rpx 24rpx 24rpx;
		padding: 28rpx 28rpx 24rpx;
		box-shadow: 0 -8rpx 24rpx rgba(0,0,0,0.06);
		margin-bottom: 24rpx;
	}

	/* 收藏/分享操作行 */
	.title-actions-row {
		display: flex;
		justify-content: flex-end;
		gap: 16rpx;
		margin-bottom: 28rpx;

		.action-btn {
			width: 68rpx;
			height: 68rpx;
			background: #F7F5F2;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;

			&:active { background: #ede9e4; transform: scale(0.93); }
			&.disabled { opacity: 0.5; }

			.action-icon-text { font-size: 32rpx; line-height: 1; }

			.loading-spinner {
				width: 32rpx;
				height: 32rpx;
				border: 3rpx solid #D93025;
				border-top-color: transparent;
				border-radius: 50%;
				animation: spin 0.8s linear infinite;
			}
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* 元信息网格 */
	.meta-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16rpx;
		margin-bottom: 32rpx;

		.meta-item {
			background: #F7F5F2;
			border-radius: 20rpx;
			padding: 20rpx 18rpx;
			display: flex;
			align-items: flex-start;
			gap: 14rpx;

			/* 跨两列的项（用于地址） */
			&.meta-item-wide {
				grid-column: span 2;
			}

			.meta-emoji { font-size: 32rpx; }

			.meta-content {
				flex: 1;
				min-width: 0;

				.meta-label {
					display: block;
					font-size: 22rpx;
					color: #aaa;
					margin-bottom: 4rpx;
				}

				.meta-value {
					font-size: 26rpx;
					color: #333;
					font-weight: 600;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				/* 地址专用样式：支持多行显示 */
				.address-value {
					white-space: normal;
					overflow: visible;
					text-overflow: unset;
					line-height: 1.4;
					word-break: break-all;
				}
			}
		}
	}

	/* 三宫格功能区 */
	.action-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;

		.grid-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12rpx;

			&:active .grid-icon-wrap {
				opacity: 0.82;
				transform: scale(0.93);
			}

			.grid-icon-wrap {
				width: 116rpx;
				height: 116rpx;
				border-radius: 30rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				position: relative;
				transition: all 0.2s;

				.grid-emoji {
					font-size: 48rpx;
					line-height: 1;
				}

				&.audio-wrap {
					background: linear-gradient(135deg, #fd7b4d 0%, #D93025 100%);
					&.playing { animation: pulse 1.2s ease infinite; }
				}

				&.nav-wrap {
					background: linear-gradient(135deg, #43d39e 0%, #00b094 100%);
				}

				&.checkin-wrap {
					background: linear-gradient(135deg, #5b8cff 0%, #2d5be3 100%);
				}
			}

			.grid-label {
				font-size: 24rpx;
				color: #555;
				font-weight: 500;
			}

			/* 声波动画 */
			.wave-dots {
				position: absolute;
				bottom: 12rpx;
				right: 12rpx;
				display: flex;
				gap: 4rpx;
				align-items: flex-end;

				.dot {
					width: 5rpx;
					background: rgba(255,255,255,0.9);
					border-radius: 3rpx;
					animation: waveDot 0.8s ease infinite;

					&:nth-child(1) { height: 10rpx; animation-delay: 0s; }
					&:nth-child(2) { height: 18rpx; animation-delay: 0.2s; }
					&:nth-child(3) { height: 10rpx; animation-delay: 0.4s; }
				}
			}
		}
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.08); }
	}

	@keyframes waveDot {
		0%, 100% { transform: scaleY(0.5); }
		50% { transform: scaleY(1.3); }
	}

	/* ===== 内容卡片 ===== */
	.section-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

		.section-header {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;
			gap: 12rpx;

			.section-icon { font-size: 32rpx; }

			.section-title {
				flex: 1;
				font-size: 30rpx;
				font-weight: 700;
				color: #222;
			}

			.section-count {
				font-size: 22rpx;
				color: #aaa;
			}
		}

		.content-text {
			font-size: 28rpx;
			color: #555;
			line-height: 1.85;
			display: block;
		}
	}

	/* 贴士卡片特殊风格 */
	.tips-card {
		background: linear-gradient(135deg, #fff9f0 0%, #fff5e8 100%);
		border: 1rpx solid #ffe0b2;

		.tips-text { color: #8a5a1a; }
	}

	/* 主要看点 */
	.features-list {
		display: flex;
		flex-wrap: wrap;
		gap: 14rpx;

		.feature-tag {
			background: linear-gradient(135deg, #fff1f0 0%, #ffe4e0 100%);
			color: #D93025;
			font-size: 25rpx;
			font-weight: 600;
			padding: 10rpx 24rpx;
			border-radius: 30rpx;
			border: 1rpx solid #fac5c0;
		}
	}

	/* 图片画廊 */
	.gallery-scroll {
		margin: 0 -4rpx;

		.gallery-list {
			display: flex;
			padding: 0 4rpx;

			.gallery-image {
				width: 220rpx;
				height: 160rpx;
				border-radius: 16rpx;
				margin-right: 16rpx;
				flex-shrink: 0;

				&:last-child { margin-right: 0; }
			}
		}
	}

	/* 景点标签 */
	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 14rpx;

		.culture-tag {
			background: linear-gradient(135deg, #6b7cff 0%, #4a5cdd 100%);
			color: #fff;
			font-size: 24rpx;
			font-weight: 500;
			padding: 10rpx 24rpx;
			border-radius: 30rpx;
		}
	}

	/* 底部占位 */
	.bottom-placeholder { height: 80rpx; }
</style>
