<template>
	<view>
		<text></text>
	</view>
</template>

<script setup>
	import { onMounted, reactive } from 'vue'
	const todo = uniCloud.importObject('todo')
	const res = uniCloud.getCurrentUserInfo('uni_id_token')
	const Data = reactive({
		userid : res.uid
	})
	async function updateLoved() {
		const result = await todo.Loved_Update(res.uid,Data.userid)
		console.log(result.data)
	}

	onMounted(()=>{
		updateLoved()
	})
</script>

<style>

</style>