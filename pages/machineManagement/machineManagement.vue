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
	
    
	
    <!-- 统一排序视图 -->
    <view class="section">
      <view class="section-header">
        <view class="section-title">机台统一排序与修改</view>
        <view class="section-description">
          <text>所有机台按分组统一显示，可通过上下按钮进行排序，支持跨分组移动</text>
        </view>
      </view>
	  <!-- 添加机台按钮 -->
	  <view class="add-machine-section">
	    <button class="btn btn-add-machine" @click="showAddMachineModal">添加机台</button>
	  </view>
      <view class="unified-sort-container">
        <!-- 未分组机台 -->
        <view class="group-section" v-if="ungroupedMachines.length > 0">
          <view class="group-header">
            <text class="group-title">未分组</text>
          </view>
          <view class="machines-in-group">
            <view v-for="(machine, index) in ungroupedMachines" :key="machine._id" class="unified-machine-item">
              <view class="machine-info">
                <text class="machine-name">{{machine.name}}</text>
              </view>
              <view class="machine-sort-actions">
                <button class="edit-btn" @click="editMachine(machine)">编辑</button>
                <button class="sort-btn sort-up" @click="moveMachineUp('ungrouped', index)" :disabled="index === 0 && sortedGroups.length === 0">上移</button>
                <button class="sort-btn sort-down" @click="moveMachineDown('ungrouped', index)" :disabled="index === ungroupedMachines.length - 1 && sortedGroups.length === 0">下移</button>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 各分组机台 -->
        <view v-for="group in sortedGroups" :key="group._id" class="group-section">
          <view class="group-header">
            <text class="group-title">{{group.name}}</text>
          </view>
          <view class="machines-in-group">
            <view v-for="(machine, index) in getMachinesInGroup(group._id)" :key="machine._id" class="unified-machine-item">
              <view class="machine-info">
                <text class="machine-name">{{machine.name}}</text>
              </view>
              <view class="machine-sort-actions">
                <button class="edit-btn" @click="editMachine(machine)">编辑</button>
                <button class="sort-btn sort-up" @click="moveMachineUp(group._id, index)" :disabled="index === 0 && group.displayOrder === 0">上移</button>
                <button class="sort-btn sort-down" @click="moveMachineDown(group._id, index)" :disabled="index === getMachinesInGroup(group._id).length - 1 && group.displayOrder === sortedGroups.length - 1">下移</button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 机台分组设置 -->
    <view class="section">
      <view class="section-title">机台分组设置</view>
	  <view class="section-description">
	    <text>这部分暂时不需要了，机台分组请使用上面的功能，目前此部分只作为测试使用</text>
	  </view>
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

    <!-- 添加/编辑机台的弹出框 -->
    <uni-popup ref="machinePopup" type="dialog">
      <uni-popup-dialog
        :title="machineModalTitle"
        :before-close="true"
        @confirm="confirmMachineModal"
        @close="closeMachineModal">
        <view class="modal-content">
          <view class="input-item">
            <text class="label">机台名称</text>
            <input type="text" v-model="currentMachine.name" placeholder="请输入机台名称" />
          </view>
          <view class="input-item">
            <text class="label">机台类型</text>
            <input type="text" v-model="currentMachine.type" placeholder="请输入机台类型" />
          </view>
          <view class="input-item">
            <text class="label">容纳人数</text>
            <input type="number" v-model="currentMachine.capacity" placeholder="请输入容纳人数" />
          </view>
          <view class="input-item">
            <text class="label">机台编号（此编号绑定订单，一旦修改订单逻辑会乱！）</text>
            <input type="text" v-model="currentMachine.machinenum" placeholder="请输入机台编号" />
          </view>
          <view class="input-item">
            <text class="label">所属分组</text>
            <picker @change="changeMachineGroup" :value="getMachineGroupIndex(currentMachine.groupId)" :range="machineGroupNames">
              <view class="picker">{{getMachineGroupName(currentMachine.groupId) || '未分组'}}</view>
            </picker>
          </view>
          <view class="input-item">
            <text class="label">机台状态</text>
            <picker @change="changeMachineStatus" :value="currentMachine.status === '可用' ? 0 : 1" :range="['可用', '维护中']">
              <view class="picker">{{currentMachine.status || '可用'}}</view>
            </picker>
          </view>
          <view class="input-item">
            <text class="label">机台描述 (可选)</text>
            <textarea v-model="currentMachine.description" placeholder="请输入机台描述"></textarea>
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>

    
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const popup = ref(null);
const machinePopup = ref(null);
const groups = ref([]);
const machines = ref([]);
const currentGroup = ref({
  name: '',
  displayOrder: 0,
  description: ''
});
const currentMachine = ref({
  name: '',
  type: '',
  capacity: '',
  machinenum: '',
  groupId: null,
  status: '可用',
  description: ''
});
const modalTitle = ref('添加分组');
const machineModalTitle = ref('添加机台');
const isEditMode = ref(false);
const isMachineEditMode = ref(false);

