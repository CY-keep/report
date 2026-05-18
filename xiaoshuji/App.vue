<!-- App.vue -->
<!-- AI辅助生成：WorkBuddy/Coding Copilot, 2026-04-08
     - 设计令牌CSS变量（川味配色、深色模式支持）
     - 全局错误处理逻辑
-->
<script>
	import { CLOUD_CONFIG } from './config.js'
	import { silentLogin } from './utils/auth.js'
	import Vue from 'vue'

	Vue.config.errorHandler = (err, vm, info) => {
		console.error('全局错误:', err)
		console.error('错误信息:', info)

		let errorMsg = '操作失败，请稍后重试'
		if (err.message && err.message.includes('cloud')) {
			errorMsg = '网络异常，请检查网络连接'
		} else if (err.message && err.message.includes('location')) {
			errorMsg = '定位服务异常，请检查定位权限'
		} else if (err.message && err.message.includes('auth')) {
			errorMsg = '授权失败，请重新授权'
		}

		uni.showToast({
			title: errorMsg,
			icon: 'none',
			duration: 2000
		})
	}

	export default {
		onLaunch: function() {
			console.log('App Launch')
			console.log('版本信息:', '四川非遗文旅数字导览 v1.0.0')

			// 初始化云开发环境
			if (wx.cloud) {
				wx.cloud.init({
					env: CLOUD_CONFIG.env,
					traceUser: true,
				})
				console.log('云开发初始化成功，环境ID:', CLOUD_CONFIG.env)

				// 预先获取 openId 并缓存
				this.initAuth()
			} else {
				console.error('请使用 2.2.3 或以上的基础库以使用云能力')
				uni.showModal({
					title: '提示',
					content: '当前微信版本过低，无法使用云开发功能，请升级微信后重试',
					showCancel: false
				})
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 初始化登录态（静默登录）
			async initAuth() {
				try {
					await silentLogin()
					console.log('登录态初始化完成')
				} catch (err) {
					console.error('静默登录失败:', err)
					// 静默登录失败不影响小程序使用，只是部分需要登录的功能不可用
				}
			}
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #F7F5F2;
		font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
		box-sizing: border-box;
	}
	
	/* ===== 设计令牌 - 亮色模式（川味版）===== */
	page {
		/* 主色：川红（更沉稳） */
		--color-primary:        #D93025;
		--color-primary-light:  #FFF0EE;
		--color-primary-deep:   #A8201A;
		/* 辅色：水墨金 */
		--color-gold:           #C9920A;
		--color-gold-light:     #FFF8E1;
		/* 辅色：竹韵青 */
		--color-teal:           #1A7F64;
		--color-teal-light:     #E8F5F1;

		/* TDesign 兼容别名 */
		--td-brand-color: #D93025;
		--td-brand-color-light: #FFF0EE;
		--td-brand-color-dark: #A8201A;
		--td-success-color: #00B42A;
		--td-warning-color: #FF7D00;
		--td-error-color: #FF3141;
		--td-info-color: #0052D9;
		/* 暖米白背景，宣纸感 */
		--td-bg-color-page: #F7F5F2;
		--td-bg-color-container: #FFFFFF;
		--td-bg-color-secondary-container: #F0EDE8;
		--td-text-color-primary: #1A1A1A;
		--td-text-color-secondary: #666666;
		--td-text-color-disabled: #BDBDBD;
		--td-border-color: #EBEBEB;
	}
	
	/* ===== 设计令牌 - 深色模式 ===== */
	@media (prefers-color-scheme: dark) {
		page {
			--color-primary:       #FF6B6B;
			--color-primary-light: #3D2A2A;
			--td-brand-color: #FF6B6B;
			--td-brand-color-light: #3D2A2A;
			--td-brand-color-dark: #FF8C8C;
			--td-success-color: #34D085;
			--td-warning-color: #FFAA33;
			--td-error-color: #FF5555;
			--td-info-color: #4D9FFF;
			--td-bg-color-page: #1C1A18;
			--td-bg-color-container: #272420;
			--td-bg-color-secondary-container: #312E2B;
			--td-text-color-primary: #F5F0E8;
			--td-text-color-secondary: #A6A6A6;
			--td-text-color-disabled: #666666;
			--td-border-color: #3D3A36;
		}
	}
	
	/* 全局安全区域适配 */
	.safe-area-bottom {
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}
	
	/* 全局卡片样式 */
	.card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		margin: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	}
	
	@media (prefers-color-scheme: dark) {
		.card {
			background-color: var(--td-bg-color-container);
			box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.2);
		}
	}
	
	/* 全局按钮样式 */
	.btn-primary {
		background: linear-gradient(135deg, #FF6B35, #FF8C5A);
		color: #ffffff;
		border: none;
		border-radius: 44rpx;
		font-size: 28rpx;
		padding: 20rpx 60rpx;
	}
	
	/* 全局文字省略 */
	.text-ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.text-ellipsis-2 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
	}
	
	/* ===== 深色模式页面背景 ===== */
	.page-container {
		background-color: var(--td-bg-color-page);
	}
</style>