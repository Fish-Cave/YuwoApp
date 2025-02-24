<template>
	<view>
		<!--导航栏？-->
		<view style="display: flex; justify-content: center; align-items: center; gap: 40rpx;">
			<view class="item">
				<uni-icons type="arrow-left" size="50rpx"></uni-icons>
				<navigator>前一天</navigator>
			</view>
			<view style="display: flex; flex-direction: column;
			justify-content: center; align-items: center; margin-top: 10rpx;">
				<view>
					<text>
						当前店铺: 
					</text>
					<text style="color: rgba(255, 141, 26, 1);">
					{{shopName}}
					</text>
				</view>
				<view>
					<text>{{nowDate}}</text>
				</view>
				<view class="item">
					<uni-icons type="calendar-filled" size="50rpx"></uni-icons>
					<text>日历</text>
				</view>
				
			</view>
			<view class="item">
				<navigator>后一天</navigator>
				<uni-icons type="arrow-right" size="50rpx"></uni-icons>
			</view>
		</view>
		
		<!--BLANK-->
		<view style="height: 20rpx;"></view>
		
		<!--机台详细信息，使用了uniapp uni-ui的卡片分组-->
		
		<view style="padding-left: 30rpx; padding-right:30rpx ;">
			
			<text class="tips">点击机台名称可查看机台信息</text>
			
			<uni-section title="IIDX" type="line">
				<uni-group mode="card">
					<view style="display: flex; justify-content: space-around">
						<view style="display: flex; flex-direction: column;">
							<text>当前预约玩家</text>
							<text>玩家</text>
							<text>玩家</text>
							<text>玩家</text>
							<text>玩家</text>
							<text>玩家</text>
						</view>
						<view style="display: flex; flex-direction: column;">
							<text>在此显示机台详细信息</text>
						</view>
					</view>
					<button class="orderButton" @click = "test()">预约此机台</button>
				</uni-group>
			</uni-section>
			
			<uni-section title="SDVX" type="line">
				<uni-group mode="card">
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
				</uni-group>
			</uni-section>
			
		</view>	
	</view>
</template>

<script lang="ts" setup>
	import { ref } from 'vue';
	const shopName = ref("鱼窝一号店")
	const nowDate = ref("1970年1月1日")
	function test(){
		console.log("test")
	}
</script>
<style lang="scss">	
	/*容器内组件水平排列*/
	.tips{
		font-size: 30rpx;
		color: gray; 
		margin-top: 10rpx;
	}
	.item{
		display: flex; 
		justify-content: center; 
		align-items: center;
	}
	/*分割线*/
	hr{
		margin-left: 30rpx;
		margin-right: 30rpx;
	}
	/*预约按钮*/
	.orderButton{
		margin-top: 35rpx;
		width: 400rpx;
		height: 90rpx;
		opacity: 1;
		border-radius: 40px;
		background: rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
	}
	/*我不会写样式*/
</style>
