<template>
	<view>
		<view>
			<!--这一堆是预览里面用来显示用户信息的部分，就是橙色底的那一堆-->
			<uni-card isFull="" style="background-color: orange;">
				<template v-slot:title>
					<uni-row style="margin-top: 20rpx;">
						<!--这边是头像，头像我觉得我已经调好了-->
						<uni-col :span="6">
							<view class="avatar">
								<!--我看了一下他这个src是支持绝对位置、相对位置、base64-->
							</view>
						</uni-col>
						<!--这一块是用户名和UID，可能要调一下字体和间距-->
						<uni-col :span="16">
							<view style="display: flex;flex-direction: column;">
								<text>{{}}</text>
								<text>UID:{{}}</text>
							</view>
						</uni-col>
						<!--小齿轮-->
						<uni-col :span="2">
							<uni-icons type="gear-filled" size="30" />
						</uni-col>
					</uni-row>
				</template>
				<!--这一块是白字的统计信息，应该要调一下字体-->
				<view style="display: flex; justify-content: space-around;">
					<view class="card">
						<text>{{}}</text>
						<text>总使用次数</text>
					</view>
					<view class="card">
						<text>{{}}</text>
						<text>总使用时长</text>
					</view>
					<view class="card">
						<text>{{}}</text>
						<text>总消费金额</text>
					</view>
				</view>
			</uni-card>
		</view>

		<!--这一堆是那四个功能按钮，应该没有东西要调-->
		<view style="display: felx; flex-direction: column;">

			<uni-card>
				<view style="display: flex; justify-content: space-around;">
					<view class="card">
						<view class="usingbox">
							<uni-icons type="checkbox" size="30"></uni-icons>
						</view>
						<text>使用中</text>
					</view>

					<view class="card">
						<view class="orderingbox" @click="goToreservationList()">
							<uni-icons type="calendar" size="30"></uni-icons>
						</view>
						<text>预约中</text>
					</view>
					<view class="card">
						<view class="favoritebox">
							<uni-icons type="heart" size="30"></uni-icons>
						</view>
						<text>收藏</text>
					</view>
					<view class="card">
						<view class="servicebox">
							<uni-icons type="chatbubble" size="30"></uni-icons>
						</view>
						<text>?客服</text>
					</view>
				</view>
				<!--你有没有发现这四个功能界面对应的页面没有设计？-->
			</uni-card>

			<!--这块是最近订单，可能要调下字体-->
			<!--用v-for遍历订单数组实现的-->
			<uni-card>
				<!--uni-card的自定义标题，详情文档-->
				<template v-slot:title>
					<uni-list>
						<uni-list-item showArrow title="最近订单" />
					</uni-list>
				</template>
				
				<view v-for="data in Data" :key="data._id">
					<uni-row>
						<uni-col :span="6">
							<view class="orderbox">
								<uni-icons type="contact" size="30"></uni-icons>
							</view>
						</uni-col>
						<uni-col :span="12">
							<view style="display: flex;flex-direction: column;">
								<text>{{data.machineId}}</text>
								<uni-dateformat :date='data.startTime'></uni-dateformat>
							</view>
						</uni-col>
						<uni-col :span="6">
							<view style="display: flex;flex-direction: column;">
								<text v-if="data.status == 1" style="color: greenyellow;">已完成</text>
								<text v-else style="color: red;">未完成</text>
								<text>{{data.status}}</text>
							</view>
						</uni-col>
					</uni-row>
					<view class="divider"></view>
				</view>
				
			</uni-card>

			<!--最底下两个功能按钮-->
			<uni-card>
				<uni-list-item showArrow title="消息通知" />
				<uni-list-item showArrow title="帮助中心" />
			</uni-card>
		</view>
		<button @click="logOut()">退出登录</button>
	</view>
</template>

<script setup lang="ts">
	import { onMounted, reactive, ref } from 'vue'
	//我把测试用的用户信息用pinia存上了，详情看那个ts文件
	import { useProfileStore } from '@/stores/userProfileStore'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	const profile = ref({})
	console.log(res)
	interface reservationData {
		_id:String;
		machineId:String;
		isOvernight:Boolean;
		status:String;
		startTime:String;
	}
	const Data = ref<reservationData[]>([])
	
	async function getReservationData() {
		try {
			let result = await todo.GetReservationInfo(res.uid)
			console.log(result.data)
			Data.value = result.data
		} catch {}
	}
	
	const uniIdCo = uniCloud.importObject('uni-id-co')
	//这是测试用的订单信息
	const testOrderData = reactive([
		{
			machineName: "IIDX",
			machineID: "机台1号",
			orderTime: "2024-02-15 15:00",
			orderStatus: 0,
			orderID: "002",
			orderPrice: "$5.99"
		},
		{
			machineName: "SDVX",
			machineID: "机台2号",
			orderTime: "2024-02-14 18:30",
			orderStatus: 1,
			orderID: "001",
			orderPrice: "$5.99"
		}
	])
	function goToreservationList(){
		uni.navigateTo({
			url: '/pages/reservationList/reservationList'
		});
	}
	async function logOut() {
		try {
			await uniIdCo.logout()
			// 3. 清除本地 token 和用户信息
			uni.removeStorageSync('uni_id_token');
			uni.removeStorageSync('uni_id_token_expired');
			// 4. 更新全局状态（Vuex/Pinia）

			// 5. 跳转到登录页
			uni.reLaunch({
				url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
			});

			// 6. （可选）处理成功提示
			uni.showToast({
				title: '退出成功',
				icon: 'none'
			});
		} catch { }
	}
	onMounted(() => {
	})
</script>

<style>
	.card {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}

	.usingbox {
		background-color: rgb(255, 247, 237);
		height: 120rpx;
		width: 120rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}

	.orderingbox {
		background-color: rgb(238, 245, 254);
		height: 120rpx;
		width: 120rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}

	.favoritebox {
		background-color: rgb(249, 244, 254);
		height: 120rpx;
		width: 120rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}

	.servicebox {
		background-color: rgb(239, 252, 243);
		height: 120rpx;
		width: 120rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}

	.orderbox {
		background-color: rgb(242, 243, 245);
		height: 100rpx;
		width: 100rpx;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}

	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}

	.avatar {
		width: 160rpx;
		/* 宽度与高度需相同 */
		height: 160rpx;
		/* 高度与宽度需相同 */
		border-radius: 50%;
		/* 关键属性 */
		overflow: hidden;
		/* 确保内容被裁剪为圆形 */
	}

	image {
		width: 160rpx;
		/* 宽度与高度需相同 */
		height: 160rpx;
		/* 高度与宽度需相同 */
	}
</style>