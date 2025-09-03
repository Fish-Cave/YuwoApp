<template>
  <view class="container">
    <view class="header">
      <view class="title">机台分组管理</view>
    </view>
    
    <!-- 分组管理部分 -->
    <view class="section">
      <view class="section-title">分组管理</view>
      <view class="group-list">
        <view v-for="group in groups" :key="group._id" class="group-item">
          <view class="group-content">
            <text class="group-name">{{group.name}}</text>
            <text class="group-order">排序：{{group.displayOrder}}</text>
          </view>
          <view class="group-actions">
            <button class="btn btn-edit" @click="editGroup(group)">编辑</button>
            <button class="btn btn-delete" @click="deleteGroup(group._id)">删除</button>
          </view>
        </view>
      </view>
      <button class="btn btn-add" @click="showAddGroupModal">添加分组</button>
    </view>
    
    <!-- 机台分组设置 -->
    <view class="section">
      <view class="section-title">机台分组设置</view>
      <view class="machine-list">
        <view v-for="machine in machines" :key="machine._id" class="machine-item">
          <view class="machine-content">
            <text class="machine-name">{{machine.name}}</text>
            <view class="machine-group">
              <text>所属分组：</text>
              <picker @change="changeGroup(machine._id, $event)" :value="getGroupIndex(machine.groupId)" :range="groupNames">
                <view class="picker">{{getGroupName(machine.groupId) || '未分组'}}</view>
              </picker>
            </view>
            <view class="machine-order">
              <text>组内排序：</text>
              <input type="number" v-model="machine.groupDisplayOrder" @blur="updateMachineOrder(machine._id, machine.groupDisplayOrder)" />
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 添加/编辑分组的弹出框 -->
    <uni-popup ref="popup" type="dialog">
      <uni-popup-dialog
        :title="modalTitle"
        :before-close="true"
        @confirm="confirmGroupModal"
        @close="closeGroupModal">
        <view class="modal-content">
          <view class="input-item">
            <text class="label">分组名称</text>
            <input type="text" v-model="currentGroup.name" placeholder="请输入分组名称" />
          </view>
          <view class="input-item">
            <text class="label">显示顺序</text>
            <input type="number" v-model="currentGroup.displayOrder" placeholder="数字越小越靠前" />
          </view>
          <view class="input-item">
            <text class="label">分组描述 (可选)</text>
            <textarea v-model="currentGroup.description" placeholder="请输入分组描述"></textarea>
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const popup = ref(null);
const groups = ref([]);
const machines = ref([]);
const currentGroup = ref({
  name: '',
  displayOrder: 0,
  description: ''
});
const modalTitle = ref('添加分组');
const isEditMode = ref(false);

const todo = uniCloud.importObject('todo');

// 分组名称列表（用于选择器）
const groupNames = computed(() => {
  return ['未分组'].concat(groups.value.map(group => group.name));
});

// 获取分组名称
function getGroupName(groupId) {
  const group = groups.value.find(g => g._id === groupId);
  return group ? group.name : null;
}

// 获取分组索引
function getGroupIndex(groupId) {
  if (!groupId) return 0; // 未分组
  const index = groups.value.findIndex(g => g._id === groupId);
  return index >= 0 ? index + 1 : 0; // +1 是因为第一项是"未分组"
}

// 加载数据
async function loadData() {
  try {
    // 加载分组数据
    const groupsResult = await todo.getGroups();
    groups.value = groupsResult.data || [];
    
    // 加载机台数据
    const machinesResult = await todo.getMachines();
    machines.value = machinesResult.data || [];
  } catch (error) {
    console.error("加载数据失败:", error);
    uni.showToast({
      icon: 'none',
      title: '加载数据失败',
      duration: 2000
    });
  }
}

// 显示添加分组弹窗
function showAddGroupModal() {
  modalTitle.value = '添加分组';
  currentGroup.value = {
    name: '',
    displayOrder: groups.value.length, // 默认放在最后
    description: ''
  };
  isEditMode.value = false;
  popup.value.open();
}

// 显示编辑分组弹窗
function editGroup(group) {
  modalTitle.value = '编辑分组';
  currentGroup.value = { ...group };
  isEditMode.value = true;
  popup.value.open();
}

