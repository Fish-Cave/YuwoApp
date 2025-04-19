<template>
  <view class="container">
    <!-- 头部信息栏 -->
    <view class="header-card glass-card">
      <view class="header-title">订单管理中心</view>
      <view class="header-subtitle">管理订单状态、价格和详细信息</view>
      
      <!-- 订单统计信息 -->
      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-value">{{ orderStats.total || 0 }}</text>
          <text class="stat-label">总订单</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ orderStats.pending || 0 }}</text>
          <text class="stat-label">待确认</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ orderStats.completed || 0 }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ formatAmount(orderStats.totalAmount || 0) }}</text>
          <text class="stat-label">总金额</text>
        </view>
      </view>
    </view>
    
    <!-- 搜索与筛选区域 -->
    <view class="search-card glass-card">
      <view class="search-header">
        <view class="search-title">订单搜索与筛选</view>
        <view class="toggle-filter" @click="toggleAdvancedFilters">
          {{ showAdvancedFilters ? '隐藏高级筛选' : '显示高级筛选' }}
        </view>
      </view>
      
      <!-- 基础搜索 -->
      <view class="basic-search">
        <view class="search-input-container">
          <uni-icons type="search" size="18" color="#6b7280"></uni-icons>
          <input 
            class="search-input" 
            v-model="searchForm.keyword" 
            placeholder="搜索订单ID、用户ID或机台" 
            @confirm="searchOrders"
          />
          <view v-if="searchForm.keyword" class="clear-button" @click="clearSearch">
            <uni-icons type="clear" size="14" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <button class="search-button" @click="searchOrders">搜索</button>
      </view>
      
      <!-- 高级筛选选项 -->
      <view v-if="showAdvancedFilters" class="advanced-filters">
        <view class="filter-row">
          <view class="filter-group">
            <text class="filter-label">订单状态</text>
            <picker 
              @change="onStatusFilterChange" 
              :value="statusFilterIndex" 
              :range="statusFilterOptions">
              <view class="picker-input">
                {{ statusFilterOptions[statusFilterIndex] }}
              </view>
            </picker>
          </view>
          
          <view class="filter-group">
            <text class="filter-label">时间范围</text>
            <picker 
              @change="onDateRangeChange" 
              :value="dateRangeIndex" 
              :range="dateRangeOptions">
              <view class="picker-input">
                {{ dateRangeOptions[dateRangeIndex] }}
              </view>
            </picker>
          </view>
        </view>
        
        <view class="filter-row">
          <view class="filter-group">
            <text class="filter-label">金额范围</text>
            <view class="range-inputs">
              <input 
                type="digit" 
                v-model="searchForm.minAmount" 
                placeholder="最小金额" 
                class="range-input"
              />
              <text class="range-separator">-</text>
              <input 
                type="digit" 
                v-model="searchForm.maxAmount" 
                placeholder="最大金额" 
                class="range-input"
              />
            </view>
          </view>
          
          <view class="filter-group">
            <text class="filter-label">排序方式</text>
            <picker 
              @change="onSortChange" 
              :value="sortIndex" 
              :range="sortOptions">
              <view class="picker-input">
                {{ sortOptions[sortIndex] }}
              </view>
            </picker>
          </view>
        </view>
        
        <view class="filter-actions">
          <button class="reset-button" @click="resetFilters">重置筛选</button>
          <button class="apply-button" @click="applyFilters">应用筛选</button>
        </view>
      </view>
    </view>
    
    <!-- 订单列表 -->
    <view class="orders-card glass-card">
      <view class="card-header">
        <text class="card-title">订单列表</text>
        <button class="refresh-button" @click="loadOrders">刷新</button>
      </view>
      
      <!-- 订单列表内容 -->
      <scroll-view class="orders-list" scroll-y="true">
        <view v-if="orders.length === 0" class="empty-list">
          <uni-icons type="info" size="32" color="#d1d5db"></uni-icons>
          <text>暂无符合条件的订单记录</text>
        </view>
        
        <view 
          v-for="(order, index) in orders" 
          :key="order._id" 
          class="order-item glass-item"
          :class="{'selected-order': selectedOrderId === order._id}"
          @click="selectOrder(order._id)"
        >
          <view class="order-header">
            <view class="order-id">订单 #{{ order._id.substring(0, 8) }}</view>
            <view :class="['order-status', getStatusClass(order.status)]">
              {{ getStatusText(order.status) }}
            </view>
          </view>
          
          <view class="order-info-row">
            <view class="order-info-item">
              <text class="info-label">用户:</text>
              <text class="info-value">{{ order.username || '未知用户' }}</text>
            </view>
            <view class="order-info-item">
              <text class="info-label">机台:</text>
              <text class="info-value">{{ order.machineName || '未知机台' }}</text>
            </view>
          </view>
          
          <view class="order-info-row">
            <view class="order-info-item">
              <text class="info-label">时间:</text>
              <text class="info-value">{{ formatDate(order.starttime) }} {{ formatTime(order.starttime) }} - {{ formatTime(order.endtime) }}</text>
            </view>
            <view class="order-info-item">
              <text class="info-label">金额:</text>
              <text class="info-value price-value">{{ formatAmount(order.total_fee) }}</text>
            </view>
          </view>
          
          <view class="order-actions">
            <button class="action-button" @click.stop="viewOrderDetail(order._id)">查看</button>
            <button class="action-button primary" @click.stop="editOrder(order)">编辑</button>
          </view>
        </view>
      </scroll-view>
      
      <!-- 分页控件 -->
      <view class="pagination">
        <button 
          class="page-button" 
          :disabled="currentPage <= 1"
          @click="goToPreviousPage"
        >
          <uni-icons type="left" size="14" :color="currentPage <= 1 ? '#d1d5db' : '#3b82f6'"></uni-icons>
        </button>
        
        <text class="page-info">{{ currentPage }} / {{ totalPages || 1 }}</text>
        
        <button 
          class="page-button" 
          :disabled="currentPage >= totalPages"
          @click="goToNextPage"
        >
          <uni-icons type="right" size="14" :color="currentPage >= totalPages ? '#d1d5db' : '#3b82f6'"></uni-icons>
        </button>
      </view>
    </view>
    
    <!-- 订单编辑弹窗（自定义弹窗而非uni-popup-dialog，解决取消按钮问题）-->
    <uni-popup ref="orderEditPopup" type="center">
      <view class="edit-popup">
        <view class="edit-popup-header">
          <text class="edit-popup-title">编辑订单 #{{ currentEditingOrder._id ? currentEditingOrder._id.substring(0, 8) : '' }}</text>
          <view class="close-button" @click="cancelEditOrder">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <scroll-view class="edit-popup-content" scroll-y="true">
          <!-- 状态修改 -->
          <view class="edit-section">
            <view class="edit-section-title">订单状态</view>
            <view class="status-options">
              <view 
                v-for="(status, idx) in editStatusOptions" 
                :key="idx"
                :class="['status-option', {'status-selected': editStatusIndex === idx}]"
                @click="selectStatus(idx)"
              >
                <view :class="['status-dot', getStatusDotClass(idx)]"></view>
                <text>{{ status }}</text>
              </view>
            </view>
          </view>
          
          <!-- 价格修改 -->
          <view class="edit-section">
            <view class="edit-section-title">订单金额</view>
            <view class="edit-price-input">
              <text class="currency-symbol">¥</text>
              <input 
                type="digit" 
                v-model="priceInput" 
                placeholder="输入新金额" 
                class="price-edit-input"
              />
            </view>
            <text class="edit-helper-text">金额将以元为单位，最终保存为分</text>
          </view>
          
          <!-- 时间修改 -->
          <view class="edit-section">
            <view class="edit-section-title">时间设置</view>
            <view class="time-edit-row">
              <text class="time-label">开始时间:</text>
              <picker 
                mode="time" 
                :value="formatTimeForPicker(currentEditingOrder.starttime)"
                @change="onStartTimeChange">
                <view class="time-picker-input">
                  {{ formatTime(currentEditingOrder.starttime) }}
                </view>
              </picker>
            </view>
            
            <view class="time-edit-row">
              <text class="time-label">结束时间:</text>
              <picker 
                mode="time" 
                :value="formatTimeForPicker(currentEditingOrder.endtime)"
                @change="onEndTimeChange">
                <view class="time-picker-input">
                  {{ formatTime(currentEditingOrder.endtime) }}
                </view>
              </picker>
            </view>
            
            <view class="time-duration">
              <text>使用时长: {{ calculateDuration(currentEditingOrder.starttime, currentEditingOrder.endtime) }}</text>
            </view>
          </view>
          
          <!-- 修改原因 -->
          <view class="edit-section">
            <view class="edit-section-title">修改原因 <text class="required-mark">*</text></view>
            <textarea 
              v-model="editReason" 
              placeholder="请输入修改原因（必填）" 
              class="edit-textarea"
            ></textarea>
          </view>
          
          <view v-if="editError" class="edit-error">
            <uni-icons type="error" size="14" color="#ef4444"></uni-icons>
            <text>{{ editError }}</text>
          </view>
        </scroll-view>
        
        <view class="edit-popup-actions">
          <button class="edit-cancel-button" @click="cancelEditOrder">取消</button>
          <button class="edit-confirm-button" @click="confirmEditOrder">保存修改</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 订单详情弹窗 -->
    <uni-popup ref="orderDetailPopup" type="center">
      <view class="detail-popup">
        <view class="detail-popup-header">
          <text class="detail-popup-title">订单详情 #{{ currentDetailOrder._id ? currentDetailOrder._id.substring(0, 8) : '' }}</text>
          <view class="close-button" @click="closeOrderDetail">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <scroll-view class="detail-popup-content" scroll-y="true">
          <view class="detail-section">
            <view class="detail-header">基本信息</view>
            <view class="detail-row">
              <text class="detail-label">订单ID:</text>
              <text class="detail-value">{{ currentDetailOrder._id }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">状态:</text>
              <view :class="['detail-status-tag', getStatusClass(currentDetailOrder.status)]">
                {{ getStatusText(currentDetailOrder.status) }}
              </view>
            </view>
            <view class="detail-row">
              <text class="detail-label">创建时间:</text>
              <text class="detail-value">{{ formatDateTime(currentDetailOrder.create_date) }}</text>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="detail-header">用户信息</view>
            <view class="detail-row">
              <text class="detail-label">用户ID:</text>
              <text class="detail-value">{{ currentDetailOrder.user_id }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">用户名:</text>
              <text class="detail-value">{{ currentDetailOrder.username || '未知用户' }}</text>
            </view>
            <button class="detail-button" @click="viewUserOrders">查看该用户所有订单</button>
          </view>
          
          <view class="detail-section">
            <view class="detail-header">预约信息</view>
            <view class="detail-row">
              <text class="detail-label">预约ID:</text>
              <text class="detail-value">{{ currentDetailOrder.reservation_id }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">机台:</text>
              <text class="detail-value">{{ currentDetailOrder.machineName }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">过夜预约:</text>
              <text class="detail-value">{{ currentDetailOrder.isOvernight ? '是' : '否' }}</text>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="detail-header">时间与费用</view>
            <view class="detail-row">
              <text class="detail-label">开始时间:</text>
              <text class="detail-value">{{ formatDateTime(currentDetailOrder.starttime) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">结束时间:</text>
              <text class="detail-value">{{ formatDateTime(currentDetailOrder.endtime) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">使用时长:</text>
              <text class="detail-value">{{ calculateDuration(currentDetailOrder.starttime, currentDetailOrder.endtime) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">费用:</text>
              <text class="detail-value price-highlight">{{ formatAmount(currentDetailOrder.total_fee) }}</text>
            </view>
          </view>
          
          <view v-if="orderEditLogs && orderEditLogs.length > 0" class="detail-section">
            <view class="detail-header">修改记录</view>
            <view v-for="(log, index) in orderEditLogs" :key="index" class="edit-log">
              <view class="log-header">
                <text class="log-time">{{ formatDateTime(log.editTime) }}</text>
                <text class="log-operator">操作人: {{ log.operatorName }}</text>
              </view>
              <view class="log-content">
                <text class="log-title">{{ log.editType }}</text>
                <view v-if="log.changes" class="log-changes">
                  <view v-for="(change, field) in log.changes" :key="field" class="change-item">
                    <text class="change-field">{{ getDisplayField(field) }}:</text>
                    <text class="change-from">{{ change.from }}</text>
                    <uni-icons type="arrow-right" size="12" color="#6b7280"></uni-icons>
                    <text class="change-to">{{ change.to }}</text>
                  </view>
                </view>
                <view class="log-reason">
                  <text class="reason-label">原因:</text>
                  <text class="reason-content">{{ log.reason }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
        
        <view class="detail-popup-actions">
          <button class="detail-action-button" @click="closeOrderDetail">关闭</button>
          <button class="detail-action-button primary" @click="editOrderFromDetail">编辑订单</button>
        </view>
      </view>
    </uni-popup>

    <!-- 确认操作弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog
        type="warn"
        :title="confirmDialogTitle"
        :content="confirmDialogContent"
        :before-close="true"
        @confirm="confirmDialogConfirm"
        @close="confirmDialogClose"
        confirmText="确认"
        cancelText="取消"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 订单统计数据
      orderStats: {
        total: 0,
        pending: 0,
        completed: 0,
        totalAmount: 0
      },
      
      // 搜索和筛选
      showAdvancedFilters: false,
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
      dateRangeOptions: ['全部时间', '今天', '昨天', '最近7天', '最近30天', '本月', '上月', '自定义'],
      sortIndex: 0,
      sortOptions: ['创建时间降序', '创建时间升序', '金额降序', '金额升序', '使用时长降序', '使用时长升序'],
      
      // 订单列表
      orders: [],
      selectedOrderId: null,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      
      // 订单编辑
      currentEditingOrder: {},
      editStatusIndex: 0,
      editStatusOptions: ['待确认', '已完成', '未完成', '已退款'],
      editReason: '',
      editError: '',
      priceInput: '', // 用于金额输入，避免直接修改原始数据的格式问题
      
      // 订单详情
      currentDetailOrder: {},
      orderEditLogs: [],
      
      // 确认对话框
      confirmDialogTitle: '',
      confirmDialogContent: '',
      confirmDialogCallback: null,
    };
  },
  
  mounted() {
    this.loadOrders();
    this.loadOrderStats();
  },
  
  methods: {
    // 订单加载与刷新
    async loadOrders() {
      try {
        uni.showLoading({ title: '加载中...' });
        
        // 构建查询参数
        const params = {
          pageSize: this.pageSize,
          pageNumber: this.currentPage,
          sortField: this.searchForm.sortField,
          sortOrder: this.searchForm.sortOrder
        };
        
        // 添加关键字
        if (this.searchForm.keyword) {
          params.keyword = this.searchForm.keyword;
        }
        
        // 添加状态筛选
        if (this.searchForm.status !== null) {
          params.status = this.searchForm.status;
        }
        
        // 添加时间筛选
        if (this.searchForm.startDate && this.searchForm.endDate) {
          params.startDate = this.searchForm.startDate;
          params.endDate = this.searchForm.endDate;
        }
        
        // 添加金额筛选
        if (this.searchForm.minAmount) {
          params.minAmount = parseFloat(this.searchForm.minAmount) * 100; // 转为分
        }
        
        if (this.searchForm.maxAmount) {
          params.maxAmount = parseFloat(this.searchForm.maxAmount) * 100; // 转为分
        }
        
        // 调用云函数获取订单列表
        // 在实际应用中替换为您的云函数名称
        const todo = uniCloud.importObject('todo');
        const result = await todo.Get_FilteredOrders(params);
        
        if (result && result.code === 0) {
          this.orders = result.data;
          this.totalPages = result.pagination.totalPages;
        } else {
          uni.showToast({
            title: result.errMsg || '加载订单失败',
            icon: 'none'
          });
        }
        
        uni.hideLoading();
      } catch (e) {
        uni.hideLoading();
        uni.showToast({
          title: '加载订单列表失败',
          icon: 'none'
        });
        console.error('加载订单列表失败:', e);
      }
    },
    
    // 加载订单统计数据
    async loadOrderStats() {
      try {
        // 调用云函数获取订单统计
        const todo = uniCloud.importObject('todo');
        const result = await todo.Get_OrdersCount();
        
        if (result && result.code === 0) {
          this.orderStats = result.data;
        }
      } catch (e) {
        console.error('加载订单统计失败:', e);
      }
    },
    
    // 搜索与筛选
    toggleAdvancedFilters() {
      this.showAdvancedFilters = !this.showAdvancedFilters;
    },
    
    clearSearch() {
      this.searchForm.keyword = '';
      this.searchOrders();
    },
    
    searchOrders() {
      this.currentPage = 1; // 重置到第一页
      this.loadOrders();
    },
    
    onStatusFilterChange(e) {
      this.statusFilterIndex = e.detail.value;
      if (this.statusFilterIndex > 0) {
        this.searchForm.status = this.statusFilterIndex - 1; // 对应状态值
      } else {
        this.searchForm.status = null; // 全部状态
      }
    },
    
    onDateRangeChange(e) {
      this.dateRangeIndex = e.detail.value;
      const now = new Date();
      
      // 重置日期
      this.searchForm.startDate = null;
      this.searchForm.endDate = null;
      
      // 根据选择设置日期范围
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
        case 7: // 自定义 - 可以打开日期选择器
          // 这里可以实现自定义日期选择的逻辑
          break;
      }
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
    
    onSortChange(e) {
      this.sortIndex = e.detail.value;
      
      // 设置排序字段和顺序
      switch (parseInt(this.sortIndex)) {
        case 0:
          this.searchForm.sortField = 'create_date';
          this.searchForm.sortOrder = 'desc';
          break;
        case 1:
          this.searchForm.sortField = 'create_date';
          this.searchForm.sortOrder = 'asc';
          break;
        case 2:
          this.searchForm.sortField = 'total_fee';
          this.searchForm.sortOrder = 'desc';
          break;
        case 3:
          this.searchForm.sortField = 'total_fee';
          this.searchForm.sortOrder = 'asc';
          break;
        case 4:
          this.searchForm.sortField = 'duration';
          this.searchForm.sortOrder = 'desc';
          break;
        case 5:
          this.searchForm.sortField = 'duration';
          this.searchForm.sortOrder = 'asc';
          break;
      }
    },
    
    resetFilters() {
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
    },
    
    applyFilters() {
      this.currentPage = 1; // 重置到第一页
      this.loadOrders();
      this.showAdvancedFilters = false; // 应用后隐藏高级筛选
    },
    
    // 分页控制
    goToPreviousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadOrders();
      }
    },
    
    goToNextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadOrders();
      }
    },
    
    // 订单选择和操作
    selectOrder(orderId) {
      this.selectedOrderId = orderId;
    },
    
    async viewOrderDetail(orderId) {
      try {
        uni.showLoading({ title: '加载中...' });
        
        // 获取订单详情
        // 在实际应用中替换为您的云函数
        const todo = uniCloud.importObject('todo');
        const result = await todo.GetOrderDetail(orderId);
        
        if (result && result.code === 0) {
          this.currentDetailOrder = result.data;
          
          // 获取订单修改日志
          const logsResult = await todo.GetOrderEditLogs(orderId);
          if (logsResult && logsResult.code === 0) {
            this.orderEditLogs = logsResult.data || [];
          } else {
            this.orderEditLogs = [];
          }
          
          uni.hideLoading();
          // 打开详情弹窗
          this.$refs.orderDetailPopup.open();
        } else {
          uni.hideLoading();
          uni.showToast({
            title: '获取订单详情失败',
            icon: 'none'
          });
        }
      } catch (e) {
        uni.hideLoading();
        console.error('加载订单详情失败:', e);
        uni.showToast({
          title: '加载订单详情失败',
          icon: 'none'
        });
      }
    },
    
    closeOrderDetail() {
      this.$refs.orderDetailPopup.close();
    },
    
    // 编辑订单
    editOrder(order) {
      // 复制订单对象，避免直接修改原对象
      this.currentEditingOrder = JSON.parse(JSON.stringify(order));
      
      // 设置状态选择器的初始值
      this.editStatusIndex = order.status || 0;
      
      // 设置价格输入框的值（转换为元）
      this.priceInput = (order.total_fee / 100).toFixed(2);
      
      // 重置编辑原因和错误信息
      this.editReason = '';
      this.editError = '';
      
      // 打开编辑弹窗
      this.$refs.orderEditPopup.open();
    },
    
    editOrderFromDetail() {
      this.closeOrderDetail();
      this.editOrder(this.currentDetailOrder);
    },
    
    // 选择状态
    selectStatus(idx) {
      this.editStatusIndex = idx;
      this.currentEditingOrder.status = idx;
    },
    
    // 获取状态样式
    getStatusDotClass(status) {
      switch (parseInt(status)) {
        case 0: return 'dot-pending';
        case 1: return 'dot-completed';
        case 2: return 'dot-unfinished';
        case 3: return 'dot-refunded';
        default: return '';
      }
    },
    
    onStartTimeChange(e) {
      // 处理时间选择器的值，需要保留日期不变，只修改时间部分
      const currentDate = new Date(this.currentEditingOrder.starttime);
      const selectedTime = e.detail.value.split(':');
      
      currentDate.setHours(selectedTime[0]);
      currentDate.setMinutes(selectedTime[1]);
      
      this.currentEditingOrder.starttime = currentDate.getTime();
    },
    
    onEndTimeChange(e) {
      // 处理时间选择器的值，需要保留日期不变，只修改时间部分
      const currentDate = new Date(this.currentEditingOrder.endtime);
      const selectedTime = e.detail.value.split(':');
      
      currentDate.setHours(selectedTime[0]);
      currentDate.setMinutes(selectedTime[1]);
      
      this.currentEditingOrder.endtime = currentDate.getTime();
    },
    
    async confirmEditOrder() {
      // 验证输入
      if (!this.editReason.trim()) {
        this.editError = '请输入修改原因';
        return;
      }
      
      // 验证金额
      const totalFee = parseFloat(this.priceInput);
      if (isNaN(totalFee) || totalFee < 0) {
        this.editError = '请输入有效的订单金额';
        return;
      }
      
      // 验证时间
      if (this.currentEditingOrder.starttime >= this.currentEditingOrder.endtime) {
        this.editError = '开始时间必须早于结束时间';
        return;
      }
      
      // 如果有较大变化，显示确认对话框
      const originalTotalFee = this.currentEditingOrder.original_total_fee || this.currentEditingOrder.total_fee;
      const feeChangePercent = Math.abs(totalFee * 100 - originalTotalFee) / originalTotalFee * 100;
      
      if (feeChangePercent > 20) { // 金额变化超过20%，显示确认对话框
        this.confirmDialogTitle = '确认金额变更';
        this.confirmDialogContent = `您正在将订单金额从 ${(originalTotalFee / 100).toFixed(2)}元 修改为 ${totalFee.toFixed(2)}元，变化比例超过20%。确定要继续吗？`;
        this.confirmDialogCallback = () => this.saveOrderChanges(totalFee);
        this.$refs.confirmPopup.open();
        return;
      }
      
      // 直接保存变更
      await this.saveOrderChanges(totalFee);
    },
    
    async saveOrderChanges(totalFee) {
      try {
        uni.showLoading({ title: '保存中...' });
        
        // 构建更新数据
        const updateData = {
          orderId: this.currentEditingOrder._id,
          status: this.currentEditingOrder.status,
          totalFee: Math.round(totalFee * 100), // 转为分并四舍五入
          starttime: this.currentEditingOrder.starttime,
          endtime: this.currentEditingOrder.endtime,
          editReason: this.editReason
        };
        
        // 调用云函数更新订单
        // 在实际应用中替换为您的云函数
        const todo = uniCloud.importObject('todo');
        const result = await todo.UpdateOrder(updateData);
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: '订单更新成功',
            icon: 'success'
          });
          
          // 关闭弹窗
          this.$refs.orderEditPopup.close();
          
          // 重新加载订单列表和统计
          this.loadOrders();
          this.loadOrderStats();
        } else {
          this.editError = result.errMsg || '更新失败，请重试';
        }
      } catch (e) {
        uni.hideLoading();
        console.error('更新订单失败:', e);
        this.editError = '系统错误，请重试';
      }
    },
    
    cancelEditOrder() {
      // 关闭弹窗
      this.$refs.orderEditPopup.close();
      
      // 重置编辑状态
      this.currentEditingOrder = {};
      this.editReason = '';
      this.editError = '';
      this.priceInput = '';
    },
    
    // 确认对话框回调
    confirmDialogConfirm() {
      if (this.confirmDialogCallback) {
        this.confirmDialogCallback();
      }
      this.confirmDialogCallback = null;
    },
    
    confirmDialogClose() {
      this.confirmDialogCallback = null;
    },
    
    // 用户相关功能
    viewUserOrders() {
      const userId = this.currentDetailOrder.user_id;
      if (userId) {
        // 关闭当前详情弹窗
        this.closeOrderDetail();
        
        // 设置搜索条件为当前用户的ID
        this.resetFilters();
        this.searchForm.keyword = userId;
        this.searchOrders();
      }
    },
    
    // 工具方法
    formatAmount(amountInCents) {
      if (!amountInCents && amountInCents !== 0) return '¥0.00';
      const amountInYuan = (amountInCents / 100).toFixed(2);
      return `¥${amountInYuan}`;
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
    
    calculateDuration(startTime, endTime) {
      if (!startTime || !endTime) return '--';
      
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMs = end - start;
      
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}小时${minutes}分钟`;
    },
    
    getStatusText(status) {
      switch (parseInt(status)) {
        case 0: return '待确认';
        case 1: return '已完成';
        case 2: return '未完成';
        case 3: return '已退款';
        default: return '未知状态';
      }
    },
    
    getStatusClass(status) {
      switch (parseInt(status)) {
        case 0: return 'status-pending';
        case 1: return 'status-completed';
        case 2: return 'status-unfinished';
        case 3: return 'status-refunded';
        default: return '';
      }
    },
    
    getDisplayField(field) {
      const fieldMap = {
        'status': '状态',
        'totalFee': '金额',
        'startTime': '开始时间',
        'endTime': '结束时间'
      };
      return fieldMap[field] || field;
    }
  }
};
</script>

<style>
/* 全局样式 */
.container {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
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
}

.glass-item {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 12px;
  margin-bottom: 10px;
  transition: transform 0.2s ease;
}

/* 头部样式 */
.header-card {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  padding: 20px 16px;
}

.header-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
}

/* 搜索区域样式 */
.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.toggle-filter {
  font-size: 14px;
  color: #3B82F6;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
}

.basic-search {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.search-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 12px;
}

.search-input {
  flex: 1;
  height: 40px;
  margin-left: 8px;
  border: none;
  background: transparent;
  font-size: 14px;
}

.clear-button {
  padding: 6px;
}

.search-button {
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 20px;
  font-size: 14px;
}

.advanced-filters {
  background: rgba(249, 250, 251, 0.7);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 10px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.filter-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  flex: 1;
}

.filter-label {
  font-size: 14px;
  color: #4B5563;
  margin-bottom: 6px;
  display: block;
}

.picker-input {
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.range-inputs {
  display: flex;
  align-items: center;
}

.range-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.range-separator {
  margin: 0 8px;
  color: #6B7280;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.reset-button {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
}

.apply-button {
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.refresh-button {
  font-size: 14px;
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-radius: 4px;
  border: none;
}

/* 订单列表样式 */
.orders-list {
  max-height: 600px;
  margin-bottom: 16px;
}

.empty-list {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.empty-list text {
  margin-top: 12px;
  font-size: 16px;
}

.order-item {
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.order-item:active,
.selected-order {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-id {
  font-size: 16px;
  font-weight: 500;
  color: #1F2937;
}

.order-status {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.status-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.status-unfinished {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.status-refunded {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
}

.order-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-info-item {
  flex: 1;
  display: flex;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: #6B7280;
  margin-right: 6px;
}

.info-value {
  font-size: 14px;
  color: #374151;
}

.price-value {
  font-weight: 600;
  color: #3B82F6;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 8px;
}

.action-button {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.action-button.primary {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
}

.page-button {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.page-button[disabled] {
  opacity: 0.5;
  background: #F3F4F6;
}

.page-info {
  margin: 0 12px;
  font-size: 14px;
  color: #4B5563;
}

/* 自定义弹窗样式 */
.edit-popup, .detail-popup {
  width: 90%;
  max-width: 600px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.edit-popup-header, .detail-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.edit-popup-title, .detail-popup-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
}

.close-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #F3F4F6;
}

.edit-popup-content, .detail-popup-content {
  flex: 1;
  max-height: 65vh;
  padding: 16px;
  overflow-y: auto;
}

.edit-popup-actions, .detail-popup-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  gap: 10px;
}

.edit-cancel-button, .detail-action-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.edit-confirm-button, .detail-action-button.primary {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  background: #3B82F6;
  color: white;
  border: none;
}

/* 编辑表单样式 */
.edit-section {
  margin-bottom: 20px;
}

.edit-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 10px;
}

.required-mark {
  color: #EF4444;
}

.status-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.status-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
}

.status-option:active {
  transform: scale(0.98);
}

.status-selected {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3B82F6;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot-pending {
  background: #D97706;
}

.dot-completed {
  background: #10B981;
}

.dot-unfinished {
  background: #EF4444;
}

.dot-refunded {
  background: #6B7280;
}

.edit-price-input {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 0 12px;
  height: 44px;
  margin-bottom: 8px;
}

.currency-symbol {
  font-size: 16px;
  color: #4B5563;
  margin-right: 4px;
}

.price-edit-input {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #1F2937;
}

.edit-helper-text {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.time-edit-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.time-label {
  width: 70px;
  font-size: 14px;
  color: #4B5563;
}

.time-picker-input {
  flex: 1;
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
}

.time-duration {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  color: #3B82F6;
  font-size: 14px;
}

.edit-textarea {
  width: 100%;
  height: 80px;
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.edit-error {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
}

/* 详情页样式 */
.detail-section {
  margin-bottom: 24px;
}

.detail-header {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
}

.detail-label {
  width: 80px;
  font-size: 14px;
  color: #6B7280;
}

.detail-value {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.detail-status-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
  display: inline-block;
}

.price-highlight {
  font-weight: 600;
  color: #3B82F6;
}

.detail-button {
  width: 100%;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 8px;
  font-size: 14px;
  margin-top: 8px;
}

.edit-log {
  background: rgba(249, 250, 251, 0.7);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  border-left: 3px solid #3B82F6;
}

.log-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6B7280;
}

.log-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.log-changes {
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  padding: 8px;
}

.change-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  flex-wrap: wrap;
}

.change-field {
  color: #6B7280;
  margin-right: 6px;
  font-weight: 500;
}

.change-from {
  color: #EF4444;
  margin-right: 4px;
  text-decoration: line-through;
  max-width: 100%;
  word-break: break-all;
}

.change-to {
  color: #10B981;
  margin-left: 4px;
  max-width: 100%;
  word-break: break-all;
}

.log-reason {
  font-size: 13px;
  color: #6B7280;
  margin-top: 6px;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px;
  border-radius: 6px;
}

.reason-label {
  color: #6B7280;
  margin-right: 4px;
  font-weight: 500;
}

.reason-content {
  color: #374151;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .container {
    background: linear-gradient(135deg, #111827 0%, #1F2937 100%);
  }
  
  .glass-card {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .glass-item {
    background: rgba(31, 41, 55, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
  }
  
  .search-title,
  .card-title {
    color: #F3F4F6;
  }
  
  .toggle-filter {
    background: rgba(96, 165, 250, 0.2);
  }
  
  .search-input-container {
    background: rgba(17, 24, 39, 0.6);
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .search-input {
    color: #E5E7EB;
  }
  
  .advanced-filters {
    background: rgba(31, 41, 55, 0.7);
  }
  
  .filter-label {
    color: #D1D5DB;
  }
  
  .picker-input,
  .range-input {
    background: rgba(17, 24, 39, 0.6);
    border-color: rgba(75, 85, 99, 0.4);
    color: #E5E7EB;
  }
  
  .reset-button {
    background: rgba(55, 65, 81, 0.7);
    color: #D1D5DB;
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .refresh-button {
    background: rgba(96, 165, 250, 0.2);
  }
  
  .order-id {
    color: #F3F4F6;
  }
  
  .info-label {
    color: #9CA3AF;
  }
  
  .info-value {
    color: #E5E7EB;
  }
  
  .action-button {
    background: rgba(55, 65, 81, 0.7);
    color: #D1D5DB;
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .action-button.primary {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .page-button {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .page-info {
    color: #D1D5DB;
  }
  
  /* 深色模式下的弹窗样式 */
  .edit-popup, .detail-popup {
    background: #1F2937;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .edit-popup-header, .detail-popup-header {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .edit-popup-title, .detail-popup-title {
    color: #F3F4F6;
  }
  
  .close-button {
    background: rgba(75, 85, 99, 0.5);
  }
  
  .edit-popup-actions, .detail-popup-actions {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .edit-cancel-button, .detail-action-button {
    background: rgba(55, 65, 81, 0.7);
    color: #D1D5DB;
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .edit-section-title {
    color: #F3F4F6;
  }
  
  .status-option {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(75, 85, 99, 0.4);
    color: #E5E7EB;
  }
  
  .status-selected {
    background: rgba(59, 130, 246, 0.2);
    border-color: #60A5FA;
  }
  
  .edit-price-input {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(75, 85, 99, 0.4);
  }
  
  .currency-symbol {
    color: #D1D5DB;
  }
  
  .price-edit-input {
    color: #F3F4F6;
  }
  
  .edit-helper-text {
    color: #9CA3AF;
  }
  
  .time-label {
    color: #D1D5DB;
  }
  
  .time-picker-input {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(75, 85, 99, 0.4);
    color: #E5E7EB;
  }
  
  .time-duration {
    background: rgba(59, 130, 246, 0.1);
  }
  
  .edit-textarea {
    background: rgba(31, 41, 55, 0.7);
    border-color: rgba(75, 85, 99, 0.4);
    color: #E5E7EB;
  }
  
  .detail-header {
    color: #F3F4F6;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .detail-label {
    color: #9CA3AF;
  }
  
  .detail-value {
    color: #E5E7EB;
  }
  
  .detail-button {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .edit-log {
    background: rgba(31, 41, 55, 0.4);
    border-color: #60A5FA;
  }
  
  .log-changes {
    background: rgba(31, 41, 55, 0.7);
  }
  
  .log-reason {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .reason-content {
    color: #E5E7EB;
  }
}
</style>