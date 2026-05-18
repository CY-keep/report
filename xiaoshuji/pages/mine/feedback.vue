<!-- pages/mine/feedback.vue - 问题反馈 -->
<template>
	<view class="page-container">
		<!-- 顶部说明 -->
		<view class="header-tip">
			<text class="tip-emoji">💬</text>
			<view class="tip-content">
				<text class="tip-title">您的反馈很重要</text>
				<text class="tip-desc">我们会在3个工作日内处理您的反馈</text>
			</view>
		</view>

		<!-- 问题类型 -->
		<view class="card">
			<view class="card-header">
				<text class="card-label">问题类型</text>
			</view>
			<view class="type-grid">
				<view v-for="(item, index) in typeList" :key="index"
					:class="['type-chip', currentType === index ? 'active' : '']"
					@click="currentType = index">
					<text class="chip-emoji">{{ item.emoji }}</text>
					<text class="chip-label">{{ item.name }}</text>
				</view>
			</view>
		</view>

		<!-- 问题描述 -->
		<view class="card">
			<view class="card-header">
				<text class="card-label">问题描述 <text class="required">*</text></text>
				<text class="char-count">{{ formData.desc.length }}/500</text>
			</view>
			<textarea
				class="desc-textarea"
				:placeholder="currentTypePlaceholder"
				v-model="formData.desc"
				:maxlength="500"
				fixed
			/>
		</view>

		<!-- 截图上传 -->
		<view class="card">
			<view class="card-header">
				<text class="card-label">相关截图（选填）</text>
				<text class="img-count">{{ formData.imgs.length }}/3</text>
			</view>
			<text class="upload-hint">上传截图可以帮助我们更快定位问题</text>
			<view class="img-grid">
				<view v-for="(img, index) in formData.imgs" :key="index" class="img-item">
					<image :src="img" mode="aspectFill" class="img-preview" @click="previewImg(index)"></image>
					<view class="img-delete" @click.stop="deleteImg(index)">
						<uni-icons type="closeempty" size="14" color="#fff"></uni-icons>
					</view>
				</view>
				<view v-if="formData.imgs.length < 3" class="img-add" @click="chooseImg">
					<uni-icons type="camera-filled" size="36" color="#CCC"></uni-icons>
					<text class="add-label">添加图片</text>
				</view>
			</view>
		</view>

		<!-- 联系方式 -->
		<view class="card">
			<view class="card-header">
				<text class="card-label">联系方式（选填）</text>
			</view>
			<input
				class="contact-input"
				v-model="formData.contact"
				placeholder="留下微信号/邮箱，方便我们回复您"
				:maxlength="100"
			/>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-wrap">
			<view 
				:class="['submit-btn', (!canSubmit || isSubmitting) ? 'disabled' : '']"
				@click="submitFeedback"
			>
				<text v-if="isSubmitting" class="loading-text">提交中...</text>
				<text v-else>提交反馈</text>
			</view>
		</view>

		<!-- 底部说明 -->
		<view class="bottom-note">
			<text>感谢您的反馈，我们将持续改进！🙏</text>
		</view>
	</view>
</template>

