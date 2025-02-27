import { defineStore } from 'pinia'

export const useUserInfo = defineStore('userInfo',{
	state(){
		return {
			userName:"",
			userUniID:"",
			avatar:"",
		}
	}
})