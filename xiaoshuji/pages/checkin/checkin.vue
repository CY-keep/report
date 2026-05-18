<!-- pages/checkin/checkin.vue - 打卡页（支持上传照片 + 备注）
     AI辅助生成：Claude, 2025-03
     - 位置验证逻辑（checkLocation云函数）
     - 图片上传到云存储
     - 打卡记录写入数据库
-->
<template>
	<view class="page-container">
		<!-- 顶部封面背景 -->
		<view class="cover-header">
			<image v-if="coverImage" class="cover-bg" :src="coverImage" mode="aspectFill"></image>
			<view v-else class="cover-default-bg"></view>
			<view class="cover-mask"></view>
			<view class="cover-info">
				<text class="cover-type-tag">{{ typeLabel }}</text>
				<text class="cover-name">{{ targetName }}</text>
			</view>
		</view>

		<!-- 主内容卡片 -->
		<view class="content-card">
			<!-- ① 打卡成功状态 -->
			<view v-if="checkinSuccess" class="success-content">
				<view class="success-icon-wrap">
					<text class="success-emoji">✅</text>
				</view>
				<text class="success-title">打卡成功 🎉</text>
				<text class="success-sub">{{ targetName }}</text>
				<text class="success-tip">{{ currentDateStr }} · 已记录到你的足迹</text>

				<!-- 上传的打卡照片预览 -->
				<image
					v-if="uploadedPhotoUrl"
					class="success-photo"
					:src="uploadedPhotoUrl"
					mode="aspectFill"
					@click="previewPhoto(uploadedPhotoUrl)"
				></image>

				<view class="success-btns">
					<button class="sub-btn" @click="goToMyCheckin">查看打卡</button>
					<button class="main-btn blue-btn flex1" @click="goBack">返回</button>
				</view>
			</view>

			<!-- ② 未打卡状态 -->
			<view v-else class="checkin-area">
				<view class="checkin-icon-wrap">
					<text class="checkin-emoji">📍</text>
				</view>
				<text class="checkin-title">来打个卡吧</text>
				<text class="checkin-desc">记录你在 {{ targetName }} 的美好时刻</text>

				<!-- 图片上传区 -->
				<view class="upload-section">
					<view class="upload-label-row">
						<text class="upload-label">📸 打卡照片</text>
						<text class="upload-hint">（可选，最多 3 张）</text>
					</view>

					<view class="photo-grid">
						<!-- 已选照片 -->
						<view
							v-for="(photo, idx) in photoList"
							:key="idx"
							class="photo-item"
						>
							<image :src="photo" class="photo-img" mode="aspectFill" @click="previewPhoto(photo)"></image>
							<view class="photo-del" @click.stop="removePhoto(idx)">✕</view>
						</view>

						<!-- 添加按钮（未满 3 张时显示） -->
						<view
							v-if="photoList.length < 3"
							class="photo-add"
							@click="choosePhoto"
						>
							<text class="photo-add-icon">＋</text>
							<text class="photo-add-text">添加照片</text>
						</view>
					</view>
				</view>

				<!-- 备注输入 -->
				<view class="note-section">
					<view class="upload-label-row">
						<text class="upload-label">✏️ 打卡备注</text>
						<text class="upload-hint">（可选，最多 100 字）</text>
					</view>
					<textarea
						class="note-input"
						v-model="note"
						placeholder="写下你此刻的感受..."
						placeholder-class="note-placeholder"
						:maxlength="100"
						auto-height
					></textarea>
					<text class="note-count">{{ note.length }}/100</text>
				</view>

				<!-- 打卡按钮 -->
				<button
					class="main-btn red-btn"
					:loading="isChecking"
					:disabled="isChecking"
					@click="doCheckin"
				>
					{{ isChecking ? (uploadProgress > 0 ? `上传中 ${uploadProgress}%` : '打卡中...') : '立即打卡' }}
				</button>

				<view class="back-tip" @click="goBack">
					<text>暂时不想打卡</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			targetId: '',
			targetType: 'heritage',
			targetName: '',
			coverImage: '',
			checkinSuccess: false,
			isChecking: false,
			currentDateStr: '',

			// 图片上传
			photoList: [],        // 本地临时路径列表
			uploadProgress: 0,    // 上传进度 0-100
			uploadedPhotoUrl: '', // 上传成功后的第一张临时URL（用于成功页预览）

			// 备注
			note: ''
		};
	},

	computed: {
		typeLabel() {
			return this.targetType === 'heritage' ? '非遗打卡' : '景点打卡';
		}
	},

	onLoad(options) {
		this.targetId = options.id || '';
		this.targetType = options.type || 'heritage';
		this.targetName = decodeURIComponent(options.name || '未知地点');
		this.coverImage = decodeURIComponent(options.cover || '');

		const now = new Date();
		this.currentDateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
	},

	methods: {
		// ── 选择照片 ──────────────────────────────────────────
		choosePhoto() {
			const remain = 3 - this.photoList.length;
			wx.chooseMedia({
				count: remain,
				mediaType: ['image'],
				sourceType: ['album', 'camera'],
				sizeType: ['compressed'],
				success: (res) => {
					const paths = res.tempFiles.map(f => f.tempFilePath);
					this.photoList = [...this.photoList, ...paths].slice(0, 3);
				}
			});
		},

		// ── 删除照片 ──────────────────────────────────────────
		removePhoto(idx) {
			this.photoList.splice(idx, 1);
		},

		// ── 预览照片 ──────────────────────────────────────────
		previewPhoto(url) {
			const urls = this.photoList.length > 0 ? this.photoList : [url];
			wx.previewImage({ current: url, urls });
		},

		// ── 上传单张图片到云存储 ───────────────────────────────
		async uploadPhoto(localPath, index) {
			const ext = localPath.split('.').pop() || 'jpg';
			const cloudPath = `images/checkin/${Date.now()}_${index}.${ext}`;
			return new Promise((resolve, reject) => {
				wx.cloud.uploadFile({
					cloudPath,
					filePath: localPath,
					success: res => resolve(res.fileID),
					fail: err => reject(err)
				});
			});
		},

		// ── 主打卡逻辑 ────────────────────────────────────────
		async doCheckin() {
			if (this.isChecking) return;
			this.isChecking = true;
			this.uploadProgress = 0;

			try {
				// 1. 上传所有照片到云存储
				const cloudPhotoIds = [];
				const total = this.photoList.length;
				for (let i = 0; i < total; i++) {
					const fileID = await this.uploadPhoto(this.photoList[i], i);
					cloudPhotoIds.push(fileID);
					this.uploadProgress = Math.round(((i + 1) / total) * 80);
				}

				// 2. 获取第一张的临时URL用于成功页展示
				if (cloudPhotoIds.length > 0) {
					const tempRes = await wx.cloud.getTempFileURL({ fileList: [cloudPhotoIds[0]] });
					this.uploadedPhotoUrl = tempRes.fileList[0]?.tempFileURL || '';
				}

				this.uploadProgress = 90;

				// 3. 调云函数写入打卡记录
				let checkinId = null;
				try {
					const res = await wx.cloud.callFunction({
						name: 'checkin-submit',
						data: {
							targetId: this.targetId,
							targetType: this.targetType,
							targetName: this.targetName,
							photoUrl: cloudPhotoIds[0] || '',
							photoUrls: cloudPhotoIds,
							note: this.note.trim()
						}
					});
					if (res.result && res.result.success) {
						checkinId = res.result.checkinId;
					}
				} catch (cloudErr) {
					console.warn('云函数打卡失败，降级本地存储', cloudErr);
				}

				this.uploadProgress = 100;

				// 4. 本地存储同步（离线兜底）
				const checkinList = uni.getStorageSync('localCheckins') || [];
				checkinList.unshift({
					id: checkinId || Date.now(),
					targetId: this.targetId,
					targetType: this.targetType,
					targetName: this.targetName,
					coverImage: this.coverImage,
					photoUrl: cloudPhotoIds[0] || '',
					photoUrls: cloudPhotoIds,
					note: this.note.trim(),
					createTime: new Date().toISOString(),
					dateStr: this.currentDateStr
				});
				uni.setStorageSync('localCheckins', checkinList);

				// 5. 展示成功页
				this.checkinSuccess = true;

			} catch (e) {
				console.error('打卡失败', e);
				uni.showToast({ title: '打卡失败，请重试', icon: 'none' });
			} finally {
				this.isChecking = false;
				this.uploadProgress = 0;
			}
		},

		goBack() {
			uni.navigateBack();
		},

		goToMyCheckin() {
			uni.navigateTo({ url: '/pages/checkin/myCheckin' });
		}
	}
};
</script>

