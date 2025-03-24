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
	    const db = uniCloud.database();
	    const startTime = content.startTime;
	    const endTime = content.endTime;
	    const machineId = content.machineId;
	    const isOvernight = content.isOvernight;
	    const userId = content.userId;
	
	    console.log("Reservation_Add function started");
	    console.log("Input content:", content);
	
	    // Input validation
	    if (!startTime || !endTime || !machineId || !userId) {
	        console.log("Error: Missing parameters");
	        return {
	            errCode: 'INVALID_PARAMS',
	            errMsg: '缺少必要参数'
	        };
	    }
	    if (startTime >= endTime) {
	        console.log("Error: Invalid time range");
	        return {
	            errCode: 'INVALID_TIME_RANGE',
	            errMsg: '开始时间必须早于结束时间'
	        };
	    }
	
	    try {
	        // 1. 获取机台信息
	        console.log("Fetching machine info for machineId:", machineId);
	        const machineInfo = await db.collection('machines')
	            .where({ _id: machineId })
	            .field({ capacity: true }) // Corrected field syntax
	            .get();
	        console.log("Machine info fetched:", machineInfo);
	
	        if (machineInfo.data.length === 0) {
	            console.log("Error: Machine not found");
	            return {
	                errCode: 'MACHINE_NOT_FOUND',
	                errMsg: '未找到指定的机台信息'
	            };
	        }
	
	        console.log("Machine data[0]:", machineInfo.data[0]);
	        console.log("Type of capacity from DB:", typeof machineInfo.data[0].capacity);
	        console.log("Raw capacity from DB:", JSON.stringify(machineInfo.data[0]));
	
	        const maxCapacity = Number(machineInfo.data[0].capacity) || 1;
	        console.log("Calculated maxCapacity:", maxCapacity);
	        console.log("Type of maxCapacity:", typeof maxCapacity);
	
	        // 2. 一次性查询所有需要的数据
	        console.log("Fetching user and overlapping reservations...");
	        const [userReservations, allOverlappingReservations] = await Promise.all([
	            // 查询用户已有的重叠预约
	            db.collection('reservation-log')
	                .where({
	                    userId: userId,
	                    status: 1,
	                    isOvernight: isOvernight,
	                    _id: db.command.neq(content._id || ''),
	                    $and: [
	                        { startTime: db.command.lt(endTime) },
	                        { endTime: db.command.gt(startTime) }
	                    ]
	                })
	                .limit(1)
	                .get(),
	
	            // 查询所有重叠的预约（用于容量检查）
	            db.collection('reservation-log')
	                .where({
	                    machineId: machineId,
	                    status: 1,
	                    isOvernight: isOvernight,
	                    $and: [
	                        { startTime: db.command.lt(endTime) },
	                        { endTime: db.command.gt(startTime) }
	                    ]
	                })
	                .field({ startTime: true, endTime: true }) // Corrected field syntax
	                .get()
	        ]);
	        console.log("Fetching user and overlapping reservations...");
	        // 3. 检查用户重叠预约
	        if (userReservations.data.length > 0) {
	            console.log("Error: Time conflict - user overlap");
	            return {
	                errCode: 'TIME_CONFLICT',
	                errMsg: '同一用户不能预约重叠的时间段'
	            };
	        }
	
	        // 4. 优化的容量检查 - 使用扫描线算法
	        const events = [];
	        allOverlappingReservations.data.forEach(rsv => {
	            events.push({ time: rsv.startTime, delta: 1 });
	            events.push({ time: rsv.endTime, delta: -1 });
	        });
	
	        // 添加当前预约的事件点
	        events.push({ time: startTime, delta: 1 });
	        events.push({ time: endTime, delta: -1 });
	
	        // 按时间排序
	        events.sort((a, b) => a.time - b.time);
	
	        // 计算最大并发数
	        let currentCount = 0;
	        let maxConcurrent = 0;
	        let prevTime = 0;
	        console.log("Starting capacity check loop. maxCapacity:", maxCapacity);
	        for (const event of events) {
	            // 相同时间点的结束事件应该先处理（减少计数）
	            if (event.time === prevTime && event.delta < 0) {
	                currentCount += event.delta;
	            } else {
	                // 更新最大并发数
	                maxConcurrent = Math.max(maxConcurrent, currentCount);
	                currentCount += event.delta;
	                prevTime = event.time;
	            }
	            console.log("After event processing - currentCount:", currentCount, "maxConcurrent:", maxConcurrent);
	        }
	        console.log("Capacity check loop finished. maxConcurrent:", maxConcurrent, "maxCapacity:", maxCapacity);
	        // 5. 检查是否超过容量限制
	        if (maxConcurrent > maxCapacity) {
	            console.log("Error: Capacity exceeded. maxConcurrent:", maxConcurrent, "maxCapacity:", maxCapacity);
	            return {
	                errCode: 'CAPACITY_EXCEEDED',
	                errMsg: `该时段已达预约上限 (${maxCapacity}人上限)，请选择其他时段`
	            };
	        }
	
	        // 6. 添加预约记录
	        console.log("Adding reservation record...");
	        const result = await db.collection('reservation-log').add({
	            ...content,
	            createTime: Date.now()
	        });
	        console.log("Reservation add result:", result);
	
	        if (!result || !result.id) {
	            console.log("Error: DB add failed");
	            return {
	                errCode: 'DB_ADD_FAILED',
	                errMsg: '添加预约记录失败'
	            };
	        }
	
	        console.log("Reservation successful, id:", result.id);
	        return {
	            errCode: 0,
	            errMsg: 'success',
	            id: result.id
	        };
	
	    } catch (e) {
	        console.error("Exception caught:", e);
	        return e.errCode ? e : {
	            errCode: 'DB_ERROR',
	            errMsg: '数据库操作失败: ' + e.message
	        };
	    } finally {
	        console.log("Reservation_Add function finished");
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

	GetMachineReservationInfo: async function(startTime, endTime) {
	    const dbJQL = uniCloud.databaseForJQL({
	        clientInfo: this.getClientInfo()
	    });
	    const collectionJQL = dbJQL.collection('reservation-log');
	    const machines = await dbJQL.collection('machines').field("_id,name,machinenum,status").get()
	
	    const reservationData = await collectionJQL.where(`startTime >= ${startTime} && endTime <= ${endTime}`)
	        .field({
	            "_id": true,
	            "machineId": true,
	            "isOvernight": true,
	            "status": true,
	            "startTime": true,
	            "endTime": true,
	            "userId": true
	        }).get()
	
	    const machineMap = new Map();
	    machines.data.forEach(machine => {
	        machineMap.set(machine._id, machine);
	    });
	
	    // 获取所有预约记录的 userId，用于批量查询用户信息
	    const userIds = [...new Set(reservationData.data.map(reservation => reservation.userId))];
	
	    // 批量查询用户信息
	    const users = await dbJQL.collection('uni-id-users')
	        .where({
	            _id: dbJQL.command.in(userIds)
	        })
	        .field({
	            "_id": true,
	            "_id": true,
	            "nickname": true,
	            "avatar": true,
	            "avatar_file": true //  <--  添加 avatar_file 字段的选择
	        })
	        .get();
	    const userMap = new Map();
	    users.data.forEach(user => {
	        userMap.set(user._id, user);
	    });
	
	
	    const result = machines.data.map(machine => {
	        const machineReservations = reservationData.data.filter(reservation => reservation.machineId === machine._id);
	        // 为每个预约记录关联用户信息
	        const reservationsWithUserInfo = machineReservations.map(reservation => {
	            const userInfo = userMap.get(reservation.userId) || {};
	            return {
	                ...reservation,
	                username: userInfo.nickname || '未知用户',
	                avatar: userInfo.avatar || '',
	                avatar_file: userInfo.avatar_file //  <--  将 avatar_file 也传递到前端
	            };
	        });
	        return {
	            machineInfo: machine,
	            reservations: reservationsWithUserInfo
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