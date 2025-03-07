import { defineStore } from 'pinia'

export const useProfileStroe = defineStore('userProfile',{
	state: () => {
		return {
			userName: "",
			userID: "",
			time: "",
			avatar: "",
			playCount:"",
			totalCost:"",		
		}
	}
})