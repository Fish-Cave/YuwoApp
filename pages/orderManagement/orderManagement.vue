<template>
  <view class="container">
    <!-- 头部信息栏 -->
    <view class="header-card glass-card">
      <view class="header-content">
        <view class="header-text">
          <view class="header-title">订单管理中心</view><br>
          <view class="header-subtitle">智能管理订单状态、价格和详细信息</view>
        </view>
        <!-- <view class="header-icon">
          <uni-icons type="list" size="32" color="rgba(255,255,255,0.8)"></uni-icons>
        </view>-->
      </view>
      
  <!-- 订单统计信息
      <view class="stats-container">
        <view class="stats-bar">
          <view class="stat-item" @click="quickFilter('all')">
            <view class="stat-number">{{ orderStats.total || 0 }}</view>
            <view class="stat-label">总订单</view>
            <view class="stat-trend">
              <uni-icons type="arrow-up" size="12" color="#10B981"></uni-icons>
            </view>
          </view>
          
          <view class="stat-divider"></view>
          
          <view class="stat-item" @click="quickFilter('pending')">
            <view class="stat-number pending-color">{{ orderStats.pending || 0 }}</view>
            <view class="stat-label">待确认</view>
            <view class="stat-badge pending-badge" v-if="orderStats.pending > 0">!</view>
          </view>
          
          <view class="stat-divider"></view>
          
          <view class="stat-item" @click="quickFilter('completed')">
            <view class="stat-number completed-color">{{ orderStats.completed || 0 }}</view>
            <view class="stat-label">已完成</view>
            <view class="stat-progress">
              <view class="progress-bar" :style="{width: getCompletionRate() + '%'}"></view>
            </view>
          </view>
          
          <view class="stat-divider"></view>
          
          <view class="stat-item">
            <view class="stat-number amount-color">{{ formatAmount(orderStats.totalAmount || 0) }}</view>
            <view class="stat-label">总收入</view>
            <view class="stat-icon">
              <uni-icons type="wallet" size="14" color="#F59E0B"></uni-icons>
            </view>
          </view>
        </view>
      </view>-->
    </view> 
     
    <!-- 快捷操作栏 -->
    <view class="quick-actions glass-card">
      <view class="quick-action-item" @click="refreshData">
        <uni-icons type="refresh" size="18" color="#3B82F6"></uni-icons>
        <text>刷新</text>
      </view>
      
      <view class="quick-action-item" @click="exportData">
        <uni-icons type="download" size="18" color="#10B981"></uni-icons>
        <text>导出</text>
      </view>
      
      <view class="quick-action-item" @click="showDatePicker">
        <uni-icons type="calendar" size="18" color="#8B5CF6"></uni-icons>
        <text>日期</text>
      </view>
      
      <view class="quick-action-item" @click="toggleAdvancedFilters">
        <uni-icons type="settings" size="18" color="#F59E0B"></uni-icons>
        <text>筛选</text>
      </view>
    </view>
    
    <!-- 搜索与筛选区域 -->
    <view class="search-card glass-card">
      <view class="search-header">
        <view class="search-title-section">
          <uni-icons type="search" size="20" color="#6B7280"></uni-icons>
          <view class="search-title">智能搜索</view>
        </view>
        <view class="filter-toggle" @click="toggleAdvancedFilters">
          <text>{{ showAdvancedFilters ? '收起' : '展开' }}</text>
          <uni-icons 
            :type="showAdvancedFilters ? 'up' : 'down'" 
            size="14" 
            color="#6B7280">
          </uni-icons>
        </view>
      </view>
      
      <!-- 基础搜索 -->
      <view class="search-section">
        <view class="search-input-wrapper">
          <view class="search-input-container">
            <uni-icons type="search" size="16" color="#9CA3AF"></uni-icons>
            <input 
              class="search-input" 
              v-model="searchForm.keyword" 
              placeholder="搜索订单ID、用户名或机台名称" 
              @confirm="performSearch"
              @input="onSearchInput"
            />
            <view v-if="searchForm.keyword" class="clear-search" @click="clearSearch">
              <uni-icons type="clear" size="14" color="#6B7280"></uni-icons>
            </view>
          </view>
          
          <button class="search-btn" @click="performSearch">
            <uni-icons type="search" size="16" color="#ffffff"></uni-icons>
          </button>
        </view>
        
        <!-- 快捷筛选标签 -->
        <view class="quick-filters">
          <view 
            v-for="(filter, index) in quickFilterTags" 
            :key="index"
            :class="['filter-tag', {'active': activeQuickFilter === filter.value}]"
            @click="applyQuickFilter(filter.value)"
          >
            <view :class="['tag-dot', filter.color]"></view>
            <text>{{ filter.label }}</text>
            <text class="tag-count">{{ filter.count || 0 }}</text>
          </view>
        </view>
      </view>
      
      <!-- 高级筛选选项 -->
      <transition name="slide-down">
        <view v-if="showAdvancedFilters" class="advanced-filters">
          <view class="filter-grid">
            <!-- 状态筛选 -->
            <view class="filter-group">
              <view class="filter-label">
                <uni-icons type="flag" size="14" color="#6B7280"></uni-icons>
                <text>订单状态</text>
              </view>
              <picker 
                @change="onStatusFilterChange" 
                :value="statusFilterIndex" 
                :range="statusFilterOptions">
                <view class="picker-display">
                  <text>{{ statusFilterOptions[statusFilterIndex] }}</text>
                  <uni-icons type="down" size="12" color="#6B7280"></uni-icons>
                </view>
              </picker>
            </view>
            
            <!-- 时间范围 -->
            <view class="filter-group">
              <view class="filter-label">
                <uni-icons type="calendar" size="14" color="#6B7280"></uni-icons>
                <text>时间范围</text>
              </view>
              <picker 
                @change="onDateRangeChange" 
                :value="dateRangeIndex" 
                :range="dateRangeOptions">
                <view class="picker-display">
                  <text>{{ dateRangeOptions[dateRangeIndex] }}</text>
                  <uni-icons type="down" size="12" color="#6B7280"></uni-icons>
                </view>
              </picker>
            </view>
            
            <!-- 金额范围 -->
            <view class="filter-group full-width">
              <view class="filter-label">
                <uni-icons type="wallet" size="14" color="#6B7280"></uni-icons>
                <text>金额范围 (元)</text>
              </view>
              <view class="amount-range">
                <view class="amount-input-wrapper">
                  <input 
                    type="digit" 
                    v-model="searchForm.minAmount" 
                    placeholder="最小金额" 
                    class="amount-input"
                  />
                </view>
                <view class="range-separator">
                  <text>至</text>
                </view>
                <view class="amount-input-wrapper">
                  <input 
                    type="digit" 
                    v-model="searchForm.maxAmount" 
                    placeholder="最大金额" 
                    class="amount-input"
                  />
                </view>
              </view>
            </view>
            
            <!-- 排序方式 -->
            <view class="filter-group">
              <view class="filter-label">
                <uni-icons type="arrow-up" size="14" color="#6B7280"></uni-icons>
                <text>排序方式</text>
              </view>
              <picker 
                @change="onSortChange" 
                :value="sortIndex" 
                :range="sortOptions">
                <view class="picker-display">
                  <text>{{ sortOptions[sortIndex] }}</text>
                  <uni-icons type="down" size="12" color="#6B7280"></uni-icons>
                </view>
              </picker>
            </view>
          </view>
          
          <view class="filter-actions">
            <button class="filter-btn reset" @click="resetAllFilters">
              <uni-icons type="refresh" size="14" color="#6B7280"></uni-icons>
              <text>重置</text>
            </button>
            <button class="filter-btn apply" @click="applyAdvancedFilters">
              <uni-icons type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
              <text>应用筛选</text>
            </button>
          </view>
        </view>
      </transition>
    </view>
    
    <!-- 订单列表卡片 -->
    <view class="orders-card glass-card">
      <view class="list-header">
        <view class="list-title-section">
          <view class="list-title">订单列表</view>
          <view class="list-subtitle" v-if="orders.length > 0">
            共 {{ totalRecords }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
          </view>
        </view>
        
        <view class="list-actions">
          <view class="view-mode-toggle">
            <view 
              :class="['mode-btn', {'active': viewMode === 'card'}]"
              @click="setViewMode('card')"
            >
              <uni-icons type="grid" size="14"></uni-icons>
            </view>
            <view 
              :class="['mode-btn', {'active': viewMode === 'list'}]"
              @click="setViewMode('list')"
            >
              <uni-icons type="list" size="14"></uni-icons>
            </view>
          </view>
          
          <button class="refresh-btn" @click="refreshOrders">
            <uni-icons type="refresh" size="14" color="#3B82F6"></uni-icons>
          </button>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 订单列表内容 -->
      <scroll-view v-else class="orders-list" scroll-y="true">
        <!-- 空状态 -->
        <view v-if="orders.length === 0" class="empty-state">
          <view class="empty-icon">
            <uni-icons type="info-filled" size="48" color="#D1D5DB"></uni-icons>
          </view>
          <view class="empty-title">暂无订单数据</view>
          <view class="empty-subtitle">
            {{ searchForm.keyword ? '未找到匹配的订单记录' : '暂时没有订单，请稍后再试' }}
          </view>
          <button v-if="searchForm.keyword" class="empty-action" @click="clearAllFilters">
            清除筛选条件
          </button>
        </view>
        
        <!-- 订单卡片 -->
        <view 
          v-for="(order, index) in orders" 
          :key="order._id" 
          :class="['order-card', viewMode + '-mode', {'selected': selectedOrderId === order._id}]"
          @click="selectOrder(order._id)"
        >
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-id-section">
              <view class="order-id">#{{ order._id.substring(0, 8).toUpperCase() }}</view>
              <view class="order-time">{{ formatRelativeTime(order.create_date) }}</view>
            </view>
            
            <view class="order-status-section">
              <view :class="['status-badge', getStatusClass(order.status)]">
                <view :class="['status-dot', getStatusClass(order.status)]"></view>
                <text>{{ getStatusText(order.status) }}</text>
              </view>
            </view>
          </view>
          
          <!-- 订单内容 -->
          <view class="order-content">
            <view class="order-info-grid">
              <view class="info-item">
                <view class="info-icon">
                  <uni-icons type="person" size="14" color="#6B7280"></uni-icons>
                </view>
                <view class="info-content">
                  <text class="info-label">用户</text>
                  <text class="info-value">{{ order.username || '未知用户' }}</text>
                </view>
              </view>
              
              <view class="info-item">
                <view class="info-icon">
                  <uni-icons type="gear" size="14" color="#6B7280"></uni-icons>
                </view>
                <view class="info-content">
                  <text class="info-label">机台</text>
                  <text class="info-value">{{ order.machineName || '未知机台' }}</text>
                </view>
              </view>
  
				<view class="info-item">
				  <view class="info-icon">
					<uni-icons type="smallcircle" size="14" color="#6B7280"></uni-icons>
				  </view>
				  <view class="info-content">
					<text class="info-label">时长</text>
					<text class="info-value">{{ formatDuration(order.duration) }}</text>
				  </view>
				</view>
				
				<view class="info-item price-item">
				  <view class="info-icon">
					<uni-icons type="wallet" size="14" color="#F59E0B"></uni-icons>
				  </view>
				  <view class="info-content">
					<text class="info-label">金额</text>
					<text class="info-value price-highlight">{{ formatAmount(order.total_fee) }}</text>
				  </view>
				</view>
			  </view>
			  
			  <!-- 时间信息 -->
			  <view class="time-section">
				<view class="time-item">
				  <uni-icons type="forward" size="12" color="#10B981"></uni-icons>
				  <text>{{ formatDateTime(order.starttime) }}</text>
				</view>
				<view class="time-separator">
				  <view class="separator-line"></view>
				</view>
				<view class="time-item">
				  <uni-icons type="back" size="12" color="#EF4444"></uni-icons>
				  <text>{{ formatDateTime(order.endtime) }}</text>
				</view>
			  </view>
			  
			  <!-- 特殊标识 -->
			  <view class="order-tags" v-if="order.isOvernight">
				<view class="tag overnight-tag">
				  <uni-icons type="moon" size="10" color="#8B5CF6"></uni-icons>
				  <text>过夜</text>
				</view>
			  </view>
			</view>
			
			<!-- 订单操作 -->
			<view class="order-actions">
			  <button class="action-btn view-btn" @click.stop="viewOrderDetail(order._id)">
				<uni-icons type="eye" size="14" color="#6B7280"></uni-icons>
				<text>查看</text>
			  </button>
			  
			  <button class="action-btn edit-btn" @click.stop="editOrder(order)">
				<uni-icons type="compose" size="14" color="#3B82F6"></uni-icons>
				<text>编辑</text>
			  </button>
			  
			  <button 
				v-if="order.status === 0" 
				class="action-btn confirm-btn" 
				@click.stop="quickConfirmOrder(order._id)"
			  >
				<uni-icons type="checkmarkempty" size="14" color="#10B981"></uni-icons>
				<text>确认</text>
			  </button>
			</view>
		  </view>
		  
		  <view v-if="!hasMoreData && orders.length > 0" class="no-more-data">
			<text>已加载全部数据</text>
		  </view>
		</scroll-view>
		
		<!-- 分页控件 -->
		<view class="pagination-container">
		  <view class="pagination">
			<button 
			  class="page-btn" 
			  :disabled="currentPage <= 1"
			  @click="goToPage(currentPage - 1)"
			>
			  <uni-icons type="left" size="14" :color="currentPage <= 1 ? '#D1D5DB' : '#3B82F6'"></uni-icons>
			</button>
			
			<view class="page-numbers">
			  <view 
				v-for="page in visiblePages" 
				:key="page"
				:class="['page-number', {'active': page === currentPage, 'ellipsis': page === '...'}]"
				@click="page !== '...' && goToPage(page)"
			  >
				{{ page }}
			  </view>
			</view>
			
			<button 
			  class="page-btn" 
			  :disabled="currentPage >= totalPages"
			  @click="goToPage(currentPage + 1)"
			>
			  <uni-icons type="right" size="14" :color="currentPage >= totalPages ? '#D1D5DB' : '#3B82F6'"></uni-icons>
			</button>
		  </view>
		  
		  <view class="page-info">
			<text>共 {{ totalRecords }} 条记录</text>
		  </view>
		</view>
	  </view>
	  
	  <!-- 订单编辑弹窗 -->
	  <uni-popup ref="orderEditPopup" type="center" :mask-click="false">
		<view class="edit-modal">
		  <view class="modal-header">
			<view class="modal-title">
			  <uni-icons type="compose" size="18" color="#3B82F6"></uni-icons>
			  <text>编辑订单</text>
			</view>
			<button class="close-btn" @click="cancelEdit">
			  <uni-icons type="clear" size="16" color="#6B7280"></uni-icons>
			</button>
		  </view>
		  
		  <scroll-view class="modal-content" scroll-y="true">
			<!-- 订单基本信息 -->
			<view class="edit-section">
			  <view class="section-header">
				<uni-icons type="info" size="16" color="#6B7280"></uni-icons>
				<text>基本信息</text>
			  </view>
			  
			  <view class="info-display">
				<view class="info-row">
				  <text class="label">订单ID:</text>
				  <text class="value">{{ currentEditingOrder._id }}</text>
				</view>
				<view class="info-row">
				  <text class="label">用户:</text>
				  <text class="value">{{ currentEditingOrder.username }}</text>
				</view>
				<view class="info-row">
				  <text class="label">机台:</text>
				  <text class="value">{{ currentEditingOrder.machineName }}</text>
				</view>
			  </view>
			</view>
			
			<!-- 状态编辑 -->
			<view class="edit-section">
			  <view class="section-header">
				<uni-icons type="flag" size="16" color="#6B7280"></uni-icons>
				<text>订单状态</text>
			  </view>
			  
			  <view class="status-selector">
				<view 
				  v-for="(status, idx) in editStatusOptions" 
				  :key="idx"
				  :class="['status-option', {'selected': editStatusIndex === idx}]"
				  @click="selectEditStatus(idx)"
				>
				  <view :class="['status-indicator', getStatusClass(idx)]"></view>
				  <text>{{ status }}</text>
				  <view v-if="editStatusIndex === idx" class="check-icon">
					<uni-icons type="checkmarkempty" size="14" color="#3B82F6"></uni-icons>
				  </view>
				</view>
			  </view>
			</view>
			
			<!-- 价格编辑 -->
			<view class="edit-section">
			  <view class="section-header">
				<uni-icons type="wallet" size="16" color="#6B7280"></uni-icons>
				<text>订单金额</text>
			  </view>
			  
			  <view class="price-editor">
				<view class="price-input-container">
				  <text class="currency">¥</text>
				  <input 
					type="digit" 
					v-model="editForm.price" 
					placeholder="0.00" 
					class="price-input"
					@input="onPriceInput"
				  />
				</view>
				
				<view class="price-suggestions">
				  <view 
					v-for="suggestion in priceSuggestions" 
					:key="suggestion"
					class="price-suggestion"
					@click="applyPriceSuggestion(suggestion)"
				  >
					¥{{ suggestion }}
				  </view>
				</view>
			  </view>
			</view>
			
			<!-- 时间编辑 -->
			<view class="edit-section">
			  <view class="section-header">
				<uni-icons type="clock" size="16" color="#6B7280"></uni-icons>
				<text>时间设置</text>
			  </view>
			  
			  <view class="time-editor">
				<view class="time-row">
				  <view class="time-label">开始时间</view>
				  <picker 
					mode="time" 
					:value="formatTimeForPicker(editForm.starttime)"
					@change="onEditStartTimeChange"
				  >
					<view class="time-picker">
					  <text>{{ formatTime(editForm.starttime) }}</text>
					  <uni-icons type="clock" size="14" color="#6B7280"></uni-icons>
					</view>
				  </picker>
				</view>
				
				<view class="time-row">
				  <view class="time-label">结束时间</view>
				  <picker 
					mode="time" 
					:value="formatTimeForPicker(editForm.endtime)"
					@change="onEditEndTimeChange"
				  >
					<view class="time-picker">
					  <text>{{ formatTime(editForm.endtime) }}</text>
					  <uni-icons type="clock" size="14" color="#6B7280"></uni-icons>
					</view>
				  </picker>
				</view>
				
				<view class="duration-display">
				  <uni-icons type="time" size="14" color="#10B981"></uni-icons>
				  <text>使用时长: {{ calculateEditDuration() }}</text>
				</view>
			  </view>
			</view>
			
			<!-- 修改原因 -->
			<view class="edit-section">
			  <view class="section-header">
				<uni-icons type="chat" size="16" color="#6B7280"></uni-icons>
				<text>修改原因</text>
				<text class="required">*</text>
			  </view>
			  
			  <textarea 
				v-model="editForm.reason" 
				placeholder="请详细说明修改原因（必填）" 
				class="reason-textarea"
				maxlength="200"
			  ></textarea>
			  
			  <view class="char-count">
				{{ editForm.reason.length }}/200
			  </view>
			</view>
			
			<!-- 错误提示 -->
			<view v-if="editError" class="error-message">
			  <uni-icons type="error" size="16" color="#EF4444"></uni-icons>
			  <text>{{ editError }}</text>
			</view>
		  </scroll-view>
		  
		  <view class="modal-footer">
			<button class="cancel-btn" @click="cancelEdit">取消</button>
			<button class="confirm-btn" @click="confirmEdit" :disabled="!canConfirmEdit">
			  <uni-icons type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
			  <text>保存修改</text>
			</button>
		  </view>
		</view>
	  </uni-popup>
	  
	  <!-- 订单详情弹窗 -->
	  <uni-popup ref="orderDetailPopup" type="center">
		<view class="detail-modal">
		  <view class="modal-header">
			<view class="modal-title">
			  <uni-icons type="eye" size="18" color="#3B82F6"></uni-icons>
			  <text>订单详情</text>
			</view>
			<button class="close-btn" @click="closeDetail">
			  <uni-icons type="clear" size="16" color="#6B7280"></uni-icons>
			</button>
		  </view>
		  
		  <scroll-view class="modal-content" scroll-y="true">
			<!-- 详情内容会在这里显示 -->
			<view class="detail-sections">
			  <!-- 基本信息 -->
			  <view class="detail-section">
				<view class="section-title">订单信息</view>
				<view class="detail-grid">
				  <view class="detail-item">
					<text class="detail-label">订单号</text>
					<text class="detail-value">{{ currentDetailOrder._id }}</text>
				  </view>
				  <view class="detail-item">
					<text class="detail-label">状态</text>
					<view :class="['status-tag', getStatusClass(currentDetailOrder.status)]">
					  {{ getStatusText(currentDetailOrder.status) }}
					</view>
				  </view>
				  <view class="detail-item">
					<text class="detail-label">创建时间</text>
					<text class="detail-value">{{ formatDateTime(currentDetailOrder.create_date) }}</text>
				  </view>
				  <view class="detail-item">
					<text class="detail-label">金额</text>
					<text class="detail-value amount">{{ formatAmount(currentDetailOrder.total_fee) }}</text>
				  </view>
				</view>
			  </view>
			  
			  <!-- 更多详情内容... -->
			</view>
		  </scroll-view>
		  
		  <view class="modal-footer">
			<button class="action-btn" @click="closeDetail">关闭</button>
			<button class="action-btn primary" @click="editFromDetail">编辑</button>
		  </view>
		</view>
	  </uni-popup>
	</view>
  </template>
  
  <script>
  export default {
	data() {
	  return {
		// 基础数据
		loading: false,
		viewMode: 'card', // 'card' | 'list'
		
		// 订单统计
		orderStats: {
		  total: 0,
		  pending: 0,
		  completed: 0,
		  unfinished: 0,
		  refunded: 0,
		  totalAmount: 0
		},
		
		// 搜索筛选
		showAdvancedFilters: false,
		activeQuickFilter: 'all',
		searchForm: {
		  keyword: '',
		  status: null,
		  startDate: null,
		  endDate: null,
		  minAmount: '',
		  maxAmount: '',
		  sortField: 'create_date',
		  sortOrder: 'desc'
		},
		
		// 筛选选项
		statusFilterIndex: 0,
		statusFilterOptions: ['全部状态', '待确认', '已完成', '未完成', '已退款'],
		dateRangeIndex: 0,
		dateRangeOptions: ['全部时间', '今天', '昨天', '最近7天', '最近30天', '本月', '上月'],
		sortIndex: 0,
		sortOptions: ['最新创建', '最早创建', '金额最高', '金额最低', '时长最长', '时长最短'],
		
		// 快捷筛选标签
		quickFilterTags: [
		  { label: '全部', value: 'all', color: 'blue', count: 0 },
		  { label: '待确认', value: 'pending', color: 'orange', count: 0 },
			  { label: '已完成', value: 'completed', color: 'green', count: 0 },
			  { label: '未完成', value: 'unfinished', color: 'red', count: 0 },
			  { label: '已退款', value: 'refunded', color: 'gray', count: 0 }
			],
			
			// 订单列表
			orders: [],
			selectedOrderId: null,
			currentPage: 1,
			pageSize: 10,
			totalPages: 1,
			totalRecords: 0,
			hasMoreData: true,
			
			// 编辑相关
			currentEditingOrder: {},
			editStatusIndex: 0,
			editStatusOptions: ['待确认', '已完成', '未完成', '已退款'],
			editForm: {
			  price: '',
			  starttime: null,
			  endtime: null,
			  reason: ''
			},
			editError: '',
			priceSuggestions: ['5.00', '10.00', '15.00', '20.00', '25.00', '30.00'],
			
			// 详情相关
			currentDetailOrder: {},
			orderEditLogs: [],
			
			// 搜索防抖
			searchTimeout: null
		  };
		},
		
		computed: {
		  visiblePages() {
			const pages = [];
			const total = this.totalPages;
			const current = this.currentPage;
			
			if (total <= 7) {
			  for (let i = 1; i <= total; i++) {
				pages.push(i);
			  }
			} else {
			  pages.push(1);
			  
			  if (current > 4) {
				pages.push('...');
			  }
			  
			  const start = Math.max(2, current - 2);
			  const end = Math.min(total - 1, current + 2);
			  
			  for (let i = start; i <= end; i++) {
				pages.push(i);
			  }
			  
			  if (current < total - 3) {
				pages.push('...');
			  }
			  
			  if (total > 1) {
				pages.push(total);
			  }
			}
			
			return pages;
		  },
		  
		  canConfirmEdit() {
			return this.editForm.reason.trim().length > 0 && !this.loading;
		  }
		},
		
		mounted() {
		  this.initData();
		},
		
		methods: {
		  async initData() {
			await Promise.all([
			  this.loadOrderStats(),
			  this.loadOrders()
			]);
			this.updateQuickFilterCounts();
		  },
		  
		  // 数据加载
		  async loadOrderStats() {
			try {
			  const todo = uniCloud.importObject('todo');
			  const result = await todo.Get_OrdersCount();
			  
			  if (result && result.code === 0) {
				this.orderStats = result.data;
			  }
			} catch (e) {
			  console.error('加载订单统计失败:', e);
			}
		  },
		  
		  async loadOrders(append = false) {
			if (this.loading) return;
			
			try {
			  this.loading = true;
			  
			  const params = {
				pageSize: this.pageSize,
				pageNumber: append ? this.currentPage + 1 : this.currentPage,
				sortField: this.searchForm.sortField,
				sortOrder: this.searchForm.sortOrder
			  };
			  
			  // 添加筛选条件
			  if (this.searchForm.keyword) {
				params.keyword = this.searchForm.keyword;
			  }
			  
			  if (this.searchForm.status !== null) {
				params.status = this.searchForm.status;
			  }
			  
			  if (this.searchForm.startDate && this.searchForm.endDate) {
				params.startDate = this.searchForm.startDate;
				params.endDate = this.searchForm.endDate;
			  }
			  
			  if (this.searchForm.minAmount) {
				params.minAmount = parseFloat(this.searchForm.minAmount) * 100;
			  }
			  
			  if (this.searchForm.maxAmount) {
				params.maxAmount = parseFloat(this.searchForm.maxAmount) * 100;
			  }
			  
			  const todo = uniCloud.importObject('todo');
			  const result = await todo.Get_FilteredOrders(params);
			  
			  if (result && result.code === 0) {
				if (append) {
				  this.orders = [...this.orders, ...result.data];
				  this.currentPage++;
				} else {
				  this.orders = result.data;
				}
				
				this.totalPages = result.pagination.totalPages;
				this.totalRecords = result.pagination.total;
				this.hasMoreData = result.pagination.hasNext;
			  } else {
				uni.showToast({
				  title: result?.errMsg || '加载失败',
				  icon: 'none'
				});
			  }
			} catch (e) {
			  console.error('加载订单失败:', e);
			  uni.showToast({
				title: '加载订单失败',
				icon: 'none'
			  });
			} finally {
			  this.loading = false;
			}
		  },
		  
		  // 搜索相关
		  onSearchInput() {
			if (this.searchTimeout) {
			  clearTimeout(this.searchTimeout);
			}
			
			this.searchTimeout = setTimeout(() => {
			  this.performSearch();
			}, 500);
		  },
		  
		  performSearch() {
			this.currentPage = 1;
			this.loadOrders();
		  },
		  
		  clearSearch() {
			this.searchForm.keyword = '';
			this.performSearch();
		  },
		  
		  // 筛选相关
		  toggleAdvancedFilters() {
			this.showAdvancedFilters = !this.showAdvancedFilters;
		  },
		  
		  quickFilter(type) {
			this.activeQuickFilter = type;
			this.applyQuickFilter(type);
		  },
		  
		  applyQuickFilter(type) {
			this.resetAllFilters();
			
			switch (type) {
			  case 'pending':
				this.searchForm.status = 0;
				this.statusFilterIndex = 1;
				break;
			  case 'completed':
				this.searchForm.status = 1;
				this.statusFilterIndex = 2;
				break;
			  case 'unfinished':
				this.searchForm.status = 2;
				this.statusFilterIndex = 3;
				break;
			  case 'refunded':
				this.searchForm.status = 3;
				this.statusFilterIndex = 4;
				break;
			  default:
				this.searchForm.status = null;
				this.statusFilterIndex = 0;
			}
			
			this.activeQuickFilter = type;
			this.performSearch();
		  },
		  
		  onStatusFilterChange(e) {
			this.statusFilterIndex = e.detail.value;
			this.searchForm.status = this.statusFilterIndex > 0 ? this.statusFilterIndex - 1 : null;
		  },
		  
		  onDateRangeChange(e) {
			this.dateRangeIndex = e.detail.value;
			const now = new Date();
			
			this.searchForm.startDate = null;
			this.searchForm.endDate = null;
			
			switch (parseInt(this.dateRangeIndex)) {
			  case 1: // 今天
				this.setDateRange(this.getStartOfDay(now), this.getEndOfDay(now));
				break;
			  case 2: // 昨天
				const yesterday = new Date(now);
				yesterday.setDate(yesterday.getDate() - 1);
				this.setDateRange(this.getStartOfDay(yesterday), this.getEndOfDay(yesterday));
				break;
			  case 3: // 最近7天
				const sevenDaysAgo = new Date(now);
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				this.setDateRange(this.getStartOfDay(sevenDaysAgo), this.getEndOfDay(now));
				break;
			  case 4: // 最近30天
				const thirtyDaysAgo = new Date(now);
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				this.setDateRange(this.getStartOfDay(thirtyDaysAgo), this.getEndOfDay(now));
				break;
			  case 5: // 本月
				this.setDateRange(
				  new Date(now.getFullYear(), now.getMonth(), 1),
				  new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
				);
				break;
			  case 6: // 上月
				this.setDateRange(
				  new Date(now.getFullYear(), now.getMonth() - 1, 1),
				  new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
				);
				break;
			}
		  },
		  
		  onSortChange(e) {
			this.sortIndex = e.detail.value;
			
			const sortConfigs = [
			  { field: 'create_date', order: 'desc' },  // 最新创建
			  { field: 'create_date', order: 'asc' },   // 最早创建
			  { field: 'total_fee', order: 'desc' },    // 金额最高
			  { field: 'total_fee', order: 'asc' },     // 金额最低
			  { field: 'duration', order: 'desc' },     // 时长最长
			  { field: 'duration', order: 'asc' }       // 时长最短
			];
			
			const config = sortConfigs[this.sortIndex];
			this.searchForm.sortField = config.field;
			this.searchForm.sortOrder = config.order;
		  },
		  
		  resetAllFilters() {
			this.searchForm = {
			  keyword: '',
			  status: null,
			  startDate: null,
			  endDate: null,
			  minAmount: '',
			  maxAmount: '',
			  sortField: 'create_date',
			  sortOrder: 'desc'
			};
			
			this.statusFilterIndex = 0;
			this.dateRangeIndex = 0;
			this.sortIndex = 0;
			this.activeQuickFilter = 'all';
		  },
		  
		  applyAdvancedFilters() {
			this.currentPage = 1;
			this.loadOrders();
			this.showAdvancedFilters = false;
		  },
		  
		  clearAllFilters() {
			this.resetAllFilters();
			this.performSearch();
		  },
		  
		  // 订单操作
		  selectOrder(orderId) {
			this.selectedOrderId = this.selectedOrderId === orderId ? null : orderId;
		  },
		  
		  async viewOrderDetail(orderId) {
			// 验证 orderId
			if (!orderId) {
			  uni.showToast({
				title: '订单ID无效',
				icon: 'none'
			  });
			  return;
			}
		  
			try {
			  uni.showLoading({ title: '加载中...' });
			  
			  const todo = uniCloud.importObject('todo');
			  const [detailResult, logsResult] = await Promise.all([
				todo.GetOrderDetail(orderId),
				todo.GetOrderEditLogs(orderId)
			  ]);
			  
			  if (detailResult && detailResult.code === 0) {
				this.currentDetailOrder = detailResult.data;
				this.orderEditLogs = logsResult?.data || [];
				
				uni.hideLoading();
				this.$refs.orderDetailPopup.open();
			  } else {
				uni.hideLoading();
				uni.showToast({
				  title: detailResult?.errMsg || '获取订单详情失败',
				  icon: 'none'
				});
			  }
			} catch (e) {
			  uni.hideLoading();
			  console.error('加载订单详情失败:', e);
			  uni.showToast({
				title: '加载失败',
				icon: 'none'
			  });
			}
		  },
		  
		  editOrder(order) {
			this.currentEditingOrder = { ...order };
			this.editStatusIndex = order.status || 0;
			
			this.editForm = {
			  price: (order.total_fee / 100).toFixed(2),
			  starttime: order.starttime,
			  endtime: order.endtime,
			  reason: ''
			};
			
			this.editError = '';
			this.$refs.orderEditPopup.open();
		  },
		  
		  editFromDetail() {
			this.closeDetail();
			this.editOrder(this.currentDetailOrder);
		  },
		  
		  async quickConfirmOrder(orderId) {
			try {
			  const todo = uniCloud.importObject('todo');
			  const result = await todo.UpdateOrder({
				orderId: orderId,
				status: 1,
				editReason: '快速确认订单'
			  });
			  
			  if (result && result.code === 0) {
				uni.showToast({
				  title: '订单已确认',
				  icon: 'success'
				});
				this.refreshOrders();
			  } else {
				uni.showToast({
				  title: result?.errMsg || '确认失败',
				  icon: 'none'
				});
			  }
			} catch (e) {
			  console.error('确认订单失败:', e);
			  uni.showToast({
				title: '确认失败',
				icon: 'none'
			  });
			}
		  },
		  
		  // 编辑相关
		  selectEditStatus(index) {
			this.editStatusIndex = index;
		  },
		  
		  onPriceInput(e) {
			const value = e.detail.value;
			// 限制输入格式
			const regex = /^\d*\.?\d{0,2}$/;
			if (regex.test(value)) {
			  this.editForm.price = value;
			}
		  },
		  
		  applyPriceSuggestion(price) {
			this.editForm.price = price;
		  },
		  
		  onEditStartTimeChange(e) {
			const time = e.detail.value.split(':');
			const date = new Date(this.editForm.starttime);
			date.setHours(parseInt(time[0]), parseInt(time[1]), 0, 0);
			this.editForm.starttime = date.getTime();
		  },
		  
		  onEditEndTimeChange(e) {
			const time = e.detail.value.split(':');
			const date = new Date(this.editForm.endtime);
			date.setHours(parseInt(time[0]), parseInt(time[1]), 0, 0);
			this.editForm.endtime = date.getTime();
		  },
		  
		  calculateEditDuration() {
			if (!this.editForm.starttime || !this.editForm.endtime) return '--';
			
			const duration = this.editForm.endtime - this.editForm.starttime;
			const hours = Math.floor(duration / (1000 * 60 * 60));
			const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
			
			return `${hours}小时${minutes}分钟`;
		  },
		  
		  async confirmEdit() {
			// 验证
			if (!this.editForm.reason.trim()) {
			  this.editError = '请输入修改原因';
			  return;
			}
			
			const price = parseFloat(this.editForm.price);
			if (isNaN(price) || price < 0) {
			  this.editError = '请输入有效的金额';
			  return;
			}
			
			if (this.editForm.starttime >= this.editForm.endtime) {
			  this.editError = '开始时间必须早于结束时间';
			  return;
			}
			
			try {
			  this.loading = true;
			  this.editError = '';
			  
			  const updateData = {
				orderId: this.currentEditingOrder._id,
				status: this.editStatusIndex,
				totalFee: Math.round(price * 100),
				starttime: this.editForm.starttime,
				endtime: this.editForm.endtime,
				editReason: this.editForm.reason
			  };
			  
			  const todo = uniCloud.importObject('todo');
			  const result = await todo.UpdateOrder(updateData);
			  
			  if (result && result.code === 0) {
				uni.showToast({
				  title: '订单更新成功',
				  icon: 'success'
				});
				
				this.cancelEdit();
				this.refreshData();
			  } else {
				this.editError = result?.errMsg || '更新失败';
			  }
			} catch (e) {
			  console.error('更新订单失败:', e);
			  this.editError = '系统错误，请重试';
			} finally {
			  this.loading = false;
			}
		  },
		  
		  cancelEdit() {
			this.$refs.orderEditPopup.close();
			this.resetEditForm();
		  },
		  
		  resetEditForm() {
			this.currentEditingOrder = {};
			this.editStatusIndex = 0;
			this.editForm = {
			  price: '',
			  starttime: null,
			  endtime: null,
			  reason: ''
			};
			this.editError = '';
		  },
		  
		  // 详情相关
		  closeDetail() {
			this.$refs.orderDetailPopup.close();
			this.currentDetailOrder = {};
			this.orderEditLogs = [];
		  },
		  
		  // 分页相关
		  goToPage(page) {
			if (page < 1 || page > this.totalPages || page === this.currentPage) return;
			
			this.currentPage = page;
			this.loadOrders();
		  },
		  
		  onScrollToLower() {
		    return;
		  },
		  
		  // 视图模式
		  setViewMode(mode) {
			this.viewMode = mode;
		  },
		  
		  // 刷新相关
		  async refreshData() {
			await Promise.all([
			  this.loadOrderStats(),
			  this.refreshOrders()
			]);
			this.updateQuickFilterCounts();
		  },
		  
		  refreshOrders() {
			this.currentPage = 1;
			return this.loadOrders();
		  },
		  
		  updateQuickFilterCounts() {
			this.quickFilterTags.forEach(tag => {
			  switch (tag.value) {
				case 'all':
				  tag.count = this.orderStats.total;
				  break;
				case 'pending':
				  tag.count = this.orderStats.pending;
				  break;
				case 'completed':
				  tag.count = this.orderStats.completed;
				  break;
				case 'unfinished':
				  tag.count = this.orderStats.unfinished;
				  break;
				case 'refunded':
				  tag.count = this.orderStats.refunded;
				  break;
			  }
			});
		  },
		  
		  // 其他功能
		  exportData() {
			uni.showToast({
			  title: '导出功能开发中',
			  icon: 'none'
			});
		  },
		  
		  showDatePicker() {
			// 可以实现自定义日期选择器
			uni.showToast({
			  title: '自定义日期选择开发中',
			  icon: 'none'
			});
		  },
		  
		  // 工具方法
		  getCompletionRate() {
			if (this.orderStats.total === 0) return 0;
			return Math.round((this.orderStats.completed / this.orderStats.total) * 100);
		  },
		  
		  setDateRange(start, end) {
			this.searchForm.startDate = start.getTime();
			this.searchForm.endDate = end.getTime();
		  },
		  
		  getStartOfDay(date) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
		  },
		  
		  getEndOfDay(date) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
		  },
		  
		  formatAmount(amountInCents) {
			if (!amountInCents && amountInCents !== 0) return '¥0.00';
			return `¥${(amountInCents / 100).toFixed(2)}`;
		  },
		  
		  formatDate(timestamp) {
			if (!timestamp) return '--';
			const date = new Date(timestamp);
			return `${date.getMonth() + 1}/${date.getDate()}`;
		  },
		  
		  formatTime(timestamp) {
			if (!timestamp) return '--';
			const date = new Date(timestamp);
			return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
		  },
		  
		  formatDateTime(timestamp) {
			if (!timestamp) return '--';
			const date = new Date(timestamp);
			return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
		  },
		  
		  formatTimeForPicker(timestamp) {
			if (!timestamp) return '00:00';
			const date = new Date(timestamp);
			return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
		  },
		  
		  formatRelativeTime(timestamp) {
			if (!timestamp) return '--';
			
			const now = Date.now();
			const diff = now - timestamp;
			const minutes = Math.floor(diff / (1000 * 60));
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const days = Math.floor(diff / (1000 * 60 * 60 * 24));
			
			if (minutes < 1) return '刚刚';
			if (minutes < 60) return `${minutes}分钟前`;
			if (hours < 24) return `${hours}小时前`;
			if (days < 7) return `${days}天前`;
			
			return this.formatDate(timestamp);
		  },
		  
		  formatDuration(minutes) {
			if (!minutes) return '--';
			
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			
			if (hours === 0) return `${mins}分钟`;
			if (mins === 0) return `${hours}小时`;
			return `${hours}小时${mins}分钟`;
		  },
		  
		  getStatusText(status) {
			const statusMap = ['待确认', '已完成', '未完成', '已退款'];
			return statusMap[parseInt(status)] || '未知状态';
		  },
		  
		  getStatusClass(status) {
			const classMap = ['pending', 'completed', 'unfinished', 'refunded'];
			return classMap[parseInt(status)] || '';
		  }
		}
	  };
	  </script>
                              
