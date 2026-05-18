<!-- pages/mine/mine.vue - 个人中心 -->
<template>
	<view class="page-container">
		<!-- 顶部用户信息区域 -->
		<view class="user-header">
			<!-- 装饰背景 -->
			<view class="header-bg"></view>

			<!-- 头像和昵称 -->
			<view class="user-profile">
				<!-- 头像区域（新版方式：chooseAvatar + input nickname） -->
				<!-- 未登录或未获取真实信息，显示登录引导 -->
				<button v-if="!hasLogin || !hasUserInfo" class="avatar-btn" open-type="chooseAvatar"
					@chooseavatar="onChooseAvatar" @click="onAvatarClick">
					<view class="avatar-wrap">
						<image class="user-avatar" :src="currentAvatar" mode="aspectFill" @error="onAvatarError"></image>
						<view class="avatar-badge">
							<uni-icons type="plusempty" size="14" color="#fff"></uni-icons>
						</view>
					</view>
				</button>

				<!-- 已登录且有真实信息 -->
				<view v-else class="avatar-wrap" @click="handleUserInfoClick">
					<image class="user-avatar" :src="userInfo.avatarUrl" mode="aspectFill" @error="onAvatarError"></image>
					<view class="avatar-verified">
						<uni-icons type="checkbox" size="12" color="#fff"></uni-icons>
					</view>
				</view>

				<!-- 用户信息文字 -->
				<view class="user-text">
					<text class="user-name">{{ displayName }}</text>
					<text class="user-status">{{ userStatusText }}</text>
				</view>
			</view>

			<!-- 用户数据统计 -->
			<view class="user-stats" v-if="hasLogin">
				<view class="stat-item" @click="navTo('myFavorites')">
					<text class="stat-num">{{ userStats.favorites }}</text>
					<text class="stat-label">收藏</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item" @click="navTo('myCheckin')">
					<text class="stat-num">{{ userStats.checkins }}</text>
					<text class="stat-label">打卡</text>
				</view>
				<view class="stat-divider"></view>
				<view class="stat-item">
					<text class="stat-num">{{ userStats.browses }}</text>
					<text class="stat-label">足迹</text>
				</view>
			</view>
			<!-- 未登录提示 -->
			<view v-else class="login-prompt">
				<text class="login-prompt-text">还没有记录嘛？登录后来打卡 ›</text>
			</view>
		</view>

		<!-- 昵称输入弹窗（新版登录方式） -->
		<view v-if="showNicknamePopup" class="nickname-popup-mask" @click="cancelNickname">
			<view class="nickname-popup" @click.stop>
				<view class="popup-title">完善个人信息</view>
				<view class="popup-avatar-section">
					<button class="popup-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
						<image class="popup-avatar" :src="tempAvatar || defaultAvatarUrl" mode="aspectFill"></image>
						<view class="popup-avatar-tip">点击更换头像</view>
					</button>
				</view>
				<view class="popup-nickname-section">
					<input type="nickname" class="nickname-input" placeholder="请输入昵称"
						v-model="tempNickname" @blur="onNicknameBlur" @change="onNicknameBlur" />
				</view>
				<view class="popup-buttons">
					<button class="popup-btn cancel" @click="cancelNickname">取消</button>
					<button class="popup-btn confirm" :disabled="!canConfirmLogin" @click="confirmLogin">确定登录</button>
				</view>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<!-- 我的内容 -->
			<view class="menu-group">
				<view class="group-title">我的内容</view>
				<view class="menu-list">
					<view class="menu-item" @click="navTo('myFavorites')">
						<view class="menu-icon" style="background: rgba(230,67,64,0.1)">
							<text class="menu-emoji">❤️</text>
						</view>
						<view class="menu-info">
							<text class="menu-name">我的收藏</text>
							<text class="menu-desc">非遗与景点收藏夹</text>
						</view>
						<view class="menu-right">
							<text v-if="userStats.favorites > 0" class="menu-badge">{{ userStats.favorites }}</text>
							<uni-icons type="arrowright" size="16" color="#CCC"></uni-icons>
						</view>
					</view>

					<view class="menu-item" @click="navTo('myCheckin')">
						<view class="menu-icon" style="background: rgba(51,153,255,0.1)">
							<text class="menu-emoji">📍</text>
						</view>
						<view class="menu-info">
							<text class="menu-name">我的打卡</text>
							<text class="menu-desc">查看打卡历史记录</text>
						</view>
						<view class="menu-right">
							<text v-if="userStats.checkins > 0" class="menu-badge">{{ userStats.checkins }}</text>
							<uni-icons type="arrowright" size="16" color="#CCC"></uni-icons>
						</view>
					</view>

					<view class="menu-item last" @click="navTo('myRoutes')">
						<view class="menu-icon" style="background: rgba(82,196,26,0.1)">
							<text class="menu-emoji">🗺️</text>
						</view>
						<view class="menu-info">
							<text class="menu-name">我的路线</text>
							<text class="menu-desc">查看保存的路线</text>
						</view>
						<uni-icons type="arrowright" size="16" color="#CCC"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 帮助与反馈 -->
			<view class="menu-group">
				<view class="group-title">帮助与反馈</view>
				<view class="menu-list">
					<view class="menu-item" @click="navTo('feedback')">
						<view class="menu-icon" style="background: rgba(114,46,209,0.1)">
							<text class="menu-emoji">💬</text>
						</view>
						<view class="menu-info">
							<text class="menu-name">问题反馈</text>
							<text class="menu-desc">遇到问题可以告诉我们</text>
						</view>
						<uni-icons type="arrowright" size="16" color="#CCC"></uni-icons>
					</view>

					<view class="menu-item last" @click="showAbout">
						<view class="menu-icon" style="background: rgba(250,173,20,0.1)">
							<text class="menu-emoji">ℹ️</text>
						</view>
						<view class="menu-info">
							<text class="menu-name">关于我们</text>
							<text class="menu-desc">版本 1.0.0</text>
						</view>
						<uni-icons type="arrowright" size="16" color="#CCC"></uni-icons>
					</view>
				</view>
			</view>
		</view>

		<!-- 退出登录 -->
		<view v-if="hasLogin" class="logout-section">
			<button class="logout-btn" :loading="logoutLoading" @click="handleLogout">退出登录</button>
		</view>

		<!-- 版权信息 -->
		<view class="footer">
			<text class="footer-text">四川非遗文旅导览 v1.0.0</text>
			<text class="footer-copy">© 2024 四川文旅</text>
		</view>
	</view>
