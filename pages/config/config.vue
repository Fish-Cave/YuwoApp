<template>
	<view class="container">
		<!-- Header Section -->
		<view class="header-card glass-card">
			<view class="header-title">系统配置管理</view>
			<view class="header-subtitle">管理页面仅限管理员访问</view>
		</view>

		<!-- Machine Management Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">机台管理</text>
				<text class="card-action" @click="toggleSection('machine')">
					{{ sections.machine ? '收起' : '展开' }}
				</text>
			</view>
			
			<view v-if="sections.machine" class="section-content">
				<!-- 机台表单模式切换 -->
				<view class="form-mode-switch">
					<view 
						:class="['mode-button', machineFormMode === 'add' ? 'mode-active' : '']" 
						@click="switchMachineFormMode('add')">
						新增机台
					</view>
					<view 
						:class="['mode-button', machineFormMode === 'edit' ? 'mode-active' : '']" 
						@click="switchMachineFormMode('edit')">
						编辑机台
					</view>
				</view>

				<!-- 编辑模式下显示机台选择器 -->
				<view v-if="machineFormMode === 'edit'" class="form-group">
					<text class="form-label">选择要编辑的机台</text>
					<picker @change="onMachinePickerChange" :value="selectedMachineIndex" :range="machinePickerRange">
						<view class="uni-input picker-input">{{ machinePickerRange[selectedMachineIndex] || '请选择机台' }}</view>
					</picker>
				</view>
				
				<view class="form-group">
					<text class="form-label">机台名称</text>
					<uni-easyinput v-model="machineData.name" placeholder="输入机台名称" />
				</view>
				
				<view class="form-group">
					<text class="form-label">类型</text>
					<uni-easyinput v-model="machineData.type" placeholder="输入机台类型" />
				</view>
				
				<view class="form-group">
					<text class="form-label">容量</text>
					<uni-easyinput v-model="machineData.capacity" placeholder="输入最大容量" type="number" />
				</view>
				
				<view class="form-group">
					<text class="form-label">编号</text>
					<uni-easyinput v-model="machineData.machinenum" placeholder="输入机台编号" type="number" />
				</view>
				
				<view class="form-group">
					<text class="form-label">状态</text>
					<uni-data-checkbox
						v-model="machineData.status"
						:localdata="machineStatusOptions"
					></uni-data-checkbox>
				</view>
				
				<view class="form-group">
					<text class="form-label">描述</text>
					<uni-easyinput
						v-model="machineData.description"
						placeholder="输入机台描述"
						type="textarea"
						:maxlength="-1"
					/>
				</view>
				
				<view class="button-group">
					<button class="secondary-button" @click="resetMachineForm">重置</button>
					<button class="primary-button" @click="handleMachineAction">
						{{ machineFormMode === 'add' ? '添加机台' : '保存修改' }}
					</button>
				</view>
				
				<!-- Machine List -->
				<view class="list-header">
					<text>当前机台列表</text>
					<button class="refresh-button" @click="loadMachines">刷新</button>
				</view>
				
				<view class="machine-list">
					<view v-for="(machine, index) in machines" :key="index" class="machine-item glass-item">
						<view class="machine-info">
							<text class="machine-name">{{machine.name}}</text>
							<text class="machine-status" :class="getStatusClass(machine.status)">{{getStatusText(machine.status)}}</text>
						</view>
						<view class="machine-details">
							<text>类型: {{machine.type || '未设置'}}</text>
							<text>容量: {{machine.capacity}}</text>
							<text>编号: {{machine.machinenum}}</text>
						</view>
						<view class="item-actions">
							<button class="action-button edit-button" @click="editMachine(machine)">编辑</button>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- Price Management Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">价格管理</text>
				<text class="card-action" @click="toggleSection('price')">
					{{ sections.price ? '收起' : '展开' }}
				</text>
			</view>
			
			<view v-if="sections.price" class="section-content">
				<!-- 价格表单模式切换 -->
				<view class="form-mode-switch">
					<view 
						:class="['mode-button', priceFormMode === 'add' ? 'mode-active' : '']" 
						@click="switchPriceFormMode('add')">
						新增价格
					</view>
					<view 
						:class="['mode-button', priceFormMode === 'edit' ? 'mode-active' : '']" 
						@click="switchPriceFormMode('edit')">
						编辑价格
					</view>
				</view>

				<!-- 编辑模式下显示价格选择器 -->
				<view v-if="priceFormMode === 'edit'" class="form-group">
					<text class="form-label">选择要编辑的价格</text>
					<picker @change="onPricePickerChange" :value="selectedPriceIndex" :range="pricePickerRange">
						<view class="uni-input picker-input">{{ pricePickerRange[selectedPriceIndex] || '请选择价格方案' }}</view>
					</picker>
				</view>
				
				<view class="form-group">
					<text class="form-label">适用日期</text>
					<uni-easyinput v-model="priceData.weekdays" placeholder="输入星期，例如 [1, 2, 3, 4, 5]" />
				</view>
				
				<view class="form-group">
					<text class="form-label">价格</text>
					<uni-easyinput v-model="priceData.price" placeholder="输入价格" type="number" />
				</view>
				
				<view class="form-group">
					<text class="form-label">单位</text>
					<uni-easyinput v-model="priceData.unit" placeholder="输入价格单位，如元/小时" />
				</view>
				
				<view class="form-group">
					<text class="form-label">类型</text>
					<uni-easyinput v-model="priceData.type" placeholder="输入价格类型，如会员/普通" />
				</view>
				
				<view class="form-group">
					<text class="form-label">描述</text>
					<uni-easyinput
						v-model="priceData.description"
						placeholder="输入价格描述"
						type="textarea"
						:maxlength="-1"
					/>
				</view>
				
				<view class="button-group">
					<button class="secondary-button" @click="resetPriceForm">重置</button>
					<button class="primary-button" @click="handlePriceAction">
						{{ priceFormMode === 'add' ? '添加价格' : '保存修改' }}
					</button>
				</view>
				
				<!-- Price List -->
				<view class="list-header">
					<text>当前价格列表</text>
					<button class="refresh-button" @click="loadPrices">刷新</button>
				</view>
				
				<view class="price-list">
					<view v-for="(price, index) in prices" :key="index" class="price-item glass-item">
						<view class="price-info">
							<text class="price-type">{{price.type}}</text>
							<text class="price-value">{{price.price}}{{price.unit}}</text>
						</view>
						<view class="price-details">
							<text>适用日期: {{price.weekdays}}</text>
							<text>{{price.description || '无描述'}}</text>
						</view>
						<view class="item-actions">
							<button class="action-button edit-button" @click="editPrice(price)">编辑</button>
						</view>
					</view>
				</view>
				
				<!-- VIP Price Section -->
				<view class="subsection-header">
					<text>会员价格设置</text>
				</view>
				
				<!-- VIP价格表单模式切换 -->
				<view class="form-mode-switch">
					<view 
						:class="['mode-button', vipPriceFormMode === 'add' ? 'mode-active' : '']" 
						@click="switchVipPriceFormMode('add')">
						新增会员价格
					</view>
					<view 
						:class="['mode-button', vipPriceFormMode === 'edit' ? 'mode-active' : '']" 
						@click="switchVipPriceFormMode('edit')">
						编辑会员价格
					</view>
				</view>

				<!-- 编辑模式下显示会员价格选择器 -->
				<view v-if="vipPriceFormMode === 'edit'" class="form-group">
					<text class="form-label">选择要编辑的会员价格</text>
					<picker @change="onVipPricePickerChange" :value="selectedVipPriceIndex" :range="vipPricePickerRange">
						<view class="uni-input picker-input">{{ vipPricePickerRange[selectedVipPriceIndex] || '请选择会员价格' }}</view>
					</picker>
				</view>
				
				<view class="form-group">
					<text class="form-label">会员类型</text>
					<uni-data-checkbox
						v-model="vipPriceData.type"
						:localdata="vipTypeOptions"
					></uni-data-checkbox>
				</view>
				
				<view class="form-group">
					<text class="form-label">价格（分）</text>
					<uni-easyinput v-model="vipPriceData.price" placeholder="输入会员价格（以分为单位）" type="number" />
				</view>
				
				<view class="form-group">
					<text class="form-label">单位</text>
					<uni-easyinput v-model="vipPriceData.unit" placeholder="输入单位" />
				</view>
				
				<view class="form-group">
					<text class="form-label">描述</text>
					<uni-easyinput
						v-model="vipPriceData.description"
						placeholder="输入会员价格描述"
						type="textarea"
						:maxlength="-1"
					/>
				</view>
				
				<view class="button-group">
					<button class="secondary-button" @click="resetVipPriceForm">重置</button>
					<button class="primary-button" @click="handleVipPriceAction">
						{{ vipPriceFormMode === 'add' ? '添加会员价格' : '保存修改' }}
					</button>
				</view>
				
				<!-- VIP价格列表 -->
				<view class="list-header">
					<text>当前会员价格列表</text>
					<button class="refresh-button" @click="loadVipPrices">刷新</button>
				</view>
				
				<view class="price-list">
					<view v-for="(price, index) in vipPrices" :key="index" class="price-item glass-item">
						<view class="price-info">
							<text class="price-type">{{getVipTypeText(price.type)}}</text>
							<text class="price-value">{{(price.price/100).toFixed(2)}}元</text>
						</view>
						<view class="price-details">
							<text>{{price.description || '无描述'}}</text>
						</view>
						<view class="item-actions">
							<button class="action-button edit-button" @click="editVipPrice(price)">编辑</button>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- Customer Service Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">客服电话管理</text>
				<text class="card-action" @click="toggleSection('customerService')">
					{{ sections.customerService ? '收起' : '展开' }}
				</text>
			</view>
			
			<view v-if="sections.customerService" class="section-content">
				<view class="current-phone">
					<text class="current-phone-label">当前客服电话:</text>
					<text class="current-phone-value">{{ currentCustomerServicePhone || '未设置' }}</text>
				</view>
				
				<view class="form-group">
					<text class="form-label">新客服电话</text>
					<uni-easyinput v-model="newCustomerServicePhone" placeholder="输入新的客服电话号码" />
				</view>
				
				<button class="primary-button" @click="updatePhone">更新客服电话</button>
			</view>
		</view>

		<!-- User Management Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">用户权限管理</text>
				<text class="card-action" @click="toggleSection('userManagement')">
					{{ sections.userManagement ? '收起' : '展开' }}
				</text>
			</view>
			
			<view v-if="sections.userManagement" class="section-content">
				<view class="list-header">
					<text>待提升权限用户列表</text>
					<button class="refresh-button" @click="loadPreUsers">刷新</button>
				</view>
				
				<view v-if="preUsers.length === 0" class="empty-list">
					<text>暂无待提升权限用户</text>
				</view>
				
				<view v-else class="user-list">
					<view v-for="user in preUsers" :key="user._id" class="user-item glass-item">
						<view class="user-info">
							<text class="user-name">{{ user.nickname || '匿名用户' }}</text>
							<text class="user-id">ID: {{ user._id }}</text>
						</view>
						
						<button class="promote-button" @click="promoteToUser(user._id)">提升为用户</button>
					</view>
				</view>
			</view>
		</view>

		<!-- System Operations Section -->
		<view class="section-card glass-card">
			<view class="card-header">
				<text class="card-title">系统操作</text>
				<text class="card-action" @click="toggleSection('systemOps')">
					{{ sections.systemOps ? '收起' : '展开' }}
				</text>
			</view>
			
			<view v-if="sections.systemOps" class="section-content">
				<view class="warning">
					<uni-icons type="warning-filled" size="24" color="#f59e0b"></uni-icons>
					<text>以下操作会影响系统数据，请谨慎操作</text>
				</view>
				
				<view class="system-buttons">
					<button class="system-button rebuild-button" @click="rebuildStatistics">
						<text>重建用户统计数据</text>
					</button>
					
					<button class="system-button danger-button" @click="confirmDatabaseDelete">
						<text>清空数据库</text>
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import dayjs from 'dayjs';