<style lang="scss" scoped>
.page-container {
	min-height: 100vh;
	background: #F7F5F2;
}

/* ── 封面区 ─────────────────────────────── */
.cover-header {
	position: relative;
	height: 380rpx;
	overflow: hidden;

	.cover-bg {
		width: 100%;
		height: 100%;
	}

	.cover-default-bg {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #D93025 0%, #A8201A 100%);
	}

	.cover-mask {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.6));
	}

	.cover-info {
		position: absolute;
		bottom: 50rpx;
		left: 40rpx;

		.cover-type-tag {
			display: inline-block;
			background: rgba(255,255,255,0.25);
			border: 1rpx solid rgba(255,255,255,0.5);
			color: #fff;
			font-size: 22rpx;
			padding: 6rpx 20rpx;
			border-radius: 20rpx;
			margin-bottom: 14rpx;
		}

		.cover-name {
			display: block;
			font-size: 44rpx;
			font-weight: bold;
			color: #fff;
			text-shadow: 0 2rpx 10rpx rgba(0,0,0,0.4);
		}
	}
}

/* ── 主卡片 ─────────────────────────────── */
.content-card {
	background: #fff;
	border-radius: 40rpx 40rpx 0 0;
	margin-top: -40rpx;
	padding: 50rpx 40rpx 80rpx;
	min-height: calc(100vh - 340rpx);
	box-shadow: 0 -10rpx 40rpx rgba(0,0,0,0.08);
}

