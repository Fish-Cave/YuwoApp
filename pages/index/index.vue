<template>
	<view>
		<view class="Header">
			<navigator>← 前一天</navigator>
			<view style="">
				<text>当前位置:&nbsp</text>
				<a style="color: orange;">{{shopName}}</a><br/>
				<text class="date">{{nowDate}}</text><br/>
				<text>日历</text>
			</view>
			<navigator>后一天 →</navigator>
		</view>
		<hr />
		<text style="font-size: 12px; color: gray;">&nbsp&nbsp&nbsp&nbsp点击机台可查看机台信息</text>
		<uni-section title="IIDX" type="line">
			<uni-group mode="card">
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
				<view> 分组内容 </view>
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
</script>
<style lang="scss">
	.Header {
		display: flex;
		/* 主轴（水平）居中 */
		justify-content: center;
		/* 交叉轴（垂直）居中 */
		align-items: center;
		/* 可选：设置容器高度（垂直居中需要高度支持） */
		height: 80px;
		/* 可选：子元素间距 */
		gap: 60px;
	  
	}
	.date{
		width: 120px;
		height: 60px;
		opacity: 1;
		border-radius: 40px;
		background: rgba(255, 222, 115, 1);
		box-shadow: 0px 2px 4px  rgba(0, 0, 0, 0.25);
	}

</style>
