<template>
	<view class="page-container">
		<!-- 顶部搜索与筛选栏 -->
		<view class="search-filter-bar">
			<!-- 搜索框 -->
			<view class="search-box">
				<uni-icons class="search-icon" type="search" size="18" color="#999"></uni-icons>
				<input 
					class="search-input" 
					placeholder="搜索景点名称、地点或关键词..." 
					placeholder-class="placeholder"
					:value="searchKeyword"
					@input="onSearchInput"
					@confirm="onSearchConfirm"
					confirm-type="search"
				/>
				<view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
					<uni-icons type="clear" size="18" color="#ccc"></uni-icons>
				</view>
			</view>
			
			<!-- 等级筛选器 -->
			<scroll-view class="filter-scroll" scroll-x="true" :show-scrollbar="false">
				<view class="filter-list">
					<view 
						class="filter-item" 
						:class="{ active: currentFilter === '' }"
						@click="changeFilter('')"
					>
						全部
					</view>
					<view 
						v-for="level in levelList" 
						:key="level"
						class="filter-item" 
						:class="{ active: currentFilter === level }"
						@click="changeFilter(level)"
					>
						{{ level }}
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 列表内容区域 -->
		<scroll-view 
			class="content-scroll" 
			scroll-y="true" 
			:show-scrollbar="false"
			@scrolltolower="onReachBottom"
			:refresher-enabled="true"
			:refresher-triggered="refresherTriggered"
			@refresherrefresh="onPullDownRefresh"
		>
			<!-- 加载状态 -->
			<view v-if="isLoading && scenicList.length === 0" class="loading-container">
				<uni-icons type="spinner-cycle" size="30" color="#e64340"></uni-icons>
				<text>正在加载景点...</text>
			</view>
			
			<!-- 空状态 -->
			<view v-else-if="!isLoading && scenicList.length === 0" class="empty-container">
				<uni-icons type="info" size="60" color="#ccc"></uni-icons>
				<text class="empty-text">暂无相关景点</text>
				<text class="empty-tip">尝试更换关键词或筛选条件</text>
				<button class="refresh-btn" @click="refreshList">重新加载</button>
			</view>
			
			<!-- 景点列表 -->
			<view v-else class="scenic-list">
				<view 
					v-for="item in scenicList" 
					:key="item._id" 
					class="scenic-card"
					@click="goToDetail(item._id)"
				>
					<image class="card-img" :src="item.coverImage || CLOUD_BASE + '/scenic/default.jpg'" mode="aspectFill" @error="onImageError"></image>
					<view class="card-content">
						<view class="card-header">
							<view class="title-wrapper">
								<text class="card-title">{{ item.name }}</text>
								<view v-if="item.isRecommended" class="recommended-tag">
									<uni-icons type="star-filled" size="12" color="#fff"></uni-icons>
									<text>推荐</text>
								</view>
							</view>
							<view class="card-level">{{ getDisplayLevel(item.level) }}</view>
						</view>
						<text class="card-desc">{{ item.brief || '暂无简介' }}</text>
						<view class="card-footer">
							<view class="card-location">
								<uni-icons type="location-filled" size="14" color="#999"></uni-icons>
								<text>{{ extractCity(item.address) || '地点未知' }}</text>
							</view>
							<view class="card-views" v-if="item.viewCount > 0">
								<uni-icons type="eye" size="12" color="#999"></uni-icons>
								<text>{{ item.viewCount }} 浏览</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view v-if="isLoadingMore" class="load-more loading">
					<uni-icons type="spinner-cycle" size="20" color="#e64340"></uni-icons>
					<text>正在加载更多...</text>
				</view>
				<view v-else-if="hasMore" class="load-more">
					<text>上拉加载更多</text>
				</view>
				<view v-else-if="scenicList.length > 0" class="load-more no-more">
					<text>没有更多了</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { processImageFields } from '@/utils/cloudCall.js';