<style>
/* 基础容器样式 */
.container {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
  position: relative;
}

/* 玻璃拟态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: hidden;
  padding: 16px;
  margin-bottom: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 头部样式 */
.header-card {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  padding: 24px 16px;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.header-icon {
  opacity: 0.6;
}

/* 统计信息样式 */
.stats-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 4px;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 12px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
}

.pending-color {
  color: #FCD34D;
}

.completed-color {
  color: #34D399;
}

.amount-color {
  color: #F472B6;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.stat-trend {
  position: absolute;
  top: 4px;
  right: 4px;
}

.stat-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-badge {
  background: #F59E0B;
  color: #ffffff;
}

.stat-progress {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1px;
  margin-top: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #34D399;
  border-radius: 1px;
  transition: width 0.5s ease;
}

.stat-icon {
  position: absolute;
  top: 4px;
  right: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 8px;
}

/* 快捷操作栏 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: 16px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.quick-action-item:active {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(0.95);
}

.quick-action-item text {
  margin-top: 6px;
  font-size: 12px;
  color: #4B5563;
  font-weight: 500;
}

/* 搜索与筛选区域 */
.search-card {
  padding: 20px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-toggle text {
  font-size: 14px;
  color: #3B82F6;
}

/* 搜索输入区域 */
.search-section {
  margin-bottom: 16px;
}

.search-input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 0 10px;
  transition: all 0.3s ease;
}