// 导入云函数
const todo = uniCloud.importObject('todo');

// 控制各个部分的展开/折叠状态
const sections = reactive({
	machine: false,
	price: false,
	customerService: false,
	userManagement: false,
	systemOps: false
});

// ==================== 机台管理 ====================
// 表单模式（add：新增，edit：编辑）
const machineFormMode = ref('add');
const machines = ref([]);
const selectedMachineId = ref('');
const selectedMachineIndex = ref(0);

// 计算属性：机台选择器选项
const machinePickerRange = computed(() => {
	return machines.value.map(machine => machine.name || `机台${machine.machinenum}`);
});

// 机台管理数据
const machineData = reactive({
	name: "",
	type: "",
	capacity: 1,
	description: "",
	status: "available",
	machinenum: 1,
	imageUrl: ""
});

const machineStatusOptions = [
	{ value: 'available', text: '可用' },
	{ value: 'maintenance', text: '维护中' },
	{ value: 'offline', text: '离线' }
];

// 切换机台表单模式
function switchMachineFormMode(mode) {
	machineFormMode.value = mode;
	if (mode === 'add') {
		resetMachineForm();
	}
}

// 机台选择器变更事件
function onMachinePickerChange(e) {
	selectedMachineIndex.value = e.detail.value;
	const selectedMachine = machines.value[selectedMachineIndex.value];
	if (selectedMachine) {
		selectedMachineId.value = selectedMachine._id;
		// 加载选中的机台详情
		loadMachineDetail(selectedMachine._id);
	}
}

