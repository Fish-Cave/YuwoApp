<template>
	<view>
		<view>
			<uni-card title="" sub-title="" extra="" isFull="" style="background-color: orange;">
				<template v-slot:title>
					<uni-row>
						<uni-col :span="6">
							<text>这里应该是头像</text>
						</uni-col>
						<uni-col :span="16">
							<view style="display: flex;flex-direction: column;">
								<text>{{userProfile.userName}}</text>
								<text>UID:{{userProfile.userID}}</text>
							</view>	
						</uni-col>
						<uni-col :span="2">
							<uni-icons type="gear-filled" size="30"/>
						</uni-col>
					</uni-row>
				</template>
				<view style="display: flex; justify-content: space-around;">
					<view class="card">
						<text>{{userProfile.playCount}}</text>
						<text>总使用次数</text>
					</view>
					<view class="card">
						<text>{{userProfile.time}}</text>
						<text>总使用时长</text>
					</view>
					<view class="card">
						<text>{{userProfile.totalCost}}</text>
						<text>总消费金额</text>
					</view>
				</view>
			</uni-card>
		</view>

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
						<view class="orderingbox">
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

			</uni-card>

			<uni-card>
				<template v-slot:title>
					<uni-list>
						<uni-list-item showArrow title="最近订单" />
					</uni-list>
				</template>
				<view v-for="data in testOrderData" :key="data.orderID">
					<uni-row>
						<uni-col :span="6">
							<view class="orderbox">
								<uni-icons type="contact" size="30"></uni-icons>
							</view>
						</uni-col>
						<uni-col :span="12">
							<view style="display: flex;flex-direction: column;">
								<text>{{data.machineName}} - {{data.machineID}}</text>
								<text>{{data.orderTime}}</text>
							</view>		
						</uni-col>
						<uni-col :span="6">
							<view style="display: flex;flex-direction: column;">
								<text v-if="data.orderStatus == 1" style="color: greenyellow;">已完成</text>
								<text v-else style="color: red;">未完成</text>
								<text>{{data.orderPrice}}</text>
							</view>		
						</uni-col>
					</uni-row>
					<view class="divider"></view>
				</view>
			</uni-card>

			<uni-card>
				<uni-list-item showArrow title="消息通知" />
				<uni-list-item showArrow title="帮助中心" />				
			</uni-card>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { reactive } from 'vue'
import { useProfileStroe }from '@/stores/userProfileStore'
	const userProfile = useProfileStroe()
	const testOrderData = reactive([
		{
			machineName:"IIDX",
			machineID:"机台1号",
			orderTime:"2024-02-15 15:00",
			orderStatus:0,
			orderID:"002",
			orderPrice:"$5.99"
		},
		{
			machineName:"SDVX",
			machineID:"机台2号",
			orderTime:"2024-02-14 18:30",
			orderStatus:1,
			orderID:"001",
			orderPrice:"$5.99"
		}
	])
	//测试用，用来导入数据
	function init(){
		userProfile.playCount = "11451"
		userProfile.time = "19198"
		userProfile.totalCost = "很多很多钱"
	}
	init()
</script>

<style>
	.card{
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;
		align-items: center;
		align-self: center;
	}
	.usingbox{
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
	.orderingbox{
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
	.favoritebox{
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
	.servicebox{
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
	.orderbox{
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
</style>