// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
module.exports = {
	_before: function() { // 通用预处理器

	},

	/**
	 * Reservation_Add 将前端传来的预约订单数据存储至后端
	 * @content {object} 此为需要向订单表添加的预约数据
	 */
	
	// 提交预约订单
	Reservation_Add: async function(content) {
		//创建JQL对象时,实际上会自动进行权限判断
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const reservationDB = dbJQL.collection('reservation-log')
		//保存机台ID,之后通过机台ID查询机台名称保存,方便后期调用,减少查询次数
		//前端就有了 我是傻逼
		//const machineId = content.machineId;
		const startTime = content.startTime;
		const endTime = content.endTime;
		const machineId = content.machineId;
		const isOvernight = content.isOvernight;
		const userId = content.userId;

		//我觉得这个查询重叠预约是不是放到前端好一点？
		const [userReservations, allOverlappingReservations] = await Promise.all([
			// 查询用户已有的重叠预约
			db.collection('reservation-log')
			.where({
				userId: userId,
				status: 1,
				isOvernight: isOvernight,
				_id: db.command.neq(content._id || ''),
				$and: [{
						startTime: db.command.lt(endTime)
					},
					{
						endTime: db.command.gt(startTime)
					}
				]
			})
			.limit(1)
			.get(),
		]);
		//检查用户重叠预约
		if (userReservations.data.length > 0) {
			console.log("Error: Time conflict - user overlap");
			return {
				errCode: 'TIME_CONFLICT',
				errMsg: '同一用户不能预约重叠的时间段'
			};
		}
		//添加
		try {
			const result = await reservationDB.add(content)
		} catch (e) {
			console.error("Exception caught:", e);
			return e.errCode ? e : {
				errCode: 'DB_ERROR',
				errMsg: '数据库操作失败: ' + e.message
			};
		}
	},
	
	/**
	 * Reservation_Update 将数据库对应订单的状态进行更新
	 * @id string 此为需要修改的预约订单的订单id
	 * @statusnumber number 此为修改后的订单状态码
	 */
	Reservation_Update: async function(id, statusnumber) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		try {
			await dbJQL.collection('reservation-log').where({
				_id: id
			}).update({
				status: statusnumber
			})
			console.log("订单状态已变更")
		} catch (e) {

		}
	},

	GetReservationInfo: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const reservation = dbJQL.collection('reservation-log')
		try {
			return await reservation.where({
				userId: uid,
			}).field({
				"_id": true,
				"machineId": true,
				"machineName": true,
				"status": true,
				"startTime": true,
				"isOvernight": true,
				"isPlay": true,
			}).limit(10).orderBy("createTime", "desc").get()
		} catch (e) {}
	},

	SearchReservationInfo: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const machines = dbJQL.collection('machines').field("_id,name").getTemp()
		const collectionJQL = dbJQL.collection('reservation-log', machines)

		return collectionJQL.where({
			_id: content,
		}).field({
			"machineId": true,
			"endTime": true
		}).get()
	},

	CancelReservation: function(id) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const reservation = dbJQL.collection('reservation-log')
		return reservation.where({
			_id: id,
		}).update({
			status: 6,
		})
	}
}