// 加载机台详情
async function loadMachineDetail(machineId) {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await todo.GetMachineDetail(machineId);
		uni.hideLoading();
		
		if (result && result.data && result.data.length > 0) {
			const machineDetail = result.data[0];
			// 更新表单数据
			Object.keys(machineData).forEach(key => {
				if (key in machineDetail) {
					machineData[key] = machineDetail[key];
				}
			});
		} else {
			uni.showToast({
				title: '获取机台详情失败',
				icon: 'none'
			});
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载机台详情失败',
			icon: 'none'
		});
		console.error('加载机台详情失败:', e);
	}
}

// 处理机台添加/更新
async function handleMachineAction() {
	if (!machineData.name) {
		uni.showToast({
			title: '请填写机台名称',
			icon: 'none'
		});
		return;
	}
	
	try {
		uni.showLoading({ title: machineFormMode.value === 'add' ? '添加中...' : '更新中...' });
		
		if (machineFormMode.value === 'add') {
			// 添加机台
			await todo.Machines_Add(machineData);
			uni.showToast({
				title: '添加成功',
				icon: 'success'
			});
		} else {
			// 更新机台
			if (!selectedMachineId.value) {
				uni.hideLoading();
				uni.showToast({
					title: '请先选择要编辑的机台',
					icon: 'none'
				});
				return;
			}
			
			await todo.Machines_Update(selectedMachineId.value, machineData);
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			});
		}
		
		uni.hideLoading();
		// 重置表单和状态
		resetMachineForm();
		// 刷新机台列表
		loadMachines();
	} catch (e) {
		uni.hideLoading();
		uni.showModal({
			title: machineFormMode.value === 'add' ? '添加失败' : '更新失败',
			content: e.errMsg || '服务器错误',
			showCancel: false
		});
		console.error(machineFormMode.value === 'add' ? '添加机台失败:' : '更新机台失败:', e);
	}
}

