// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
module.exports = {
	_before: function() { // 通用预处理器

	},
	/**
	 * method1方法描述
	 * @param {string} param1 参数1描述
	 * @returns {object} 返回值描述
	 */
	SignIn_Search: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		console.log('Now Searching SignIn')
		try {
			return signin.where({
				userid: uid,
				status: 0
			}).field({
				"id": true,
				"status": true,
				"reservationid": true,
				"isPlay": true,
				"isOvernight": true,
				"starttime": true
			}).get()
		} catch (e) {}

	},

	SignIn_Add: async function(content, uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')

		//判断是否已经存在签到订单
		const result = await Promise.any([
			signin.where({
				userid: uid,
				status: 0
			}).field({
				"id": true,
				"status": true,
				"reservationid": true,
				"isPlay": true,
				"isOvernight": true,
				"starttime": true
			}).limit(1).get()
		])
		console.log(result.data)
		console.log(typeof(result.data))

		//不为空返回错误
		if (result.data[0] != null) {
			console.log("NOT EMPTY")
			return {
				errCode: "SIGNIN_EXIST",
				errMsg: "存在未结算的签到订单",
			}
		}
		//为空添加数据
		console.log("IS EMPTY")
		try {
			console.log("ADD DATA")
			const res = await signin.add(content)
			return res
		} catch (e) {

		}
	},

	SignIn_Search: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		return await signin.where({
			userid: uid
		}).field({
			"id": true,
			"status": true,
			"reservationid": true,
			"isPlay": true,
			"isOvernight": true,
			"starttime": true
		}).get()
	},
	
	SignIn_Update: async function(id, statusnumber) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		try {
			await signin.where({
				_id: id
			}).update({
				status: statusnumber
			})
			console.log("订单状态已变更")
		} catch (e) {
	
		}
	},
}