<script>
	import { callCloud } from '@/utils/cloudCall.js'
	import { CLOUD_FUNCTIONS } from '@/config.js'

	export default {
		data() {
			return {
				typeList: [
					{ name: '地图导航', emoji: '🗺️', placeholder: '描述地图或导航相关的问题...' },
					{ name: '内容有误', emoji: '📝', placeholder: '指出有误的内容，我们会及时更正...' },
					{ name: '加载异常', emoji: '⚠️', placeholder: '描述页面加载或功能异常的情况...' },
					{ name: '功能建议', emoji: '💡', placeholder: '分享您的功能建议，帮助我们改进...' },
					{ name: '其他问题', emoji: '❓', placeholder: '描述您遇到的其他问题...' }
				],
				currentType: 0,
				formData: {
					desc: '',
					imgs: [],
					contact: ''
				},
				isSubmitting: false
			};
		},

		computed: {
			canSubmit() {
				return this.formData.desc.trim().length >= 5 && !this.isSubmitting;
			},
			currentTypePlaceholder() {
				return this.typeList[this.currentType]?.placeholder || '请详细描述您遇到的问题...';
			}
		},

		methods: {
			// 选择图片
			chooseImg() {
				const maxCount = 3 - this.formData.imgs.length;
				uni.chooseImage({
					count: maxCount,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.formData.imgs = this.formData.imgs.concat(res.tempFilePaths);
					},
					fail: (err) => {
						if (!err.errMsg.includes('cancel')) {
							uni.showToast({ title: '选择图片失败', icon: 'none' });
						}
					}
				});
			},

			// 删除图片
			deleteImg(index) {
				this.formData.imgs.splice(index, 1);
			},

			// 预览图片
			previewImg(index) {
				uni.previewImage({
					current: index,
					urls: this.formData.imgs
				});
			},

			// 上传图片到云存储
			async uploadImgs() {
				if (!this.formData.imgs.length) return [];
				const tasks = this.formData.imgs.map((filePath, i) => {
					const ext = filePath.split('.').pop() || 'jpg';
					const cloudPath = `feedback/${Date.now()}_${i}.${ext}`;
					return wx.cloud.uploadFile({ cloudPath, filePath });
				});
				const results = await Promise.all(tasks);
				return results.map(r => r.fileID);
			},

			// 提交反馈
			async submitFeedback() {
				if (!this.canSubmit) return;

				const descLen = this.formData.desc.trim().length;
				if (descLen < 5) {
					uni.showToast({ title: '请至少描述5个字', icon: 'none' });
					return;
				}

				this.isSubmitting = true;
				uni.showLoading({ title: '提交中...', mask: true });

				try {
					// 上传图片
					let cloudImgIds = [];
					if (this.formData.imgs.length > 0) {
						uni.showLoading({ title: '上传图片中...' });
						cloudImgIds = await this.uploadImgs();
					}

			// 调用云函数提交反馈
			uni.showLoading({ title: '提交中...' });
			await callCloud(CLOUD_FUNCTIONS.submitFeedback, {
				type: this.typeList[this.currentType].name,
				content: this.formData.desc.trim(),
				images: cloudImgIds,
				contact: this.formData.contact.trim()
			});

					uni.hideLoading();
					uni.showToast({
						title: '提交成功，感谢反馈！',
						icon: 'success',
						duration: 2500
					});

					// 2.5秒后返回
					setTimeout(() => {
						uni.navigateBack();
					}, 2500);

				} catch (err) {
					uni.hideLoading();
					console.error('提交反馈失败:', err);

					// 降级方案：直接写入数据库
					try {
					const db = wx.cloud.database();
					await db.collection('feedback').add({
						data: {
							type: this.typeList[this.currentType].name,
							content: this.formData.desc.trim(),
							images: cloudImgIds,
							contact: this.formData.contact.trim(),
							createTime: db.serverDate(),
							status: '待处理'
						}
					});

						uni.showToast({ title: '提交成功', icon: 'success', duration: 2000 });
						setTimeout(() => uni.navigateBack(), 2000);
					} catch (dbErr) {
						uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
					}
				} finally {
					this.isSubmitting = false;
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	.page-container {
		background: #F5F6FA;
		min-height: 100vh;
		padding: 0 0 120rpx;
	}

	/* ===== 顶部提示 ===== */
	.header-tip {
		background: linear-gradient(135deg, #D93025 0%, #A8201A 100%);
		padding: 40rpx;
		display: flex;
		align-items: center;
		gap: 24rpx;
		margin-bottom: 24rpx;

		.tip-emoji {
			font-size: 56rpx;
			flex-shrink: 0;
		}

		.tip-content {
			.tip-title {
				display: block;
				font-size: 34rpx;
				font-weight: 700;
				color: #fff;
				margin-bottom: 8rpx;
			}

			.tip-desc {
				display: block;
				font-size: 24rpx;
				color: rgba(255,255,255,0.8);
			}
		}
	}

	/* ===== 卡片 ===== */
	.card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx 36rpx;
		margin: 0 24rpx 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		.card-label {
			font-size: 32rpx;
			font-weight: 600;
			color: #1A1A1A;

			.required {
				color: #E64340;
				margin-left: 6rpx;
			}
		}

		.img-count, .char-count {
			font-size: 24rpx;
			color: #BDBDBD;
		}
	}

	/* ===== 文本域 ===== */
	.desc-textarea {
		width: 100%;
		min-height: 240rpx;
		padding: 24rpx;
		background: #F8F9FA;
		border-radius: 16rpx;
		font-size: 30rpx;
		color: #333;
		line-height: 1.6;
		box-sizing: border-box;
	}

	/* ===== 联系输入框 ===== */
	.contact-input {
		height: 88rpx;
		padding: 0 24rpx;
		background: #F8F9FA;
		border-radius: 16rpx;
		font-size: 30rpx;
		color: #333;
	}

	/* ===== 提交按钮 ===== */
	.submit-wrap {
		padding: 0 24rpx;
		margin-top: 20rpx;
	}

	.submit-btn {
		height: 96rpx;
		background: linear-gradient(135deg, #E64340, #C63333);
		border-radius: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: 600;
		color: #fff;
		box-shadow: 0 8rpx 24rpx rgba(230, 67, 64, 0.3);

		&.disabled {
			background: #CCC;
			box-shadow: none;
		}

		&:active:not(.disabled) {
			transform: scale(0.98);
		}
	}

	.loading-text {
		font-size: 28rpx;
	}

	/* ===== 类型选择 ===== */
	.type-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.type-chip {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 16rpx 22rpx;
		background: #F5F6FA;
		border-radius: 40rpx;
		border: 2rpx solid transparent;
		transition: all 0.2s;

		&.active {
			background: rgba(230,67,64,0.08);
			border-color: #E64340;

			.chip-label { color: #E64340; }
		}

		.chip-emoji { font-size: 28rpx; }

		.chip-label {
			font-size: 26rpx;
			color: #555;
			font-weight: 500;
		}
	}

	/* ===== 图片上传 ===== */
	.upload-hint {
		display: block;
		font-size: 24rpx;
		color: #BDBDBD;
		margin-bottom: 24rpx;
	}

	.img-grid {
		display: flex;
		gap: 20rpx;
		flex-wrap: wrap;
	}

	.img-item {
		width: 190rpx;
		height: 190rpx;
		border-radius: 16rpx;
		overflow: hidden;
		position: relative;

		.img-preview {
			width: 100%;
			height: 100%;
		}

		.img-delete {
			position: absolute;
			top: 8rpx;
			right: 8rpx;
			width: 44rpx;
			height: 44rpx;
			background: rgba(0,0,0,0.6);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.img-add {
		width: 190rpx;
		height: 190rpx;
		border-radius: 16rpx;
		border: 2rpx dashed #D0D0D0;
		background: #FAFAFA;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		transition: all 0.2s;

		&:active {
			background: #F0F7FF;
			border-color: #3399FF;
		}

		.add-label {
			font-size: 24rpx;
			color: #BDBDBD;
		}
	}

	/* ===== 底部说明 ===== */
	.bottom-note {
		text-align: center;
		padding: 0 0 40rpx;
		font-size: 26rpx;
		color: #BDBDBD;
	}
</style>