// 重置机台表单
function resetMachineForm() {
	machineData.name = "";
	machineData.type = "";
	machineData.capacity = 1;
	machineData.description = "";
	machineData.status = "available";
	machineData.machinenum = 1;
	machineData.imageUrl = "";
	selectedMachineId.value = '';
	selectedMachineIndex.value = 0;
}

// 编辑机台
function editMachine(machine) {
	switchMachineFormMode('edit');
	// 找到选中机台的索引
	const index = machines.value.findIndex(m => m._id === machine._id);
	if (index > -1) {
		selectedMachineIndex.value = index;
		selectedMachineId.value = machine._id;
		
		// 填充表单数据
		Object.keys(machineData).forEach(key => {
			if (key in machine) {
				machineData[key] = machine[key];
			}
		});
		
		// 滚动到表单位置
		uni.pageScrollTo({
			selector: '.form-mode-switch',
			duration: 300
		});
	}
}

// 加载机台列表
async function loadMachines() {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await todo.Machines_List();
		uni.hideLoading();
		if (result && result.data) {
			machines.value = result.data;
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载机台列表失败',
			icon: 'none'
		});
		console.error('加载机台列表失败:', e);
	}
}

// 获取机台状态的显示文本
function getStatusText(status) {
	switch (status) {
		case 'available': return '可用';
		case 'maintenance': return '维护中';
		case 'offline': return '离线';
		default: return '未知状态';
	}
}

// 获取机台状态的样式类名
function getStatusClass(status) {
	switch (status) {
		case 'available': return 'status-available';
		case 'maintenance': return 'status-maintenance';
		case 'offline': return 'status-offline';
		default: return '';
	}
}

// ==================== 价格管理 ====================
// 表单模式（add：新增，edit：编辑）
const priceFormMode = ref('add');
const prices = ref([]);
const selectedPriceId = ref('');
const selectedPriceIndex = ref(0);

// 计算属性：价格选择器选项
const pricePickerRange = computed(() => {
	return prices.value.map(price => `${price.type}(${price.price}${price.unit})`);
});

// 价格管理数据
const priceData = reactive({
	weekdays: "[1, 2, 3, 4, 5]",
	price: 5,
	unit: "元/小时",
	type: "普通",
	description: ""
});

// 切换价格表单模式
function switchPriceFormMode(mode) {
	priceFormMode.value = mode;
	if (mode === 'add') {
		resetPriceForm();
	}
}

// 价格选择器变更事件
function onPricePickerChange(e) {
	selectedPriceIndex.value = e.detail.value;
	const selectedPrice = prices.value[selectedPriceIndex.value];
	if (selectedPrice) {
		selectedPriceId.value = selectedPrice._id;
		// 加载选中的价格详情
		loadPriceDetail(selectedPrice._id);
	}
}

// 加载价格详情
async function loadPriceDetail(priceId) {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await todo.GetPriceDetail(priceId);
		uni.hideLoading();
		
		if (result && result.data && result.data.length > 0) {
			const priceDetail = result.data[0];
			// 更新表单数据
			Object.keys(priceData).forEach(key => {
				if (key in priceDetail) {
					priceData[key] = priceDetail[key];
				}
			});
		} else {
			uni.showToast({
				title: '获取价格详情失败',
				icon: 'none'
			});
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载价格详情失败',
			icon: 'none'
		});
		console.error('加载价格详情失败:', e);
	}
}

// 处理价格添加/更新
async function handlePriceAction() {
	if (!priceData.price || !priceData.type) {
		uni.showToast({
			title: '请填写价格和类型',
			icon: 'none'
		});
		return;
	}
	
	try {
		uni.showLoading({ title: priceFormMode.value === 'add' ? '添加中...' : '更新中...' });
		
		if (priceFormMode.value === 'add') {
			// 添加价格
			await todo.Prices_Add(priceData);
			uni.showToast({
				title: '添加成功',
				icon: 'success'
			});
		} else {
			// 更新价格
			if (!selectedPriceId.value) {
				uni.hideLoading();
				uni.showToast({
					title: '请先选择要编辑的价格',
					icon: 'none'
				});
				return;
			}
			
			await todo.Prices_Update(selectedPriceId.value, priceData);
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			});
		}
		
		uni.hideLoading();
		// 重置表单和状态
		resetPriceForm();
		// 刷新价格列表
		loadPrices();
	} catch (e) {
		uni.hideLoading();
		uni.showModal({
			title: priceFormMode.value === 'add' ? '添加失败' : '更新失败',
			content: e.errMsg || '服务器错误',
			showCancel: false
		});
		console.error(priceFormMode.value === 'add' ? '添加价格失败:' : '更新价格失败:', e);
	}
}

// 重置价格表单
function resetPriceForm() {
	priceData.weekdays = "[1, 2, 3, 4, 5]";
	priceData.price = 5;
	priceData.unit = "元/小时";
	priceData.type = "普通";
	priceData.description = "";
	selectedPriceId.value = '';
	selectedPriceIndex.value = 0;
}