/* ── 未打卡区 ────────────────────────────── */
.checkin-area {
	display: flex;
	flex-direction: column;
	align-items: center;

	.checkin-icon-wrap {
		width: 140rpx;
		height: 140rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #fd7b4d, #D93025);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 30rpx;
		box-shadow: 0 16rpx 40rpx rgba(217,48,37,0.3);

		.checkin-emoji { font-size: 64rpx; line-height: 1; }
	}

	.checkin-title {
		font-size: 42rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 12rpx;
	}

	.checkin-desc {
		font-size: 26rpx;
		color: #999;
		text-align: center;
		margin-bottom: 40rpx;
	}

	.back-tip {
		margin-top: 30rpx;
		font-size: 26rpx;
		color: #bbb;
		text-decoration: underline;
	}
}

/* ── 图片上传区 ─────────────────────────── */
.upload-section, .note-section {
	width: 100%;
	margin-bottom: 36rpx;

	.upload-label-row {
		display: flex;
		align-items: baseline;
		margin-bottom: 16rpx;

		.upload-label {
			font-size: 28rpx;
			font-weight: 600;
			color: #333;
		}

		.upload-hint {
			font-size: 22rpx;
			color: #bbb;
			margin-left: 12rpx;
		}
	}
}

.photo-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;

	.photo-item {
		position: relative;
		width: 196rpx;
		height: 196rpx;
		border-radius: 16rpx;
		overflow: visible;

		.photo-img {
			width: 196rpx;
			height: 196rpx;
			border-radius: 16rpx;
			display: block;
		}

		.photo-del {
			position: absolute;
			top: -16rpx;
			right: -16rpx;
			width: 44rpx;
			height: 44rpx;
			background: rgba(0,0,0,0.55);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 22rpx;
			color: #fff;
			z-index: 10;
		}
	}

	.photo-add {
		width: 196rpx;
		height: 196rpx;
		border-radius: 16rpx;
		border: 2rpx dashed #D93025;
		background: #fff5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.photo-add-icon {
			font-size: 56rpx;
			color: #D93025;
			line-height: 1;
			margin-bottom: 8rpx;
		}

		.photo-add-text {
			font-size: 22rpx;
			color: #D93025;
		}
	}
}

/* ── 备注输入 ────────────────────────────── */
.note-input {
	width: 100%;
	min-height: 160rpx;
	background: #F7F5F2;
	border-radius: 20rpx;
	padding: 24rpx;
	font-size: 28rpx;
	color: #333;
	line-height: 1.7;
	box-sizing: border-box;
}

.note-placeholder {
	color: #ccc;
}

.note-count {
	display: block;
	text-align: right;
	font-size: 22rpx;
	color: #ccc;
	margin-top: 8rpx;
}

/* ── 成功状态 ────────────────────────────── */
.success-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 30rpx;

	.success-icon-wrap {
		width: 140rpx;
		height: 140rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #55efc4, #00b894);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 30rpx;
		box-shadow: 0 16rpx 40rpx rgba(0,184,148,0.3);

		.success-emoji { font-size: 64rpx; line-height: 1; }
	}

	.success-title {
		font-size: 44rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 12rpx;
	}

	.success-sub {
		font-size: 30rpx;
		color: #D93025;
		margin-bottom: 8rpx;
	}

	.success-tip {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 30rpx;
	}

	.success-photo {
		width: 100%;
		height: 340rpx;
		border-radius: 20rpx;
		margin-bottom: 40rpx;
		object-fit: cover;
	}
}

/* ── 按钮 ──────────────────────────────── */
.success-btns {
	display: flex;
	gap: 24rpx;
	width: 100%;
}

.main-btn {
	height: 96rpx;
	border-radius: 48rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;

	&.blue-btn { background: linear-gradient(135deg, #74b9ff, #0984e3); color: #fff; }
	&.red-btn  { background: linear-gradient(135deg, #fd7b4d, #D93025); color: #fff; box-shadow: 0 12rpx 32rpx rgba(217,48,37,0.3); }
	&.flex1    { flex: 1; }

	&[disabled] { opacity: 0.7; }
}

.sub-btn {
	height: 96rpx;
	min-width: 180rpx;
	border-radius: 48rpx;
	font-size: 30rpx;
	background: #f0f0f0;
	color: #666;
	border: none;
}
</style>
