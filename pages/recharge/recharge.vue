<template>
	<view>
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
		<view style="padding-left: 30rpx; padding-right: 30rpx;">
			<view style="display: flex; justify-content: space-between;">
				<view style="display: flex; flex-direction: column;">
					<uni-title type="h1" title="剩余时长"></uni-title>
					<uni-title type="h1" title="鱼窝会员"></uni-title>
					<uni-title type="h1" title="大月卡/大周卡"></uni-title>
				</view>
				<view style="display: flex; flex-direction: column; justify-content: space-around;">
					<view>
						<text style="color: rgba(255, 141, 26, 1);">{{}}</text>
						<text>小时</text>
					</view>
					<view>
						<text style="color: rgba(255, 141, 26, 1);">{{}}</text>
						<text>到期</text>
					</view>
					<view>
						<text>到期</text>
					</view>
				</view>
			</view>
			
			
		</view>
	</view>
		
	
</template>

<script lang="ts" setup>
	
</script>
<style>
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
</style>
