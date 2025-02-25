<template>
	<view class="container">
		<uni-group mode="card">
			<view style="display: flex; justify-content: space-between;">
				<view>
					<uni-title type="h1" title="我是头像"></uni-title>
					<uni-title type="h1" title="我是头像"></uni-title>
				</view>
				<view style="display: flex; flex-direction: column; 
				align-items: flex-end; gap: 10rpx;">
					<text>我是ID</text>
					<text>我是UID</text>
					<button class="editButton">
						<uni-icons type="compose" size="30"></uni-icons>
					</button>
				</view>
			</view>
		</uni-group>
		
		<view class="itemContainer" >
			<view style="display: flex; justify-content: space-between;">
				<view class=".containerVertical">
					<uni-title type="h1" title="鱼窝会员"></uni-title>
					<uni-title type="h1" title="大月卡/大周卡"></uni-title>
				</view>
				<view style="display: flex; flex-direction: column; justify-content: space-around;">
					<view>
						<text style="color: rgba(255, 141, 26, 1);">{{}}</text>
						<text>到期</text>
					</view>
					<view>
						<text>到期</text>
					</view>
				</view>
			</view>
			
			<view>
				<text class="tips">
					如果已经成为会员，计时计费将会使用会员价格。
				</text>	
			</view>
			
			<!--这里应该有一个容器用来放计时收费相关的东西-->
			<view style="height: 500rpx; display: flex; flex-direction: column; justify-content: center;">
				<text>这里应该有一个容器用来放计时收费相关的东西</text>
				<text>这里应该有一个容器用来放计时收费相关的东西</text>
				<text>这里应该有一个容器用来放计时收费相关的东西</text>
			</view>
			
			
			<!--会员充值模块-->
			<view>
				<view style="display: flex; justify-content: space-between; 
				padding-left: 20rpx; padding-right: 20rpx;" >
					<view class="box">
						<text>鱼窝会员</text><br/>
						<text>售价: 30</text>
					</view>
					<view class="box">
						<text>鱼窝会员</text><br/>
						<text>售价: 30</text>
					</view>
					<view class="box">
						<text>鱼窝会员</text><br/>
						<text>售价: 30</text>
					</view>
				</view>
				<view style="display: flex; margin-top: 20rpx;">
					<view style="display: flex; justify-content: center;
					 align-content: center; align-self: center;">
						<uni-icons type="info" size="50rpx"></uni-icons>
						<navigator class="tips">关于鱼窝会员、大月卡、大周卡的区别</navigator>
					</view>
					<button class="bt">购买</button>
				</view>
			</view>
		</view>
	</view>
		
	
</template>

<script lang="ts" setup>
	
</script>
<style>
	.container {
	  background-color: #f5f5f5;
	  min-height: 100vh;
	  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
		width: 160rpx;
		height:80rpx;
		border-radius: 40px;
		background: rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
		display: flex;
		justify-content: center; 
		align-items: center;
	}
	.box{
		width: 160rpx;
		height: 140rpx;
		border-radius: 10rpx;
		background: rgba(255, 255, 255, 1);
		border: 3px solid rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
	}
	.itemContainer{
		padding-left: 30rpx; 
		padding-right: 30rpx;
		display: flex;
		flex-direction: column;
	}
	.containerVertical{
		display: flex; 
		flex-direction: column;
	}
</style>
