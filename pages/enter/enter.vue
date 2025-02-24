<template>	
	<view>
		<!--导航栏？-->
		<view class="Header">
			<view class="arrow">
				<img class="icon" src="/static/icon/arrow_left.png" />
				<navigator>前一天</navigator>
			</view>
			<view class="item">
				<view>
					<text>当前位置:&nbsp</text>
					<a style="color: orange;">{{shopName}}</a><br/>
				</view>
				<view class="date">
					<text >{{nowDate}}</text><br/>
				</view>
				<view>
					<img class="icon" src="/static/icon/calendar.png" />
				</view>					
			</view>
			<view class="arrow">
				<navigator>后一天</navigator>
				<img class="icon" src="/static/icon/arrow_right.png" />
			</view>
		</view>
		<hr />
		
		<view style="padding-left: 30rpx; padding-right: 30rpx;">
			<!--玩家信息-->
			<view>
				<view style="display: flex; padding-left: 20rpx;">
					<view>
						<h1>我是头像</h1>
						<h1>我是头像</h1>
						<h1>我是头像</h1>
					</view>
					<view style="width: 100rpx;"></view>
					<view style="display: flex; flex-direction: column;">
						<h2>我是ID</h2>
						<text>我是UID</text>
						<text>我是会员剩余时长</text>
					</view>
				</view>
				
				<view style="display: flex;">
					<view >
						<p>您于{{year}}年共计在鱼窝消耗{{4294967296}}小时！地力 UP！
						被封禁次数：{{bebaned}} 次，请继续保持！</p>
					</view>
					<button class="editButton">
						<img class="icon" src="/static/icon/edit.png"/>
					</button>
				</view>
			</view>
			
			
			<!--预约时段信息-->
			<view style="margin-top: 20rpx;">
				<view style="display: flex;">
					<view>
						<h1 >已预约时段</h1>
					</view>
					<view style="width: 120rpx;"></view>
					<view style="display: flex; flex-direction: column; ">
						<text style="font-size: 25rpx;">今日共记预约</text>
						<text style="font-size: 25rpx;">{{reserveTime}}小时</text>
					</view>
				</view>>
			</view>
			
			
			<!--具体预约信息-->
			<view>
				<view>
					
				</view>
				<view style="display: flex">
					<view style="width: 80rpx;"></view>
					<button>
						<text style="font-size: 25rpx;">
							增加时段
						</text>
					</button>
					<button>
						<text style="font-size: 25rpx;">
							取消预约
						</text>
					</button>
					<view style="width: 80rpx;"></view>
				</view>
			</view>
			
			
			<!--帮助-->
			<view>
				<view>
					<h1>需要协助？</h1>
					<p>
						开启门锁功能仅在预约时段内可用，如有物品遗失等问题需要临时开门，请及时联系管理员。</p>
				</view>
				<view style="display: flex; margin-top: 30rpx; padding-left: 60rpx;
				 padding-right: 60rpx; gap: 30rpx;">
					<button>
						<text style="font-size: 25rpx;">
							查看地图
						</text>
					</button>
					<button>
						<text style="font-size: 25rpx;">
							开启门锁
						</text>
					</button>
					<button>
						<text style="font-size: 25rpx;">
							联系电话
						</text>
					</button>
				</view>
			</view>
		</view>
		
		
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
	/*容器内组件水平排列*/
	.Header {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 160rpx;
		gap: 50rpx;
	  
	}
	/*容器内组件竖直排列*/
	.item{
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 10rpx;
	}
	.date{
		width: 300rpx;
		height: 50rpx;
		opacity: 1;
		border-radius: 40px;
		background: rgba(255, 222, 115, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
		display: flex;
		justify-content: center;
		align-items: center;
	}
	/*图标*/
	.icon{
		height: 35rpx;
	}
	.arrow{
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 5rpx;
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
	/*分割线*/
	hr{
		margin-left: 20rpx;
		margin-right: 20rpx;
	}
	button{
		width: 200rpx;
		height: 70rpx;
		border-radius: 40px;
		background: rgba(255, 195, 0, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
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
