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
	//根据角色返回对应的价格表
	GetPriceInfoByRole: function(content){
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		return dbJQL.collection("prices").where({
			role : content, 
		}).field({
			"_id":true,
			"price":true,
			"noplayprice":true,
		}).get()
	},

	Reservation_Add: async function(content) {
	    const dbJQL = uniCloud.databaseForJQL({
	        clientInfo: this.getClientInfo()
	    });
	
	    const startTime = content.startTime;
	    const endTime = content.endTime;
	    const machineId = content.machineId;
	    const isOvernight = content.isOvernight;
	
	    // 1. 获取机台的 capacity 值
	    const machineInfo = await dbJQL.collection('machines')
	        .where({ _id: machineId })
	        .field('capacity')
	        .get();
	
	    if (machineInfo.data.length === 0) {
	        return {
	            errCode: 'MACHINE_NOT_FOUND',
	            errMsg: '未找到指定的机台信息'
	        }; // 机台不存在
	    }
	
	    const maxCapacity = machineInfo.data[0].capacity || 1; // 默认 capacity 为 1，防止未设置 capacity 的情况
	
	    // 2. 统计当前时间段内该机台的预约数量
	    const existingReservationsCount = await dbJQL.collection('reservation-log')
	        .where({
	            machineId: machineId,
	            status: 1, //  只统计 "进行中" 的预约
	            isOvernight: isOvernight, // 预约类型也需要一致
	            _id: dbJQL.command.neq(content._id || ''), // 排除自身更新的情况
	            $and: [
	                { startTime: dbJQL.command.lt(endTime) },
	                { endTime: dbJQL.command.gt(startTime) }
	            ]
	        })
	        .count();
	
	
	    // 3. 判断预约数量是否超过 capacity
	    if (existingReservationsCount.total >= maxCapacity) {
	        return {
	            errCode: 'CAPACITY_EXCEEDED',
	            errMsg: `该时段机台预约已满 (${maxCapacity}人上限)，请选择其他时段或机台。`
	        };
	    }
	
	    // 4. 如果未超过 capacity，则创建预约
	    try {
	        await dbJQL.collection('reservation-log').add(content);
	        return { errCode: 0, errMsg: 'success' };
	    } catch (e) {
	        return { errCode: 500, errMsg: e.message };
	    }
	},

	
	Reservation_Update: function(content,statusnumber) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		dbJQL.collection('reservation-log').where({
				_id : content
		}).update({
			status : statusnumber
		})
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
			"isPlay":true
		}).orderBy("startTime", "desc").get()
	},

	GetMachineReservationInfo: async function(startTime, endTime) { // 新增的 GetMachineReservationInfo，根据时间范围获取机台预约信息
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		const collectionJQL = dbJQL.collection('reservation-log');
		const machines = await dbJQL.collection('machines').field("_id,name,machinenum,status").get() // 获取机台信息，用于后续关联

		const reservationData = await collectionJQL.where(`startTime >= ${startTime} && endTime <= ${endTime}`)
			.field({
				"_id": true,
				"machineId": true,
				"isOvernight": true,
				"status": true,
				"startTime": true,
				"endTime": true,
			}).get()

		const machineMap = new Map();
		machines.data.forEach(machine => {
			machineMap.set(machine._id, machine); // 使用 Map 优化查询效率
		});

		const result = machines.data.map(machine => {
			const machineReservations = reservationData.data.filter(reservation => reservation
				.machineId === machine._id);
			return {
				machineInfo: machine,
				reservations: machineReservations
			};
		});
		return result;
	},

	GetUserInfo: function(content) {
		const collection = db.collection('uni-id-users');
		return collection.field({
			"nickname": true,
			"avatar": true,
		}).where({
			_id: content
		}).get()
	},
	
	SignIn_Add: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		signin.add(content)
	},
	
	SignIn_Search: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		return signin.where({
			userid : content,
			status : 0
		}).field({
			"id" : true,
			"status": true,
			"reservationid": true,
			"isPlay" : true,
			"starttime" : true
		}).get()
	}
}