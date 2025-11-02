<template>
	<view class="container">
		<!-- 个人信息卡片 -->
		<view v-if="res.uid==null" class="launch-button glass-button" @click="goToLaunch()">
			<text>登录</text>
		</view>
		<view v-else class="user-info-card glass-card">
			<view class="user-info-header">
				<view class="avatar-container" style="width: 160rpx; height: 160rpx;">
					<!-- 使用 uni-id-pages-avatar 组件显示头像 -->
					<uni-id-pages-avatar width="160rpx" height="160rpx"></uni-id-pages-avatar>
				</view>
				<view class="user-details">
					<text class="nickname">{{ userInfo.nickname || '未设置昵称' }}</text>
					<text class="user-id">UID: {{ userInfo._id }}</text>
				</view>
			</view>
		</view>

		<!-- 功能按钮卡片 -->
		<view class="function-card glass-card">
			<view class="card-title">
				<view style="display: flex; align-items: center; justify-content: space-between;">
					<text>简洁模式(测试)</text>
					<switch @change="switchChange" :checked="simpleMode"></switch>
				</view>
			</view>
			<view v-if="!simpleMode">
				<view class="function-buttons">
					<view class="function-button" @click="goToreservationList()">
						<view class="icon-container">
							<uni-icons type="calendar" size="30" color="#ffffff"></uni-icons>
						</view>
						<text class="function-text">预约中</text>
					</view>

					<view class="vertical-divider"></view>

					<view class="function-button" @click="goToUsing()">
						<view class="icon-container">
							<uni-icons type="paperplane" size="30" color="#ffffff"></uni-icons>
						</view>
						<text class="function-text">使用中</text>
					</view>
				</view>
			</view>
			<!-- 简洁模式 -->
			<view v-else>
				<view v-if="ReservationData">
					<view v-for="data in ReservationData.slice(0,1)" :key="data._id"
						class="reservation-item glass-card">
						<view class="reservation-header">

							<view class="icon-container">
								<uni-icons type="contact" size="30" color="#ffffff"></uni-icons>
							</view>

              <view class="reservation-info">
                <view><text class="machine-name">{{data.machineName}}</text></view>
                <view class="status-badge" :class="getStatusClass(data.status)">
                  <text>{{ getStatusText(data.status) }}</text>
                </view>
              </view>

              <view v-if="data.status == 1" class="button-group">
                <view class="sign-in-button"
                      @click="goToStart(data.machineName, data.startTime, data._id, data.isOvernight, data.isPlay)">
                  <text>签到</text>
                </view>
                <view class="cancel-button" @click="cancelReservation(data._id)">
                  <text>取消</text>
                </view>
              </view>

              <view v-if="data.status == 4" class="button-group" >
                <view class="sign-in-button" @click="goToUsing()">
                  <text>查看计时</text>
                </view>
                <view>
                  <text style="padding: 4px">占个位喵 :3</text>
                </view>
              </view>

						</view>
					</view>
				</view>
        <view v-else>
          <text style="display: flex; justify-content: center">还没有预约，快去预约吧！</text>
        </view>
			</view>


		</view>

		<!-- 使用说明卡片 -->
		<view class="instructions-card glass-card">
			<view class="card-title">
				<text>使用说明</text>
			</view>

			<view class="instructions-list">
				<view class="instruction-item" v-for="(text, value) in textData" :key="value">
					<view class="instruction-number">
						<text>{{value + 1}}</text>
					</view>
					<text class="instruction-text">{{text}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { reactive, ref, computed, onMounted } from 'vue'
	// 引入 uni-id-pages 的 store
	import { store } from '@/uni_modules/uni-id-pages/common/store.js'
	const simpleMode = ref(true)

	const todo = uniCloud.importObject('todo')
	const reservationHandler = uniCloud.importObject('reservationHandler')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')

	const textData = [
		"请在预约时间前15分钟内完成签到",
		"超时未签到将自动取消预约",
		"游玩结束后请关闭机台",
	]

	// 定义预约数据的数据结构
	interface reservationData {
		"_id" : string;
		"machineId" : string;
		"machineName" : string;
		"status" : number;
		"startTime" : number;
		"isOvernight" : boolean;
		"isPlay" : boolean;
	}

	const ReservationData = ref<reservationData[]>([])

	// 管理预约状态标签
	function getStatusText(status : number) : string {
		switch (status) {
			case 1: return '未完成';
			case 2: return '已结算';
			case 3: return '已过期';
			case 4: return '正使用';
			case 5: return '待结算';
			case 6: return '已取消'
			default: return '未知';
		}
	}

	function getStatusClass(status : number) : string {
		switch (status) {
			case 1: return 'status-pending';
			case 2: return 'status-completed';
			case 3: return 'status-expired';
			case 4: return 'status-active';
			case 5: return 'status-pending';
			case 6: return 'status-expired';
			default: return '';
		}
	}

	// 使用计算属性获取用户信息
	const userInfo = computed(() => store.userInfo)

	function goToreservationList() {
		uni.navigateTo({
			url: '/pages/reservationList/reservationList'
		});
	}

	async function goToUsing() {
		console.log(res.uid)
		try {
			const result = await todo.SignIn_Search(res.uid)
			if (result.data.length == 1) {
				console.log(result.data[0])
				uni.navigateTo({
					url: "/pages/using/using"
				})
			} else {
				uni.showToast({
					title: "未找到签到信息",
					icon: "error"
				})
			}
		} catch { }
	}

	function goToLaunch() {
		uni.redirectTo({
			url: "/uni_modules/uni-id-pages/pages/login/login-withpwd", // 确保路径正确
		});
	}

	// 控制简洁模式显示，正式采用新版签到界面后可弃用
	function switchChange() {
		console.log(simpleMode.value)
		simpleMode.value = !simpleMode.value
		console.log(simpleMode.value)
	}
	// 获取预约数据
	async function getReservationData() {
		try {
			const result = await reservationHandler.GetReservationInfo(res.uid)
			ReservationData.value = result.data
			console.log(result.data)
		} catch (error) {
			console.error('Failed to fetch reservation data:', error)
		}
	}
	// 取消预约
	async function cancelReservation(resid : string) {
		try {
			const result = await reservationHandler.CancelReservation(resid)
			console.log(result.data)
			if (result) {
				uni.showToast({
					title: "预约已取消"
				})
			}
			//刷新预约情况
			getReservationData()
		} catch (e) {

		}
	}
	// 跳转签到
	function goToStart(machineName : string, startTime : number, reservationID : string, isOvernight : boolean, isPlay : boolean) {
		uni.navigateTo({
			url: "/pages/start/start",
			success: (res) => {
				res.eventChannel.emit('acceptDataFromOpenerPage', {
					"machineName": machineName,
					"startTime": startTime,
					"reservationID": reservationID,
					"isOvernight": isOvernight,
					"isPlay": isPlay
				})
			}
		})
	}
	onMounted(() => {
		getReservationData()
	})
</script>

<style scoped>
	/* 全局样式 */
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

	.glass-card:active {
		transform: translateY(2px);
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
	}

	/* 用户信息卡片 */
	.user-info-card {
		margin-bottom: 24px;
	}

	.user-info-header {
		display: flex;
		align-items: center;
		padding: 8px;
	}

	.avatar-container {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid #fff;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
		margin-right: 16rpx;
	}

	.user-details {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.nickname {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8px;
		color: #333;
		/* 允许长单词/URL换行 */
		overflow-wrap: break-word;
		/* 中文/日文等任意字符处换行 */
		word-break: break-all;
		/* 保留空白符但允许换行 */
		white-space: pre-line;
		/* 触发换行的容器宽度 */
		max-width: 400rpx;
	}

	.user-id {
		font-size: 24rpx;
		color: #6b7280;
		background: rgba(243, 244, 246, 0.7);
		padding: 4px 10px;
		border-radius: 12px;
		align-self: flex-start;
	}

	/* 功能按钮卡片 */
	.function-card {
		margin-bottom: 24px;
	}

	.function-buttons {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px;
	}

	.function-button {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px 0;
		transition: transform 0.2s ease;
	}

	.function-button:active {
		transform: scale(0.95);
	}

	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
		width: 60px;
		height: 60px;
		border-radius: 16px;
		margin-bottom: 12px;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
	}

	.function-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
	}

	.vertical-divider {
		width: 1px;
		height: 80px;
		background: rgba(107, 114, 128, 0.2);
	}

	/* 使用说明卡片 */
	.instructions-card {
		margin-bottom: 24px;
	}

	.card-title {
		font-size: 18px;
		font-weight: bold;
		color: #333;
		padding: 8px 4px 16px 4px;
		border-bottom: 1px solid rgba(107, 114, 128, 0.1);
		margin-bottom: 16px;
	}

	.instructions-list {
		padding: 0 4px;
	}

	.instruction-item {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
	}

	.instruction-number {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(255, 193, 7, 0.1);
		color: #FF9800;
		font-size: 14px;
		font-weight: 600;
		margin-right: 12px;
	}

	.instruction-text {
		font-size: 28rpx;
		color: #4b5563;
		line-height: 1.5;
	}

	/*登陆按钮*/
	.launch-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: white;
		border: none;
		border-radius: 24px;
		padding: 12px 24px;
		font-size: 40rpx;
		font-weight: 600;
		margin-top: 20px;
		margin-bottom: 20px;
		height: 80rpx;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* 媒体查询：针对不同尺寸设备的响应式样式 */
	/* 小屏幕设备 */
	@media screen and (max-width: 375px) {
		.container {
			padding: 16px;
		}

		.nickname {
			font-size: 32rpx;
		}

		.user-id {
			font-size: 22rpx;
		}

		.icon-container {
			width: 50px;
			height: 50px;
		}

		.function-text {
			font-size: 26rpx;
		}

		.instruction-number {
			width: 22px;
			height: 22px;
		}

		.instruction-text {
			font-size: 26rpx;
		}
	}

	/* 大屏幕设备 */
	@media screen and (min-width: 768px) {
		.container {
			padding: 24px;
		}

		.glass-card {
			padding: 20px;
			border-radius: 24px;
		}

		.nickname {
			font-size: 40rpx;
		}

		.user-id {
			font-size: 26rpx;
		}

		.icon-container {
			width: 70px;
			height: 70px;
			border-radius: 20px;
		}

		.function-text {
			font-size: 30rpx;
		}

		.card-title {
			font-size: 20px;
		}

		.instruction-number {
			width: 28px;
			height: 28px;
		}

		.instruction-text {
			font-size: 30rpx;
		}
	}

  /* 预约项目 */
  .reservation-item {
    position: relative;
    padding: 0;
  }

  .reservation-header {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 4px;
  }

  .icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
    width: 56px;
    height: 56px;
    border-radius: 16px;
    margin-right: 16px;
    margin-top: 10px;
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
  }

  .reservation-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
  }

  .machine-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-pending {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }

  .status-completed {
    background: rgba(110, 231, 78, 0.1);
    color: #6EE74E;
  }

  .status-expired {
    background: rgba(156, 163, 175, 0.1);
    color: #6B7280;
  }

  .status-active {
    background: rgba(255, 193, 7, 0.1);
    color: #FF9800;
  }

  .reservation-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
  }

  .reservation-id {
    display: flex;
    align-items: center;
  }

  .id-label {
    font-size: 12px;
    color: #9ca3af;
    margin-right: 4px;
  }

  .id-value {
    font-size: 12px;
    color: #6b7280;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .button-group {
    display: flow;
    align-items: center;
    padding: 8px;
  }

  .sign-in-button {
    background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    transition: all 0.2s ease;
    margin-top: 8rpx;
  }

  .cancel-button {
    background: linear-gradient(135deg, #D3D3D3 0%, #B0B0B0 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    transition: all 0.2s ease;
    margin-top: 8rpx;
  }

  .sign-in-button:active {
    transform: translateY(2px);
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
  }

	/* 黑夜模式 */
	@media (prefers-color-scheme: dark) {

		/* 全局样式 */
		.container {
			padding: 20px;
			background: rgb(0, 0, 0);
			min-height: 100vh;
			position: relative;
		}

		/* 玻璃拟态卡片 */
		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 20px;
			box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			padding: 16px;
			margin-bottom: 20px;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
		}

		.glass-card:active {
			transform: translateY(2px);
			box-shadow: 0 4px 16px rgba(31, 38, 135, 0.08);
		}

		.avatar-container {
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			overflow: hidden;
			border: 2px solid #fff;
			box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
			margin-right: 16px;
		}

		.user-details {
			display: flex;
			flex-direction: column;
			flex: 1;
		}

		.nickname {
			font-size: 36rpx;
			font-weight: bold;
			margin-bottom: 8px;
			color: white;
			/* 允许长单词/URL换行 */
			overflow-wrap: break-word;
			/* 中文/日文等任意字符处换行 */
			word-break: break-all;
			/* 保留空白符但允许换行 */
			white-space: pre-line;
			/* 触发换行的容器宽度 */
			max-width: 400rpx;
		}

		.user-id {
			font-size: 24rpx;
			color: #6b7280;
			background: rgb(59, 59, 61);
			padding: 4px 10px;
			border-radius: 12px;
			align-self: flex-start;
		}

		.icon-container {
			display: flex;
			justify-content: center;
			align-items: center;
			background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
			width: 60px;
			height: 60px;
			border-radius: 16px;
			margin-bottom: 12px;
			box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
		}

		.function-text {
			font-size: 28rpx;
			font-weight: 600;
			color: white;
		}

		.vertical-divider {
			width: 1px;
			height: 80px;
			background: rgb(51, 49, 50);
		}

		/* 使用说明卡片 */
		.instructions-card {
			margin-bottom: 24px;
		}

		.card-title {
			font-size: 18px;
			font-weight: bold;
			color: white;
			padding: 8px 4px 16px 4px;
			border-bottom: 1px solid rgb(51, 49, 50);
			margin-bottom: 16px;
		}

		.instructions-list {
			padding: 0 4px;
		}

		.instruction-item {
			display: flex;
			align-items: center;
			margin-bottom: 16px;
		}

		.instruction-number {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 24px;
			height: 24px;
			border-radius: 50%;
			background: rgba(255, 193, 7, 0.1);
			color: #FF9800;
			font-size: 14px;
			font-weight: 600;
			margin-right: 12px;
		}

		.instruction-text {
			font-size: 28rpx;
			color: white;
			line-height: 1.5;
		}

    .machine-name {
      color: #FFF;
    }

	}


</style>
