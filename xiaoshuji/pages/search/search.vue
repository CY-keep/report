<template>
	<view class="page-container">
		<!-- 搜索栏 -->
		<view class="search-header">
			<view class="search-box">
				<uni-icons class="search-icon" type="search" size="20" color="#999"></uni-icons>
				<input
					class="search-input"
					:value="searchKeyword"
					@input="onInput"
					@confirm="onSearch"
					placeholder="搜索非遗项目或景点..."
					placeholder-style="color: #bbb;"
					focus
				/>
				<view v-if="searchKeyword" class="clear-icon" @click="clearKeyword">
					<uni-icons type="clear" size="20" color="#ccc"></uni-icons>
				</view>
			</view>
			<text class="cancel-btn" @click="goBack">取消</text>
		</view>

		<!-- 搜索历史 (有历史且未开始搜索时显示) -->
		<view v-if="!isSearching && searchHistory.length > 0" class="history-section">
			<view class="section-title">
				<text>搜索历史</text>
				<text class="clear-history" @click="clearHistory">清空</text>
			</view>
			<view class="history-tags">
				<view
					v-for="(item, index) in searchHistory"
					:key="index"
					class="history-tag"
					@click="searchFromHistory(item)"
				>
					<text>{{ item }}</text>
				</view>
			</view>
		</view>

		<!-- 热门搜索推荐 (无输入且未开始搜索时显示) -->
		<view v-if="!isSearching" class="hot-section">
			<view class="section-title">热门搜索</view>
			<view class="hot-tags">
				<view
					v-for="(item, index) in hotKeywords"
					:key="index"
					class="hot-tag"
					@click="searchFromHot(item)"
				>
					<text>{{ item }}</text>
				</view>
			</view>
		</view>

		<!-- 搜索结果区域 -->
		<view v-if="isSearching" class="result-area">
			<!-- Tab 切换栏 -->
			<view class="tab-bar">
				<view
					class="tab-item"
					:class="{ active: activeTab === 'heritage' }"
					@click="activeTab = 'heritage'"
				>
					<text>非遗</text>
					<text class="tab-count">{{ heritageResult.length }}</text>
				</view>
				<view
					class="tab-item"
					:class="{ active: activeTab === 'scenic' }"
					@click="activeTab = 'scenic'"
				>
					<text>景点</text>
					<text class="tab-count">{{ scenicResult.length }}</text>
				</view>
			</view>

			<!-- 加载中 -->
			<view v-if="isLoading" class="loading-container">
				<text>搜索中...</text>
			</view>

			<!-- 非遗结果 -->
			<scroll-view
				v-else-if="activeTab === 'heritage'"
				class="result-scroll"
				scroll-y="true"
				:show-scrollbar="false"
			>
				<view v-if="heritageResult.length === 0" class="empty-container">
					<uni-icons type="search" size="80" color="#ccc"></uni-icons>
					<text class="empty-text">未找到相关非遗项目</text>
					<text class="empty-tip">换个关键词试试吧</text>
				</view>
				<view v-else class="result-list">
					<view
						v-for="item in heritageResult"
						:key="item._id"
						class="result-item"
						@click="goToHeritageDetail(item._id)"
					>
						<image class="item-cover" :src="item.coverImage" mode="aspectFill"></image>
						<view class="item-info">
							<view class="item-title-row">
								<text class="item-title">{{ item.name }}</text>
								<view v-if="item.isHot" class="item-hot-tag">
									<uni-icons type="fire" size="14" color="#fff"></uni-icons>
								</view>
							</view>
							<text class="item-brief">{{ item.brief || '暂无简介' }}</text>
							<view class="item-meta">
								<text class="item-category heritage-cat">{{ item.category }}</text>
								<text class="item-location">{{ item.location }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 景点结果 -->
			<scroll-view
				v-else-if="activeTab === 'scenic'"
				class="result-scroll"
				scroll-y="true"
				:show-scrollbar="false"
			>
				<view v-if="scenicResult.length === 0" class="empty-container">
					<uni-icons type="search" size="80" color="#ccc"></uni-icons>
					<text class="empty-text">未找到相关景点</text>
					<text class="empty-tip">换个关键词试试吧</text>
				</view>
				<view v-else class="result-list">
					<view
						v-for="item in scenicResult"
						:key="item._id"
						class="result-item"
						@click="goToScenicDetail(item._id)"
					>
						<image class="item-cover" :src="item.coverImage" mode="aspectFill"></image>
						<view class="item-info">
							<view class="item-title-row">
								<text class="item-title">{{ item.name }}</text>
								<view v-if="item.level" class="item-level-tag">
									<text>{{ item.level }}</text>
								</view>
							</view>
							<text class="item-brief">{{ item.brief || '暂无简介' }}</text>
							<view class="item-meta">
								<text class="item-category scenic-cat">景点</text>
								<text class="item-location">{{ item.location }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { processImageFields } from '@/utils/cloudCall.js';

export default {
	data() {
		return {
			// 搜索相关
			searchKeyword: '',
			heritageResult: [],
			scenicResult: [],
			isSearching: false,
			isLoading: false,
			activeTab: 'heritage',

			// 历史与推荐
			searchHistory: [],
			hotKeywords: ['成都', '传统技艺', '川剧', '手工', '国家级非遗', '阿坝州', '凉山', '民俗'],
			searchTimer: null
		};
	},
	onLoad() {
		this.loadSearchHistory();
	},
	methods: {
		// 输入框防抖处理
		onInput(e) {
			const keyword = e.detail.value.trim();
			this.searchKeyword = keyword;
			clearTimeout(this.searchTimer);
			if (keyword) {
				this.searchTimer = setTimeout(() => {
					this.doSearch(keyword);
				}, 500);
			} else {
				this.isSearching = false;
				this.heritageResult = [];
				this.scenicResult = [];
			}
		},

		// 执行搜索（同时查非遗和景点）
		async doSearch(keyword) {
			if (!keyword) return;
			this.isSearching = true;
			this.isLoading = true;
			this.heritageResult = [];
			this.scenicResult = [];
			this.saveToHistory(keyword);

			try {
				const db = wx.cloud.database();
				const buildCondition = (keyword) => db.command.or([
					{ name: db.RegExp({ regexp: keyword, options: 'i' }) },
					{ brief: db.RegExp({ regexp: keyword, options: 'i' }) },
					{ category: db.RegExp({ regexp: keyword, options: 'i' }) },
					{ location: db.RegExp({ regexp: keyword, options: 'i' }) }
				]);

				// 并发查询非遗和景点
				const [heritageRes, scenicRes] = await Promise.all([
					db.collection('heritage').where(buildCondition(keyword)).limit(20).get(),
					db.collection('scenic').where(buildCondition(keyword)).limit(20).get()
				]);

				// 处理云存储图片
				this.heritageResult = await processImageFields(heritageRes.data, ['coverImage']);
				this.scenicResult = await processImageFields(scenicRes.data, ['coverImage']);

				// 自动切换到有结果的 Tab
				if (heritageRes.data.length === 0 && scenicRes.data.length > 0) {
					this.activeTab = 'scenic';
				} else {
					this.activeTab = 'heritage';
				}
			} catch (err) {
				console.error('搜索失败：', err);
				uni.showToast({ title: '搜索失败，请重试', icon: 'none' });
			} finally {
				this.isLoading = false;
			}
		},

		// 键盘确认搜索
		onSearch() {
			const keyword = this.searchKeyword.trim();
			if (keyword) this.doSearch(keyword);
		},

		// 从历史记录搜索
		searchFromHistory(keyword) {
			this.searchKeyword = keyword;
			this.doSearch(keyword);
		},

		// 从热门关键词搜索
		searchFromHot(keyword) {
			this.searchKeyword = keyword;
			this.doSearch(keyword);
		},

		// 保存搜索历史
		saveToHistory(keyword) {
			const index = this.searchHistory.indexOf(keyword);
			if (index !== -1) this.searchHistory.splice(index, 1);
			this.searchHistory.unshift(keyword);
			if (this.searchHistory.length > 10) {
				this.searchHistory = this.searchHistory.slice(0, 10);
			}
			uni.setStorageSync('searchHistory', this.searchHistory);
		},

		// 加载搜索历史
		loadSearchHistory() {
			this.searchHistory = uni.getStorageSync('searchHistory') || [];
		},

		// 清空搜索历史
		clearHistory() {
			uni.showModal({
				title: '提示',
				content: '确定要清空搜索历史吗？',
				success: (res) => {
					if (res.confirm) {
						this.searchHistory = [];
						uni.removeStorageSync('searchHistory');
					}
				}
			});
		},

		// 清空关键词
		clearKeyword() {
			this.searchKeyword = '';
			this.isSearching = false;
			this.heritageResult = [];
			this.scenicResult = [];
		},

		// 返回上一页
		goBack() {
			uni.navigateBack();
		},

		// 跳转非遗详情
		goToHeritageDetail(id) {
			uni.navigateTo({ url: `/pages/heritage/heritageDetail?id=${id}` });
		},

		// 跳转景点详情
		goToScenicDetail(id) {
			uni.navigateTo({ url: `/pages/scenic/scenicDetail?id=${id}` });
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

/* 搜索头部 */
.search-header {
	background-color: #fff;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;

	.search-box {
		flex: 1;
		background-color: #f5f5f5;
		border-radius: 50rpx;
		padding: 20rpx 30rpx;
		display: flex;
		align-items: center;

		.search-icon { margin-right: 15rpx; }

		.search-input {
			flex: 1;
			font-size: 28rpx;
			color: #333;
			height: 40rpx;
			line-height: 40rpx;
		}

		.clear-icon {
			width: 40rpx;
			height: 40rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.cancel-btn {
		font-size: 30rpx;
		color: #666;
		margin-left: 20rpx;
		padding: 10rpx 0;
	}
}

/* 历史 & 热门 */
.history-section,
.hot-section {
	background-color: #fff;
	margin-top: 20rpx;
	padding: 30rpx;

	.section-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 28rpx;
		color: #999;
		margin-bottom: 25rpx;

		.clear-history {
			font-size: 26rpx;
			color: #666;
		}
	}
}

.history-tags,
.hot-tags {
	display: flex;
	flex-wrap: wrap;

	.history-tag,
	.hot-tag {
		background-color: #f5f5f5;
		border-radius: 40rpx;
		padding: 15rpx 25rpx;
		margin-right: 20rpx;
		margin-bottom: 20rpx;

		text { font-size: 26rpx; color: #666; }
	}

	.hot-tag {
		background-color: #fff0f0;
		text { color: #e64340; }
	}
}

/* 结果区域 */
.result-area {
	flex: 1;
	display: flex;
	flex-direction: column;
}

/* Tab 栏 */
.tab-bar {
	display: flex;
	background: #fff;
	border-bottom: 1rpx solid #f0f0f0;

	.tab-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 28rpx 0;
		font-size: 28rpx;
		color: #999;
		position: relative;

		.tab-count {
			font-size: 22rpx;
			color: #bbb;
			margin-left: 8rpx;
			background: #f0f0f0;
			padding: 2rpx 12rpx;
			border-radius: 20rpx;
		}

		&.active {
			color: #e64340;
			font-weight: bold;

			&::after {
				content: '';
				position: absolute;
				bottom: 0;
				left: 50%;
				transform: translateX(-50%);
				width: 60rpx;
				height: 4rpx;
				background: #e64340;
				border-radius: 2rpx;
			}

			.tab-count {
				color: #fff;
				background: #e64340;
			}
		}
	}
}

.result-scroll {
	flex: 1;
	height: calc(100vh - 220rpx);
}

/* 加载 & 空状态 */
.loading-container {
	padding: 200rpx 0;
	text-align: center;
	font-size: 28rpx;
	color: #999;
}

.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
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
	}
}

/* 结果列表 */
.result-list {
	padding: 20rpx 30rpx;

	.result-item {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		display: flex;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);

		&:active { background-color: #f9f9f9; }

		.item-cover {
			width: 180rpx;
			height: 180rpx;
			border-radius: 10rpx;
			margin-right: 25rpx;
			flex-shrink: 0;
		}

		.item-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			.item-title-row {
				display: flex;
				align-items: center;
				margin-bottom: 15rpx;

				.item-title {
					flex: 1;
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					line-height: 1.4;
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
				}

				.item-hot-tag {
					background-color: #e64340;
					width: 40rpx;
					height: 40rpx;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					margin-left: 15rpx;
					flex-shrink: 0;
				}

				.item-level-tag {
					background: linear-gradient(135deg, #f5a623, #e08b00);
					padding: 4rpx 14rpx;
					border-radius: 20rpx;
					margin-left: 15rpx;
					flex-shrink: 0;

					text {
						font-size: 22rpx;
						color: #fff;
					}
				}
			}

			.item-brief {
				font-size: 26rpx;
				color: #666;
				line-height: 1.6;
				margin-bottom: 15rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
			}

			.item-meta {
				display: flex;
				align-items: center;

				.item-category {
					font-size: 24rpx;
					padding: 6rpx 15rpx;
					border-radius: 20rpx;
					margin-right: 15rpx;
				}

				.heritage-cat {
					color: #e64340;
					background-color: #ffeaea;
				}

				.scenic-cat {
					color: #007AFF;
					background-color: #e8f2ff;
				}

				.item-location {
					font-size: 24rpx;
					color: #999;
				}
			}
		}
	}
}
</style>
