<template>
  <view class="container">
    <!-- 头部信息栏 -->
    <view class="header-card glass-card">
      <view class="header-title">用户管理中心</view>
      <view class="header-subtitle">管理用户账户、权限和会员信息</view>
      
      <!-- 用户统计信息 -->
      <view class="stats-bar">
        <view class="stat-item">
          <text class="stat-value">{{ userStats.total || 0 }}</text>
          <text class="stat-label">总用户</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStats.active || 0 }}</text>
          <text class="stat-label">活跃用户</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStats.vip || 0 }}</text>
          <text class="stat-label">会员用户</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStats.new || 0 }}</text>
          <text class="stat-label">本周新增</text>
        </view>
      </view>
    </view>
    
    <!-- 搜索与筛选区域 -->
    <view class="search-card glass-card">
      <view class="search-header">
        <view class="search-title">用户搜索与筛选</view>
      </view>
      
      <!-- 基础搜索 -->
      <view class="basic-search">
        <view class="search-input-container">
          <uni-icons type="search" size="18" color="#6b7280"></uni-icons>
          <input
            class="search-input"
            v-model="searchForm.keyword"
            placeholder="搜索用户ID、用户名或手机号"
            @confirm="searchUsers"
            @input="onSearchInput"
          />
          <view v-if="searchForm.keyword" class="clear-button" @click="clearSearch">
            <uni-icons type="clear" size="14" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <button class="search-button" @click="searchUsers">搜索</button>
      </view>
      
      <!-- 高级筛选选项 -->
      <view class="advanced-filters">
        <view class="filter-row">
          <view class="filter-group">
            <text class="filter-label">用户类型</text>
            <picker 
              @change="onUserTypeFilterChange" 
              :value="userTypeFilterIndex" 
              :range="userTypeOptions">
              <view class="picker-input">
                {{ userTypeOptions[userTypeFilterIndex] }}
              </view>
            </picker>
          </view>
          
          <view class="filter-group">
            <text class="filter-label">注册时间</text>
            <picker 
              @change="onRegisterTimeFilterChange" 
              :value="registerTimeFilterIndex" 
              :range="timeFilterOptions">
              <view class="picker-input">
                {{ timeFilterOptions[registerTimeFilterIndex] }}
              </view>
            </picker>
          </view>
        </view>
        
        <view class="filter-row">
          <view class="filter-group">
            <text class="filter-label">活跃状态</text>
            <picker 
              @change="onActiveStatusFilterChange" 
              :value="activeStatusFilterIndex" 
              :range="activeStatusOptions">
              <view class="picker-input">
                {{ activeStatusOptions[activeStatusFilterIndex] }}
              </view>
            </picker>
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
      
      <!-- 批量操作工具栏 -->
      <view v-if="selectedUsers.length > 0" class="batch-toolbar">
        <view class="selected-count">已选择 {{ selectedUsers.length }} 位用户</view>
        <view class="batch-actions">
          <button class="batch-action-button" @click="batchSendMessage">发送消息</button>
          <button v-if="hasAdminPermission" class="batch-action-button" @click="batchPromoteToVip">授予会员</button>
          <button v-if="hasAdminPermission" class="batch-action-button danger" @click="batchResetAccount">重置账户</button>
        </view>
      </view>
    </view>
    
    <!-- 用户列表 -->
    <view class="users-card glass-card">
      <view class="card-header">
        <text class="card-title">用户列表</text>
        <button class="refresh-button" @click="loadUsers">刷新</button>
      </view>
      
      <!-- 用户列表内容 -->
      <scroll-view class="users-list" scroll-y="true">
        <view v-if="users.length === 0" class="empty-list">
          <uni-icons type="person" size="32" color="#d1d5db"></uni-icons>
          <text>暂无符合条件的用户</text>
        </view>
        
        <view 
          v-for="(user, index) in users" 
          :key="user._id" 
          class="user-item glass-item"
          :class="{'selected-user': isUserSelected(user._id)}"
        >
          <view class="user-select">
            <checkbox 
              :checked="isUserSelected(user._id)" 
              @click="toggleUserSelection(user._id)"
            />
          </view>
          
          <view class="user-info" @click="viewUserDetail(user)">
            <view class="user-name-row">
              <text class="user-name">{{ user.nickname || user.username || '匿名用户' }}</text>
              <view v-if="isUserVip(user)" class="vip-tag">
                VIP
              </view>
            </view>

            <view class="user-details">
              <view class="user-detail-item">
                <uni-icons type="person" size="14" color="#6b7280"></uni-icons>
                <text>{{ user.role_display || '普通用户' }}</text>
              </view>

              <view class="user-detail-item">
                <uni-icons type="phone" size="14" color="#6b7280"></uni-icons>
                <text>{{ formatPhone(user.mobile) || '未绑定手机' }}</text>
              </view>

              <view class="user-detail-item">
                <uni-icons type="calendar" size="14" color="#6b7280"></uni-icons>
                <text>{{ formatDate(user.register_date) || '未知注册日期' }}</text>
              </view>
            </view>

            <view class="user-activity">
              <view class="activity-item">
                <text class="activity-label">账号状态</text>
                <text class="activity-value" :class="getUserStatusClass(user)">
                  {{ getUserStatusText(user) }}
                </text>
              </view>
              <view class="activity-divider"></view>
              <view class="activity-item">
                <text class="activity-label">最近登录</text>
                <text class="activity-value">{{ formatLastLogin(user.last_login_date) }}</text>
              </view>
            </view>
          </view>
          
          <view class="user-actions">
            <view class="action-buttons-row">
              <button class="action-button" @click="editUser(user)">编辑</button>
              <button class="action-button primary" @click="viewUserDetail(user)">详情</button>
            </view>
            <view class="role-management-buttons" v-if="hasAdminPermission">
              <button
                v-if="canPromoteUser(user)"
                class="role-button promote"
                @click="promoteUser(user)"
                title="提升用户权限"
              >
                提权
              </button>
              <button
                v-if="canDemoteUser(user)"
                class="role-button demote"
                @click="demoteUser(user)"
                title="降低用户权限"
              >
                降权
              </button>
            </view>
          </view>
        </view>
      </scroll-view>
      
      <!-- 分页控件 -->
      <view class="pagination">
        <view class="pagination-info">
          <text class="page-count">第 {{ currentPage }} 页 / 共 {{ totalPages || 1 }} 页</text>
          <text class="total-count">共 {{ totalRecords }} 条记录</text>
        </view>

        <view class="pagination-controls">
          <button
            class="page-button"
            :disabled="currentPage <= 1"
            @click="goToPreviousPage"
          >
            <uni-icons type="left" size="14" :color="currentPage <= 1 ? '#d1d5db' : '#3b82f6'"></uni-icons>
            上一页
          </button>

          <button
            class="page-button"
            :disabled="currentPage >= totalPages"
            @click="goToNextPage"
          >
            下一页
            <uni-icons type="right" size="14" :color="currentPage >= totalPages ? '#d1d5db' : '#3b82f6'"></uni-icons>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 用户详情弹窗 -->
    <uni-popup ref="userDetailPopup" type="center">
      <view class="detail-popup">
        <view class="detail-popup-header">
          <text class="detail-popup-title">用户详情</text>
          <view class="close-button" @click="closeUserDetail">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <scroll-view class="detail-popup-content" scroll-y="true">
          <!-- 用户概览 -->
          <view class="user-profile">
            <view class="profile-header">
              <image 
                class="profile-avatar" 
                :src="currentUser.avatar || '/static/default-avatar.png'" 
                mode="aspectFill"
              ></image>
              
              <view class="profile-info">
                <view class="profile-name">
                  {{ currentUser.nickname || currentUser.username || '匿名用户' }}
                  <view v-if="getUserRoleBadge(currentUser)" :class="['role-badge', getRoleBadgeClass(currentUser)]">
                    {{ getUserRoleBadge(currentUser) }}
                  </view>
                </view>
                
                <view class="profile-status" :class="getAccountStatusClass(currentUser)">
                  {{ getAccountStatusText(currentUser) }}
                </view>
                
                <view class="profile-id">ID: {{ currentUser._id }}</view>
              </view>
              
              <view v-if="currentUser.isMember" class="vip-info">
                <!-- 会员信息 -->
                <view class="vip-header">
                  <text class="vip-title">{{ getVipTypeText(currentUser.vip_type) }}</text>
                  <text class="vip-status">{{ isVipActive(currentUser) ? '生效中' : '已过期' }}</text>
                </view>
                
                <view class="vip-details">
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">开始时间</text>
                    <text class="vip-detail-value">{{ formatDateTime(currentUser.memberStartDate) }}</text>
                  </view>
                  
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">到期时间</text>
                    <text class="vip-detail-value">{{ formatDateTime(currentUser.vip_expire_date) }}</text>
                  </view>
                  
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">剩余天数</text>
                    <text class="vip-detail-value">{{ calculateRemainingDays(currentUser.vip_expire_date) }}</text>
                  </view>
                </view>
              </view>
            </view>
            <!-- 快速操作按钮 -->
            <view class="profile-quick-actions">
              <button class="quick-action-button" @click="sendMessageToUser">
                <uni-icons type="email" size="16" color="#3b82f6"></uni-icons>
                <text>发消息</text>
              </button>
              
              <button class="quick-action-button" @click="showUserOrders">
                <uni-icons type="list" size="16" color="#3b82f6"></uni-icons>
                <text>订单记录</text>
              </button>
              
              <button v-if="hasAdminPermission" class="quick-action-button" @click="editUser(currentUser)">
                <uni-icons type="compose" size="16" color="#3b82f6"></uni-icons>
                <text>编辑资料</text>
              </button>
              
              <button v-if="hasAdminPermission" :class="['quick-action-button', {'warning-button': isUserActive(currentUser)}]" @click="toggleUserStatus">
                <uni-icons :type="isUserActive(currentUser) ? 'closeempty' : 'checkmarkempty'" size="16" :color="isUserActive(currentUser) ? '#ef4444' : '#10b981'"></uni-icons>
                <text>{{ isUserActive(currentUser) ? '禁用账户' : '启用账户' }}</text>
              </button>
            </view>
          </view>
          
          <!-- 选项卡切换 -->
          <view class="user-detail-tabs">
            <view 
              v-for="(tab, index) in detailTabs" 
              :key="index"
              :class="['tab-item', {'active-tab': currentTabIndex === index}]"
              @click="switchTab(index)"
            >
              {{ tab.name }}
            </view>
          </view>
          
          <!-- 选项卡内容 -->
          <view class="tab-content">
            <!-- 基础信息 -->
            <view v-if="currentTabIndex === 0" class="info-section">
              <view class="info-group">
                <view class="info-item">
                  <text class="info-label">用户名</text>
                  <text class="info-value">{{ currentUser.username || '未设置' }}</text>
                </view>
                
                <view class="info-item">
                  <text class="info-label">手机号码</text>
                  <text class="info-value">{{ formatPhone(currentUser.mobile) || '未绑定' }}</text>
                </view>
                
                <view class="info-item">
                  <text class="info-label">邮箱</text>
                  <text class="info-value">{{ currentUser.email || '未设置' }}</text>
                </view>
                
                <view class="info-item">
                  <text class="info-label">注册时间</text>
                  <text class="info-value">{{ formatDateTime(currentUser.register_date) }}</text>
                </view>
                
                <view class="info-item">
                  <text class="info-label">最近登录</text>
                  <text class="info-value">{{ formatDateTime(currentUser.last_login_date) }}</text>
                </view>
                
                <view class="info-item">
                  <text class="info-label">注册来源</text>
                  <text class="info-value">{{ getRegisterSource(currentUser) }}</text>
                </view>
              </view>
            </view>
            
            <!-- 会员信息 -->
            <view v-if="currentTabIndex === 1" class="info-section">
              <view v-if="currentUser.vip_type" class="vip-info">
                <view class="vip-header">
                  <text class="vip-title">{{ getVipTypeText(currentUser.vip_type) }}</text>
                  <text class="vip-status">{{ isVipActive(currentUser) ? '生效中' : '已过期' }}</text>
                </view>
                
                <view class="vip-details">
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">开始时间</text>
                    <text class="vip-detail-value">{{ formatDateTime(currentUser.vip_start_date) }}</text>
                  </view>
                  
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">到期时间</text>
                    <text class="vip-detail-value">{{ formatDateTime(currentUser.vip_expire_date) }}</text>
                  </view>
                  
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">剩余天数</text>
                    <text class="vip-detail-value">{{ calculateRemainingDays(currentUser.vip_expire_date) }}</text>
                  </view>
                  
                  <view class="vip-detail-item">
                    <text class="vip-detail-label">自动续费</text>
                    <text class="vip-detail-value">{{ currentUser.auto_renew ? '开启' : '关闭' }}</text>
                  </view>
                </view>
                
                <view class="vip-history-header">会员购买记录</view>
                <view v-if="vipHistory.length === 0" class="empty-data-message">
                  暂无会员购买记录
                </view>
                <view v-else class="vip-history">
                  <view 
                    v-for="(item, index) in vipHistory" 
                    :key="index" 
                    class="vip-history-item"
                  >
                    <view class="vip-history-type">{{ getVipTypeText(item.vip_type) }}</view>
                    <view class="vip-history-date">{{ formatDateTime(item.purchase_date) }}</view>
                    <view class="vip-history-price">{{ formatAmount(item.price) }}</view>
                  </view>
                </view>
                
                <view v-if="hasAdminPermission" class="vip-admin-actions">
                  <button class="vip-admin-button" @click="extendVipMembership">延长会员</button>
                  <button class="vip-admin-button warning" @click="cancelVipMembership">取消会员</button>
                </view>
              </view>
              
              <view v-else class="no-vip-message">
                <uni-icons type="info" size="32" color="#d1d5db"></uni-icons>
                <text>该用户不是会员</text>
                
                <view v-if="hasAdminPermission" class="vip-admin-actions single">
                  <button class="vip-admin-button primary" @click="assignVipMembership">授予会员资格</button>
                </view>
              </view>
            </view>
            
            <!-- 订单记录 -->
            <view v-if="currentTabIndex === 2" class="info-section">
              <view class="order-summary">
                <view class="summary-item">
                  <text class="summary-value">{{ userOrders.length }}</text>
                  <text class="summary-label">总订单</text>
                </view>
                <view class="summary-divider"></view>
                <view class="summary-item">
                  <text class="summary-value">{{ formatAmount(calculateTotalSpent()) }}</text>
                  <text class="summary-label">总消费</text>
                </view>
                <view class="summary-divider"></view>
                <view class="summary-item">
                  <text class="summary-value">{{ calculateAverageSpent() }}</text>
                  <text class="summary-label">平均订单</text>
                </view>
              </view>
              
              <view class="list-header">
                <text>订单历史</text>
                <button class="mini-refresh-button" @click="loadUserOrders">刷新</button>
              </view>
              
              <view v-if="userOrders.length === 0" class="empty-data-message">
                该用户暂无订单记录
              </view>
              
              <view v-else class="order-history">
                <view 
                  v-for="(order, index) in userOrders" 
                  :key="order._id" 
                  class="order-history-item"
                >
                  <view class="order-history-header">
                    <view class="order-history-id">订单 #{{ order._id.substring(0, 8) }}</view>
                    <view :class="['order-history-status', getOrderStatusClass(order)]">
                      {{ getOrderStatusText(order.status) }}
                    </view>
                  </view>
                  
                  <view class="order-history-content">
                    <view class="order-history-machine">{{ order.machineName || '未知机台' }}</view>
                    <view class="order-history-time">
                      {{ formatDate(order.create_date) }} {{ formatTime(order.starttime) }}-{{ formatTime(order.endtime) }}
                    </view>
                    <view class="order-history-price">{{ formatAmount(order.total_fee) }}</view>
                  </view>
                  
                  <view class="order-history-actions">
                    <button class="mini-action-button" @click="viewOrderDetail(order._id)">查看详情</button>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 活动记录 -->
            <view v-if="currentTabIndex === 3" class="info-section">
              <view class="activity-summary">
                <view class="summary-item">
                  <text class="summary-value">{{ userActivities.logins || 0 }}</text>
                  <text class="summary-label">登录次数</text>
                </view>
                <view class="summary-divider"></view>
                <view class="summary-item">
                  <text class="summary-value">{{ userActivities.reservations || 0 }}</text>
                  <text class="summary-label">预约次数</text>
                </view>
                <view class="summary-divider"></view>
                <view class="summary-item">
                  <text class="summary-value">{{ formatDuration(userActivities.totalUsageTime || 0) }}</text>
                  <text class="summary-label">使用时长</text>
                </view>
              </view>
              
              <view class="activity-timeline-header">最近活动</view>
              <view v-if="userActivities.timeline && userActivities.timeline.length === 0" class="empty-data-message">
                暂无活动记录
              </view>
              
              <view v-else class="activity-timeline">
                <view 
                  v-for="(activity, index) in userActivities.timeline" 
                  :key="index" 
                  class="timeline-item"
                >
                  <view class="timeline-icon" :class="getActivityIconClass(activity.type)">
                    <uni-icons :type="getActivityIcon(activity.type)" size="14" color="#ffffff"></uni-icons>
                  </view>
                  
                  <view class="timeline-content">
                    <view class="timeline-header">
                      <text class="timeline-title">{{ getActivityTitle(activity) }}</text>
                      <text class="timeline-time">{{ formatDateTime(activity.time) }}</text>
                    </view>
                    
                    <view class="timeline-details">
                      {{ getActivityDetails(activity) }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
        
        <view class="detail-popup-actions">
          <button class="detail-action-button" @click="closeUserDetail">关闭</button>
          <button v-if="hasAdminPermission" class="detail-action-button primary" @click="editUser(currentUser)">编辑用户</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 用户编辑弹窗 -->
    <uni-popup ref="userEditPopup" type="center">
      <view class="edit-popup">
        <view class="edit-popup-header">
          <text class="edit-popup-title">编辑用户</text>
          <view class="close-button" @click="cancelEditUser">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <scroll-view class="edit-popup-content" scroll-y="true">
          <!-- 用户基本信息编辑 -->
          <view class="edit-section">
            <view class="edit-section-title">基本信息</view>
            
            <view class="form-group">
              <text class="form-label">昵称</text>
              <input 
                type="text" 
                v-model="editUserForm.nickname" 
                placeholder="用户昵称" 
                class="form-input"
              />
            </view>
            
            <view class="form-group">
              <text class="form-label">手机号码</text>
              <input 
                type="number" 
                v-model="editUserForm.mobile" 
                placeholder="手机号码" 
                class="form-input"
                maxlength="11"
              />
            </view>
            
            <view class="form-group">
              <text class="form-label">邮箱</text>
              <input 
                type="text" 
                v-model="editUserForm.email" 
                placeholder="电子邮箱" 
                class="form-input"
              />
            </view>
          </view>
          
          <!-- 权限管理 -->
          <view v-if="hasAdminPermission" class="edit-section">
            <view class="edit-section-title">权限管理</view>
            
            <view class="form-group">
              <text class="form-label">用户角色</text>
              <picker 
                @change="onRoleChange" 
                :value="roleIndex" 
                :range="roleOptions">
                <view class="picker-input">
                  {{ roleOptions[roleIndex] }}
                </view>
              </picker>
            </view>
            
            <view class="form-group">
              <text class="form-label">账户状态</text>
              <picker 
                @change="onStatusChange" 
                :value="statusIndex" 
                :range="statusOptions">
                <view class="picker-input">
                  {{ statusOptions[statusIndex] }}
                </view>
              </picker>
            </view>
          </view>
          
          <!-- 会员设置 -->
          <view v-if="hasAdminPermission" class="edit-section">
            <view class="edit-section-title">会员设置</view>
            
            <view class="form-group">
              <text class="form-label">会员类型</text>
              <picker 
                @change="onVipTypeChange" 
                :value="vipTypeIndex" 
                :range="vipTypeOptions">
                <view class="picker-input">
                  {{ vipTypeOptions[vipTypeIndex] }}
                </view>
              </picker>
            </view>
            
            <view v-if="vipTypeIndex > 0" class="form-group">
              <text class="form-label">到期时间</text>
              <view class="datetime-picker">
                <picker 
                  mode="date" 
                  :value="formatDateForPicker(editUserForm.vip_expire_date)"
                  @change="onVipExpiryDateChange">
                  <view class="picker-input">
                    {{ formatDate(editUserForm.vip_expire_date) || '选择日期' }}
                  </view>
                </picker>
              </view>
            </view>
          </view>
          
          <!-- 备注信息 -->
          <view v-if="hasAdminPermission" class="edit-section">
            <view class="edit-section-title">管理备注</view>
            <textarea 
              v-model="editUserForm.admin_remark" 
              placeholder="添加管理员备注" 
              class="admin-remark-textarea"
            ></textarea>
          </view>
          
          <view v-if="editError" class="edit-error">
            <uni-icons type="error" size="14" color="#ef4444"></uni-icons>
            <text>{{ editError }}</text>
          </view>
        </scroll-view>
        
        <view class="edit-popup-actions">
          <button class="edit-cancel-button" @click="cancelEditUser">取消</button>
          <button class="edit-confirm-button" @click="confirmEditUser">保存修改</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 消息发送弹窗 -->
    <uni-popup ref="messageSendPopup" type="center">
      <view class="message-popup">
        <view class="message-popup-header">
          <text class="message-popup-title">发送消息</text>
          <view class="close-button" @click="cancelSendMessage">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <view class="message-popup-content">
          <view class="message-recipients">
            <text class="recipients-label">收件人:</text>
            <view v-if="messageRecipients.length === 1" class="single-recipient">
              {{ messageRecipients[0].nickname || messageRecipients[0].username || '用户' }}
            </view>
            <view v-else class="multiple-recipients">
              {{ messageRecipients.length }} 位用户
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">标题</text>
            <input 
              type="text" 
              v-model="messageForm.title" 
              placeholder="消息标题" 
              class="form-input"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">消息内容</text>
            <textarea 
              v-model="messageForm.content" 
              placeholder="请输入消息内容" 
              class="message-textarea"
            ></textarea>
          </view>
          
          <view class="form-group">
            <text class="form-label">消息类型</text>
            <picker 
              @change="onMessageTypeChange" 
              :value="messageTypeIndex" 
              :range="messageTypeOptions">
              <view class="picker-input">
                {{ messageTypeOptions[messageTypeIndex] }}
              </view>
            </picker>
          </view>
          
          <view v-if="messageError" class="edit-error">
            <uni-icons type="error" size="14" color="#ef4444"></uni-icons>
            <text>{{ messageError }}</text>
          </view>
        </view>
        
        <view class="message-popup-actions">
          <button class="message-cancel-button" @click="cancelSendMessage">取消</button>
          <button class="message-send-button" @click="confirmSendMessage">发送</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 会员授予/延长弹窗 -->
    <uni-popup ref="vipAssignPopup" type="center">
      <view class="vip-popup">
        <view class="vip-popup-header">
          <text class="vip-popup-title">{{ isExtendVip ? '延长会员' : '授予会员' }}</text>
          <view class="close-button" @click="cancelAssignVip">
            <uni-icons type="close" size="18" color="#6b7280"></uni-icons>
          </view>
        </view>
        
        <view class="vip-popup-content">
          <view class="vip-assign-user">
            <text class="vip-assign-label">用户:</text>
            <view v-if="vipAssignRecipients.length === 1" class="vip-assign-name">
              {{ vipAssignRecipients[0].nickname || vipAssignRecipients[0].username || '用户' }}
            </view>
            <view v-else class="vip-assign-count">
              {{ vipAssignRecipients.length }} 位用户
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">会员类型</text>
            <picker 
              @change="onAssignVipTypeChange" 
              :value="assignVipTypeIndex" 
              :range="vipTypeOptions.slice(1)">
              <view class="picker-input">
                {{ vipTypeOptions.slice(1)[assignVipTypeIndex] }}
              </view>
            </picker>
          </view>
          
          <view class="form-group">
            <text class="form-label">{{ isExtendVip ? '延长时间' : '有效期' }}</text>
            <view class="vip-duration-options">
              <view 
                v-for="(option, index) in vipDurationOptions"
                :key="index"
                :class="['vip-duration-option', {'selected-duration': vipDurationIndex === index}]"
                @click="selectVipDuration(index)"
              >
                {{ option.label }}
              </view>
            </view>
          </view>
          
          <view v-if="customDuration" class="form-group">
            <text class="form-label">自定义天数</text>
            <input 
              type="number" 
              v-model="customDurationDays" 
              placeholder="输入天数" 
              class="form-input"
            />
          </view>
          
          <view class="vip-summary">
            <view class="vip-expiry-preview">
              <text class="vip-preview-label">到期时间: </text>
              <text class="vip-preview-value">{{ formatVipPreviewDate() }}</text>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">备注</text>
            <textarea 
              v-model="vipAssignRemark" 
              placeholder="添加备注信息（可选）" 
              class="vip-remark-textarea"
            ></textarea>
          </view>
          
          <view v-if="vipAssignError" class="edit-error">
            <uni-icons type="error" size="14" color="#ef4444"></uni-icons>
            <text>{{ vipAssignError }}</text>
          </view>
        </view>
        
        <view class="vip-popup-actions">
          <button class="vip-cancel-button" @click="cancelAssignVip">取消</button>
          <button class="vip-confirm-button" @click="confirmAssignVip">确认</button>
        </view>
      </view>
    </uni-popup>
    
    <!-- 确认对话框 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog
        :type="confirmDialogType"
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
      // 用户统计数据
      userStats: {
        total: 0,
        active: 0,
        vip: 0,
        new: 0
      },
      
      // 搜索和筛选
      showAdvancedFilters: true, // 默认展开高级筛选，减少压缩感
      searchForm: {
        keyword: '',
        userType: null,
        registerTimeRange: null,
        activeStatus: null,
        sortField: 'register_date',
        sortOrder: 'desc'
      },

      // 搜索状态管理
      searchTimeout: null,
      searchLoading: false,
      
      // 筛选选项
      userTypeFilterIndex: 0,
      userTypeOptions: ['全部用户', '普通用户', '会员用户', '管理员'],
      registerTimeFilterIndex: 0,
      timeFilterOptions: ['全部时间', '今天', '昨天', '最近7天', '最近30天', '本月', '上月'],
      activeStatusFilterIndex: 0,
      activeStatusOptions: ['全部状态', '活跃用户', '非活跃用户', '未登录用户'],
      sortIndex: 0,
      sortOptions: ['注册时间降序', '注册时间升序', '最近登录降序', '最近登录升序', '消费金额降序', '消费金额升序'],
      
      // 用户列表
      users: [],
      selectedUsers: [],
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      totalRecords: 0,
      
      // 用户详情
      currentUser: {},
      detailTabs: [
        { name: '基础信息' },
        { name: '会员信息' },
        { name: '订单记录' },
        { name: '活动记录' }
      ],
      currentTabIndex: 0,
      userOrders: [],
      vipHistory: [],
      userActivities: {
        logins: 0,
        reservations: 0,
        totalUsageTime: 0,
        timeline: []
      },
      
      // 用户编辑
      editUserForm: {
        _id: '',
        nickname: '',
        mobile: '',
        email: '',
        status: 'normal',
        role: 'user',
        vip_type: '',
        vip_expire_date: null,
        admin_remark: ''
      },
      roleIndex: 0,
      roleOptions: ['普通用户', '会员用户', '管理员'], 
      statusIndex: 0,
      statusOptions: ['正常', '禁用', '限制访问'],
      vipTypeIndex: 0,
      vipTypeOptions: ['无会员', '周卡会员', '月卡会员', '季卡会员', '年卡会员'],
      editError: '',
      
      // 消息发送
      messageRecipients: [],
      messageForm: {
        title: '',
        content: '',
        type: 'normal'
      },
      messageTypeIndex: 0,
      messageTypeOptions: ['一般消息', '促销消息', '重要通知', '系统通知'],
      messageError: '',
      
      // 会员授予/延长
      isExtendVip: false,
      vipAssignRecipients: [],
      assignVipTypeIndex: 0,
      vipDurationIndex: 0,
      vipDurationOptions: [
        { label: '7天', days: 7 },
        { label: '30天', days: 30 },
        { label: '90天', days: 90 },
        { label: '365天', days: 365 },
        { label: '自定义', custom: true }
      ],
      customDuration: false,
      customDurationDays: '',
      vipAssignRemark: '',
      vipAssignError: '',
      
      // 确认对话框
      confirmDialogType: 'info',
      confirmDialogTitle: '',
      confirmDialogContent: '',
      confirmDialogCallback: null,
      
      // 权限控制
      hasAdminPermission: true // 默认为true以展示所有功能，实际应用中应基于用户权限动态设置
    };
  },
  
  mounted() {
    this.loadUsers();
    this.loadUserStats();
    this.checkAdminPermission();
  },
  
  methods: {
    // 权限检查
    checkAdminPermission() {
      try {
        const userInfo = uni.getStorageSync('uni_id_user_info') || {};
        this.hasAdminPermission = userInfo.role && (userInfo.role.includes('admin') || userInfo.role.includes('super-admin'));
      } catch (e) {
        console.error('获取用户权限失败', e);
        this.hasAdminPermission = false;
      }
    },
    
    // 用户加载与刷新
    async loadUsers() {
      if (this.searchLoading) return;

      try {
        this.searchLoading = true;
        uni.showLoading({ title: '加载中...' });
        
        // 调用云函数获取用户列表
        const todo = uniCloud.importObject('todo');

        // 构建搜索参数（参考 orderManagement 和 reservationManagement 的正确模式）
        const params = {
          pageNumber: this.currentPage,
          pageSize: this.pageSize,
          sortField: this.searchForm.sortField,
          sortOrder: this.searchForm.sortOrder
        };

        // 只添加非空的筛选条件（与其他工作页面保持一致）
        if (this.searchForm.keyword) {
          params.keyword = this.searchForm.keyword;
        }

        if (this.searchForm.userType !== null) {
          params.userType = this.searchForm.userType;
        }

        if (this.searchForm.activeStatus !== null) {
          params.activeStatus = this.searchForm.activeStatus;
        }

        // 处理时间范围
        if (this.searchForm.registerTimeRange) {
          if (this.searchForm.registerTimeRange.start) {
            params.registerStartDate = this.searchForm.registerTimeRange.start;
          }
          if (this.searchForm.registerTimeRange.end) {
            params.registerEndDate = this.searchForm.registerTimeRange.end;
          }
        }

        console.log('发送给后端的参数:', params);

        const result = await todo.Get_FilteredUsers(params);

        console.log('后端返回的分页数据:', {
          code: result.code,
          dataLength: result.data?.length,
          pagination: result.pagination,
          total: result.pagination?.total,
          totalPages: result.pagination?.totalPages,
          currentPage: result.pagination?.currentPage
        });
        
        if (result && result.code === 0) {
          this.users = result.data || [];
          this.totalPages = result.pagination ? result.pagination.totalPages : 1;
          this.totalRecords = result.pagination ? result.pagination.total : 0;

          console.log('前端更新后的状态:', {
            usersLength: this.users.length,
            totalPages: this.totalPages,
            totalRecords: this.totalRecords,
            currentPage: this.currentPage
          });

          // 检查分页是否合理
          if (this.totalPages > 1 && this.users.length > 0) {
            console.log('应该有多页数据，检查翻页按钮是否可点击');
          }
        } else {
          uni.showToast({
            title: result.errMsg || '加载用户失败',
            icon: 'none',
            duration: 3000
          });
        }
        
        uni.hideLoading();
      } catch (e) {
        uni.hideLoading();
        uni.showToast({
          title: '加载用户列表失败',
          icon: 'none'
        });
        console.error('加载用户列表失败:', e);
      }

      this.searchLoading = false;
    },
    
    // 加载用户统计数据
    async loadUserStats() {
      try {
        // 调用云函数获取用户统计
        const todo = uniCloud.importObject('todo');
        const result = await todo.Get_UserStats();
        
        if (result && result.code === 0) {
          this.userStats = result.data;
        }
      } catch (e) {
        console.error('加载用户统计失败:', e);
      }
    },
    
    // 搜索与筛选
        
    clearSearch() {
      this.searchForm.keyword = '';
      this.searchUsers();
    },

    // 搜索输入防抖
    onSearchInput() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      this.searchTimeout = setTimeout(() => {
        this.searchUsers();
      }, 500);
    },

    searchUsers() {
      this.currentPage = 1; // 重置到第一页
      this.loadUsers();
    },
    
    onUserTypeFilterChange(e) {
      this.userTypeFilterIndex = e.detail.value;
      this.searchForm.userType = this.userTypeFilterIndex === 0 ? null : this.userTypeFilterIndex - 1;
      // 自动触发搜索
      this.searchUsers();
    },

    onRegisterTimeFilterChange(e) {
      this.registerTimeFilterIndex = e.detail.value;
      const now = new Date();

      // 重置时间范围
      this.searchForm.registerTimeRange = null;

      // 根据选择设置时间范围
      switch (parseInt(this.registerTimeFilterIndex)) {
        case 1: // 今天
          this.searchForm.registerTimeRange = {
            start: this.getStartOfDay(now).getTime(),
            end: this.getEndOfDay(now).getTime()
          };
          break;
        case 2: // 昨天
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          this.searchForm.registerTimeRange = {
            start: this.getStartOfDay(yesterday).getTime(),
            end: this.getEndOfDay(yesterday).getTime()
          };
          break;
        case 3: // 最近7天
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          this.searchForm.registerTimeRange = {
            start: this.getStartOfDay(sevenDaysAgo).getTime(),
            end: this.getEndOfDay(now).getTime()
          };
          break;
        case 4: // 最近30天
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          this.searchForm.registerTimeRange = {
            start: this.getStartOfDay(thirtyDaysAgo).getTime(),
            end: this.getEndOfDay(now).getTime()
          };
          break;
        case 5: // 本月
          this.searchForm.registerTimeRange = {
            start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime()
          };
          break;
        case 6: // 上月
          this.searchForm.registerTimeRange = {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime(),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime()
          };
          break;
      }

      // 自动触发搜索
      this.searchUsers();
    },
    
    onActiveStatusFilterChange(e) {
      this.activeStatusFilterIndex = e.detail.value;
      this.searchForm.activeStatus = this.activeStatusFilterIndex === 0 ? null : this.activeStatusFilterIndex - 1;
      // 自动触发搜索
      this.searchUsers();
    },
    
    onSortChange(e) {
      this.sortIndex = e.detail.value;

      // 设置排序字段和顺序
      switch (parseInt(this.sortIndex)) {
        case 0:
          this.searchForm.sortField = 'register_date';
          this.searchForm.sortOrder = 'desc';
          break;
        case 1:
          this.searchForm.sortField = 'register_date';
          this.searchForm.sortOrder = 'asc';
          break;
        case 2:
          this.searchForm.sortField = 'last_login_date';
          this.searchForm.sortOrder = 'desc';
          break;
        case 3:
          this.searchForm.sortField = 'last_login_date';
          this.searchForm.sortOrder = 'asc';
          break;
        case 4:
          this.searchForm.sortField = 'total_spent';
          this.searchForm.sortOrder = 'desc';
          break;
        case 5:
          this.searchForm.sortField = 'total_spent';
          this.searchForm.sortOrder = 'asc';
          break;
      }

      // 自动触发搜索
      this.searchUsers();
    },
    
    resetFilters() {
      this.searchForm = {
        keyword: '',
        userType: null,
        registerTimeRange: null,
        activeStatus: null,
        sortField: 'register_date',
        sortOrder: 'desc'
      };
      
      this.userTypeFilterIndex = 0;
      this.registerTimeFilterIndex = 0;
      this.activeStatusFilterIndex = 0;
      this.sortIndex = 0;

      // 触发搜索以加载重置后的数据
      this.searchUsers();
    },
    
    applyFilters() {
      this.currentPage = 1; // 重置到第一页
      this.loadUsers();
    },
    
    getStartOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    },
    
    getEndOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    },
    
    // 分页控制
    goToPreviousPage() {
      console.log('点击上一页，当前页码:', this.currentPage);
      if (this.currentPage > 1) {
        this.currentPage--;
        console.log('页码更新为:', this.currentPage);
        this.loadUsers();
      } else {
        console.log('已经是第一页，无法继续翻页');
      }
    },
    
    goToNextPage() {
      console.log('点击下一页，当前页码:', this.currentPage, '总页数:', this.totalPages);
      console.log('下一页按钮状态检查:', {
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        canGoNext: this.currentPage < this.totalPages,
        condition: `${this.currentPage} < ${this.totalPages}`
      });

      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        console.log('页码更新为:', this.currentPage);
        this.loadUsers();
      } else {
        console.log('无法翻页 - 可能原因:');
        console.log('1. totalPages 值不正确:', this.totalPages);
        console.log('2. 后端返回的分页数据有问题');
        console.log('3. currentPage 和 totalPages 比较有问题');
      }
    },
    
    // 用户选择与批量操作
    toggleUserSelection(userId) {
      const index = this.selectedUsers.indexOf(userId);
      if (index > -1) {
        this.selectedUsers.splice(index, 1);
      } else {
        this.selectedUsers.push(userId);
      }
    },
    
    isUserSelected(userId) {
      return this.selectedUsers.includes(userId);
    },
    
    batchSendMessage() {
      if (this.selectedUsers.length === 0) {
        uni.showToast({
          title: '请先选择用户',
          icon: 'none'
        });
        return;
      }
      
      // 准备收件人列表
      this.messageRecipients = this.users.filter(user => this.selectedUsers.includes(user._id));
      
      // 重置消息表单
      this.messageForm = {
        title: '',
        content: '',
        type: 'normal'
      };
      this.messageTypeIndex = 0;
      this.messageError = '';
      
      // 打开消息发送弹窗
      this.$refs.messageSendPopup.open();
    },
    
    batchPromoteToVip() {
      if (!this.hasAdminPermission) {
        uni.showToast({
          title: '您没有权限执行此操作',
          icon: 'none'
        });
        return;
      }
      
      if (this.selectedUsers.length === 0) {
        uni.showToast({
          title: '请先选择用户',
          icon: 'none'
        });
        return;
      }
      
      // 准备会员授予
      this.vipAssignRecipients = this.users.filter(user => this.selectedUsers.includes(user._id));
      this.isExtendVip = false;
      this.assignVipTypeIndex = 0;
      this.vipDurationIndex = 1; // 默认选择30天
      this.customDuration = false;
      this.customDurationDays = '';
      this.vipAssignRemark = '';
      this.vipAssignError = '';
      
      // 打开会员授予弹窗
      this.$refs.vipAssignPopup.open();
    },
    
    batchResetAccount() {
      if (!this.hasAdminPermission) {
        uni.showToast({
          title: '您没有权限执行此操作',
          icon: 'none'
        });
        return;
      }
      
      if (this.selectedUsers.length === 0) {
        uni.showToast({
          title: '请先选择用户',
          icon: 'none'
        });
        return;
      }
      
      // 显示确认对话框
      this.confirmDialogType = 'warn';
      this.confirmDialogTitle = '重置账户确认';
      this.confirmDialogContent = `您确定要重置这 ${this.selectedUsers.length} 位用户的账户吗？此操作将会清除用户部分数据。`;
      this.confirmDialogCallback = this.confirmBatchReset;
      this.$refs.confirmPopup.open();
    },
    
    async confirmBatchReset() {
      try {
        uni.showLoading({ title: '处理中...' });
        
        // 在实际应用中调用云函数进行批量重置
        const todo = uniCloud.importObject('todo');
        const result = await todo.BatchResetAccounts(this.selectedUsers);
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: '账户重置成功',
            icon: 'success'
          });
          
          // 清空选择并刷新列表
          this.selectedUsers = [];
          this.loadUsers();
        } else {
          uni.showModal({
            title: '操作失败',
            content: result.errMsg || '重置账户失败',
            showCancel: false
          });
        }
      } catch (e) {
        uni.hideLoading();
        uni.showModal({
          title: '操作失败',
          content: '系统错误，请稍后再试',
          showCancel: false
        });
        console.error('批量重置账户失败:', e);
      }
    },
    
    // 用户详情
    async viewUserDetail(user) {
      try {
        uni.showLoading({ title: '加载中...' });

        // 暂时直接使用用户数据，不调用后端（避免500错误）
        this.currentUser = user;
        this.currentTabIndex = 0; // 重置为第一个选项卡

        // 暂时禁用详细数据加载（避免500错误）
        // await this.loadUserOrders();
        // await this.loadUserVipHistory();
        // await this.loadUserActivities();

        uni.hideLoading();
        // 打开详情弹窗
        this.$refs.userDetailPopup.open();
      } catch (e) {
        uni.hideLoading();
        console.error('加载用户详情失败:', e);
        uni.showToast({
          title: '加载用户详情失败',
          icon: 'none'
        });
      }
    },
    
    closeUserDetail() {
      this.$refs.userDetailPopup.close();
    },
    
    switchTab(index) {
      this.currentTabIndex = index;
      
      // 根据切换的标签加载相应数据
      if (index === 2 && this.userOrders.length === 0) {
        this.loadUserOrders();
      } else if (index === 1 && this.vipHistory.length === 0) {
        this.loadUserVipHistory();
      } else if (index === 3 && (!this.userActivities.timeline || this.userActivities.timeline.length === 0)) {
        this.loadUserActivities();
      }
    },
    
    async loadUserOrders() {
      // 暂时禁用，避免调用不存在的后端方法
      console.log('loadUserOrders 暂时禁用');
      this.userOrders = [];
    },
    
    async loadUserVipHistory() {
      // 暂时禁用，避免调用不存在的后端方法
      console.log('loadUserVipHistory 暂时禁用');
      this.vipHistory = [];
    },
    
    async loadUserActivities() {
      // 暂时禁用，避免调用不存在的后端方法
      console.log('loadUserActivities 暂时禁用');
      this.userActivities = {
        logins: 0,
        reservations: 0,
        totalUsageTime: 0,
        timeline: []
      };
    },
    
    calculateTotalSpent() {
      if (!this.userOrders || this.userOrders.length === 0) return 0;
      return this.userOrders.reduce((total, order) => total + (order.total_fee || 0), 0);
    },
    
    calculateAverageSpent() {
      if (!this.userOrders || this.userOrders.length === 0) return '¥0.00';
      const total = this.calculateTotalSpent();
      const average = total / this.userOrders.length;
      return this.formatAmount(average);
    },
    
    async viewOrderDetail(orderId) {
      // 这里可以跳转到订单详情页面或打开订单详情弹窗
      uni.showToast({
        title: '查看订单: ' + orderId,
        icon: 'none'
      });
      
      // 实际应用中可能需要导航到订单详情页
      // uni.navigateTo({
      //   url: `/pages/orderManagement/detail?id=${orderId}`
      // });
    },
    
    showUserOrders() {
      // 切换到订单记录选项卡
      this.currentTabIndex = 2;
      this.loadUserOrders();
    },
    
    calculateRemainingDays(expireDate) {
      if (!expireDate) return '0天';
      
      const now = new Date();
      const expire = new Date(expireDate);
      
      // 如果已过期，返回0天
      if (expire < now) return '0天';
      
      // 计算剩余天数
      const diffTime = Math.abs(expire - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return `${diffDays}天`;
    },
    
    // 编辑用户时加载会员信息
    editUser(user) {
      // 复制用户对象，避免直接修改原对象
      this.editUserForm = {
        _id: user._id,
        nickname: user.nickname || '',
        mobile: user.mobile || '',
        email: user.email || '',
        status: user.status || 'normal',
        role: user.role || 'user',
        vip_type: user.vip_type || '',
        vip_expire_date: user.vip_expire_date || null,
        admin_remark: user.admin_remark || ''
      };
      
      // 设置表单初始值
      this.roleIndex = this.getRoleIndex(user.role);
      this.statusIndex = this.getStatusIndex(user.status);
      this.vipTypeIndex = this.getVipTypeIndex(user.vip_type);
      
      // 重置错误信息
      this.editError = '';
      
      // 打开编辑弹窗
      this.$refs.userEditPopup.open();
    },
    
    getRoleIndex(role) {
      switch (role) {
        case 'admin': return 2;
        case 'vip': return 1;
        default: return 0;
      }
    },
    
    getStatusIndex(status) {
      switch (status) {
        case 'disabled': return 1;
        case 'limited': return 2;
        default: return 0;
      }
    },
    
    getVipTypeIndex(vipType) {
      if (!vipType) return 0;
      
      const vipTypes = ['weekly', 'monthly', 'quarterly', 'yearly'];
      const index = vipTypes.indexOf(vipType);
      
      return index > -1 ? index + 1 : 0;
    },
    
    onRoleChange(e) {
      this.roleIndex = e.detail.value;
      
      switch (parseInt(this.roleIndex)) {
        case 0:
          this.editUserForm.role = 'user';
          break;
        case 1:
          this.editUserForm.role = 'vip';
          break;
        case 2:
          this.editUserForm.role = 'admin';
          break;
      }
    },
    
    onStatusChange(e) {
      this.statusIndex = e.detail.value;
      
      switch (parseInt(this.statusIndex)) {
        case 0:
          this.editUserForm.status = 'normal';
          break;
        case 1:
          this.editUserForm.status = 'disabled';
          break;
        case 2:
          this.editUserForm.status = 'limited';
          break;
      }
    },
    
    
    onVipTypeChange(e) {
      this.vipTypeIndex = e.detail.value;
      
      const vipTypes = ['', 'weekly', 'monthly', 'quarterly', 'yearly'];
      this.editUserForm.vip_type = vipTypes[this.vipTypeIndex];
      
      // 如果选择了会员类型，默认设置30天有效期
      if (this.vipTypeIndex > 0 && !this.editUserForm.vip_expire_date) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 30);
        this.editUserForm.vip_expire_date = expireDate.getTime();
      }
    },
    
    onVipExpiryDateChange(e) {
      const selectedDate = new Date(e.detail.value);
      this.editUserForm.vip_expire_date = selectedDate.getTime();
    },
    
    async confirmEditUser() {
      // 验证表单
      if (this.editUserForm.mobile && !/^1\d{10}$/.test(this.editUserForm.mobile)) {
        this.editError = '请输入有效的手机号码';
        return;
      }
      
      if (this.editUserForm.email && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(this.editUserForm.email)) {
        this.editError = '请输入有效的邮箱地址';
        return;
      }
      
      try {
        uni.showLoading({ title: '保存中...' });
        
        // 调用云函数更新用户信息
        const todo = uniCloud.importObject('todo');
        const result = await todo.UpdateUser(this.editUserForm);
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: '用户更新成功',
            icon: 'success'
          });
          
          // 关闭弹窗
          this.$refs.userEditPopup.close();
          
          // 更新当前用户详情和列表
          if (this.currentUser && this.currentUser._id === this.editUserForm._id) {
            Object.assign(this.currentUser, this.editUserForm);
          }
          
          this.loadUsers();
        } else {
          this.editError = result.errMsg || '更新失败，请重试';
        }
      } catch (e) {
        uni.hideLoading();
        console.error('更新用户失败:', e);
        this.editError = '系统错误，请重试';
      }
    },
    
    cancelEditUser() {
      // 关闭弹窗
      this.$refs.userEditPopup.close();
      
      // 重置编辑状态
      this.editUserForm = {
        _id: '',
        nickname: '',
        mobile: '',
        email: '',
        status: 'normal',
        role: 'user',
        vip_type: '',
        vip_expire_date: null,
        admin_remark: ''
      };
      this.editError = '';
    },
    
    // 消息发送
    sendMessageToUser() {
      if (!this.currentUser || !this.currentUser._id) return;
      
      // 准备收件人列表
      this.messageRecipients = [this.currentUser];
      
      // 重置消息表单
      this.messageForm = {
        title: '',
        content: '',
        type: 'normal'
      };
      this.messageTypeIndex = 0;
      this.messageError = '';
      
      // 打开消息发送弹窗
      this.$refs.messageSendPopup.open();
    },
    
    onMessageTypeChange(e) {
      this.messageTypeIndex = e.detail.value;
      
      const types = ['normal', 'promotion', 'important', 'system'];
      this.messageForm.type = types[this.messageTypeIndex];
    },
    
    async confirmSendMessage() {
      // 验证表单
      if (!this.messageForm.title.trim()) {
        this.messageError = '请输入消息标题';
        return;
      }
      
      if (!this.messageForm.content.trim()) {
        this.messageError = '请输入消息内容';
        return;
      }
      
      try {
        uni.showLoading({ title: '发送中...' });
        
        // 获取收件人ID列表
        const recipientIds = this.messageRecipients.map(user => user._id);
        
        // 调用云函数发送消息
        const todo = uniCloud.importObject('todo');
        const result = await todo.SendUserMessage({
          recipients: recipientIds,
          title: this.messageForm.title,
          content: this.messageForm.content,
          type: this.messageForm.type
        });
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: '消息发送成功',
            icon: 'success'
          });
          
          // 关闭弹窗
          this.$refs.messageSendPopup.close();
        } else {
          this.messageError = result.errMsg || '发送失败，请重试';
        }
      } catch (e) {
        uni.hideLoading();
        console.error('发送消息失败:', e);
        this.messageError = '系统错误，请重试';
      }
    },
    
    cancelSendMessage() {
      // 关闭弹窗
      this.$refs.messageSendPopup.close();
      
      // 重置表单
      this.messageRecipients = [];
      this.messageForm = {
        title: '',
        content: '',
        type: 'normal'
      };
      this.messageError = '';
    },
    
    // 会员管理
    extendVipMembership() {
      if (!this.currentUser || !this.currentUser._id) return;
      
      // 准备会员延长
      this.vipAssignRecipients = [this.currentUser];
      this.isExtendVip = true;
      
      // 设置当前会员类型
      const vipTypes = ['', 'weekly', 'monthly', 'quarterly', 'yearly'];
      this.assignVipTypeIndex = vipTypes.indexOf(this.currentUser.vip_type) - 1;
      if (this.assignVipTypeIndex < 0) this.assignVipTypeIndex = 0;
      
      // 重置其他表单数据
      this.vipDurationIndex = 1; // 默认选择30天
      this.customDuration = false;
      this.customDurationDays = '';
      this.vipAssignRemark = '';
      this.vipAssignError = '';
      
      // 打开会员延长弹窗
      this.$refs.vipAssignPopup.open();
    },
    
    cancelVipMembership() {
      if (!this.currentUser || !this.currentUser._id) return;
      
      // 显示确认对话框
      this.confirmDialogType = 'warn';
      this.confirmDialogTitle = '取消会员确认';
      this.confirmDialogContent = `确定要取消 ${this.currentUser.nickname || this.currentUser.username || '此用户'} 的会员资格吗？此操作将立即生效。`;
      this.confirmDialogCallback = this.confirmCancelVip;
      this.$refs.confirmPopup.open();
    },
    
    async confirmCancelVip() {
      try {
        uni.showLoading({ title: '处理中...' });
        
        // 调用云函数取消会员
        const todo = uniCloud.importObject('todo');
        const result = await todo.CancelVipMembership(this.currentUser._id);
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: '会员已取消',
            icon: 'success'
          });
          
          // 更新用户详情
          await this.viewUserDetail(this.currentUser);
        } else {
          uni.showModal({
            title: '操作失败',
            content: result.errMsg || '取消会员失败',
            showCancel: false
          });
        }
      } catch (e) {
        uni.hideLoading();
        uni.showModal({
          title: '操作失败',
          content: '系统错误，请稍后再试',
          showCancel: false
        });
        console.error('取消会员失败:', e);
      }
    },
    
    assignVipMembership() {
      if (!this.currentUser || !this.currentUser._id) return;
      
      // 准备会员授予
      this.vipAssignRecipients = [this.currentUser];
      this.isExtendVip = false;
      this.assignVipTypeIndex = 0;
      this.vipDurationIndex = 1; // 默认选择30天
      this.customDuration = false;
      this.customDurationDays = '';
      this.vipAssignRemark = '';
      this.vipAssignError = '';
      
      // 打开会员授予弹窗
      this.$refs.vipAssignPopup.open();
    },
    
    onAssignVipTypeChange(e) {
      this.assignVipTypeIndex = e.detail.value;
    },
    
    selectVipDuration(index) {
      this.vipDurationIndex = index;
      this.customDuration = this.vipDurationOptions[index].custom;
    },
    
    formatVipPreviewDate() {
      // 计算预期的会员到期时间
      let daysToAdd = 0;
      
      if (this.customDuration && this.customDurationDays) {
        daysToAdd = parseInt(this.customDurationDays);
      } else {
        daysToAdd = this.vipDurationOptions[this.vipDurationIndex].days;
      }
      
      // 无效输入处理
      if (isNaN(daysToAdd) || daysToAdd <= 0) {
        return '无效输入';
      }
      
      // 计算新的到期日期
      let startDate = new Date();
      
      // 如果是延长会员且当前会员有效，则从当前到期日开始计算
      if (this.isExtendVip && this.currentUser.vip_expire_date) {
        const expireDate = new Date(this.currentUser.vip_expire_date);
        if (expireDate > startDate) {
          startDate = expireDate;
        }
      }
      
      // 计算新的到期日期
      const expireDate = new Date(startDate);
      expireDate.setDate(expireDate.getDate() + daysToAdd);
      
      return this.formatDate(expireDate.getTime());
    },
    
    async confirmAssignVip() {
      // 验证表单
      if (this.customDuration) {
        if (!this.customDurationDays.trim() || isNaN(parseInt(this.customDurationDays)) || parseInt(this.customDurationDays) <= 0) {
          this.vipAssignError = '请输入有效的天数';
          return;
        }
      }
      
      try {
        uni.showLoading({ title: '处理中...' });
        
        // 获取收件人ID列表
        const recipientIds = this.vipAssignRecipients.map(user => user._id);
        
        // 计算天数
        let daysToAdd = 0;
        if (this.customDuration) {
          daysToAdd = parseInt(this.customDurationDays);
        } else {
          daysToAdd = this.vipDurationOptions[this.vipDurationIndex].days;
        }
        
        // 获取会员类型
        const vipTypes = ['weekly', 'monthly', 'quarterly', 'yearly'];
        const vipType = vipTypes[this.assignVipTypeIndex];
        
        // 调用云函数分配会员
        const todo = uniCloud.importObject('todo');
        const result = await todo.AssignVipMembership({
          userIds: recipientIds,
          vipType: vipType,
          days: daysToAdd,
          isExtend: this.isExtendVip,
          remark: this.vipAssignRemark
        });
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: this.isExtendVip ? '会员已延长' : '会员已授予',
            icon: 'success'
          });
          
          // 关闭弹窗
          this.$refs.vipAssignPopup.close();
          
          // 更新用户详情
          if (this.currentUser && recipientIds.includes(this.currentUser._id)) {
            await this.viewUserDetail(this.currentUser);
          }
          
          // 刷新用户列表
          this.loadUsers();
        } else {
          this.vipAssignError = result.errMsg || '操作失败，请重试';
        }
      } catch (e) {
        uni.hideLoading();
        console.error('会员操作失败:', e);
        this.vipAssignError = '系统错误，请重试';
      }
    },
    
    cancelAssignVip() {
      // 关闭弹窗
      this.$refs.vipAssignPopup.close();
      
      // 重置表单
      this.vipAssignRecipients = [];
      this.isExtendVip = false;
      this.assignVipTypeIndex = 0;
      this.vipDurationIndex = 0;
      this.customDuration = false;
      this.customDurationDays = '';
      this.vipAssignError = '';
    },
    
    // 账户状态管理
    isUserActive(user) {
      return user.status === 'normal';
    },
    
    toggleUserStatus() {
      if (!this.currentUser || !this.currentUser._id) return;
      
      const isActive = this.isUserActive(this.currentUser);
      
      // 显示确认对话框
      this.confirmDialogType = isActive ? 'warn' : 'info';
      this.confirmDialogTitle = isActive ? '禁用账户确认' : '启用账户确认';
      this.confirmDialogContent = isActive 
        ? `确定要禁用 ${this.currentUser.nickname || this.currentUser.username || '此用户'} 的账户吗？禁用后用户将无法登录。`
        : `确定要启用 ${this.currentUser.nickname || this.currentUser.username || '此用户'} 的账户吗？`;
      this.confirmDialogCallback = this.confirmToggleStatus;
      this.$refs.confirmPopup.open();
    },
    
    async confirmToggleStatus() {
      try {
        uni.showLoading({ title: '处理中...' });
        
        const isActive = this.isUserActive(this.currentUser);
        const newStatus = isActive ? 'disabled' : 'normal';
        
        // 调用云函数更新状态
        const todo = uniCloud.importObject('todo');
        const result = await todo.UpdateUserStatus(this.currentUser._id, newStatus);
        
        uni.hideLoading();
        
        if (result && result.code === 0) {
          uni.showToast({
            title: isActive ? '账户已禁用' : '账户已启用',
            icon: 'success'
          });
          
          // 更新用户状态
          this.currentUser.status = newStatus;
          
          // 刷新用户列表
          this.loadUsers();
        } else {
          uni.showModal({
            title: '操作失败',
            content: result.errMsg || '更新账户状态失败',
            showCancel: false
          });
        }
      } catch (e) {
        uni.hideLoading();
        uni.showModal({
          title: '操作失败',
          content: '系统错误，请稍后再试',
          showCancel: false
        });
        console.error('更新账户状态失败:', e);
      }
    },
    
    // 确认对话框
    confirmDialogConfirm() {
      if (this.confirmDialogCallback) {
        this.confirmDialogCallback();
      }
      this.confirmDialogCallback = null;
    },
    
    confirmDialogClose() {
      this.confirmDialogCallback = null;
    },
    
    // 工具方法：用户相关
    getUserRoleBadge(user) {
      if (!user) return '';
      
      if (user.role === 'admin' || user.role === 'super-admin') {
        return '管理员';
      } else if (user.role === 'staff') {
        return '员工';
      }
      
      return '';
    },
    
    getRoleBadgeClass(user) {
      if (!user) return '';

      if (user.role === 'admin' || user.role === 'super-admin') {
        return 'admin-badge';
      } else if (user.role === 'staff') {
        return 'staff-badge';
      }

      return '';
    },

    getAccountStatusClass(user) {
      if (!user) return '';

      switch (user.status) {
        case 'normal': return 'status-normal';
        case 'disabled': return 'status-disabled';
        case 'limited': return 'status-limited';
        default: return '';
      }
    },

    getVipTypeText(type) {
      switch (type) {
        case 'weekly': return '周卡';
        case 'monthly': return '月卡';
        case 'quarterly': return '季卡';
        case 'yearly': return '年卡';
        default: return type;
      }
    },
    
    getAccountStatusText(user) {
      if (!user) return '未知状态';
      
      switch (user.status) {
        case 'normal': return '账户正常';
        case 'disabled': return '账户禁用';
        case 'limited': return '访问受限';
        default: return '未知状态';
      }
    },

    isVipActive(user) {
      return user && user.isMember;
    },
    
    formatVipExpiry(timestamp) {
      if (!timestamp) return '无有效期';
      
      const expireDate = new Date(timestamp);
      const now = new Date();
      
      // 如果已过期，显示已过期
      if (expireDate < now) {
        return '已过期';
      }
      
      return `有效期至 ${this.formatDate(timestamp)}`;
    },
    
    getRegisterSource(user) {
      if (!user) return '未知来源';
      
      switch (user.register_source) {
        case 'weixin': return '微信注册';
        case 'qq': return 'QQ注册';
        case 'mobile': return '手机号注册';
        case 'email': return '邮箱注册';
        default: return '未知来源';
      }
    },
    
    // 工具方法：订单相关
    getOrderStatusText(status) {
      switch (parseInt(status)) {
        case 0: return '待确认';
        case 1: return '已完成';
        case 2: return '未完成';
        case 3: return '已退款';
        default: return '未知状态';
      }
    },
    
    getOrderStatusClass(order) {
      switch (parseInt(order.status)) {
        case 0: return 'order-pending';
        case 1: return 'order-completed';
        case 2: return 'order-unfinished';
        case 3: return 'order-refunded';
        default: return '';
      }
    },
    
    // 工具方法：活动相关
    getActivityIcon(type) {
      switch (type) {
        case 'login': return 'personadd';
        case 'order': return 'cart';
        case 'reservation': return 'calendar';
        case 'vip': return 'star';
        case 'payment': return 'rmb';
        default: return 'info';
      }
    },
    
    getActivityIconClass(type) {
      switch (type) {
        case 'login': return 'icon-login';
        case 'order': return 'icon-order';
        case 'reservation': return 'icon-reservation';
        case 'vip': return 'icon-vip';
        case 'payment': return 'icon-payment';
        default: return 'icon-info';
      }
    },
    
    getActivityTitle(activity) {
      switch (activity.type) {
        case 'login': return '用户登录';
        case 'order': return '创建订单';
        case 'reservation': return '预约机台';
        case 'vip': return activity.action === 'purchase' ? '购买会员' : '会员变更';
        case 'payment': return '支付完成';
        default: return '用户活动';
      }
    },
    
    getActivityDetails(activity) {
      switch (activity.type) {
        case 'login':
          return `用户从 ${activity.details?.device || '未知设备'} 登录系统`;
        case 'order':
          return `创建了订单，使用机台 ${activity.details?.machineName || '未知机台'}，金额 ${this.formatAmount(activity.details?.amount || 0)}`;
        case 'reservation':
          return `预约了机台 ${activity.details?.machineName || '未知机台'}，时间 ${this.formatTime(activity.details?.startTime)} - ${this.formatTime(activity.details?.endTime)}`;
        case 'vip':
          if (activity.action === 'purchase') {
            return `购买了 ${this.getVipTypeText(activity.details?.vipType)} 会员，有效期 ${activity.details?.days || 0} 天`;
          } else {
            return `会员状态变更为 ${this.getVipTypeText(activity.details?.vipType)}`;
          }
        case 'payment':
          return `完成支付，金额 ${this.formatAmount(activity.details?.amount || 0)}，支付方式 ${activity.details?.paymentMethod || '未知'}`;
        default:
          return JSON.stringify(activity.details) || '无详细信息';
      }
    },
    
    // 工具方法：格式化
    formatPhone(phone) {
      if (!phone) return '';
      
      // 隐藏中间4位
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },
    
    formatAmount(amountInCents) {
      if (!amountInCents && amountInCents !== 0) return '¥0.00';
      const amountInYuan = (amountInCents / 100).toFixed(2);
      return `¥${amountInYuan}`;
    },

    // 新增方法
    isUserVip(user) {
      return user && (user.membership_expiry > Date.now() || user.subscription_package_expiry > Date.now());
    },

    getUserStatusClass(user) {
      if (!user) return '';
      switch (user.status) {
        case 0: return 'status-normal';
        case 1: return 'status-disabled';
        case 2: return 'status-limited';
        default: return 'status-normal';
      }
    },

    getUserStatusText(user) {
      if (!user) return '未知';
      switch (user.status) {
        case 0: return '正常';
        case 1: return '禁用';
        case 2: return '限制';
        default: return '正常';
      }
    },

  
    // 权限管理方法
    canPromoteUser(user) {
      if (!user || !this.hasAdminPermission) return false;
      // 管理员不能提权，普通用户可以提升为员工，员工可以提升为管理员
      if (user.role === 'admin' || user.role === 'super-admin') return false;
      return true;
    },

    canDemoteUser(user) {
      if (!user || !this.hasAdminPermission) return false;
      // 不能降权比自己权限高或同级的用户
      if (user.role === 'super-admin') return false;
      // 可以降权管理员、员工和普通用户（设置为禁用状态）
      if (user.role === 'admin' || user.role === 'staff' || user.role === 'user') return true;
      return false;
    },

    async promoteUser(user) {
      if (!user) return;

      const newRole = user.role === 'user' ? 'staff' : 'admin';
      const roleText = newRole === 'staff' ? '员工' : '管理员';

      uni.showModal({
        title: '权限提升确认',
        content: `确定要将 ${user.nickname || user.username || '此用户'} 提升为${roleText}吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' });

              // 调用云函数更新用户权限
              const todo = uniCloud.importObject('todo');
              const result = await todo.UpdateUserRole({
                userId: user._id,
                newRole: newRole
              });

              if (result && result.code === 0) {
                uni.showToast({
                  title: '权限提升成功',
                  icon: 'success'
                });

                // 更新本地数据
                user.role = newRole;
                user.role_display = newRole === 'staff' ? '员工' : '管理员';

                // 如果是当前查看的用户，也更新详情
                if (this.currentUser && this.currentUser._id === user._id) {
                  this.currentUser.role = newRole;
                  this.currentUser.role_display = user.role_display;
                }
              } else {
                uni.showToast({
                  title: result.errMsg || '权限提升失败',
                  icon: 'none'
                });
              }
            } catch (e) {
              uni.showToast({
                title: '系统错误，请稍后再试',
                icon: 'none'
              });
              console.error('权限提升失败:', e);
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },

    async demoteUser(user) {
      if (!user) return;

      const newRole = user.role === 'admin' ? 'staff' : 'user';
      const roleText = newRole === 'staff' ? '员工' : '普通用户';

      uni.showModal({
        title: '权限降低确认',
        content: `确定要将 ${user.nickname || user.username || '此用户'} 降级为${roleText}吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '处理中...' });

              // 调用云函数更新用户权限
              const todo = uniCloud.importObject('todo');
              const result = await todo.UpdateUserRole({
                userId: user._id,
                newRole: newRole
              });

              if (result && result.code === 0) {
                uni.showToast({
                  title: '权限降低成功',
                  icon: 'success'
                });

                // 更新本地数据
                user.role = newRole;
                user.role_display = newRole === 'staff' ? '员工' : '普通用户';

                // 如果是当前查看的用户，也更新详情
                if (this.currentUser && this.currentUser._id === user._id) {
                  this.currentUser.role = newRole;
                  this.currentUser.role_display = user.role_display;
                }
              } else {
                uni.showToast({
                  title: result.errMsg || '权限降低失败',
                  icon: 'none'
                });
              }
            } catch (e) {
              uni.showToast({
                title: '系统错误，请稍后再试',
                icon: 'none'
              });
              console.error('权限降低失败:', e);
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    
    formatDate(timestamp) {
      if (!timestamp) return '--';
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },
    
    formatDateForPicker(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
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
    
    formatLastLogin(timestamp) {
      if (!timestamp) return '未登录';
      
      const now = new Date();
      const loginDate = new Date(timestamp);
      const diffTime = Math.abs(now - loginDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return '今天';
      } else if (diffDays === 1) {
        return '昨天';
      } else if (diffDays < 30) {
        return `${diffDays}天前`;
      } else {
        return this.formatDate(timestamp);
      }
    },
    
    formatDuration(seconds) {
      if (!seconds) return '0小时';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours === 0) {
        return `${minutes}分钟`;
      } else if (minutes === 0) {
        return `${hours}小时`;
      } else {
        return `${hours}小时${minutes}分钟`;
      }
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

/* 样式延续 */
.glass-item {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 12px;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.glass-item:active {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.selected-user {
  background-color: rgba(59, 130, 246, 0.08);
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
  height: 40px;
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

/* 批量工具栏 */
.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(59, 130, 246, 0.1);
  border: 1px dashed rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 10px 16px;
  margin-top: 16px;
  animation: fadeIn 0.3s ease;
}

.selected-count {
  font-size: 14px;
  color: #3B82F6;
  font-weight: 500;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-action-button {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border: none;
}

.batch-action-button.danger {
  background: rgba(239, 68, 68, 0.9);
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

/* 用户列表容器 */
.users-list {
  max-height: 600px;
  overflow-y: auto;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

/* 空列表状态 */
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
  font-size: 14px;
}

/* 用户列表项 */
.user-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:active {
  background-color: #f9fafb;
}

/* 用户选择框 */
.user-select {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

/* 确保选择框在正确位置 */
.user-select checkbox {
  transform: scale(0.9);
}

.admin-badge {
  background-color: #F59E0B;
}

.staff-badge {
  background-color: #10B981;
}

/* 用户信息布局 */
.user-info {
  flex: 1;
  min-width: 0;
  margin-left: 45px;
  margin-right: 120px;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #1F2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vip-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  color: white;
  background: #F59E0B;
  font-weight: 500;
}

/* 用户详细信息 */
.user-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 4px;
}

.user-detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

/* 用户活动状态 */
.user-activity {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.activity-label {
  color: #6B7280;
}

.activity-value {
  font-weight: 500;
  color: #374151;
}

.activity-value.status-normal {
  color: #10B981;
}

.activity-value.status-disabled {
  color: #EF4444;
}

.activity-value.status-limited {
  color: #F59E0B;
}

.activity-divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #d1d5db;
  margin: 0 4px;
}

/* 文字按钮 */
.user-actions {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.action-button {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #4B5563;
  border: 1px solid #e5e7eb;
  white-space: nowrap;
  text-align: center;
}

.action-button.primary {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-color: rgba(59, 130, 246, 0.2);
}

/* 优化列表布局 */
.action-buttons-row {
  display: flex;
  gap: 8px;
}

.role-management-buttons {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.role-button {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  border: none;
  color: white;
  text-align: center;
}

.role-button.promote {
  background: #10B981;
}

.role-button.demote {
  background: #F59E0B;
}

/* 分页控件优化 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.pagination-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-count, .total-count {
  font-size: 12px;
  color: #6B7280;
}

.pagination-controls {
  display: flex;
  gap: 8px;
}

.page-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #374151;
}

.page-button:disabled {
  opacity: 0.5;
}

/* 弹窗样式 */
.detail-popup, .edit-popup, .message-popup, .vip-popup {
  width: 90%;
  max-width: 600px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-popup-header, .edit-popup-header, .message-popup-header, .vip-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-popup-title, .edit-popup-title, .message-popup-title, .vip-popup-title {
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

.detail-popup-content, .edit-popup-content, .message-popup-content, .vip-popup-content {
  flex: 1;
  max-height: 65vh;
  padding: 16px;
  overflow-y: auto;
}

.detail-popup-actions, .edit-popup-actions, .message-popup-actions, .vip-popup-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  gap: 10px;
}

.detail-action-button, .edit-cancel-button, .message-cancel-button, .vip-cancel-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.edit-confirm-button, .detail-action-button.primary, .message-send-button, .vip-confirm-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  background: #3B82F6;
  color: white;
  border: none;
}

/* 用户详情样式 */
.user-profile {
  background: rgba(249, 250, 251, 0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  background-color: #3B82F6;
}

.profile-status {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-bottom: 6px;
}

.status-normal {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.status-disabled {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.status-limited {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.profile-id {
  font-size: 12px;
  color: #6B7280;
}

.profile-vip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
}

.vip-badge {
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 8px;
  color: white;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  margin-bottom: 6px;
  font-weight: 500;
}

.vip-expiry {
  font-size: 12px;
  color: #6B7280;
}

.profile-quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-action-button {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  font-size: 12px;
  color: #3B82F6;
}

.warning-button {
  color: #EF4444;
}

.user-detail-tabs {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 20px;
}

.tab-item {
  font-size: 14px;
  padding: 10px 16px;
  color: #6B7280;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.active-tab {
  color: #3B82F6;
  border-bottom-color: #3B82F6;
  font-weight: 500;
}

.info-section {
  margin-bottom: 20px;
}

.info-group {
  background: #F9FAFB;
  border-radius: 12px;
  padding: 12px;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.info-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-label {
  width: 80px;
  font-size: 14px;
  color: #6B7280;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #1F2937;
}

/* 会员信息样式 */
.vip-info {
  background: rgba(249, 250, 251, 0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.vip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.vip-title {
  font-size: 18px;
  font-weight: 600;
  color: #D97706;
}

.vip-status {
  font-size: 14px;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.vip-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
}

.vip-detail-item {
  display: flex;
  flex-direction: column;
}

.vip-detail-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.vip-detail-value {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.vip-history-header {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.vip-history {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
}

.vip-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.vip-history-item:last-child {
  border-bottom: none;
}

.vip-history-type {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.vip-history-date {
  font-size: 12px;
  color: #6B7280;
}

.vip-history-price {
  font-size: 14px;
  color: #3B82F6;
  font-weight: 500;
}

.vip-admin-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.vip-admin-actions.single {
  justify-content: center;
}

.vip-admin-button {
  flex: 1;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #D1D5DB;
}

.vip-admin-button.warning {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.vip-admin-button.primary {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.no-vip-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #9ca3af;
}

.no-vip-message text {
  margin-top: 12px;
  margin-bottom: 24px;
  font-size: 16px;
}

.empty-data-message {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 14px;
}

/* 订单记录样式 */
.order-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(249, 250, 251, 0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 12px;
  color: #6B7280;
}

.summary-divider {
  width: 1px;
  height: 30px;
  background: rgba(209, 213, 219, 0.5);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.mini-refresh-button {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-radius: 4px;
  border: none;
}

.order-history {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.order-history-item {
  padding: 12px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.order-history-item:last-child {
  border-bottom: none;
}

.order-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-history-id {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
}

.order-history-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #D97706;
}

.order-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.order-completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.order-unfinished {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.order-refunded {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
}

.order-history-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-history-machine {
  font-size: 13px;
  color: #374151;
}

.order-history-time {
  font-size: 12px;
  color: #6B7280;
}

.order-history-price {
  font-size: 14px;
  color: #3B82F6;
  font-weight: 500;
}

.order-history-actions {
  display: flex;
  justify-content: flex-end;
}

.mini-action-button {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 活动记录样式 */
.activity-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(249, 250, 251, 0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.activity-timeline-header {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.activity-timeline {
  position: relative;
  padding-left: 24px;
}

.activity-timeline:before {
  content: "";
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 7px;
  width: 2px;
  background: rgba(209, 213, 219, 0.5);
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-icon {
  position: absolute;
  left: -24px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.icon-login {
  background: #3B82F6;
}

.icon-order {
  background: #F59E0B;
}

.icon-reservation {
  background: #10B981;
}

.icon-vip {
  background: #8B5CF6;
}

.icon-payment {
  background: #EC4899;
}

.icon-info {
  background: #6B7280;
}

.timeline-content {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: #1F2937;
}

.timeline-time {
  font-size: 12px;
  color: #6B7280;
}

.timeline-details {
  font-size: 13px;
  color: #4B5563;
}

/* 编辑表单样式 */
.edit-section {
  margin-bottom: 24px;
}

.edit-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #1F2937;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #4B5563;
  margin-bottom: 6px;
  display: block;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
}

.admin-remark-textarea {
  width: 100%;
  height: 100px;
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
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

/* 消息发送样式 */
.message-recipients {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.recipients-label {
  font-size: 14px;
  color: #4B5563;
}

.single-recipient {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.multiple-recipients {
  font-size: 14px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-radius: 4px;
  font-weight: 500;
}

.message-textarea {
  width: 100%;
  height: 150px;
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
}

/* 会员授予/延长样式 */
.vip-assign-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.vip-assign-label {
  font-size: 14px;
  color: #4B5563;
}

.vip-assign-name {
  font-size: 14px;
  color: #1F2937;
  font-weight: 500;
}

.vip-assign-count {
  font-size: 14px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
  border-radius: 4px;
  font-weight: 500;
}

.vip-duration-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.vip-duration-option {
  padding: 8px 16px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  color: #4B5563;
  transition: all 0.2s ease;
}

.selected-duration {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3B82F6;
}

.vip-summary {
  background: rgba(249, 250, 251, 0.7);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.vip-expiry-preview {
  font-size: 14px;
  color: #1F2937;
}

.vip-preview-label {
  color: #4B5563;
}

.vip-preview-value {
  font-weight: 500;
}

.vip-remark-textarea {
  width: 100%;
  height: 80px;
  padding: 12px;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 14px;
}

/* 响应式布局优化 */
@media screen and (max-width: 768px) {
  .user-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .user-info {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }

  .user-actions {
    width: 100%;
    align-items: center;
  }

  .user-avatar {
    width: 72px;
    height: 72px;
  }

  .user-activity {
    flex-direction: column;
    gap: 8px;
  }

  .activity-divider {
    width: 80%;
    height: 1px;
    margin: 4px 0;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .users-list {
    background: #1F2937;
    border-color: #374151;
  }

  .user-item {
    border-bottom-color: #374151;
  }

  .user-item:active {
    background-color: #374151;
  }

  .selected-user {
    background-color: rgba(59, 130, 246, 0.2);
  }

  .user-name {
    color: #F3F4F6;
  }

  .user-detail-item {
    color: #9CA3AF;
  }

  .activity-label {
    color: #9CA3AF;
  }

  .activity-value {
    color: #D1D5DB;
  }

  .activity-divider {
    background-color: #4B5563;
  }

  .action-button {
    background: #374151;
    color: #D1D5DB;
  }

  .action-button.primary {
    background: rgba(59, 130, 246, 0.2);
    color: #60A5FA;
  }

  .role-management-buttons {
    background: #1F2937;
  }

  .pagination {
    background: #111827;
    border-color: #374151;
  }

  .page-button {
    background: #1F2937;
    border-color: #374151;
    color: #D1D5DB;
  }
}

/* 响应式优化 */
@media screen and (max-width: 480px) {
  .user-actions {
    position: static;
    transform: none;
    flex-direction: row;
    justify-content: center;
    margin-top: 12px;
    width: 100%;
  }

  .user-detail-item {
    max-width: 150px;
  }

  .user-activity {
    flex-direction: column;
    gap: 4px;
  }

  .activity-divider {
    display: none;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-info {
    align-items: center;
  }
}
</style>