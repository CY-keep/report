<template>
	<view class="page-container">
		<!-- 顶部搜索与筛选栏 -->
		<view class="search-filter-bar">
			<!-- 搜索框 -->
			<view class="search-box">
				<uni-icons class="search-icon" type="search" size="18" color="#999"></uni-icons>
				<input 
					class="search-input" 
					placeholder="搜索非遗名称、地点或分类..." 
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
			
			<!-- 分类筛选器 (水平滚动) -->
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
						v-for="category in categoryList" 
						:key="category"
						class="filter-item" 
						:class="{ active: currentFilter === category }"
						@click="changeFilter(category)"
					>
						{{ category }}
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
			<view v-if="isLoading && heritageList.length === 0" class="loading-container">
				<text>正在加载非遗项目...</text>
			</view>
			
			<!-- 空状态 -->
			<view v-else-if="!isLoading && heritageList.length === 0" class="empty-container">
				<uni-icons type="info" size="60" color="#ccc"></uni-icons>
				<text class="empty-text">暂无相关非遗项目</text>
				<text class="empty-tip">尝试更换关键词或筛选条件</text>
			</view>
			
			<!-- 非遗列表 -->
			<view v-else class="heritage-list">
				<view 
					v-for="item in heritageList" 
					:key="item._id" 
					class="heritage-card"
					@click="goToDetail(item._id)"
				>
					<image class="card-img" :src="item.coverImage" mode="aspectFill"></image>
					<view class="card-content">
						<view class="card-header">
							<text class="card-title">{{ item.name }}</text>
							<view class="card-tag">{{ getDisplayCategory(item.category) }}</view>
						</view>
						<text class="card-desc">{{ item.brief }}</text>
						<view class="card-footer">
							<view class="card-location">
								<uni-icons type="location" size="14" color="#999"></uni-icons>
								<text>{{ item.location }}</text>
							</view>
							<view class="card-hot" v-if="item.isHot">
								<uni-icons type="fire" size="14" color="#e64340"></uni-icons>
								<text>热门</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 加载更多 -->
				<view v-if="isLoadingMore" class="load-more">
					<text>正在加载更多...</text>
				</view>
				<view v-else-if="hasMore" class="load-more">
					<text>上拉加载更多</text>
				</view>
				<view v-else-if="heritageList.length > 0" class="load-more no-more">
					<text>没有更多了</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { processImageFields } from '@/utils/cloudCall.js';

