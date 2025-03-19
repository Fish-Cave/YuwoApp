import { defineStore } from 'pinia'

export const useProfileStroe = defineStore('userProfile',{
	state: () => {
		return {
			uid:"",
			role:[] as any,
			"permission": [] as any,
			userName: "我是测试数据",
			userID: "2147483647+1",
			time: "很久很久",
			avatar: "/static/test.png",
			playCount:"很多很多次",
			totalCost:"很多很多钱",
		}
	}
})