// 编辑价格
function editPrice(price) {
	switchPriceFormMode('edit');
	// 找到选中价格的索引
	const index = prices.value.findIndex(p => p._id === price._id);
	if (index > -1) {
		selectedPriceIndex.value = index;
		selectedPriceId.value = price._id;
		
		// 填充表单数据
		Object.keys(priceData).forEach(key => {
			if (key in price) {
				priceData[key] = price[key];
			}
		});
		
		// 滚动到表单位置
		uni.pageScrollTo({
			selector: '.form-mode-switch',
			duration: 300
		});
	}
}

// 加载价格列表
async function loadPrices() {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await todo.Prices_List();
		uni.hideLoading();
		if (result && result.data) {
			prices.value = result.data;
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载价格列表失败',
			icon: 'none'
		});
		console.error('加载价格列表失败:', e);
	}
}

// ==================== VIP价格管理 ====================
// 表单模式（add：新增，edit：编辑）
const vipPriceFormMode = ref('add');
const vipPrices = ref([]);
const selectedVipPriceId = ref('');
const selectedVipPriceIndex = ref(0);

// 计算属性：VIP价格选择器选项
const vipPricePickerRange = computed(() => {
	return vipPrices.value.map(price => `${getVipTypeText(price.type)}(${(price.price/100).toFixed(2)}元)`);
});

// VIP价格数据
const vipPriceData = reactive({
	type: "weekly",
	price: 35800,
	unit: "分",
	description: "此为周卡会员价格,单位是分"
});

const vipTypeOptions = [
	{ value: 'weekly', text: '周卡' },
	{ value: 'monthly', text: '月卡' },
	{ value: 'quarterly', text: '季卡' },
	{ value: 'yearly', text: '年卡' }
];

// 获取VIP类型的显示文本
function getVipTypeText(type) {
	switch (type) {
		case 'weekly': return '周卡';
		case 'monthly': return '月卡';
		case 'quarterly': return '季卡';
		case 'yearly': return '年卡';
		default: return type;
	}
}

// 切换VIP价格表单模式
function switchVipPriceFormMode(mode) {
	vipPriceFormMode.value = mode;
	if (mode === 'add') {
		resetVipPriceForm();
	}
}

// VIP价格选择器变更事件
function onVipPricePickerChange(e) {
	selectedVipPriceIndex.value = e.detail.value;
	const selectedVipPrice = vipPrices.value[selectedVipPriceIndex.value];
	if (selectedVipPrice) {
		selectedVipPriceId.value = selectedVipPrice._id;
		// 加载选中的VIP价格详情
		loadVipPriceDetail(selectedVipPrice._id);
	}
}

// 加载VIP价格详情
async function loadVipPriceDetail(vipPriceId) {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await todo.GetVipPriceDetail(vipPriceId);
		uni.hideLoading();
		
		if (result && result.data && result.data.length > 0) {
			const vipPriceDetail = result.data[0];
			// 更新表单数据
			Object.keys(vipPriceData).forEach(key => {
				if (key in vipPriceDetail) {
					vipPriceData[key] = vipPriceDetail[key];
				}
			});
		} else {
			uni.showToast({
				title: '获取会员价格详情失败',
				icon: 'none'
			});
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载会员价格详情失败',
			icon: 'none'
		});
		console.error('加载会员价格详情失败:', e);
	}
}

// 处理VIP价格添加/更新
async function handleVipPriceAction() {
	if (!vipPriceData.price) {
		uni.showToast({
			title: '请填写会员价格',
			icon: 'none'
		});
		return;
	}
	
	try {
		uni.showLoading({ title: vipPriceFormMode.value === 'add' ? '添加中...' : '更新中...' });
		
		if (vipPriceFormMode.value === 'add') {
			// 添加VIP价格
			await todo.AddVipPrices(vipPriceData);
			uni.showToast({
				title: '添加成功',
				icon: 'success'
			});
		} else {
			// 更新VIP价格
			if (!selectedVipPriceId.value) {
				uni.hideLoading();
				uni.showToast({
					title: '请先选择要编辑的会员价格',
					icon: 'none'
				});
				return;
			}
			
			await todo.VipPrices_Update(selectedVipPriceId.value, vipPriceData);
			uni.showToast({
				title: '更新成功',
				icon: 'success'
			});
		}
		
		uni.hideLoading();
		// 重置表单和状态
		resetVipPriceForm();
		// 刷新VIP价格列表
		loadVipPrices();
	} catch (e) {
		uni.hideLoading();
		uni.showModal({
			title: vipPriceFormMode.value === 'add' ? '添加失败' : '更新失败',
			content: e.errMsg || '服务器错误',
			showCancel: false
		});
		console.error(vipPriceFormMode.value === 'add' ? '添加会员价格失败:' : '更新会员价格失败:', e);
	}
}

// 重置VIP价格表单
function resetVipPriceForm() {
	vipPriceData.type = "weekly";
	vipPriceData.price = 35800;
	vipPriceData.unit = "分";
	vipPriceData.description = "此为周卡会员价格,单位是分";
	selectedVipPriceId.value = '';
	selectedVipPriceIndex.value = 0;
}

