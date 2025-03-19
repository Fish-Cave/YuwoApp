<template>
	<scroll-view>
		<view style="padding: 20rpx,20rpx;">
			<uni-row>
				<uni-col :span="4">
					<view class="icon">
						<uni-icons type="headphones" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="16">
					<view style="display: flex;
			 flex-direction: column; padding-left: 20rpx;">
						<text style="font-weight: bold;font-size: 35rpx;">{{machineName}}</text>
						<text>5元/半时</text>
					</view>
				</uni-col>
				<uni-col :span="4">
					<view style="display: flex; justify-content: center; padding-top: 20rpx;">

					</view>
				</uni-col>
			</uni-row>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="选择日期"></uni-title>
			<wu-calendar :insert="true" type="week" :fold="false" startWeek="mon" color="#f9cb14"
				@change="calendarChange"></wu-calendar>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="已预约时段"></uni-title>
			<text style="font-weight: bold;font-size: 50rpx;">这里是神秘条形图</text>
		</view>

		<view class="divider" />
		<view>
			<uni-title type="h1" title="选择时间段"></uni-title>
			<view>
				<text>薄被，要在鱼窝过夜吗？</text>
				<uni-data-checkbox v-model="isOvernight" :localdata="option" @change="setPrice()"></uni-data-checkbox>
			</view>

			<view v-if="isOvernight">
				<view style="padding-top: 20rpx;">
					<uni-row class="attention">
						<uni-col :span="4">
							<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：包夜！</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

			<view v-else style="display: flex;flex-direction: column;">
				<view style="display: flex; justify-content: space-between;">
					<view class="option">
						<text>开始时间</text>
						<uni-datetime-picker v-model="startTime" :border="false"
							returnType="timestamp"></uni-datetime-picker>
						<text>{{startTime}}</text>
					</view>
					<view class="option">
						<text>结束时间</text>
						<uni-datetime-picker v-model="endTime" :border="false"
							returnType="timestamp"></uni-datetime-picker>
						<text>{{endTime}}</text>
					</view>
				</view>
				<view style="padding-top: 20rpx;">
					<uni-row class="attention">
						<uni-col :span="4">
							<uni-icons type="checkbox" size="30" style="padding-left: 20rpx;"></uni-icons>
						</uni-col>
						<uni-col :span="14">预计时长：{{totalTime}} 小时</uni-col>
						<uni-col :span="6">费用：¥{{price}}</uni-col>
					</uni-row>
				</view>
			</view>

		</view>
	</scroll-view>

	<view class="divider" />
	<view style="display: flex;
	flex-direction: column; 
	justify-content: center; 
	align-items: center;">

		<view class="price">
			<text>总计费用 </text>
			<text>¥{{price}}</text>
		</view>
		<view class="bt" @click="">
			<text>确认预约</text>
		</view>
	</view>

</template>

<script setup lang="ts">
	import { ref, getCurrentInstance, onMounted, reactive } from 'vue';
	const machineName = ref("")
	interface reservationData{
		"userId":String;
		"machineId":String;
		"startTime":String;
		"endTime":String;
		"isOvernight":Boolean;
		"priceId":String;
		"orderId":String;
		"status":String;
		"notes":String
	}
	const Data = reactive<reservationData>({
	})
	const isOvernight = ref(false)
	const option = [
		{
			"value": false,
			"text": "不要过夜",
		},
		{
			"value": true,
			"text": "对！没错！我要过夜！",
		}
	]
	const price = ref(0)
	const startTime = ref(0)
	const endTime = ref(0)
	const totalTime = ref(0)

	function setPrice() {
		if (isOvernight.value == true) {
			price.value = 50
		} else {
			price.value = 0
		}
	}
	onMounted(() => {
		const instance = getCurrentInstance().proxy;
		const eventChannel = instance.getOpenerEventChannel();
		eventChannel.on('acceptDataFromOpenerPage', function (data) {
			console.log('acceptDataFromOpenerPage', data)
			machineName.value = data.name
		})
	})
	
</script>

<style>
	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}

	.attention {
		background-color: rgb(253, 251, 231);
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
		align-content: center;
		border-radius: 20rpx;
		height: 90rpx;
	}

	.bt {
		background-color: rgb(249, 203, 20);
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 20rpx;
		width: 80%;
		height: 80rpx;
	}

	.price {
		display: flex;
		width: 90%;
		justify-content: space-between;
	}

	.option {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>