export default {
	data() {
		return {
			// 数据列表
			heritageList: [],
			
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
			
			// 分类列表（从数据库动态获取）
			categoryList: [],
			
			// 分类映射：数据库值 → 显示名称
			categoryMap: {
				'1': '传统技艺',
				'2': '传统戏剧',
				'3': '传统美术',
				'4': '传统音乐',
				'5': '传统舞蹈',
				'6': '传统医药',
				'7': '民俗',
				'8': '民间文学',
				'9': '传统体育',
				'10': '曲艺',
				'11': '杂技'
			}
		};
	},
	onLoad() {
		// 页面加载时获取数据
		this.loadHeritageList(true);
		this.loadCategoryList();
	},
	onPullDownRefresh() {
		// 手动触发下拉刷新时
		this.refresherTriggered = true;
		this.refreshList();
	},
	methods: {
		// 加载非遗列表
		async loadHeritageList(isRefresh = false) {
			if (isRefresh) {
				// 刷新或首次加载
				this.currentPage = 0;
				this.hasMore = true;
				this.isLoading = true;
			} else {
				// 加载更多
				if (!this.hasMore || this.isLoadingMore) return;
				this.isLoadingMore = true;
			}
			
			try {
				const db = wx.cloud.database();
				const skip = this.currentPage * this.pageSize;
				
				// 构建查询条件
				let query = db.collection('heritage');
				
				// 添加搜索条件
				if (this.searchKeyword) {
					// 多字段模糊搜索：名称、地点、分类
					const dbCmd = db.command;
					query = query.where(dbCmd.or([
						{ name: dbCmd.regex(new RegExp(this.searchKeyword, 'i')) },
						{ location: dbCmd.regex(new RegExp(this.searchKeyword, 'i')) },
						{ category: dbCmd.regex(new RegExp(this.searchKeyword, 'i')) }
					]));
				}
				
				// 添加分类筛选条件
				if (this.currentFilter) {
					query = query.where({ category: this.currentFilter });
				}
				
			// 执行查询
			const res = await query
				.orderBy('viewCount', 'desc') // 按浏览量降序
				.skip(skip)
				.limit(this.pageSize)
				.get();
			
			const newList = await processImageFields(res.data, ['coverImage']);
			
			// 更新数据列表
			if (isRefresh) {
				this.heritageList = newList;
			} else {
				this.heritageList = [...this.heritageList, ...newList];
			}
				
				// 更新分页状态
				this.hasMore = newList.length === this.pageSize;
				this.currentPage++;
				
				console.log(`加载非遗列表成功，第${this.currentPage}页，共${this.heritageList.length}条`);
				
			} catch (err) {
				console.error('加载非遗列表失败：', err);
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
			this.loadHeritageList(true);
		},
		
		// 动态加载非遗分类列表
		async loadCategoryList() {
			try {
				const db = wx.cloud.database();
				const res = await db.collection('heritage')
					.field({ category: true })
					.limit(500)  // 获取足够多的数据以覆盖所有分类
					.get();
				
				// 提取所有不重复的原始分类值（可能包含多个分类用逗号分隔）
				const rawCategories = [];
				res.data.forEach(item => {
					if (item.category) {
						// 处理多个分类（用逗号分隔）
						const cats = item.category.split(',').map(c => c.trim());
						rawCategories.push(...cats);
					}
				});
				
				// 去重
				const uniqueRawCategories = [...new Set(rawCategories)];
				
				// 转换为显示名称
				const displayCategories = uniqueRawCategories.map(cat => this.getDisplayCategory(cat));
				
				// 按常见分类顺序排序
				const sortOrder = ['传统技艺', '传统戏剧', '传统美术', '传统音乐', '传统舞蹈', '传统医药', '民俗', '民间文学', '传统体育', '曲艺', '杂技'];
				displayCategories.sort((a, b) => {
					const indexA = sortOrder.indexOf(a);
					const indexB = sortOrder.indexOf(b);
					if (indexA === -1 && indexB === -1) return a.localeCompare(b);
					if (indexA === -1) return 1;
					if (indexB === -1) return -1;
					return indexA - indexB;
				});
				
				this.categoryList = displayCategories;
				console.log('非遗分类列表加载成功：', displayCategories);
			} catch (err) {
				console.error('加载非遗分类列表失败：', err);
				// 失败时使用默认列表
				this.categoryList = ['传统技艺', '传统戏剧', '传统美术', '传统音乐', '传统舞蹈', '民俗'];
			}
		},
		
		// 获取显示用的分类名称
		getDisplayCategory(category) {
			if (!category) return '未分类';
			// 如果已经是中文名称（不在映射中的），直接返回
			if (!this.categoryMap[category] && !this.categoryMap[String(category)]) {
				return category;
			}
			// 如果是数字字符串，映射为显示名称
			return this.categoryMap[category] || this.categoryMap[String(category)] || category;
		},
		
		// 获取数据库值（从显示名称反查）
		getDbValueForCategory(displayName) {
			for (const [key, value] of Object.entries(this.categoryMap)) {
				if (value === displayName) {
					return key;
				}
			}
			// 如果本身就是数据库值，直接返回
			return displayName;
		},
		
		// 搜索相关方法
		onSearchInput(e) {
			this.searchKeyword = e.detail.value;
		},
		
		onSearchConfirm() {
			// 防抖处理，避免频繁搜索
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
		changeFilter(category) {
			// 如果选择全部，清空筛选
			if (category === '') {
				this.currentFilter = '';
				this.refreshList();
				return;
			}
			
			// 将显示名称转换为数据库值进行筛选
			const dbValue = this.getDbValueForCategory(category);
			if (this.currentFilter !== dbValue) {
				this.currentFilter = dbValue;
				this.refreshList();
			}
		},
		
		// 触底加载更多
		onReachBottom() {
			if (!this.isLoading && !this.isLoadingMore && this.hasMore) {
				this.loadHeritageList(false);
			}
		},
		
		// 跳转到详情页
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/heritage/heritageDetail?id=${id}`
			});
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
			padding-bottom: 10rpx;
			
			.filter-item {
				padding: 12rpx 30rpx;
				margin-right: 20rpx;
				border-radius: 30rpx;
				background-color: #f5f5f5;
				font-size: 26rpx;
				color: #666;
				display: inline-block;
				
				&:last-child {
					margin-right: 0;
				}
				
				&.active {
					background-color: #e64340;
					color: #ffffff;
					font-weight: bold;
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
	padding: 100rpx 0;
	text-align: center;
	font-size: 28rpx;
	color: #999;
}

/* 空状态 */
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 150rpx 0;
	
	.empty-text {
		font-size: 32rpx;
		color: #666;
		margin-top: 30rpx;
		margin-bottom: 15rpx;
	}
	
	.empty-tip {
		font-size: 26rpx;
		color: #999;
	}
}

/* 非遗列表 */
.heritage-list {
	padding: 30rpx;
	
	.heritage-card {
		background-color: #ffffff;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
		
		.card-img {
			width: 100%;
			height: 350rpx;
		}
		
		.card-content {
			padding: 25rpx 30rpx;
			
			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 20rpx;
				
				.card-title {
					flex: 1;
					font-size: 34rpx;
					font-weight: bold;
					color: #333;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
					margin-right: 20rpx;
				}
				
				.card-tag {
					flex-shrink: 0;
					font-size: 22rpx;
					color: #e64340;
					background-color: #ffeaea;
					padding: 6rpx 15rpx;
					border-radius: 8rpx;
				}
			}
			
			.card-desc {
				font-size: 28rpx;
				color: #666;
				line-height: 1.5;
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
				.card-hot {
					display: flex;
					align-items: center;
					font-size: 24rpx;
					color: #999;
					
					text {
						margin-left: 8rpx;
					}
				}
				
				.card-hot {
					color: #e64340;
				}
			}
		}
		
		/* 点击反馈 */
		&:active {
			opacity: 0.9;
			transform: scale(0.995);
			transition: all 0.1s;
		}
	}
	
	.load-more {
		text-align: center;
		padding: 40rpx 0;
		font-size: 26rpx;
		color: #999;
		
		&.no-more {
			color: #ccc;
		}
	}
}
</style>