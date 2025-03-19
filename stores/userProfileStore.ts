import { defineStore } from 'pinia'

export const useProfileStroe = defineStore('userProfile',{
	state: () => {
		return {
			_id:"",
			role:[] as any,
			permission: [] as any,
			nickname: "",
			avatar:"",
		}
	}
})