// 编辑VIP价格
function editVipPrice(vipPrice) {
	switchVipPriceFormMode('edit');
	// 找到选中VIP价格的索引
	const index = vipPrices.value.findIndex(p => p._id === vipPrice._id);
	if (index > -1) {
		selectedVipPriceIndex.value = index;
		selectedVipPriceId.value = vipPrice._id;
		
		// 填充表单数据
		Object.keys(vipPriceData).forEach(key => {
			if (key in vipPrice) {
				vipPriceData[key] = vipPrice[key];
			}
		});
		
		// 滚动到会员价格表单位置
		uni.pageScrollTo({
			selector: '.subsection-header',
			duration: 300
		});
	}
}

// 加载VIP价格列表
async function loadVipPrices() {
	try {
		uni.showLoading({ title: '加载中...' });
		const result = await todo.GetVipPrices();
		uni.hideLoading();
		if (result && result.data) {
			vipPrices.value = result.data;
		}
	} catch (e) {
		uni.hideLoading();
		uni.showToast({
			title: '加载会员价格列表失败',
			icon: 'none'
		});
		console.error('加载会员价格列表失败:', e);
	}
}

// ==================== 客服电话管理 ====================
// 客服电话管理数据
const currentCustomerServicePhone = ref('');
const newCustomerServicePhone = ref('');

// 加载客服电话
async function loadCustomerServicePhone() {
	try {
		uni.showLoading({ title: '加载电话...' });
		const phoneResult = await todo.getCustomerServicePhone();
		uni.hideLoading();
		
		if (phoneResult.errCode === 0 && phoneResult.data) {
			currentCustomerServicePhone.value = phoneResult.data.phoneNo;
		} else {
			currentCustomerServicePhone.value = '';
			console.error('加载客服电话失败:', phoneResult.errMsg);
		}
	} catch (e) {
		uni.hideLoading();
		currentCustomerServicePhone.value = '';
		console.error('调用 getCustomerServicePhone 失败:', e);
		uni.showToast({
			title: '网络错误，加载电话失败',
			icon: 'none'
		});
	}
}

// 更新客服电话
async function updatePhone() {
	const phoneToUpdate = newCustomerServicePhone.value.trim();
	if (!phoneToUpdate) {
		uni.showToast({
			title: '请输入新的电话号码',
			icon: 'none'
		});
		return;
	}

	uni.showModal({
		title: '确认更新',
		content: `确定要将客服电话更新为 "${phoneToUpdate}" 吗？`,
		success: async (modalRes) => {
			if (modalRes.confirm) {
				uni.showLoading({
					title: '更新中...'
				});
				try {
					const result = await todo.updateCustomerServicePhone({
						newPhoneNo: phoneToUpdate
					});
					uni.hideLoading();

					if (result.errCode === 0) {
						uni.showToast({
							title: '更新成功',
							icon: 'success'
						});
						newCustomerServicePhone.value = ''; // 清空输入框
						await loadCustomerServicePhone(); // 重新加载当前电话号码
					} else {
						uni.showModal({
							title: '更新失败',
							content: result.errMsg || '发生未知错误',
							showCancel: false
						});
					}
				} catch (e) {
					uni.hideLoading();
					console.error('调用 updateCustomerServicePhone 失败:', e);
					uni.showModal({
						title: '更新失败',
						content: '网络错误或服务器内部错误',
						showCancel: false
					});
				}
			}
		}
	});
}

// ==================== 用户权限管理 ====================
// 用户权限管理数据
const preUsers = ref([]);

// 加载待提升权限的用户
async function loadPreUsers() {
	try {
		uni.showLoading({ title: '加载中...' });
		const preUserResult = await todo.getPreUsers();
		uni.hideLoading();
		
		if (preUserResult && preUserResult.errCode === 0 && preUserResult.data) {
			preUsers.value = preUserResult.data;
		} else {
			console.error('获取 preUser 列表失败', preUserResult);
			uni.showToast({
				title: preUserResult.errMsg || '获取用户列表失败',
				icon: 'error'
			});
		}
	} catch (e) {
		uni.hideLoading();
		console.error('调用云函数 getPreUsers 失败', e);
		uni.showToast({
			title: '网络错误',
			icon: 'error'
		});
	}
}

// 提升用户权限
async function promoteToUser(userId) {
	uni.showModal({
		title: '权限提升确认',
		content: `确定要将用户 ${userId} 提升为正式用户吗？`,
		success: async (modalRes) => {
			if (modalRes.confirm) {
				uni.showLoading({
					title: '提升中...'
				});
				try {
					const result = await todo.promoteUserRole({
						userId: userId
					});
					uni.hideLoading();
					
					if (result && result.errCode === 0) {
						uni.showToast({
							title: '用户权限提升成功',
							icon: 'success'
						});
						// 刷新 preUser 列表
						loadPreUsers();
					} else {
						console.error('提升用户权限失败', result);
						uni.showToast({
							title: result.errMsg || '提升权限失败',
							icon: 'error'
						});
					}
				} catch (e) {
					uni.hideLoading();
					console.error('调用云函数 promoteUserRole 失败', e);
					uni.showToast({
						title: '网络错误',
						icon: 'error'
					});
				}
			}
		}
	});
}

