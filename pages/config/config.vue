<template>
	<view style="padding: 20rpx;">
		<text>测试增删改查</text>
		<button @click="todoAddMachine()">添加机台信息</button>
		<text>{{Machine}}</text>
		<button @click="todoAddPrices()">添加价格信息</button>
		<text>{{Price}}</text>
		<button @click="rebuildStatistics()">重建用户统计数据</button>
		<view style="margin-top: 30rpx; border-top: 1px solid #eee; padding-top: 20rpx;">
			<text style="font-weight: bold; display: block; margin-bottom: 10rpx;">修改客服电话</text>
			<view style="margin-bottom: 10rpx;">
				<text>当前电话: {{ currentCustomerServicePhone || '未设置' }}</text>
			</view>
			<uni-easyinput type="text" v-model="newCustomerServicePhone" placeholder="请输入新的客服电话号码"
				style="margin-bottom: 10rpx;" />
			<button size="mini" type="primary" @click="updatePhone()">更新电话</button>
		</view>
		<view style="margin-top: 20rpx;">
			<text>待提升权限用户列表</text>
			<view v-if="preUsers.length === 0">
				<text>暂无待提升权限用户</text>
			</view>
			<view v-else>
				<view v-for="user in preUsers" :key="user._id"
					style="margin-bottom: 10rpx; display: flex; align-items: center;">
					<text>{{ user.nickname || '匿名用户' }} ({{ user._id }})</text>
					<button style="margin-left: 10rpx;" size="mini" @click="promoteToUser(user._id)">提升为用户</button>
				</view>
			</view>
		</view>
		<view>
			<button @click="deleteDB()">删库</button>
		</view>
		<view>
			<text>{{vippriceData}}</text>
		</view>
		<view>
			<button @click="addVipPrices()">添加会员价格</button>
		</view>
	</view>
</template>

