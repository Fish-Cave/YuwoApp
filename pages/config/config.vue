<template>
	<view style="padding: 20rpx;">
		<text>测试增删改查</text>
		<button @click="todoAddMachine()">添加机台信息</button>
		<text>{{Machine}}</text>
		<button @click="todoAddPrices()">添加价格信息</button>
		<text>{{Price}}</text>
		<button @click="rebuildStatistics()">重建用户统计数据</button>
        <view style="margin-top: 20rpx;">
            <text>待提升权限用户列表</text>
            <view v-if="preUsers.length === 0">
                <text>暂无待提升权限用户</text>
            </view>
            <view v-else>
                <view v-for="user in preUsers" :key="user._id" style="margin-bottom: 10rpx; display: flex; align-items: center;">
                    <text>{{ user.nickname || '匿名用户' }} ({{ user._id }})</text>
                    <button style="margin-left: 10rpx;" size="mini" @click="promoteToUser(user._id)">提升为用户</button>
                </view>
            </view>
        </view>
	</view>
</template>

<script setup>
	import dayjs from 'dayjs';
	import holiday2025 from '@/static/holiday/2025.json'
	import {
		reactive, ref, onMounted
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
	async function todoAddMachine() {
		try {
			const res = await todo.Machine(0, Machine)
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
			const res = await todo.Prices_Add(Price)
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
	async function loadData(){
		try{
			prices.value = await todo.Prices_List()
		}catch{}
	}
	// 系统初始化时重建统计数据（管理员功能）
	async function rebuildStatistics() {
        uni.showModal({
            title: '操作确认',
            content: '确定要重建所有用户统计数据吗？此操作不可逆，且耗时较长。',
            success: async (res) => {
                if (res.confirm) {
                    // 用户点击确定，执行重建操作
                    const cloudObject = uniCloud.importObject('todo');
                    const result = await cloudObject.rebuildAllUserStatistics();
                    console.log("重建统计结果:", result);
                    uni.showToast({
                        title: '重建统计数据完成',
                        icon: 'success',
                        duration: 2000
                    })
                    return result;
                } else if (res.cancel) {
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

    //  ---  新增 preUser 相关代码  ---
    const preUsers = ref([])

    async function loadPreUsers() {
        try {
            const cloudObject = uniCloud.importObject('todo');
            const res = await cloudObject.getPreUsers(); // 调用云函数获取 preUser
            if (res && res.data) {
                preUsers.value = res.data;
            } else {
                console.error('获取 preUser 列表失败', res);
                uni.showToast({
                    title: '获取用户列表失败',
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
            success: async (res) => {
                if (res.confirm) {
                    try {
                        const cloudObject = uniCloud.importObject('todo');
                        const result = await cloudObject.promoteUserRole({ userId: userId }); // 调用云函数提升用户权限
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
                                title: '提升权限失败',
                                icon: 'error'
                            });
                        }
                    } catch (e) {
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
	
	
	//console.log(JSON.stringify(holiday2025.days))
	//console.log(holiday2025.days)
	const now = dayjs(1746083625000).format('YYYY-MM-DD')
	const result = holiday2025.days.find(data =>data.date == now)
	console.log(result)
	
	onMounted(()=>{
		const res = uniCloud.callFunction({
			name : "updateMembershipStatus"
		})
		const res1 = uniCloud.callFunction({
			name : "updateReservation"
		})
        loadData() // 加载价格列表
        loadPreUsers() // 加载 preUser 列表
	})
</script>

<style>

</style>
