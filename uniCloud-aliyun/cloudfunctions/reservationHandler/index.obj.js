// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
module.exports = {
	_before: function() { // 通用预处理器

	},
	
	/*
	 * Reservation_Add方法描述
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

		// 你这块前端不是判断过了吗？
		/*
		if (!startTime || !endTime || !machineId || !userId) {
			console.log("Error: Missing parameters");
			return {
				errCode: 'INVALID_PARAMS',
				errMsg: '缺少必要参数'
			};
		}
		// 这块为什么不交给前端判断？
		if (startTime >= endTime) {
			console.log("Error: Invalid time range");
			return {
				errCode: 'INVALID_TIME_RANGE',
				errMsg: '开始时间必须早于结束时间'
			};
		}
		*/

	},

	Reservation_Update: function(content, statusnumber) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		dbJQL.collection('reservation-log').where({
			_id: content
		}).update({
			status: statusnumber
		})
		console.log("订单状态已变更")
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
			"isPlay": true,
			"isOvernight": true,
		}).orderBy("createTime", "desc").get()
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

	/**
	 * method1方法描述
	 * @param {string} param1 参数1描述
	 * @returns {object} 返回值描述
	 */
	/* 
	method1(param1) {
		// 参数校验，如无参数则不需要
		if (!param1) {
			return {
				errCode: 'PARAM_IS_NULL',
				errMsg: '参数不能为空'
			}
		}
		// 业务逻辑
		
		// 返回结果
		return {
			param1 //请根据实际需要返回值
		}
	}
	*/
}