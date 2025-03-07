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
						<text>使用中</text>
					</view>

					<view class="card">
						<text>预约中</text>
					</view>
					<view class="card">
						<text>收藏</text>
					</view>
					<view class="card">
						<text>?客服</text>
					</view>
				</view>

			</uni-card>

			<uni-card title="最近订单">
				<template v-slot:title>
					<uni-list>
						<uni-list-item showArrow title="最近订单" />
					</uni-list>
				</template>
				<text>123</text>
			</uni-card>

			<uni-card>
				<uni-list-item showArrow title="消息通知" />
				<uni-list-item showArrow title="帮助中心" />				
			</uni-card>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { useProfileStroe }from '@/stores/userProfileStore'
	const userProfile = useProfileStroe()
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
	}
</style>