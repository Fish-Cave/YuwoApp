import { defineStore } from 'pinia'

export const useProfileStore = defineStore('userProfile',{
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