.search-input-container:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
  flex: 1;
  height: 40px;
  margin-left: 8px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #1F2937;
}

.clear-search {
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.clear-search:active {
  background: rgba(107, 114, 128, 0.1);
}

.search-btn {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

/* 快捷筛选标签 */
.quick-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-tag.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3B82F6;
}

.filter-tag text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.tag-dot.blue { background: #3B82F6; }
.tag-dot.orange { background: #F59E0B; }
.tag-dot.green { background: #10B981; }
.tag-dot.red { background: #EF4444; }
.tag-dot.gray { background: #6B7280; }

.tag-count {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.1);
  color: #6B7280;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

/* 高级筛选 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.advanced-filters {
  background: rgba(249, 250, 251, 0.8);
  border-radius: 16px;
  padding: 20px;
  margin-top: 16px;
  animation: fade-in 0.3s ease;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group.full-width {
  grid-column: 1 / -1;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 14px;
  color: #4B5563;
  font-weight: 500;
}

.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 10px;
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #1F2937;
  cursor: pointer;
  transition: all 0.3s ease;
}

.picker-display:active {
  background: rgba(255, 255, 255, 0.9);
}

.amount-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.amount-input-wrapper {
  flex: 1;
}

.amount-input {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #1F2937;
}

.range-separator {
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.reset {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.filter-btn.reset:active {
  background: #E5E7EB;
}

.filter-btn.apply {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.filter-btn.apply:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

/* 订单列表区域 */
.orders-card {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.list-title-section {
  flex: 1;
}

.list-title {
  font-size: 16px;
  font-weight: 500;
  color: #4B5563;
}

.list-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-mode-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 2px;
}

.mode-btn {
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.refresh-btn {
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:active {
  background: rgba(59, 130, 246, 0.2);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #6B7280;
}

/* 订单列表 */
.orders-list {
  max-height: 70vh;
  margin-bottom: 20px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #9CA3AF;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #4B5563;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 20px;
  line-height: 1.5;
}

.empty-action {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.empty-action:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

/* 订单卡片 */
.order-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 12px;
  margin-bottom: 10px;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.order-card:active {
  transform: scale(0.98);
}

.order-card.selected {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.order-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.order-id-section {
  flex: 1;
}

.order-id {
  font-size: 16px;
  font-weight: 500;
  color: #1F2937;
  margin-bottom: 4px;
}

.order-time {
  font-size: 13px;
  color: #6B7280;
}

.order-status-section {
  flex-shrink: 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.status-badge.unfinished {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.status-badge.refunded {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.pending { background: #F59E0B; }
.status-dot.completed { background: #10B981; }
.status-dot.unfinished { background: #EF4444; }
.status-dot.refunded { background: #6B7280; }

/* 订单内容 */
.order-content {
  margin-bottom: 8px;
}

.order-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

/* 移动端订单信息网格优化 */
@media (max-width: 768px) {
  .order-info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  flex-shrink: 0;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 2px;
}

.info-value {
  display: block;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-highlight {
  color: #3B82F6;
  font-weight: 600;
}

.price-item .info-value {
  color: #3B82F6;
  font-weight: 600;
}

/* 时间信息 */
.time-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  margin-bottom: 8px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
}

.time-separator {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.separator-line {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #D1D5DB, transparent);
}

/* 订单标签 */
.order-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.overnight-tag {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

/* 订单操作按钮 */
.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.edit-btn {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.confirm-btn {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.action-btn:active {
  transform: scale(0.95);
}

/* 加载更多和分页 */
.load-more, .no-more-data {
  text-align: center;
  padding: 20px;
  color: #6B7280;
  font-size: 14px;
}

.pagination-container {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):active {
  background: rgba(59, 130, 246, 0.1);
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number.active {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.page-number.ellipsis {
  cursor: default;
  color: #9CA3AF;
}

.page-number:not(.active):not(.ellipsis):hover {
  background: rgba(59, 130, 246, 0.1);
}

.page-info {
  text-align: center;
  font-size: 12px;
  color: #6B7280;
}

/* 弹窗样式 */
.edit-modal, .detail-modal {
  width: 90vw;
  max-width: 500px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(249, 250, 251, 0.8);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(107, 114, 128, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 15;
}

.close-btn:active {
  background: rgba(107, 114, 128, 0.2);
}

.modal-content {
  max-height: 60vh;
  padding: 20px;
}

/* 编辑表单样式 */
.edit-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #EF4444;
  font-size: 14px;
  margin-left: 4px;
}

.info-display {
  background: rgba(249, 250, 251, 0.8);
  border-radius: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.info-row .value {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
}

/* 状态选择器 */
.status-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.status-option.selected {
  border-color: #3B82F6;
  background: rgba(59, 130, 246, 0.05);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.pending { background: #F59E0B; }
.status-indicator.completed { background: #10B981; }
.status-indicator.unfinished { background: #EF4444; }
.status-indicator.refunded { background: #6B7280; }

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 价格编辑器 */
.price-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.price-input-container {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 0 10px;
  transition: all 0.3s ease;
}

.price-input-container:focus-within {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.currency {
  font-size: 16px;
  font-weight: 600;
  color: #6B7280;
  margin-right: 8px;
}

.price-input {
  flex: 1;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
}

.price-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.price-suggestion {
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.price-suggestion:active {
  background: rgba(59, 130, 246, 0.2);
}

/* 时间编辑器 */
.time-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.time-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-picker:active {
  background: rgba(255, 255, 255, 0.9);
}

.duration-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 8px;
  font-size: 14px;
  color: #10B981;
  font-weight: 500;
}

/* 原因输入框 */
.reason-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  resize: vertical;
  transition: all 0.3s ease;
}

.reason-textarea:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

/* 错误提示 */
.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #EF4444;
  font-size: 14px;
}

/* 弹窗底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(249, 250, 251, 0.8);
  position: relative;
  z-index: 10;
}

.cancel-btn {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.cancel-btn:active {
  background: #E5E7EB;
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.confirm-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 详情弹窗样式 */
.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background: rgba(249, 250, 251, 0.8);
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #374151;
  font-weight: 600;
}

.detail-value.amount {
  color: #3B82F6;
}

.status-tag {
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.status-tag.completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.status-tag.unfinished {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.status-tag.refunded {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
}

/* 详情弹窗底部按钮 */
.modal-footer .action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-footer .action-btn.primary {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-footer .action-btn:not(.primary) {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.modal-footer .action-btn:active {
  transform: translateY(1px);
}

/* 动画效果 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .container {
    background: linear-gradient(135deg, #111827 0%, #1F2937 100%);
  }
  
  .glass-card {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .order-card {
    background: rgba(31, 41, 55, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .search-title, .list-title {
    color: #F3F4F6;
  }
  
  .filter-toggle text {
    color: #60A5FA;
  }
  
  .filter-toggle {
    background: rgba(96, 165, 250, 0.2);
  }
  
  .search-input-container, .picker-display, .amount-input, .time-picker, .reason-textarea, .price-input-container {
    background-color: rgba(31, 41, 55, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
    color: #F3F4F6;
  }
  
  .filter-btn.reset, .cancel-btn {
    background: rgba(31, 41, 55, 0.7);
    color: #D1D5DB;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .filter-btn.reset:active, .cancel-btn:active {
    background: rgba(31, 41, 55, 0.9);
  }
  
  .advanced-filters, .info-display, .detail-section {
    background: rgba(31, 41, 55, 0.5);
  }
  
  .order-id, .info-value, .detail-value {
    color: #F3F4F6;
  }
  
  .order-time, .info-label, .detail-label {
    color: #9CA3AF;
  }
  
  .modal-header, .modal-footer {
    background: rgba(31, 41, 55, 0.8);
  }
  
  .edit-modal, .detail-modal {
    background: rgba(31, 41, 55, 0.95);
  }
  
  .modal-title, .section-header, .section-title {
    color: #F3F4F6;
  }
  
  .close-btn {
    background: rgba(107, 114, 128, 0.2);
  }
  
  .close-btn:active {
    background: rgba(107, 114, 128, 0.3);
  }
  
  .status-option {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .status-option.selected {
    background: rgba(59, 130, 246, 0.1);
  }
  
  .empty-state {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .empty-title {
    color: #D1D5DB;
  }
  
  .time-section {
    background: rgba(255, 255, 255, 0.03);
  }
}

/* 移动端优化 - 针对手机模式的紧凑布局 */
@media (max-width: 768px) {
  .container {
    padding: 8px;
  }
  
  .glass-card {
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 16px;
  }
  
  .header-card {
    padding: 16px 12px;
    margin-bottom: 16px;
  }
  
  .header-title {
    font-size: 20px;
    margin-bottom: 4px;
  }
  
  .header-subtitle {
    font-size: 12px;
  }
  
  .stats-container {
    padding: 2px;
  }
  
  .stats-bar {
    padding: 8px 6px;
    flex-direction: column;
    gap: 4px;
  }
  
  .stat-item {
    width: 100%;
    padding: 8px 6px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat-number {
    font-size: 18px;
    margin-bottom: 0;
  }
  
  .stat-label {
    font-size: 10px;
  }
  
  .stat-divider {
    display: none;
  }
  
  .quick-actions {
    padding: 8px;
    gap: 4px;
  }
  
  .quick-action-item {
    padding: 8px 6px;
    min-width: 60px;
  }
  
  .quick-action-item text {
    font-size: 10px;
    margin-top: 4px;
  }
  
  .search-card, .orders-card {
    padding: 12px;
  }
  
  .search-title {
    font-size: 16px;
  }
  
  .search-input-wrapper {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .search-btn {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }
  
  .quick-filters {
    gap: 6px;
  }
  
  .filter-tag {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .filter-tag text {
    font-size: 12px;
  }
  
  .tag-count {
    font-size: 10px;
    padding: 1px 4px;
  }
  
  .advanced-filters {
    padding: 12px;
    margin-top: 12px;
  }
  
    .filter-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .filter-label {
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .picker-display, .amount-input {
      height: 36px;
      font-size: 13px;
      padding: 0 8px;
    }
    
    .amount-range {
      gap: 8px;
    }
    
    .range-separator {
      font-size: 12px;
    }
    
    .filter-actions {
      flex-direction: column;
      gap: 8px;
    }
    
    .filter-btn {
      width: 100%;
      justify-content: center;
      padding: 8px 12px;
      font-size: 13px;
    }
    
    .list-header {
      margin-bottom: 8px;
    }
    
    .list-title {
      font-size: 14px;
    }
    
    .list-subtitle {
      font-size: 11px;
    }
    
    .view-mode-toggle {
      display: none;
    }
    
    .refresh-btn {
      font-size: 11px;
      padding: 3px 6px;
    }
    
    .order-card {
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 10px;
    }
    
    .order-id {
      font-size: 14px;
      margin-bottom: 2px;
    }
    
    .order-time {
      font-size: 11px;
    }
    
    .status-badge {
      padding: 1px 6px;
      font-size: 10px;
    }
    
    .order-info-grid {
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .info-item {
      gap: 6px;
    }
    
    .info-label {
      font-size: 10px;
      margin-bottom: 1px;
    }
    
    .info-value {
      font-size: 12px;
    }
    
    .time-section {
      padding: 6px;
      gap: 8px;
      margin-bottom: 6px;
    }
    
    .time-item {
      font-size: 11px;
      gap: 2px;
    }
    
    .order-tags {
      gap: 4px;
      margin-bottom: 6px;
    }
    
    .tag {
      padding: 2px 6px;
      font-size: 9px;
    }
    
    .order-actions {
      justify-content: center;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    
    .action-btn {
      font-size: 10px;
      padding: 3px 6px;
      margin-left: 0;
    }
    
    .pagination {
      flex-wrap: wrap;
      gap: 4px;
    }
    
    .page-btn, .page-number {
      width: 28px;
      height: 28px;
      font-size: 12px;
      min-width: 28px;
    }
    
    .page-info {
      font-size: 11px;
    }
    
    .edit-modal, .detail-modal {
      width: 95vw;
      max-height: 85vh;
      border-radius: 16px;
    }
    
    .modal-header, .modal-footer {
      padding: 12px;
    }
    
    .modal-title {
      font-size: 16px;
    }
    
    .close-btn {
      width: 28px;
      height: 28px;
    }
    
    .modal-content {
      padding: 12px;
      max-height: calc(85vh - 120px);
      overflow-y: auto;
      padding-bottom: 20px;
    }
    
    .edit-section {
      margin-bottom: 16px;
    }
    
    .section-header {
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .info-display, .detail-section {
      padding: 12px;
      border-radius: 10px;
    }
    
    .info-row {
      margin-bottom: 6px;
    }
    
    .info-row .label, .detail-label {
      font-size: 11px;
    }
    
    .info-row .value, .detail-value {
      font-size: 12px;
    }
    
    .status-selector {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .status-option {
      padding: 10px;
      border-radius: 10px;
    }
    
    .price-editor, .time-editor {
      gap: 12px;
    }
    
    .price-input-container, .time-picker {
      height: 36px;
      padding: 0 8px;
    }
    
    .price-input {
      height: 36px;
      font-size: 14px;
    }
    
    .price-suggestions {
      gap: 6px;
    }
    
    .price-suggestion {
      padding: 3px 6px;
      font-size: 11px;
    }
    
    .time-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    
    .time-label {
      font-size: 12px;
    }
    
    .time-picker {
      width: 100%;
      justify-content: space-between;
    }
    
    .duration-display {
      padding: 6px 10px;
      font-size: 12px;
    }
    
    .reason-textarea {
      min-height: 60px;
      padding: 10px;
      font-size: 13px;
    }
    
    .char-count {
      font-size: 11px;
    }
    
    .error-message {
      padding: 10px;
      font-size: 12px;
    }
    
    .modal-footer {
      flex-direction: column;
      gap: 8px;
      padding: 16px 12px;
      position: sticky;
      bottom: 0;
      background: rgba(249, 250, 251, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      z-index: 20;
    }
    
    .cancel-btn, .confirm-btn {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .detail-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    
    .section-title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .status-tag {
      padding: 3px 6px;
      font-size: 10px;
    }
    
    .modal-footer .action-btn {
      padding: 8px 16px;
      font-size: 12px;
    }
    
    .empty-state {
      padding: 16px;
    }
    
    .empty-icon {
      margin-bottom: 12px;
    }
    
    .empty-title {
      font-size: 14px;
      margin-bottom: 6px;
    }
    
    .empty-subtitle {
      font-size: 12px;
      margin-bottom: 16px;
    }
    
    .empty-action {
      padding: 10px;
      font-size: 14px;
    }
    
    .loading-container {
      padding: 30px 0;
    }
    
    .loading-spinner {
      width: 28px;
      height: 28px;
      border-width: 2px;
    }
    
    .loading-text {
      margin-top: 10px;
      font-size: 12px;
    }
    
    .load-more, .no-more-data {
      padding: 16px;
      font-size: 12px;
    }
    
    .pagination-container {
      padding-top: 16px;
    }
  }
  
  /* 超小屏幕优化（小于400px） */
  @media (max-width: 400px) {
    .container {
      padding: 6px;
    }
    
    .glass-card {
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 12px;
    }
    
    .header-card {
      padding: 12px 10px;
      margin-bottom: 12px;
    }
    
    .header-title {
      font-size: 18px;
    }
    
    .stats-bar {
      padding: 6px 4px;
    }
    
    .stat-item {
      padding: 4px;
    }
    
    .stat-number {
      font-size: 16px;
    }
    
    .stat-label {
      font-size: 9px;
    }
    
    .quick-action-item {
      padding: 6px 4px;
      min-width: 50px;
    }
    
    .quick-action-item text {
      font-size: 9px;
    }
    
    .search-card, .orders-card {
      padding: 10px;
    }
    
    .search-title {
      font-size: 14px;
    }
    
    .search-input-container {
      height: 32px;
      font-size: 12px;
    }
    
    .search-btn {
      padding: 8px;
      font-size: 12px;
    }
    
    .filter-tag {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    .advanced-filters {
      padding: 10px;
    }
    
    .picker-display, .amount-input {
      height: 32px;
      font-size: 12px;
    }
    
    .filter-btn {
      padding: 6px 10px;
      font-size: 12px;
    }
    
    .order-card {
      padding: 8px;
      margin-bottom: 6px;
    }
    
    .order-id {
      font-size: 13px;
    }
    
    .order-time {
      font-size: 10px;
    }
    
    .status-badge {
      font-size: 9px;
    }
    
    .info-label {
      font-size: 9px;
    }
    
    .info-value {
      font-size: 11px;
    }
    
    .time-item {
      font-size: 10px;
    }
    
    .action-btn {
      font-size: 9px;
      padding: 2px 4px;
    }
    
    .edit-modal, .detail-modal {
      width: 98vw;
      max-height: 90vh;
    }
    
    .modal-header, .modal-footer {
      padding: 10px;
    }
    
    .modal-title {
      font-size: 14px;
    }
    
    .modal-content {
      padding: 10px;
      max-height: 70vh;
    }
    
    .section-header {
      font-size: 13px;
    }
    
    .price-input-container, .time-picker {
      height: 32px;
    }
    
    .reason-textarea {
      min-height: 50px;
      font-size: 12px;
    }
    
    .cancel-btn, .confirm-btn {
      padding: 8px;
      font-size: 13px;
    }
  }
  
  /* 横屏模式优化 */
  @media (max-width: 768px) and (orientation: landscape) {
    .stats-bar {
      flex-direction: row;
      flex-wrap: nowrap;
    }
    
    .stat-item {
      flex: 1;
      min-width: auto;
    }
    
    .stat-divider {
      display: block;
      width: 1px;
      height: 30px;
      margin: 0 6px;
    }
    
    .edit-modal, .detail-modal {
      max-height: 95vh;
    }
    
    .modal-content {
      max-height: 75vh;
    }
  }
  
  /* 触摸设备优化 */
  @media (hover: none) and (pointer: coarse) {
    .order-card:hover {
      transform: none;
      box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
    }
    
    .page-number:not(.active):not(.ellipsis):hover {
      background: transparent;
    }
    
    /* 增大触摸目标 */
    .action-btn, .filter-tag, .quick-action-item {
      min-height: 44px;
      min-width: 44px;
    }
    
    .page-btn, .page-number {
      min-height: 44px;
      min-width: 44px;
    }
    
    .close-btn {
      min-height: 44px;
      min-width: 44px;
    }
  }
  </style>
