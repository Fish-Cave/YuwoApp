<template>
	<view class="container">
		<view class="card">
			<uni-section class="forms" title="加入🐟窝!" type="line" >
				<uni-card>
					<uni-forms ref="formRef" :modelValue="userData" :rules="rules" label-position="top">
						<uni-forms-item label="昵称 :" required name="username">
							<uni-easyinput type="text" 
							v-model="userData.username" placeholder="请输入昵称🐟" />
						</uni-forms-item>
							
						<uni-forms-item label="手机号 :" required name="mobile">
							<uni-easyinput type="text" 
							v-model="userData.mobile" placeholder="请输手机号⭐" />
						</uni-forms-item>
						
						<uni-forms-item label="邮箱 :" required name="email">
							<uni-easyinput type="text" 
							v-model="userData.email" placeholder="请输入邮箱📫" />
						</uni-forms-item>
					</uni-forms>
					
					<view style="display: flex; justify-content: space-between;">
						<button class="bt" @click="CommitUserData()">启动！</button>
						<button type="warn" class="bt">算了算了</button>
					</view>
				</uni-card>
			</uni-section>
			
			<!--鱼鱼-->
<!--			
			<view style="margin: 80rpx;">
				<pre>
		[bug]     /"*._         _
		      .-*'`    `*-.._.-'/
		    < * ))     ,       ( 
		      `*-._`._(__.--*"`.\
					
				</pre>
			</view>
			                               -->
		</view>	
	</view>
</template>

<script setup lang="ts">
	import { reactive } from 'vue';
	
	interface userInfo{
		username:String,
		mobile:String,
		email:String,
	}
	const userData = reactive<userInfo>({
		username:"",
		mobile:"",
		email:"",
	})
	
	function CommitUserData(){
		console.log(userData)
	}
	const rules = {
		username : {
			rules:[
				{
					require: true,
					errorMessage: '请输入姓名',
				}
			]
		},
		mobile :{
			rules:[
				{
					require: true,
					errorMessage: '请输入手机号',
				}
			]
		},
		email :{
			rules:[
				{
					require: true,
					errorMessage: '请输入邮箱',
				}
			]
		},
	}
</script>

<style>
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}
	.card{
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;
		min-height: 400rpx;
	}
	.forms{
		
	}
	.bt {
	  margin-top: 20rpx;
	  width: 240rpx;
	  height: 90rpx;
	  border-radius: 40px;
	  background: rgba(255, 195, 0, 1);
	  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
	  font-size: 28rpx;
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  color: #333;
	}
	
</style>