// ==================== 系统操作 ====================
// 重建用户统计数据
async function rebuildStatistics() {
	uni.showModal({
		title: '操作确认',
		content: '确定要重建所有用户统计数据吗？此操作不可逆，且耗时较长。',
		success: async (modalRes) => {
			if (modalRes.confirm) {
				uni.showLoading({
					title: '重建中...'
				});
				try {
					const result = await todo.rebuildAllUserStatistics();
					uni.hideLoading();
					
					uni.showToast({
						title: result.errMsg || '重建完成',
						icon: result.errCode === 0 ? 'success' : 'none',
						duration: 2000
					});
				} catch (e) {
					uni.hideLoading();
					console.error("重建统计失败:", e);
					uni.showToast({
						title: '重建操作失败',
						icon: 'error'
					});
				}
			} else if (modalRes.cancel) {
				uni.showToast({
					title: '已取消重建操作',
					icon: 'none',
					duration: 1500
				});
			}
		}
	});
}

// 确认删除数据库
function confirmDatabaseDelete() {
	uni.showModal({
		title: '危险操作确认',
		content: '此操作将清空数据库中的订单、预约和签到信息，操作不可恢复！确定要继续吗？',
		confirmText: '确认清空',
		confirmColor: '#FF0000',
		success: async (modalRes) => {
			if (modalRes.confirm) {
				// 二次确认
				uni.showModal({
					title: '最终确认',
					content: '此操作将导致数据永久丢失！确定要清空数据库吗？',
					confirmText: '确认',
					confirmColor: '#FF0000',
					success: async (finalRes) => {
						if (finalRes.confirm) {
							try {
								uni.showLoading({ title: '清空中...' });
								await todo.Delete();
								uni.hideLoading();
								
								uni.showToast({
									title: '数据已清空',
									icon: 'success'
								});
							} catch (e) {
								uni.hideLoading();
								uni.showModal({
									title: '操作失败',
									content: e.errMsg || '发生未知错误',
									showCancel: false
								});
							}
						}
					}
				});
			}
		}
	});
}

// 切换部分的展开/折叠状态
function toggleSection(sectionName) {
	sections[sectionName] = !sections[sectionName];
}

// 生命周期钩子
onMounted(() => {
	// 加载初始数据
	loadMachines();
	loadPrices();
	loadVipPrices();
	loadCustomerServicePhone();
	loadPreUsers();
});
</script>

<style>
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

.glass-item:active {
	transform: scale(0.98);
}

/* 头部样式 */
.header-card {
	background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
	padding: 24px 16px;
	margin-bottom: 24px;
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

/* 卡片头部 */
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 4px 0;
	margin-bottom: 12px;
}

.card-title {
	font-size: 18px;
	font-weight: 600;
	color: #333;
}

.card-action {
	font-size: 14px;
	color: #3B82F6;
	padding: 4px 8px;
	border-radius: 4px;
	background: rgba(59, 130, 246, 0.1);
}

.section-content {
	animation: fade-in 0.3s ease;
	padding-top: 8px;
}

/* 表单模式切换 */
.form-mode-switch {
	display: flex;
	margin-bottom: 16px;
	border-radius: 8px;
	overflow: hidden;
	border: 1px solid rgba(59, 130, 246, 0.2);
}

.mode-button {
	flex: 1;
	text-align: center;
	padding: 10px 0;
	font-size: 14px;
	background: rgba(255, 255, 255, 0.7);
	transition: all 0.3s ease;
}

.mode-active {
	background: #3B82F6;
	color: white;
	font-weight: 500;
}

/* 表单样式 */
.form-group {
	margin-bottom: 16px;
}

.form-label {
	display: block;
	font-size: 14px;
	color: #4B5563;
	margin-bottom: 6px;
	font-weight: 500;
}

.picker-input {
	height: 40px;
	line-height: 40px;
	padding: 0 10px;
	background-color: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 6px;
	font-size: 14px;
	color: #1F2937;
}

/* 按钮组 */
.button-group {
	display: flex;
	gap: 10px;
	margin-top: 16px;
	margin-bottom: 24px;
}

/* 按钮样式 */
.primary-button {
	flex: 2;
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

.primary-button:active {
	transform: translateY(2px);
	box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
}

.secondary-button {
	flex: 1;
	background: #F3F4F6;
	color: #4B5563;
	border: 1px solid #D1D5DB;
	border-radius: 12px;
	padding: 12px;
	font-size: 16px;
	font-weight: 500;
	transition: background-color 0.2s ease;
}

.secondary-button:active {
	background: #E5E7EB;
}

/* 列表样式 */
.list-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding: 0 4px;
}

.list-header text {
	font-size: 16px;
	font-weight: 500;
	color: #4B5563;
}

.refresh-button {
	font-size: 12px;
	padding: 4px 8px;
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
	border-radius: 4px;
	border: none;
}

.empty-list {
	padding: 20px;
	text-align: center;
	color: #9CA3AF;
	background: rgba(0, 0, 0, 0.02);
	border-radius: 8px;
}

/* 项目操作按钮 */
.item-actions {
	display: flex;
	justify-content: flex-end;
	margin-top: 8px;
}

.action-button {
	font-size: 12px;
	padding: 4px 8px;
	border-radius: 4px;
	margin-left: 6px;
}