<script setup>
	import dayjs from 'dayjs';
	import holiday2025 from '@/static/holiday/2025.json'
	import isFreeDay from '@/modules/isFreeDay.ts'
	import {
		reactive,
		ref,
		onMounted
	} from 'vue'
	const todo = uniCloud.importObject('todo')
	const Machine = reactive({
		"name": "9号机-Taiko",
		"type": "Taiko",
		"capacity": 1,
		"description": "神童科技，街机尺寸。已装Taiko彩虹版39.09。",
		"imageUrl": "",
		"status": "maintenance",
		"machinenum": 7,
	})
	const Price = reactive({
		"weekdays": "[1, 2, 3, 4, 5,6,7]",
		"price": 80,
		"unit": "元/次",
		"type": "会员",
		"description": "测试数据"
	})
	const vippriceData = reactive({
		"type": "weekly",
		"price": 35800,
		"unit": "分",
		"description": "此为月卡会员价格,单位是分"
	})
	const currentCustomerServicePhone = ref(''); // 用于显示当前电话
	const newCustomerServicePhone = ref(''); // 用于输入新电话
	const prices = ref([]); // Define prices ref if used in loadData
	
	async function addVipPrices() {
		try {
			// Changed variable name
			const addPriceResult = await todo.AddVipPrices(vippriceData)
			uni.showToast({
				title: '创建成功'
			})
		} catch (e) {
			uni.showModal({
				title: '创建失败',
				content: e.errMsg,
				showCancel: false
			})
		}
	}

	async function todoAddMachine() {
		try {
			// Changed variable name to avoid conflict if needed elsewhere
			const addMachineResult = await todo.Machine(0, Machine)
			uni.showToast({
				title: '创建成功'
			})
		} catch (e) {
			uni.showModal({
				title: '创建失败',
				content: e.errMsg,
				showCancel: false
			})
		}
	}
	async function todoAddPrices() {
		try {
			// Changed variable name
			const addPriceResult = await todo.Prices_Add(Price)
			uni.showToast({
				title: '创建成功'
			})
		} catch (e) {
			uni.showModal({
				title: '创建失败',
				content: e.errMsg,
				showCancel: false
			})
		}
	}
	async function loadData() {
		try {
			// Assuming you have a 'prices' ref defined
			const priceListResult = await todo.Prices_List()
			if (priceListResult && priceListResult.data) {
				prices.value = priceListResult.data; // Assign to the ref
			}
		} catch (e) {
			console.error("Failed to load prices:", e);
			uni.showToast({
				title: '加载价格列表失败',
				icon: 'none'
			});
		}
	}
	// 系统初始化时重建统计数据（管理员功能）
	async function rebuildStatistics() {
		uni.showModal({
			title: '操作确认',
			content: '确定要重建所有用户统计数据吗？此操作不可逆，且耗时较长。',
			// Renamed 'res' to 'modalRes' for clarity
			success: async (modalRes) => {
				if (modalRes.confirm) {
					// 用户点击确定，执行重建操作
					const cloudObject = uniCloud.importObject('todo');
					uni.showLoading({
						title: '重建中...'
					});
					try {
						const result = await cloudObject.rebuildAllUserStatistics();
						console.log("重建统计结果:", result);
						uni.hideLoading();
						uni.showToast({
							title: result.errMsg || '重建完成', // Use message from result if available
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
					// 用户点击取消，不执行任何操作
					uni.showToast({
						title: '已取消重建操作',
						icon: 'none',
						duration: 1500
					});
				}
			}
		});
	}

	//  ---  preUser 相关代码  ---
	const preUsers = ref([])

	async function loadPreUsers() {
		try {
			const cloudObject = uniCloud.importObject('todo');
			// Changed variable name
			const preUserResult = await cloudObject.getPreUsers(); // 调用云函数获取 preUser
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
			console.error('调用云函数 getPreUsers 失败', e);
			uni.showToast({
				title: '网络错误',
				icon: 'error'
			});
		}
	}

	async function promoteToUser(userId) {
		uni.showModal({
			title: '权限提升确认',
			content: `确定要将用户 ${userId} 提升为正式用户吗？`,
			// Renamed 'res' to 'modalRes'
			success: async (modalRes) => {
				if (modalRes.confirm) {
					uni.showLoading({
						title: '提升中...'
					});
					try {
						const cloudObject = uniCloud.importObject('todo');
						const result = await cloudObject.promoteUserRole({
							userId: userId
						}); // 调用云函数提升用户权限
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

	async function loadCustomerServicePhone() {
		try {
			uni.showLoading({
				title: '加载电话...'
			}); // Changed title slightly
			// Changed variable name
			const phoneResult = await todo.getCustomerServicePhone();
			if (phoneResult.errCode === 0 && phoneResult.data) {
				currentCustomerServicePhone.value = phoneResult.data.phoneNo;
			} else {
				currentCustomerServicePhone.value = ''; // Clear if not found or error
				console.error('加载客服电话失败:', phoneResult.errMsg);
				// Optionally show a toast for loading errors
				// uni.showToast({ title: phoneResult.errMsg || '加载电话失败', icon: 'none' });
			}
		} catch (e) {
			currentCustomerServicePhone.value = '';
			console.error('调用 getCustomerServicePhone 失败:', e);
			uni.showToast({
				title: '网络错误，加载电话失败',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	}

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
			// Renamed 'res' to 'modalRes'
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
							newCustomerServicePhone.value = ''; // Clear input field
							await loadCustomerServicePhone(); // Reload the current phone number
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
	async function deleteDB() {
		try {
			const res = await todo.Delete()
		} catch (e) {}
	}

	// Removed console logs for holiday 
	// const now = dayjs(1746083625000).format('YYYY-MM-DD')
	// const result = holiday2025.days.find(data =>data.date == now)
	// console.log(result)

	onMounted(() => {
		// Removed duplicate calls
		// You might not need to store the result if you don't use it
		uniCloud.callFunction({
			name: "updateMembershipStatus"
		}).catch(err => console.error("Call updateMembershipStatus failed:", err));
		uniCloud.callFunction({
			name: "updateReservation"
		}).catch(err => console.error("Call updateReservation failed:", err));

		loadData(); // 加载价格列表
		loadPreUsers(); // 加载 preUser 列表
		loadCustomerServicePhone(); // 加载客服电话
		console.log(isFreeDay())
	})
</script>

<style>

</style>