const todo = uniCloud.importObject('todo');

// 分组名称列表（用于选择器）
const groupNames = computed(() => {
  return ['未分组'].concat(groups.value.map(group => group.name));
});

// 机台分组名称列表（用于选择器）
const machineGroupNames = computed(() => {
  return ['未分组'].concat(groups.value.map(group => group.name));
});

// 排序后的分组列表
const sortedGroups = computed(() => {
  return [...groups.value].sort((a, b) => a.displayOrder - b.displayOrder);
});

// 未分组的机台
const ungroupedMachines = computed(() => {
  return machines.value.filter(machine => !machine.groupId).sort((a, b) => a.groupDisplayOrder - b.groupDisplayOrder);
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

// 获取机台分组索引
function getMachineGroupIndex(groupId) {
  if (!groupId) return 0; // 未分组
  const index = groups.value.findIndex(g => g._id === groupId);
  return index >= 0 ? index + 1 : 0;
}

// 获取机台分组名称
function getMachineGroupName(groupId) {
  const group = groups.value.find(g => g._id === groupId);
  return group ? group.name : null;
}

// 获取分组内的机台
function getMachinesInGroup(groupId) {
  return machines.value
    .filter(machine => machine.groupId === groupId)
    .sort((a, b) => a.groupDisplayOrder - b.groupDisplayOrder);
}

// 检查是否可以从分组向上移动（跨组）
function canMoveUpFromGroup(groupId) {
  const groupIndex = sortedGroups.value.findIndex(g => g._id === groupId);
  return groupIndex > 0 || ungroupedMachines.value.length > 0;
}

// 检查是否可以从分组向下移动（跨组）
function canMoveDownFromGroup(groupId) {
  const groupIndex = sortedGroups.value.findIndex(g => g._id === groupId);
  return groupIndex < sortedGroups.value.length - 1;
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

// 移动机台向上
async function moveMachineUp(groupId, machineIndex) {
  if (machineIndex === 0) {
    // 检查是否可以跨组移动（移动到上一个分组的最后一个位置）
    await moveToPreviousGroup(groupId, machineIndex);
    return;
  }
  
  const machinesInGroup = groupId === 'ungrouped' 
    ? ungroupedMachines.value 
    : getMachinesInGroup(groupId);
  
  const currentMachine = machinesInGroup[machineIndex];
  const previousMachine = machinesInGroup[machineIndex - 1];
  
  // 交换排序值
  const tempOrder = currentMachine.groupDisplayOrder;
  currentMachine.groupDisplayOrder = previousMachine.groupDisplayOrder;
  previousMachine.groupDisplayOrder = tempOrder;
  
  // 更新数据库
  await Promise.all([
    updateMachineOrder(currentMachine._id, currentMachine.groupDisplayOrder),
    updateMachineOrder(previousMachine._id, previousMachine.groupDisplayOrder)
  ]);
  
  // 重新加载数据
  await loadData();
}

// 移动机台向下
async function moveMachineDown(groupId, machineIndex) {
  const machinesInGroup = groupId === 'ungrouped' 
    ? ungroupedMachines.value 
    : getMachinesInGroup(groupId);
  
  // 检查是否可以跨组移动（移动到下一个分组的第一个位置）
  if (machineIndex === machinesInGroup.length - 1) {
    await moveToNextGroup(groupId, machineIndex);
    return;
  }
  
  const currentMachine = machinesInGroup[machineIndex];
  const nextMachine = machinesInGroup[machineIndex + 1];
  
  // 交换排序值
  const tempOrder = currentMachine.groupDisplayOrder;
  currentMachine.groupDisplayOrder = nextMachine.groupDisplayOrder;
  nextMachine.groupDisplayOrder = tempOrder;
  
  // 更新数据库
  await Promise.all([
    updateMachineOrder(currentMachine._id, currentMachine.groupDisplayOrder),
    updateMachineOrder(nextMachine._id, nextMachine.groupDisplayOrder)
  ]);
  
  // 重新加载数据
  await loadData();
}

// 移动到下一个分组
async function moveToNextGroup(currentGroupId, machineIndex) {
  const machinesInGroup = currentGroupId === 'ungrouped' 
    ? ungroupedMachines.value 
    : getMachinesInGroup(currentGroupId);
  
  const currentMachine = machinesInGroup[machineIndex];
  
  // 获取当前分组在排序列表中的位置
  let currentGroupOrder = -1;
  if (currentGroupId === 'ungrouped') {
    currentGroupOrder = -1; // 未分组在最前面
  } else {
    const currentGroup = groups.value.find(g => g._id === currentGroupId);
    currentGroupOrder = currentGroup ? currentGroup.displayOrder : -1;
  }
  
  // 获取下一个分组（按displayOrder排序）
  let nextGroup = null;
  if (currentGroupId === 'ungrouped') {
    nextGroup = sortedGroups.value.find(g => g.displayOrder === 0);
  } else {
    nextGroup = sortedGroups.value.find(g => g.displayOrder === currentGroupOrder + 1);
  }
  
  if (!nextGroup) return;
  
  // 获取目标分组的机台数量
  const targetMachines = getMachinesInGroup(nextGroup._id);
  const newOrder = targetMachines.length > 0 ? Math.max(...targetMachines.map(m => m.groupDisplayOrder)) + 1 : 0;
  
  // 更改机台分组和排序
  await todo.updateMachineGroup(currentMachine._id, nextGroup._id);
  await updateMachineOrder(currentMachine._id, newOrder);
  
  // 重新加载数据
  await loadData();
  
  uni.showToast({
    icon: 'success',
    title: `已移动到${nextGroup.name}`,
    duration: 2000
  });
}

// 移动到上一个分组
async function moveToPreviousGroup(currentGroupId, machineIndex) {
  const machinesInGroup = currentGroupId === 'ungrouped' 
    ? ungroupedMachines.value 
    : getMachinesInGroup(currentGroupId);
  
  const currentMachine = machinesInGroup[machineIndex];
  
  // 获取当前分组的displayOrder
  let currentGroupOrder = -1;
  if (currentGroupId === 'ungrouped') {
    return; // 未分组在最前面，不能向上移动
  } else {
    const currentGroup = groups.value.find(g => g._id === currentGroupId);
    currentGroupOrder = currentGroup ? currentGroup.displayOrder : -1;
  }
  
  // 获取上一个分组（按displayOrder排序）
  let previousGroup = null;
  if (currentGroupOrder === 0) {
    previousGroup = null; // 移动到未分组
  } else {
    previousGroup = sortedGroups.value.find(g => g.displayOrder === currentGroupOrder - 1);
  }
  
  // 获取目标分组的机台数量
  let targetMachines = [];
  if (previousGroup) {
    targetMachines = getMachinesInGroup(previousGroup._id);
  } else {
    targetMachines = ungroupedMachines.value;
  }
  const newOrder = targetMachines.length > 0 ? Math.max(...targetMachines.map(m => m.groupDisplayOrder)) + 1 : 0;
  
  // 更改机台分组和排序
  const newGroupId = previousGroup ? previousGroup._id : null;
  await todo.updateMachineGroup(currentMachine._id, newGroupId);
  await updateMachineOrder(currentMachine._id, newOrder);
  
  // 重新加载数据
  await loadData();
  
  const targetGroupName = previousGroup ? previousGroup.name : '未分组';
  uni.showToast({
    icon: 'success',
    title: `已移动到${targetGroupName}`,
    duration: 2000
  });
}

// 显示添加机台弹窗
function showAddMachineModal() {
  machineModalTitle.value = '添加机台';
  currentMachine.value = {
    name: '',
    type: '',
    capacity: '',
    machinenum: '',
    groupId: null,
    status: '可用',
    description: ''
  };
  isMachineEditMode.value = false;
  machinePopup.value.open();
}

// 编辑机台
function editMachine(machine) {
  machineModalTitle.value = '编辑机台';
  currentMachine.value = { ...machine };
  isMachineEditMode.value = true;
  machinePopup.value.open();
}

// 更改机台分组（在弹窗中）
function changeMachineGroup(event) {
  const index = event.detail.value;
  if (index > 0) {
    currentMachine.value.groupId = groups.value[index - 1]._id;
  } else {
    currentMachine.value.groupId = null;
  }
}

// 更改机台状态
function changeMachineStatus(event) {
  const index = event.detail.value;
  currentMachine.value.status = index === 0 ? '可用' : '维护中';
}

// 确认添加/编辑机台
async function confirmMachineModal() {
  try {
    if (!currentMachine.value.name) {
      uni.showToast({
        icon: 'none',
        title: '机台名称不能为空',
        duration: 2000
      });
      return;
    }

    if (isMachineEditMode.value) {
      // 编辑模式
      await todo.updateMachine(currentMachine.value._id, {
        name: currentMachine.value.name,
        type: currentMachine.value.type || '',
        capacity: parseInt(currentMachine.value.capacity) || 0,
        machinenum: currentMachine.value.machinenum || '',
        groupId: currentMachine.value.groupId,
        status: currentMachine.value.status || '可用',
        description: currentMachine.value.description || ''
      });
    } else {
      // 添加模式 - 自动放置到分组的最后位置
      let groupDisplayOrder = 0;
      if (currentMachine.value.groupId) {
        const machinesInGroup = machines.value.filter(m => m.groupId === currentMachine.value.groupId);
        groupDisplayOrder = machinesInGroup.length > 0 ? Math.max(...machinesInGroup.map(m => m.groupDisplayOrder)) + 1 : 0;
      } else {
        const ungroupedMachines = machines.value.filter(m => !m.groupId);
        groupDisplayOrder = ungroupedMachines.length > 0 ? Math.max(...ungroupedMachines.map(m => m.groupDisplayOrder)) + 1 : 0;
      }

      await todo.addMachine({
        name: currentMachine.value.name,
        type: currentMachine.value.type || '',
        capacity: parseInt(currentMachine.value.capacity) || 0,
        machinenum: currentMachine.value.machinenum || '',
        groupId: currentMachine.value.groupId,
        status: currentMachine.value.status || '可用',
        description: currentMachine.value.description || '',
        groupDisplayOrder: groupDisplayOrder
      });
    }

    // 重新加载数据
    await loadData();

    uni.showToast({
      icon: 'success',
      title: isMachineEditMode.value ? '编辑成功' : '添加成功',
      duration: 2000
    });

    closeMachineModal();
  } catch (error) {
    console.error(isMachineEditMode.value ? "编辑机台失败:" : "添加机台失败:", error);
    uni.showToast({
      icon: 'none',
      title: isMachineEditMode.value ? '编辑机台失败' : '添加机台失败',
      duration: 2000
    });
  }
}

// 关闭机台弹窗
function closeMachineModal() {
  machinePopup.value.close();
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
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
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

.btn-add-machine {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  width: 100%;
  margin-top: 40rpx;
  padding: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.add-machine-section {
  margin-top: 40rpx;
  margin-bottom: 40rpx;
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

/* 统一排序样式 */
.section-description {
  margin-bottom: 30rpx;
  padding: 16rpx 20rpx;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12rpx;
  border-left: 4rpx solid #3b82f6;
}

.section-description text {
  font-size: 28rpx;
  color: #4b5563;
  line-height: 1.5;
}

.unified-sort-container {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.group-section {
  background: rgba(248, 249, 250, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.group-header {
  background: rgba(233, 236, 239, 0.9);
  backdrop-filter: blur(10px);
  padding: 24rpx 30rpx;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.group-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #495057;
}

.machines-in-group {
  padding: 20rpx;
}

.unified-machine-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.unified-machine-item:last-child {
  margin-bottom: 0;
}

.unified-machine-item:active {
  transform: translateY(1rpx);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.machine-info {
  flex: 1;
}

.machine-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.machine-sort-actions {
  display: flex;
  gap: 12rpx;
}

.edit-btn {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
  color: white;
  min-width: 80rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.edit-btn:active {
  transform: scale(0.95);
}

.sort-btn {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
  color: white;
  min-width: 80rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sort-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.sort-btn:not(:disabled):active {
  transform: scale(0.95);
}

.sort-up {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.sort-down {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .container {
    background: #121212;
  }
  
  .section {
    background: rgba(30, 30, 30, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .title, .section-title {
    color: #e0e0e0;
  }

  .section-header {
    margin-bottom: 30rpx;
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
  
  /* 深色模式统一排序样式 */
  .section-description {
    background: rgba(59, 130, 246, 0.2);
    border-left-color: #60a5fa;
  }

  .section-description text {
    color: #d1d5db;
  }

  .group-section {
    background: rgba(42, 42, 42, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .group-header {
    background: rgba(51, 51, 51, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #555;
  }
  
  .group-title {
    color: #e0e0e0;
    font-size: 40rpx;
  }
  
  .unified-machine-item {
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .machine-name {
    color: #e0e0e0;
  }

  .sort-up {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
  }

  .sort-down {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
  }

  .edit-btn {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
  }

  .btn-add-machine {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
  }
}
</style>
