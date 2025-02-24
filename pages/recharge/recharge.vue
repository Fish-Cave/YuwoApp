<template>
	<view style="padding-left: 30rpx; padding-right: 30rpx;">
		<view>
			<!--玩家信息-->
			<view>
				<view style="display: flex; padding-left: 20rpx;">
					<view>
						<h1>我是头像</h1>
						<h1>我是头像</h1>
						<h1>我是头像</h1>
					</view>
					<view style="width: 200rpx;"/>
					<view style="display: flex; flex-direction: column;">
						<h2>我是ID</h2>
						<text>我是UID</text>
						<button class="editButton">
							<img class="icon"/>
						</button>
					</view>
				</view>
			</view>
			<!--BLANK-->
			<view style="height: 30rpx;"/>
			
			<view style="display: flex;">
				<view style="display: flex; flex-direction: column;">
					<h2>剩余时长</h2>
					<h2>鱼窝会员</h2>
					<h2>大月卡/大周卡</h2>
				</view>
				<view style="display: flex; flex-direction: column;">
					<h2>{{}}小时</h2>
					<h2>{{}}到期</h2>
					<h2>{{}}到期</h2>
				</view>
			</view>
			<!--BLANK-->
			<view style="height: 20rpx;"/>
			
			<view style="display: flex;">
				<p>如果已经成为会员，以下售价将会显示会员价格。已售出时长不进行退款，请理智购买。</p>
			</view>
			
			<!--BLANK-->
			<view style="height: 20rpx;"/>
			<view>
				
			</view>
			
			<hr />
		</view>
	</view>
</template>

<script lang="ts" setup>
	
</script>
<style>
	.icon{
		height: 35rpx;
	}
	.editButton{
		width: 120rpx;
		height: 60rpx;
		border-radius: 40px;
		background: rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
		margin-top: 12rpx;
		justify-content: center;
		align-items: center;
		display: flex;
	}
	p{
		font-size: 10rpx; 
		color: gray; 
		margin-top: 10rpx;
	}
</style>