// 确认添加/编辑分组
async function confirmGroupModal() {
  try {
    if (!currentGroup.value.name) {
      uni.showToast({
        icon: 'none',
        title: '分组名称不能为空',
        duration: 2000
      });
      return;
    }
    
    if (isEditMode.value) {
      // 编辑模式
      await todo.updateGroup(currentGroup.value._id, {
        name: currentGroup.value.name,
        displayOrder: parseInt(currentGroup.value.displayOrder) || 0,
        description: currentGroup.value.description || ''
      });
    } else {
      // 添加模式
      await todo.addGroup({
        name: currentGroup.value.name,
        displayOrder: parseInt(currentGroup.value.displayOrder) || 0,
        description: currentGroup.value.description || ''
      });
    }
    
    // 重新加载数据
    await loadData();
    
    uni.showToast({
      icon: 'success',
      title: isEditMode.value ? '编辑成功' : '添加成功',
      duration: 2000
    });
    
    closeGroupModal();
  } catch (error) {
    console.error(isEditMode.value ? "编辑分组失败:" : "添加分组失败:", error);
    uni.showToast({
      icon: 'none',
      title: isEditMode.value ? '编辑分组失败' : '添加分组失败',
      duration: 2000
    });
  }
}

// 关闭弹窗
function closeGroupModal() {
  popup.value.close();
}

// 删除分组
async function deleteGroup(groupId) {
  try {
    // 显示确认弹窗
    uni.showModal({
      title: '确认删除',
      content: '删除分组后，该分组下的机台将变为未分组状态。确定要删除吗？',
      success: async (res) => {
        if (res.confirm) {
          await todo.deleteGroup(groupId);
          
          // 重新加载数据
          await loadData();
          
          uni.showToast({
            icon: 'success',
            title: '删除成功',
            duration: 2000
          });
        }
      }
    });
  } catch (error) {
    console.error("删除分组失败:", error);
    uni.showToast({
      icon: 'none',
      title: '删除分组失败',
      duration: 2000
    });
  }
}

// 更改机台所属分组
async function changeGroup(machineId, event) {
  const index = event.detail.value;
  let groupId = null;
  
  // 如果不是选择"未分组"，则获取对应的分组ID
  if (index > 0) {
    groupId = groups.value[index - 1]._id;
  }
  
  try {
    await todo.updateMachineGroup(machineId, groupId);
    
    // 更新本地数据
    const machineIndex = machines.value.findIndex(m => m._id === machineId);
    if (machineIndex >= 0) {
      machines.value[machineIndex].groupId = groupId;
    }
    
    uni.showToast({
      icon: 'success',
      title: '分组更新成功',
      duration: 1500
    });
  } catch (error) {
    console.error("更新机台分组失败:", error);
    uni.showToast({
      icon: 'none',
      title: '更新分组失败',
      duration: 2000
    });
  }
}

// 更新机台排序
async function updateMachineOrder(machineId, order) {
  try {
    const orderNum = parseInt(order) || 0;
    await todo.updateMachineOrder(machineId, orderNum);
    
    uni.showToast({
      icon: 'success',
      title: '排序更新成功',
      duration: 1500
    });
  } catch (error) {
    console.error("更新机台排序失败:", error);
    uni.showToast({
      icon: 'none',
      title: '更新排序失败',
      duration: 2000
    });
  }
}

onMounted(() => {
  loadData();
});
</script>

<style>
.container {
  padding: 30rpx;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.section {
  margin-bottom: 60rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  color: #333;
  border-left: 8rpx solid #3b82f6;
  padding-left: 20rpx;
}

.group-list, .machine-list {
  margin-bottom: 30rpx;
}

.group-item, .machine-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}

.group-content, .machine-content {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.group-name, .machine-name {
  font-weight: bold;
}

.group-order, .machine-order, .machine-group {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #666;
}

.group-actions {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.btn {
  padding: 10rpx 30rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.btn-edit {
  background-color: #3b82f6;
  color: white;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
}

.btn-add {
  background-color: #10b981;
  color: white;
  width: 100%;
  margin-top: 20rpx;
}

.modal-content {
  padding: 20rpx 0;
}

.input-item {
  margin-bottom: 20rpx;
}

.label {
  display: block;
  margin-bottom: 10rpx;
  font-size: 28rpx;
  color: #666;
}

input, textarea {
  width: 100%;
  border: 1px solid #ddd;
  padding: 16rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

textarea {
  height: 160rpx;
}

.picker {
  padding: 10rpx 20rpx;
  border: 1px solid #ddd;
  border-radius: 8rpx;
  min-width: 200rpx;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .container {
    background: #121212;
  }
  
  .section {
    background: #1e1e1e;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
  
  .title, .section-title {
    color: #e0e0e0;
  }
  
  .group-item, .machine-item {
    border-bottom: 1px solid #333;
  }
  
  .group-name, .machine-name {
    color: #e0e0e0;
  }
  
  .group-order, .machine-order, .machine-group, .label {
    color: #a0a0a0;
  }
  
  input, textarea, .picker {
    background: #333;
    color: #e0e0e0;
    border-color: #555;
  }
}
</style>
