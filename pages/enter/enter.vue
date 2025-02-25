<template>	
	<view class="container">
		<!-- Header Navigation -->
		<view class="header">
		  <view class="nav-item">
		    <uni-icons type="arrow-left" size="20"></uni-icons>
		    <text class="nav-text">前一天</text>
		  </view>
		
		  <view class="date-container">
		    <view class="location">
		      <text>当前位置: </text>
		      <text class="shop-name">{{ shopName }}</text>
		    </view>
		    <view class="date-pill">
		      <text>{{ nowDate }}</text>
		    </view>
		    <view class="calendar-btn">
		      <uni-icons type="calendar" size="16"></uni-icons>
		      <text>日历</text>
		    </view>
		  </view>
		
		  <view class="nav-item">
		    <text class="nav-text">后一天</text>
		    <uni-icons type="arrow-right" size="20"></uni-icons>
		  </view>
		</view>
		
		<view class="itemContainer">
			<!--玩家信息-->
			<uni-group mode="card">
				<view style="display: flex; justify-content: space-between;">
					<view>
						<uni-title type="h1" title="我是头像"></uni-title>
						<uni-title type="h1" title="我是头像"></uni-title>
						<uni-title type="h1" title="我是头像"></uni-title>
					</view>
					<view style="display: flex; flex-direction: column; 
					align-items: flex-end; ">
						<text>我是ID</text>
						<text>我是UID</text>
						<text>我是会员剩余时长</text>
					</view>
				</view>
			</uni-group>
			
			<view>
				<view style="display: flex;">
					<view >
						<text class="tips">您于{{year}}年共计在鱼窝消耗</text>
						<text class="tips" style="color: rgba(255, 141, 26, 1);">{{4294}}</text>
						<text class="tips">小时! 地力 UP! 被封禁次数：</text>
						<text class="tips" style="color: rgba(255, 141, 26, 1); ;">{{bebaned}}</text>
						<text class="tips">次，请继续保持! </text>
					</view>
					<view>
						<button class="editButton">
							<uni-icons type="compose" size="30"></uni-icons>
						</button>
					</view>
				</view>
			</view>
			
			
			
			<!--预约时段信息-->
			<view style="margin-top: 20rpx;">
				<view style="display: flex; justify-content: space-between;">
					<view>
						<uni-title type="h1" title="已预约时段"></uni-title>
					</view>
					<view style="width: 120rpx;"></view>
					<view style="display: flex; flex-direction: column; 
					justify-content: center; align-items: flex-end; ">
						<text style="font-size: 25rpx;">今日共记预约</text>
						<view style="display: flex;">
							<text style="font-size: 25rpx; 
							color: rgba(255, 141, 26, 1);;">{{reserveTime}}</text>
							<text style="font-size: 25rpx;">小时</text>
						</view>
						
					</view>
				</view>
			</view>
			
			
			<!--具体预约信息-->
			<view>
				<uni-group title="这是具体预约信息">
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
					<view> 分组内容 </view>
				</uni-group>
				
				<view style="display: flex">
					<view style="width: 80rpx;"></view>
					<button class="bt">
						<text style="font-size: 25rpx;">
							增加时段
						</text>
					</button>
					<button class="bt">
						<text style="font-size: 25rpx;">
							取消预约
						</text>
					</button>
					<view style="width: 80rpx;"></view>
				</view>
			</view>
			
			
			<!--帮助-->
			<uni-card>
				<uni-title type="h1" title="遇到问题了？"></uni-title>
				<text class="tips">
					开启门锁功能仅在预约时段内可用，如有物品遗失等问题需要临时开门，请及时联系管理员。
				</text>
			</uni-card>
			<view style="display: flex; gap: 20rpx;">
				<button class="bt">
					<text style="font-size: 25rpx;">
						查看地图
					</text>
				</button>
				<button class="bt">
					<text style="font-size: 25rpx;">
						开启门锁
					</text>
				</button>
				<button class="bt">
					<text style="font-size: 25rpx;">
						联系电话
					</text>
				</button>
			</view>	
		</view>
		<!--BLANK-->
		<view style="height: 40rpx;"></view>
		
		
	</view>
	
</template>
	
<script lang="ts" setup>
	import { ref } from 'vue';
	const shopName = ref("鱼窝一号店")
	const nowDate = ref("1970年1月1日")
	const reserveTime = ref(65535)
	const year = ref(2024)
	const bebaned = ref(0)
</script>
<style>
	.container {
	  background-color: #f5f5f5;
	  min-height: 100vh;
	  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}
	.header {
	  display: flex;
	  justify-content: space-between;
	  align-items: center;
	  padding: 20rpx 30rpx;
	}
	
	.nav-item {
	  display: flex;
	  align-items: center;
	  gap: 10rpx;
	}
	
	.nav-text {
	  font-size: 28rpx;
	  color: #333;
	}
	
	.date-container {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  gap: 10rpx;
	}
	
	.location {
	  font-size: 28rpx;
	  color: #333;
	}
	
	.shop-name {
	  color: #FF8D1A;
	}
	
	.date-pill {
	  background-color: #FFD700;
	  padding: 8rpx 40rpx;
	  border-radius: 30rpx;
	  margin-top: 10rpx;
	  margin-bottom: 10rpx;
	}
	
	.calendar-btn {
	  display: flex;
	  align-items: center;
	  gap: 10rpx;
	  font-size: 26rpx;
	  color: #666;
	}
	.tips{
		font-size: 25rpx;
		color: gray; 
		margin-top: 10rpx;
	}
	.item{
		display: flex; 
		justify-content: center; 
		align-items: center;
	}
	.editButton{
		width: 120rpx;
		height: 80rpx;
		border-radius: 40rpx;
		background: rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
		display: flex;
		justify-content: center; 
		align-items: center;
	}
	.bt{
		width: 200rpx;
		height:40px;
		border-radius: 40px;
		background: rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
		display: flex;
		justify-content: center; 
		align-items: center;
	}
	.itemContainer{
		padding-left: 30rpx; 
		padding-right: 30rpx;
	}
	.containerVertical{
		display: flex; 
		flex-direction: column;
	}
	/*分割线*/
</style>
