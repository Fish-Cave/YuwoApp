// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
module.exports = {
	_before: function() { // 通用预处理器

	},
	Machines_Add: function(content) {
		const collection = db.collection('machines');
		collection.add(content)
	},
	Machines_List: function() {
		const collection = db.collection('machines');
		return collection.field({
			"_id": true,
			"name": true,
			"capacity": true,
			"status": true,
			"machinenum": true,
			"description": true,
		}).get()
	},
	GetMachinesInfo: function(content) {
		const collection = db.collection('machines');
		return collection.field({
			"name": true,
			"type": true,
			"capacity": true,
			"status": true,
		}).where({
			_id: content,
		}).get()
	},

	Prices_Add: function(content) {
		const collection = db.collection('prices');
		collection.add(content)
	},
	Prices_List: function() {
		const collection = db.collection('prices');
		return collection.field({
			"price": true,
			"unit": true,
			"type": true,
			"description": true,
		}).get()
	},

	Reservation_Add: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const collectionJQL = dbJQL.collection("reservation-log")
		collectionJQL.add(content)
	},
	
	GetReservationInfo: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const machines = dbJQL.collection('machines').field("_id,name").getTemp()
		const collectionJQL = dbJQL.collection('reservation-log', machines)

		return collectionJQL.where({
			userId: content,
		}).field({
			"_id": true,
			"machineId": true,
			"isOvernight": true,
			"status": true,
			"startTime": true,
		}).orderBy("startTime", "desc").get()
	},

	GetUserInfo: function(content) {
		const collection = db.collection('uni-id-users');
		return collection.field({
			"nickname": true,
			"avatar": true,
		}).where({
			_id: content
		}).get()
	}
}