</template>

<script>
	import { cloudFn } from '@/utils/cloudFunctionNames.js'
	import auth from '@/utils/auth.js'

	// 云存储默认头像
	const CLOUD_BASE = 'cloud://cloud1-7gabd815fd2c236e.636c-cloud1-7gabd815fd2c236e-1418729882/images';
	const CLOUD_DEFAULT_AVATAR = CLOUD_BASE + '/icon/default-avatar.png';

	export default {
		data() {
			return {
				hasLogin: false,
				hasUserInfo: false,
				userInfo: {
					avatarUrl: CLOUD_DEFAULT_AVATAR,
					nickName: ''
				},
				currentAvatar: CLOUD_DEFAULT_AVATAR,
				defaultAvatarUrl: CLOUD_DEFAULT_AVATAR,
				logoutLoading: false,
				userStats: {
					favorites: 0,
					checkins: 0,
					browses: 0
				},
				// 新版登录弹窗相关
				showNicknamePopup: false,
				tempAvatar: '',
				tempNickname: ''
			};
		},

		computed: {
			displayName() {
				if (this.hasUserInfo && this.userInfo.nickName) return this.userInfo.nickName;
				if (this.hasLogin) return '微信用户';
				return '游客';
			},
			userStatusText() {
				if (this.hasUserInfo) return '欢迎回来 👋';
				if (this.hasLogin) return '点击头像完善信息';
				return '点击头像登录';
			},
			canConfirmLogin() {
				return this.tempNickname.trim().length > 0
			}
		},

		onLoad() {
			this.checkLoginStatus();
		},

		onShow() {
			this.checkLoginStatus();
			this.loadUserStats();
		},

		methods: {
			// ==================== 登录状态 ====================

			// 检查登录状态
			checkLoginStatus() {
				const { isLoggedIn, hasRealInfo, userInfo: storedInfo } = auth.checkLoginStatus()

				if (isLoggedIn && storedInfo) {
					this.userInfo = storedInfo
					this.hasLogin = true
					this.hasUserInfo = hasRealInfo
					this.currentAvatar = (hasRealInfo && storedInfo.avatarUrl) ? storedInfo.avatarUrl : CLOUD_DEFAULT_AVATAR
				} else if (isLoggedIn) {
					// 已静默登录但无详细信息
					this.hasLogin = true
					this.hasUserInfo = false
				} else {
					this.hasLogin = false
					this.hasUserInfo = false
					this.userInfo = { avatarUrl: CLOUD_DEFAULT_AVATAR, nickName: '' }
					this.currentAvatar = CLOUD_DEFAULT_AVATAR
				}
			},

			// ==================== 新版登录流程 ====================

			// 点击头像按钮
			onAvatarClick() {
				// 如果已经登录且有用户信息，不做处理
				if (this.hasLogin && this.hasUserInfo) return
				// 如果已登录但无详细信息，打开完善信息弹窗
				if (this.hasLogin && !this.hasUserInfo) {
					this.openNicknamePopup()
				}
				// 未登录会由 button 的 open-type="chooseAvatar" 接管
			},

			// 选择头像回调（chooseAvatar）
			onChooseAvatar(e) {
				const { avatarUrl } = e.detail
				this.tempAvatar = avatarUrl

				// 如果昵称也已输入，直接登录
				if (this.tempNickname.trim().length > 0) {
					this.confirmLogin()
				} else {
					// 打开昵称弹窗
					this.showNicknamePopup = true
				}
			},

			// 打开昵称弹窗
			openNicknamePopup() {
				this.showNicknamePopup = true
			},

			// 昵称输入完成
			onNicknameBlur(e) {
				this.tempNickname = e.detail.value || ''
			},

			// 取消昵称输入
			cancelNickname() {
				this.showNicknamePopup = false
				this.tempAvatar = ''
				this.tempNickname = ''
			},

			// 确认登录
			async confirmLogin() {
				const nickname = this.tempNickname.trim()
				if (!nickname) {
					uni.showToast({ title: '请输入昵称', icon: 'none' })
					return
				}

				const avatarUrl = this.tempAvatar || CLOUD_DEFAULT_AVATAR
				this.showNicknamePopup = false

				try {
					// 调用授权登录
					const userInfo = await auth.authorizeLogin(avatarUrl, nickname)
					this.userInfo = userInfo
					this.hasLogin = true
					this.hasUserInfo = true
					this.currentAvatar = avatarUrl
					this.tempAvatar = ''
					this.tempNickname = ''

					// 刷新统计数据
					this.loadUserStats()
				} catch (err) {
					console.error('登录失败:', err)
					// 即使云端同步失败，本地登录仍成功
					// 本地存储用户信息
					const localUserInfo = {
						avatarUrl,
						nickName: nickname,
						loginTime: Date.now(),
						isRealInfo: true
					}
					wx.setStorageSync('userInfo', localUserInfo)
					wx.setStorageSync('hasUserInfo', true)

					this.userInfo = localUserInfo
					this.hasLogin = true
					this.hasUserInfo = true
					this.currentAvatar = avatarUrl
					this.tempAvatar = ''
					this.tempNickname = ''

					uni.showToast({ title: '登录成功（离线模式）', icon: 'success' })
					this.loadUserStats()
				}
			},

			// ==================== 统计数据 ====================

			// 加载用户统计数据
			async loadUserStats() {
				if (!this.hasLogin) return;
				try {
					// 从本地缓存读取
					const favCount = uni.getStorageSync('fav_count') || 0;
					const checkinCount = uni.getStorageSync('checkin_count') || 0;
					const history = uni.getStorageSync('browse_history') || [];

					this.userStats = {
						favorites: favCount,
						checkins: checkinCount,
						browses: history.length
					};

					// 后台同步云端数据（异步，不影响显示）
					this.syncCloudStats();
				} catch (e) {}
			},

			// 从云端同步统计数据
			async syncCloudStats() {
				try {
					const db = wx.cloud.database();
					const openid = uni.getStorageSync('openid') || auth.getOpenid();
					if (!openid) return;

					const [favRes, checkinRes] = await Promise.all([
						db.collection('user_favorites').where({ _openid: openid }).count(),
						db.collection('checkin').where({ _openid: openid }).count()
					]);

					this.userStats.favorites = favRes.total || 0;
					this.userStats.checkins = checkinRes.total || 0;

					// 同步到本地
					uni.setStorageSync('fav_count', favRes.total);
					uni.setStorageSync('checkin_count', checkinRes.total);
				} catch (e) {
					console.warn('云端统计同步失败:', e);
				}
			},

			// ==================== 头像 & 信息 ====================

			// 头像加载失败
			onAvatarError() {
				this.currentAvatar = CLOUD_DEFAULT_AVATAR;
			},

			// 已登录点击头像
			handleUserInfoClick() {
				if (this.hasUserInfo) {
					uni.showToast({ title: '已登录', icon: 'success' });
				}
			},

			// ==================== 退出登录 ====================

			handleLogout() {
				uni.showModal({
					title: '退出登录',
					content: '确定要退出登录吗？',
					confirmText: '退出',
					confirmColor: '#E64340',
					success: (res) => {
						if (res.confirm) {
							this.logoutLoading = true;

							// 使用 auth.js 的 logout 方法
							auth.logout();

							this.userInfo = { avatarUrl: CLOUD_DEFAULT_AVATAR, nickName: '' };
							this.currentAvatar = CLOUD_DEFAULT_AVATAR;
							this.hasLogin = false;
							this.hasUserInfo = false;
							this.userStats = { favorites: 0, checkins: 0, browses: 0 };

							setTimeout(() => {
								this.logoutLoading = false;
								uni.showToast({ title: '已退出登录', icon: 'success' });
							}, 300);
						}
					}
				});
			},

			// ==================== 导航 & 其他 ====================

			navTo(page) {
				const needLogin = ['myFavorites', 'myCheckin', 'myRoutes'];
				if (needLogin.includes(page) && !this.hasLogin) {
					uni.showToast({ title: '请先登录', icon: 'none' });
					return;
				}

				const routes = {
					myFavorites: '/pages/mine/favorites',
					myCheckin: '/pages/checkin/myCheckin',
					myRoutes: '/pages/route/myRoutes',
					feedback: '/pages/mine/feedback'
				};

				const url = routes[page];
				if (url) uni.navigateTo({ url });
			},

			showAbout() {
				uni.showModal({
					title: '四川非遗文旅导览',
					content: '版本：1.0.0\n\n本应用致力于传播四川非物质文化遗产，让更多人了解和喜爱四川的传统文化。\n\n如有问题请通过"问题反馈"联系我们。',
					showCancel: false,
					confirmText: '确定'
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.page-container {
		background: #F7F5F2;
		min-height: 100vh;
	}

	/* ===== 顶部用户区域（川红渐变，去除紫色） ===== */
	.user-header {
		position: relative;
		background: linear-gradient(150deg, #D93025 0%, #A8201A 60%, #8A1A15 100%);
		padding: 60rpx 40rpx 50rpx;
		overflow: hidden;

		.header-bg {
			position: absolute;
			top: -60rpx;
			right: -60rpx;
			width: 300rpx;
			height: 300rpx;
			border-radius: 50%;
			background: rgba(255,255,255,0.06);
			pointer-events: none;

			&::after {
				content: '';
				position: absolute;
				top: 60rpx;
				left: -80rpx;
				width: 200rpx;
				height: 200rpx;
				border-radius: 50%;
				background: rgba(255,255,255,0.04);
			}
		}
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: 30rpx;
		margin-bottom: 40rpx;
	}

	.avatar-btn {
		background: none;
		padding: 0;
		margin: 0;
		border: none;
		line-height: 1;
		display: flex;
		
		&::after { border: none; }
	}

	.avatar-wrap {
		position: relative;
		flex-shrink: 0;

		.user-avatar {
			width: 130rpx;
			height: 130rpx;
			border-radius: 50%;
			border: 4rpx solid rgba(255,255,255,0.4);
		}

		.avatar-badge,
		.avatar-verified {
			position: absolute;
			bottom: 2rpx;
			right: 2rpx;
			width: 36rpx;
			height: 36rpx;
			border-radius: 50%;
			background: #D93025;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 3rpx solid #fff;
		}

		.avatar-verified { background: #52C41A; }
	}

	.user-text {
		flex: 1;

		.user-name {
			display: block;
			font-size: 42rpx;
			font-weight: 700;
			color: #fff;
			margin-bottom: 10rpx;
		}

		.user-status {
			display: block;
			font-size: 26rpx;
			color: rgba(255,255,255,0.75);
		}
	}

	/* ===== 统计数据 ===== */
	.user-stats {
		display: flex;
		align-items: center;
		background: rgba(255,255,255,0.12);
		border-radius: 20rpx;
		padding: 28rpx 0;

		.stat-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8rpx;

			.stat-num {
				font-size: 44rpx;
				font-weight: 800;
				color: #fff;
				line-height: 1.1;
			}

			.stat-label {
				font-size: 24rpx;
				color: rgba(255,255,255,0.7);
			}
		}

		.stat-divider {
			width: 1rpx;
			height: 50rpx;
			background: rgba(255,255,255,0.25);
		}
	}

	.login-prompt {
		background: rgba(255,255,255,0.14);
		border-radius: 20rpx;
		padding: 28rpx 30rpx;
		text-align: center;
		border: 1rpx solid rgba(255,255,255,0.2);

		.login-prompt-text {
			font-size: 28rpx;
			color: rgba(255,255,255,0.92);
			font-weight: 500;
		}
	}

	/* ===== 功能菜单 ===== */
	.menu-section {
		padding: 24rpx 30rpx 0;
	}

	.menu-group {
		margin-bottom: 24rpx;

		.group-title {
			font-size: 26rpx;
			color: #999;
			font-weight: 500;
			padding: 0 0 16rpx 6rpx;
		}

		.menu-list {
			background: #fff;
			border-radius: 24rpx;
			overflow: hidden;
		}
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 28rpx 30rpx;
		gap: 24rpx;
		border-bottom: 1rpx solid #F5F5F5;
		transition: all 0.15s;

		&.last { border-bottom: none; }
		&:active { background: #FAFAFA; }

		.menu-icon {
			width: 80rpx;
			height: 80rpx;
			border-radius: 20rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;

			.menu-emoji { font-size: 36rpx; }
		}

		.menu-info {
			flex: 1;

			.menu-name {
				display: block;
				font-size: 32rpx;
				font-weight: 600;
				color: #1A1A1A;
				margin-bottom: 6rpx;
			}

			.menu-desc {
				display: block;
				font-size: 24rpx;
				color: #999;
			}
		}

		.menu-right {
			display: flex;
			align-items: center;
			gap: 12rpx;

			.menu-badge {
				background: #D93025;
				color: #fff;
				font-size: 20rpx;
				min-width: 36rpx;
				height: 36rpx;
				line-height: 36rpx;
				text-align: center;
				border-radius: 18rpx;
				padding: 0 10rpx;
				font-weight: 600;
			}
		}
	}

	/* ===== 退出登录 ===== */
	.logout-section {
		padding: 16rpx 30rpx;

		.logout-btn {
			width: 100%;
			height: 90rpx;
			line-height: 90rpx;
			background: #fff;
			color: #D93025;
			font-size: 32rpx;
			font-weight: 600;
			border-radius: 45rpx;
			border: 2rpx solid #FFD7D7;

			&::after { border: none; }
			&:active { background: #FFF5F5; }
		}
	}

	/* ===== 底部 ===== */
	.footer {
		text-align: center;
		padding: 50rpx 0 80rpx;

		.footer-text {
			display: block;
			font-size: 24rpx;
			color: #BDBDBD;
		}

		.footer-copy {
			display: block;
			font-size: 22rpx;
			color: #D0D0D0;
			margin-top: 8rpx;
		}
	}

	/* ===== 昵称输入弹窗 ===== */
	.nickname-popup-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nickname-popup {
		width: 600rpx;
		background: #fff;
		border-radius: 24rpx;
		padding: 50rpx 50rpx 40rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
	}

	.popup-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #1A1A1A;
		text-align: center;
		margin-bottom: 50rpx;
	}

	.popup-avatar-section {
		display: flex;
		justify-content: center;
		margin-bottom: 40rpx;
	}

	.popup-avatar-btn {
		background: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		border: none;
		line-height: 1;

		&::after { border: none; }
	}

	.popup-avatar {
		width: 150rpx;
		height: 150rpx;
		border-radius: 50%;
		border: 4rpx solid #E64340;
		display: block;
	}

	.popup-avatar-tip {
		font-size: 24rpx;
		color: #E64340;
		margin-top: 16rpx;
	}

	.popup-nickname-section {
		margin-bottom: 50rpx;
	}

	.nickname-input {
		width: 100%;
		height: 90rpx;
		background: #F7F5F2;
		border-radius: 16rpx;
		padding: 0 30rpx;
		font-size: 30rpx;
		color: #1A1A1A;
		box-sizing: border-box;

		&::placeholder { color: #BDBDBD; }
	}

	.popup-buttons {
		display: flex;
		gap: 24rpx;
	}

	.popup-btn {
		flex: 1;
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 44rpx;
		font-size: 30rpx;
		font-weight: 600;
		border: none;

		&::after { border: none; }

		&.cancel {
			background: #F5F5F5;
			color: #666;
		}

		&.confirm {
			background: #E64340;
			color: #fff;

			&[disabled] {
				background: #FFCCC7;
				color: #fff;
			}
		}
	}
</style>
