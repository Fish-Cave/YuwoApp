<template>
	<view style="padding: 20rpx 20rpx;">
		<view>
			<uni-row>
				<uni-col :span="4">
					<view class="icon">
						<uni-icons type="headphones" size="30"></uni-icons>
					</view>
				</uni-col>
				<uni-col :span="16">
					<view style="display: flex;
			 flex-direction: column; padding-left: 20rpx;">
						<text style="font-weight: bold;font-size: 35rpx;">机台1号 - IIDX</text>
						<text>30元/小时</text>
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
				<uni-data-checkbox v-model="isOvernight" :localdata="option"></uni-data-checkbox>
			</view>
			<view v-if="isOvernight">
				<view>
					<uni-row>
						<uni-col></uni-col>
						<uni-col></uni-col>
						<uni-col></uni-col>
					</uni-row>
				</view>
			</view>
			<view v-else style="display: flex;">
				<view>
					<text>开始时间</text>
				</view>
				<view>
					<text>结束时间</text>
				</view>
			</view>
			<view>
				<view>
					<uni-row>
						<uni-col></uni-col>
						<uni-col></uni-col>
						<uni-col></uni-col>
					</uni-row>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
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
</script>

<style>
	.divider {
		height: 2rpx;
		background-color: rgb(242, 242, 242);
		margin-top: 15rpx;
		margin-bottom: 15rpx;
	}
</style>