// 云存储基础路径
const CLOUD_BASE = 'cloud://cloud1-7gabd815fd2c236e.636c-cloud1-7gabd815fd2c236e-1418729882/images';

export default {
	data() {
		return {
			// 数据列表
			scenicList: [],
			
			// 分页参数
			currentPage: 0,
			pageSize: 10,
			hasMore: true,
			
			// 加载状态
			isLoading: false,
			isLoadingMore: false,
			refresherTriggered: false,
			
			// 搜索与筛选参数
			searchKeyword: '',
			currentFilter: '', // 空字符串表示"全部"
			
			// 等级列表（从数据库动态获取）
			levelList: [],
			
			// 等级映射：数据库值 → 显示名称
			levelMap: {
				'1': 'AAAAA',
				'2': 'AAAA',
				'3': 'AAA',
				'4': 'AA',
				'5': 'A',
				'6': '未评级'
			}
		};
	},
	onLoad() {
		this.loadScenicList(true);
		this.loadLevelList();
	},
	onPullDownRefresh() {
		this.refresherTriggered = true;
		this.refreshList();
	},
		methods: {
			// 从详细地址提取"四川省xx市/州"格式的省市信息
			extractCity(address) {
				if (!address) return null;
				// 匹配：四川省 + 到"市"或"州"截止
				const match = address.match(/^(四川省[^市州]+[市州])/);
				if (match) return match[0];
				// 兜底：四川省开头但格式不完整，截取前6字
				if (address.startsWith('四川省')) {
					return address.substring(0, 6);
				}
				return address;
			},

			// 加载景点列表
		async loadScenicList(isRefresh = false) {
			if (isRefresh) {
				this.currentPage = 0;
				this.hasMore = true;
				this.isLoading = true;
			} else {
				if (!this.hasMore || this.isLoadingMore) return;
				this.isLoadingMore = true;
			}
			
			try {
				const db = wx.cloud.database();
				const skip = this.currentPage * this.pageSize;
				
				// 构建查询条件
				let query = db.collection('scenic');
				
				// 添加搜索条件
				if (this.searchKeyword) {
					const dbCmd = db.command;
					query = query.where(dbCmd.or([
						{ name: dbCmd.regex(new RegExp(this.searchKeyword, 'i')) },
						{ location: dbCmd.regex(new RegExp(this.searchKeyword, 'i')) },
						{ brief: dbCmd.regex(new RegExp(this.searchKeyword, 'i')) }
					]));
				}
				
				// 添加等级筛选条件
				if (this.currentFilter) {
					query = query.where({ level: this.currentFilter });
				}
				
			// 执行查询
			const res = await query
				.orderBy('viewCount', 'desc')
				.skip(skip)
				.limit(this.pageSize)
				.get();
			
			const newList = await processImageFields(res.data, ['coverImage']);
			
			// 更新数据列表
			if (isRefresh) {
				this.scenicList = newList;
			} else {
				this.scenicList = [...this.scenicList, ...newList];
			}
				
				// 更新分页状态
				this.hasMore = newList.length === this.pageSize;
				this.currentPage++;
				
				console.log(`加载景点列表成功，第${this.currentPage}页，共${this.scenicList.length}条`);
				
			} catch (err) {
				console.error('加载景点列表失败：', err);
				uni.showToast({
					title: '加载失败，请重试',
					icon: 'none'
				});
			} finally {
				if (isRefresh) {
					this.isLoading = false;
					this.refresherTriggered = false;
					uni.stopPullDownRefresh();
				} else {
					this.isLoadingMore = false;
				}
			}
		},
		
		// 刷新列表
		refreshList() {
			this.loadScenicList(true);
		},
		
		// 动态加载景点等级列表
		async loadLevelList() {
			try {
				const db = wx.cloud.database();
				const res = await db.collection('scenic')
					.field({ level: true })
					.limit(500)  // 获取足够多的数据以覆盖所有等级
					.get();
				
				// 提取所有不重复的等级值（原始值）
				const rawLevels = [...new Set(res.data.map(item => item.level).filter(Boolean))];
				
				// 转换为显示名称
				const displayLevels = rawLevels.map(level => this.getDisplayLevel(level));
				
				// 按等级排序（AAAAA > AAAA > AAA > AA > A > 其他）
				const sortOrder = ['AAAAA', 'AAAA', 'AAA', 'AA', 'A', '未评级', '无等级', '其他'];
				displayLevels.sort((a, b) => {
					const indexA = sortOrder.indexOf(a);
					const indexB = sortOrder.indexOf(b);
					if (indexA === -1 && indexB === -1) return a.localeCompare(b);
					if (indexA === -1) return 1;
					if (indexB === -1) return -1;
					return indexA - indexB;
				});
				
				this.levelList = displayLevels;
				console.log('景点等级列表加载成功：', displayLevels);
			} catch (err) {
				console.error('加载景点等级列表失败：', err);
				// 失败时使用默认列表
				this.levelList = ['AAAAA', 'AAAA', 'AAA', 'AA', 'A', '未评级'];
			}
		},
		
		// 获取显示用的等级名称
		getDisplayLevel(level) {
			if (!level) return '未评级';
			// 如果已经是文字（如 AAAAA），直接返回
			if (typeof level === 'string' && level.match(/^[A-Z]+$/)) {
				return level;
			}
			// 如果是数值或数字字符串，映射为显示名称
			return this.levelMap[level] || this.levelMap[String(level)] || '其他';
		},
		
		// 搜索相关方法
		onSearchInput(e) {
			this.searchKeyword = e.detail.value;
		},
		
		onSearchConfirm() {
			clearTimeout(this.searchTimer);
			this.searchTimer = setTimeout(() => {
				this.refreshList();
			}, 300);
		},
		
		clearSearch() {
			this.searchKeyword = '';
			this.refreshList();
		},
		
		// 筛选相关方法
		changeFilter(level) {
			// 如果选择全部，清空筛选
			if (level === '') {
				this.currentFilter = '';
				this.refreshList();
				return;
			}
			
			// 将显示名称转换为数据库值进行筛选
			const dbValue = this.getDbValue(level);
			if (this.currentFilter !== dbValue) {
				this.currentFilter = dbValue;
				this.refreshList();
			}
		},
		
		// 获取数据库值（从显示名称反查）
		getDbValue(displayName) {
			for (const [key, value] of Object.entries(this.levelMap)) {
				if (value === displayName) {
					return key;
				}
			}
			// 如果本身就是数据库值，直接返回
			return displayName;
		},
		
		// 触底加载更多
		onReachBottom() {
			if (!this.isLoading && !this.isLoadingMore && this.hasMore) {
				this.loadScenicList(false);
			}
		},
		
		// 跳转到详情页
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/scenic/scenicDetail?id=${id}`
			});
		},
		
		// 图片加载失败处理
		onImageError(e) {
			console.log('图片加载失败', e);
			// 可以设置默认图片
		}
	}
};
</script>

<style lang="scss" scoped>
.page-container {
	background-color: #f8f8f8;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

/* 搜索与筛选栏 */
.search-filter-bar {
	background-color: #ffffff;
	padding: 20rpx 30rpx;
	position: sticky;
	top: 0;
	z-index: 100;
	border-bottom: 1rpx solid #f0f0f0;
	
	.search-box {
		background-color: #f5f5f5;
		border-radius: 40rpx;
		height: 70rpx;
		display: flex;
		align-items: center;
		padding: 0 25rpx;
		margin-bottom: 20rpx;
		
		.search-icon {
			flex-shrink: 0;
		}
		
		.search-input {
			flex: 1;
			font-size: 28rpx;
			color: #333;
			margin: 0 20rpx;
			height: 100%;
			background-color: transparent;
			
			.placeholder {
				color: #999;
			}
		}
		
		.clear-btn {
			width: 40rpx;
			height: 40rpx;
			border-radius: 50%;
			background-color: #eee;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
	}
	
	.filter-scroll {
		white-space: nowrap;
		
		.filter-list {
			display: inline-flex;
			padding-bottom: 5rpx;
			
			.filter-item {
				padding: 12rpx 30rpx;
				margin-right: 20rpx;
				border-radius: 30rpx;
				background-color: #f5f5f5;
				font-size: 26rpx;
				color: #666;
				display: inline-block;
				flex-shrink: 0;
				
				&:last-child {
					margin-right: 0;
				}
				
				&.active {
					background-color: #3399ff;
					color: #ffffff;
					font-weight: bold;
					box-shadow: 0 4rpx 12rpx rgba(51, 153, 255, 0.3);
				}
			}
		}
	}
}

/* 内容区域 */
.content-scroll {
	flex: 1;
	height: calc(100vh - 240rpx);
}

/* 加载状态 */
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 0;
	
	text {
		font-size: 28rpx;
		color: #999;
		margin-top: 20rpx;
	}
}

/* 空状态 */
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 30rpx;
	
	.empty-text {
		font-size: 32rpx;
		color: #666;
		margin-top: 30rpx;
		margin-bottom: 15rpx;
	}
	
	.empty-tip {
		font-size: 26rpx;
		color: #999;
		margin-bottom: 40rpx;
		text-align: center;
	}
	
	.refresh-btn {
		background-color: #3399ff;
		color: #fff;
		font-size: 28rpx;
		border-radius: 50rpx;
		padding: 20rpx 60rpx;
		margin-top: 20rpx;
	}
}

/* 景点列表 */
.scenic-list {
	padding: 30rpx;
	
	.scenic-card {
		background-color: #ffffff;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
		&:active {
			transform: scale(0.995);
			transition: transform 0.1s;
		}
		
		.card-img {
			width: 100%;
			height: 350rpx;
			display: block;
		}
		
		.card-content {
			padding: 25rpx 30rpx;
			
			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 20rpx;
				
				.title-wrapper {
					flex: 1;
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					
					.card-title {
						font-size: 34rpx;
						font-weight: bold;
						color: #333;
						line-height: 1.4;
						margin-right: 15rpx;
						display: -webkit-box;
						-webkit-box-orient: vertical;
						-webkit-line-clamp: 2;
						overflow: hidden;
					}
					
					.recommended-tag {
						background-color: #e64340;
						color: #fff;
						font-size: 20rpx;
						padding: 4rpx 10rpx;
						border-radius: 6rpx;
						display: flex;
						align-items: center;
						flex-shrink: 0;
						
						text {
							margin-left: 4rpx;
						}
					}
				}
				
				.card-level {
					font-size: 24rpx;
					color: #3399ff;
					background-color: #e6f2ff;
					padding: 6rpx 12rpx;
					border-radius: 8rpx;
					font-weight: bold;
					flex-shrink: 0;
					margin-left: 15rpx;
				}
			}
			
			.card-desc {
				font-size: 28rpx;
				color: #666;
				line-height: 1.6;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 2;
				overflow: hidden;
				margin-bottom: 25rpx;
			}
			
			.card-footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				
				.card-location,
				.card-views {
					display: flex;
					align-items: center;
					font-size: 24rpx;
					color: #999;
					
					text {
						margin-left: 8rpx;
					}
				}
				
				.card-views {
					color: #666;
				}
			}
		}
	}
	
	.load-more {
		text-align: center;
		padding: 40rpx 0;
		font-size: 26rpx;
		color: #999;
		
		&.loading {
			display: flex;
			align-items: center;
			justify-content: center;
			
			text {
				margin-left: 10rpx;
			}
		}
		
		&.no-more {
			color: #ccc;
		}
	}
}
</style>