.edit-button {
	background: rgba(59, 130, 246, 0.1);
	color: #3B82F6;
	border: 1px solid rgba(59, 130, 246, 0.2);
}

/* 机台列表样式 */
.machine-list {
	margin-bottom: 20px;
}

.machine-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.machine-name {
	font-size: 16px;
	font-weight: 500;
	color: #1F2937;
}

.machine-status {
	font-size: 12px;
	padding: 2px 8px;
	border-radius: 20px;
}

.status-available {
	background: rgba(16, 185, 129, 0.1);
	color: #10B981;
}

.status-maintenance {
	background: rgba(245, 158, 11, 0.1);
	color: #F59E0B;
}

.status-offline {
	background: rgba(239, 68, 68, 0.1);
	color: #EF4444;
}

.machine-details {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.machine-details text {
	font-size: 13px;
	color: #6B7280;
}

/* 价格列表样式 */
.price-list {
	margin-bottom: 20px;
}

.price-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.price-type {
	font-size: 16px;
	font-weight: 500;
	color: #1F2937;
}

.price-value {
	font-size: 15px;
	font-weight: 600;
	color: #3B82F6;
	background: rgba(59, 130, 246, 0.1);
	padding: 4px 10px;
	border-radius: 20px;
}

.price-details {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.price-details text {
	font-size: 13px;
	color: #6B7280;
}

/* 子部分标题 */
.subsection-header {
	font-size: 16px;
	font-weight: 500;
	color: #4B5563;
	margin: 20px 0 16px 0;
	padding-bottom: 8px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

/* 客服电话样式 */
.current-phone {
	background: rgba(59, 130, 246, 0.05);
	padding: 12px;
	border-radius: 8px;
	margin-bottom: 16px;
	display: flex;
	align-items: center;
}

.current-phone-label {
	font-size: 14px;
	color: #6B7280;
	margin-right: 8px;
}

.current-phone-value {
	font-size: 16px;
	font-weight: 500;
	color: #1F2937;
}

/* 用户列表样式 */
.user-list {
	margin-bottom: 20px;
}

.user-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
}

.user-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.user-name {
	font-size: 16px;
	font-weight: 500;
	color: #1F2937;
}

.user-id {
	font-size: 12px;
	color: #6B7280;
}

.promote-button {
	background: linear-gradient(135deg, #10B981 0%, #059669 100%);
	color: white;
	border: none;
	border-radius: 8px;
	padding: 6px 12px;
	font-size: 13px;
	box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

/* 系统操作样式 */
.warning {
	display: flex;
	align-items: center;
	background: rgba(245, 158, 11, 0.1);
	padding: 12px;
	border-radius: 8px;
	margin-bottom: 16px;
}

.warning text {
	color: #9A3412;
	font-size: 14px;
	margin-left: 10px;
}

.system-buttons {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.system-button {
	border: none;
	border-radius: 12px;
	padding: 14px;
	font-size: 15px;
	font-weight: 500;
	color: white;
	display: flex;
	justify-content: center;
	align-items: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.system-button text {
	margin-left: 8px;
}

.system-button:active {
	transform: translateY(2px);
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.rebuild-button {
	background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.danger-button {
	background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);
}

/* 动画 */
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
	
	.card-title {
		color: #F3F4F6;
	}
	
	.card-action {
		color: #60A5FA;
		background: rgba(96, 165, 250, 0.2);
	}
	
	.form-label {
		color: #9CA3AF;
	}
	
	.mode-button {
		background: rgba(31, 41, 55, 0.5);
		color: #D1D5DB;
	}
	
	.mode-active {
		background: #3B82F6;
		color: white;
	}
	
	.picker-input {
		background-color: rgba(31, 41, 55, 0.7);
		border-color: rgba(255, 255, 255, 0.08);
		color: #F3F4F6;
	}
	
	.secondary-button {
		background: rgba(31, 41, 55, 0.7);
		color: #D1D5DB;
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.secondary-button:active {
		background: rgba(31, 41, 55, 0.9);
	}
	
	.list-header text {
		color: #D1D5DB;
	}
	
	.refresh-button {
		background: rgba(59, 130, 246, 0.2);
		color: #60A5FA;
	}
	
	.empty-list {
		background: rgba(255, 255, 255, 0.03);
	}
	
	.edit-button {
		background: rgba(59, 130, 246, 0.2);
		border-color: rgba(59, 130, 246, 0.3);
	}
	
	.machine-name {
		color: #F3F4F6;
	}
	
	.machine-details text {
		color: #9CA3AF;
	}
	
	.price-type {
		color: #F3F4F6;
	}
	
	.price-details text {
		color: #9CA3AF;
	}
	
	.subsection-header {
		color: #D1D5DB;
		border-color: rgba(255, 255, 255, 0.1);
	}
	
	.current-phone {
		background: rgba(59, 130, 246, 0.1);
	}
	
	.current-phone-label {
		color: #9CA3AF;
	}
	
	.current-phone-value {
		color: #F3F4F6;
	}
	
	.user-name {
		color: #F3F4F6;
	}
	
	.warning {
		background: rgba(245, 158, 11, 0.2);
	}
	
	.warning text {
		color: #FBBF24;
	}
}
</style>