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
		<hr/>
		<text style="font-size: 10rpx; color: gray;">&nbsp&nbsp&nbsp&nbsp点击机台可查看机台信息</text>
		
		<!--机台详细信息，使用了uniapp uni-ui的卡片分组-->
		<!--但是uni-ui的组件在微信开发工具的小程序模拟器中渲染有问题，之后可能要修改 -->
		<uni-section title="IIDX" type="line">
			<uni-group mode="card">
				<view style="display: flex;">
					<view class="item">
						<text>当前预约玩家</text>
						<text>玩家</text>
						<text>玩家</text>
						<text>玩家</text>
						<text>玩家</text>
						<text>玩家</text>
					</view>>
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
		
		<uni-section title="舞萌DX" type="line">
			<uni-group mode="card">
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
			</uni-group>
		</uni-section>
		
		<uni-section title="中二节奏" type="line">
			<uni-group mode="card">
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
			</uni-group>
		</uni-section>
		
		<uni-section title="音击" type="line">
			<uni-group mode="card">
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
			</uni-group>
		</uni-section>
		
		<uni-section title="太鼓达人" type="line">
			<uni-group mode="card">
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
			</uni-group>
		</uni-section>
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
	/*疑似导航栏使用*/
	
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
