// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
const helpCenterCollection = db.collection('help-center');
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
// 全局函数：检查管理员权限
function checkAdminPermission(clientInfo) {
    try {
        console.log("权限检查 - 用户信息:", JSON.stringify(clientInfo));

        if (!clientInfo || !clientInfo.uniIdToken) {
            console.log("权限检查失败: 未找到身份令牌");
            return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
        }

        const tokenParts = clientInfo.uniIdToken.split('.');
        if (tokenParts.length !== 3) {
            console.log("权限检查失败: 令牌格式无效");
            return { errCode: 'INVALID_TOKEN', errMsg: '令牌格式无效' };
        }

        let payload;
        try {
            const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = Buffer.from(base64, 'base64').toString();
            payload = JSON.parse(jsonStr);
            console.log("解析后的令牌信息:", JSON.stringify(payload));
        } catch (e) {
            console.error("解析令牌失败:", e);
            return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌: ' + e.message };
        }

        const role = payload.role;
        let hasAdminRole = false;

        if (Array.isArray(role)) {
            hasAdminRole = role.includes('admin');
        } else if (typeof role === 'string') {
            hasAdminRole = role === 'admin';
        }

        console.log("用户是否有管理员权限:", hasAdminRole);

        if (!hasAdminRole) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '只有管理员才能执行此操作' };
        }

        return null; // 权限验证通过
    } catch (e) {
        console.error("权限验证过程中发生异常:", e);
        return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
    }
};
// 全局函数：检查用户是否为 'user' 或 'admin' 角色
function checkUserOrAdminPermission(clientInfo) {
    try {
        if (!clientInfo || !clientInfo.uniIdToken) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
        }

        const tokenParts = clientInfo.uniIdToken.split('.');
        if (tokenParts.length !== 3) {
            return { errCode: 'INVALID_TOKEN', errMsg: '令牌格式无效' };
        }

        let payload;
        try {
            const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = Buffer.from(base64, 'base64').toString();
            payload = JSON.parse(jsonStr);
        } catch (e) {
            console.error("解析令牌失败:", e);
            return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌: ' + e.message };
        }

        const role = payload.role;
        let hasRequiredRole = false;

        if (Array.isArray(role)) {
            hasRequiredRole = role.includes('user') || role.includes('admin');
        } else if (typeof role === 'string') {
            hasRequiredRole = role === 'user' || role === 'admin';
        }

        if (!hasRequiredRole) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '无权访问此功能' };
        }

        return null; // 权限验证通过
    } catch (e) {
        console.error("权限验证过程中发生异常:", e);
        return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
    }
}
function getStatusText(status) { // 移除下划线
  switch (parseInt(status)) {
    case 0: return '待确认';
    case 1: return '已完成';
    case 2: return '未完成';
    case 3: return '已退款';
    default: return '未知状态';
  }
}
function formatDateTime(timestamp) { // 移除下划线
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
/**
 * 记录订单编辑日志
 * @param {Object} logData 日志数据
 */
async function logOrderEdit(logData) { 
  const db = uniCloud.database(); 
  try {
    // 获取操作人信息
    const operatorResult = await db.collection('uni-id-users')
      .doc(logData.operatorId)
      .field("nickname,username")
      .get();
    
    const operatorName = operatorResult.data.length > 0 
      ? (operatorResult.data[0].nickname || operatorResult.data[0].username) 
      : '未知用户';
    
    // 添加日志记录
    await db.collection('order-edit-logs').add({
      orderId: logData.orderId,
      operatorId: logData.operatorId,
      operatorName: operatorName,
      editType: logData.editType,
      changes: logData.changes,
      reason: logData.reason,
      editTime: logData.editTime
    });
  } catch (e) {
    console.error("Log order edit error:", e);
    // 日志记录失败不影响主要业务逻辑
  }
}
module.exports = {
	// 内部辅助函数：检查管理员权限
	_checkAdminPermission() {
		try {
			const clientInfo = this.getClientInfo();
			console.log("权限检查 - 用户信息:", JSON.stringify(clientInfo));

			if (!clientInfo || !clientInfo.uniIdToken) {
				console.log("权限检查失败: 未找到身份令牌");
				return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
			}

			const tokenParts = clientInfo.uniIdToken.split('.');
			if (tokenParts.length !== 3) {
				console.log("权限检查失败: 令牌格式无效");
				return { errCode: 'INVALID_TOKEN', errMsg: '令牌格式无效' };
			}

			let payload;
			try {
				const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
				const jsonStr = Buffer.from(base64, 'base64').toString();
				payload = JSON.parse(jsonStr);
				console.log("解析后的令牌信息:", JSON.stringify(payload));
			} catch (e) {
				console.error("解析令牌失败:", e);
				return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌: ' + e.message };
			}

			const role = payload.role;
			let hasAdminRole = false;

			if (Array.isArray(role)) {
				hasAdminRole = role.includes('admin');
			} else if (typeof role === 'string') {
				hasAdminRole = role === 'admin';
			}

			console.log("用户是否有管理员权限:", hasAdminRole);

			if (!hasAdminRole) {
				return { errCode: 'PERMISSION_DENIED', errMsg: '只有管理员才能执行此操作' };
			}

			// 权限验证通过，返回 null 表示没有错误
			return null;
		} catch (e) {
			console.error("权限验证过程中发生异常:", e);
			return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
		}
	},
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
	GetPriceInfoByRole: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		return dbJQL.collection("prices").where({
			role: content,
		}).field({
			"_id": true,
			"price": true,
			"noplayprice": true,
		}).get()
	},
	
	//根据每周日期返回对应的价格表
	GetPriceInfoByWeekdays: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		return dbJQL.collection("prices").where({
			weekdays : content,
		}).field({
			"_id": true,
			"price": true,
			"noplayprice": true,
		}).get()
	},
	// 更新机台信息
	Machines_Update: function(id, updateData) {
		const collection = db.collection('machines');
		return collection.doc(id).update(updateData);
	},
	  
	// 更新价格信息
	Prices_Update: function(id, updateData) {
		const collection = db.collection('prices');
		return collection.doc(id).update(updateData);
	},

	// 更新会员价格信息
	VipPrices_Update: function(id, updateData) {
		const collection = db.collection('prices_vip');
		return collection.doc(id).update(updateData);
	},

	// 获取单个机台详情
	GetMachineDetail: function(id) {
		const collection = db.collection('machines');
		return collection.doc(id).get();
	},

	// 获取单个价格方案详情
	GetPriceDetail: function(id) {
		const collection = db.collection('prices');
		return collection.doc(id).get();
	},

	// 获取会员价格列表
	GetVipPrices: function() {
		const collection = db.collection('prices_vip');
		return collection.get();
	},

	// 获取单个会员价格详情
	GetVipPriceDetail: function(id) {
		const collection = db.collection('prices_vip');
		return collection.doc(id).get();
	},
	/**
	 * 获取用户会员信息
	 * @param {string} userID 用户ID
	 * @returns {object} 会员信息，包含 membership 和 subscriptionPackage 状态
	 */
	async getUserMembershipInfo(userID) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		try {
			const membershipCollection = dbJQL.collection('membership');
			const subscriptionPackageCollection = dbJQL.collection('subscription-package');

			const membership = await membershipCollection
				.where({
					userID: userID,
					status: true, // 只查询有效的会员
					validthru: dbJQL.command.gt(Date.now()) //并且会员到期时间大于当前时间，注意这里也要用 dbJQL.command
				})
				.get();

			const subscriptionPackage = await subscriptionPackageCollection
				.where({
					userID: userID,
					status: true, // 只查询有效的会员
					validthru: dbJQL.command.gt(Date.now()) //并且会员到期时间大于当前时间，注意这里也要用 dbJQL.command
				})
				.get();

			//检查是否有数据，没有数据返回空数组
			const membershipData = membership.data.length > 0 ? membership.data : [];
			const subscriptionPackageData = subscriptionPackage.data.length > 0 ? subscriptionPackage.data : [];

			return {
				membership: membershipData,
				subscriptionPackage: subscriptionPackageData,
			};
		} catch (e) {
			console.error("Error in getUserMembershipInfo:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '获取会员信息失败: ' + e.message
			};
		}
	},

	// 提交订单
	async Reservation_Add(content) {
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
				.where({
					_id: machineId
				})
				.field({
					capacity: true
				})
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

			// 2. 获取用户会员信息
			// 直接在这里实现获取会员信息的逻辑，而不是调用其他方法
			const dbJQL = uniCloud.databaseForJQL({
				clientInfo: this.getClientInfo()
			});

			let membershipInfo = {
				membership: [],
				subscriptionPackage: []
			};

			try {
				const membershipCollection = dbJQL.collection('membership');
				const subscriptionPackageCollection = dbJQL.collection('subscription-package');

				const membership = await membershipCollection
					.where({
						userID: userId,
						status: true,
						validthru: dbJQL.command.gt(Date.now())
					})
					.get();

				const subscriptionPackage = await subscriptionPackageCollection
					.where({
						userID: userId,
						status: true,
						validthru: dbJQL.command.gt(Date.now())
					})
					.get();

				membershipInfo.membership = membership.data.length > 0 ? membership.data : [];
				membershipInfo.subscriptionPackage = subscriptionPackage.data.length > 0 ? subscriptionPackage
					.data : [];
			} catch (e) {
				console.error("Error in fetching membership info:", e);
				return {
					errCode: 'DB_ERROR',
					errMsg: '获取会员信息失败: ' + e.message
				};
			}
			console.log("Membership Info:", membershipInfo);

			// 3. 根据会员信息修改价格
			// 获取基础价格信息
			let price;
			if (isOvernight) {
				// 获取过夜预约价格
				const priceInfo = await db.collection('prices')
					.where({
						type: 'overnight'
					})
					.get();
				price = priceInfo.data.length > 0 ? priceInfo.data[0].price : 50; // 默认50
			} else {
				// 获取普通预约价格
				const priceInfo = await db.collection('prices')
					.where({
						type: 'normal'
					})
					.get();
				price = priceInfo.data.length > 0 ? priceInfo.data[0].price : 5; // 默认5
			}

			// 应用会员折扣
			if (membershipInfo.subscriptionPackage.length > 0) {
				// 包周/月卡会员，100% off
				price = 0;
				console.log("User has subscription package, price set to 0");
			} else if (membershipInfo.membership.length > 0 && !isOvernight) {
				// 音游会员，每半小时4元，当日封顶40元
				const diffHours = (endTime - startTime) / (1000 * 60 * 60);
				const halfHourUnits = Math.ceil(diffHours / 0.5);
				price = Math.min(halfHourUnits * 4, 40); // 日常上限40元
				console.log("User has membership, price calculated as:", price);
			}

			// 将价格放入content
			content.price = price;

			// 4. 一次性查询所有需要的数据
			console.log("Fetching user and overlapping reservations...");
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

				// 查询所有重叠的预约（用于容量检查）
				db.collection('reservation-log')
				.where({
					machineId: machineId,
					status: 1,
					isOvernight: isOvernight,
					$and: [{
							startTime: db.command.lt(endTime)
						},
						{
							endTime: db.command.gt(startTime)
						}
					]
				})
				.field({
					startTime: true,
					endTime: true
				})
				.get()
			]);

			// 5. 检查用户重叠预约
			if (userReservations.data.length > 0) {
				console.log("Error: Time conflict - user overlap");
				return {
					errCode: 'TIME_CONFLICT',
					errMsg: '同一用户不能预约重叠的时间段'
				};
			}

			// 6. 优化的容量检查 - 使用扫描线算法
			const events = [];
			allOverlappingReservations.data.forEach(rsv => {
				events.push({
					time: rsv.startTime,
					delta: 1
				});
				events.push({
					time: rsv.endTime,
					delta: -1
				});
			});

			// 添加当前预约的事件点
			events.push({
				time: startTime,
				delta: 1
			});
			events.push({
				time: endTime,
				delta: -1
			});

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
				console.log("After event processing - currentCount:", currentCount, "maxConcurrent:",
					maxConcurrent);
			}
			console.log("Capacity check loop finished. maxConcurrent:", maxConcurrent, "maxCapacity:",
				maxCapacity);

			// 7. 检查是否超过容量限制
			if (maxConcurrent > maxCapacity) {
				console.log("Error: Capacity exceeded. maxConcurrent:", maxConcurrent, "maxCapacity:",
					maxCapacity);
				return {
					errCode: 'CAPACITY_EXCEEDED',
					errMsg: `该时段已达预约上限 (${maxCapacity}人上限)，请选择其他时段`
				};
			}

			// 8. 添加预约记录
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

	GetOrderInfo: async function(content) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		})
		const machines = dbJQL.collection('machines').field("_id,name").getTemp()
		const collectionJQL = dbJQL.collection('signin', machines)

		// 提取参数，content 应该包含 userId, pageSize, pageNumber
		const userId = content.userId;
		const pageSize = content.pageSize || 10; // 默认每页 10 条
		const pageNumber = content.pageNumber || 1; // 默认第一页

		let baseQuery = collectionJQL.where({
			userId: userId,
		}).field({
			"_id": true,
			"machineId": true,
			"isOvernight": true,
			"status": true,
			"startTime": true,
			"endTime": true,
			"isPlay": true
		}).orderBy("createTime", "desc")

		// 1. 获取总记录数
		const countResult = await baseQuery.count()
		const total = countResult.total;

		// 2. 应用分页
		const paginatedQuery = baseQuery
			.skip((pageNumber - 1) * pageSize) // 跳过前面页面的数据
			.limit(pageSize) // 限制每页数量

		const dataResult = await paginatedQuery.get()
		const data = dataResult.data;

		return {
			data: data,
			total: total
		}
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
			const machineReservations = reservationData.data.filter(reservation => reservation
				.machineId === machine._id);
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
			userid: content,
			status: 0
		}).field({
			"id": true,
			"status": true,
			"reservationid": true,
			"isPlay": true,
			"isOvernight": true,
			"starttime": true
		}).get()
	},

	Loved_Update: async function(uid, content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const Loved = dbJQL.collection('loved')

		const db = uniCloud.database();
		const collection = db.collection('loved');
		const dbCmd = db.command;
		const res = await Loved.where({
			userid: uid
		}).get()

		if (res.data.length == 0) {
			await Loved.add({
				userid: uid,
				love: [],
			})
			const result = await collection.where({
				userid: uid,
			}).update({
				love: dbCmd.push(content)
			})
		} else {
			const res = await collection.where({
				userid: uid,
				love: content
			}).get()
			if (res.data.length != 0) {
				console.log("当前数据已经存在")
			} else {
				const result = await collection.where({
					userid: uid,
				}).update({
					love: dbCmd.push(content)
				})
			}
		}
	},

	// 查询用户的收藏列表
	Loved_Query: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		const Loved = dbJQL.collection('loved');

		// 查询该用户的收藏记录
		const res = await Loved.where({
			userid: uid
		}).get();

		// 如果用户没有收藏记录，返回空数组
		if (res.data.length === 0) {
			return {
				code: 0,
				data: [],
				message: "用户暂无收藏内容"
			};
		}

		// 返回用户的收藏内容
		return {
			code: 0,
			data: res.data[0].love || [],
			message: "查询成功"
		};
	},

	//新增订单
	Order_Add: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const fishOrder = dbJQL.collection('fishcave-orders')
		fishOrder.add(content)
		while (1) {
			if (fishOrder.where({
					user_id: content.user_id,
					status: 0
				}).get()) {
				break
			}
			console.log("1")
		}
		return "success"
	},

	Order_Get: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const fishOrder = dbJQL.collection('fishcave-orders')
		return fishOrder.where({
			user_id: content,
			status: 0
		}).field({
			_id: true
		}).get()
	},
	
	Get_fishOrderList: function(content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const fishOrder = dbJQL.collection('fishcave-orders')
		return fishOrder.where({
			user_id: content,
		}).orderBy("create_date", "desc").get()
	},
	
	HowManyPlayer: function() {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		return signin.where({
			status : 0, 
		}).get()
	},
	
	/**
	 * 更新用户统计信息
	 * 在订单完成时调用此方法，更新用户的使用统计
	 * @param {string} userId 用户ID
	 * @param {string} reservationId 预约ID
	 * @returns {object} 更新结果
	 */
	async updateUserStatistics(userId, reservationId) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		
		try {
			console.log("开始更新用户统计信息, userId:", userId, "reservationId:", reservationId);
			
			// 1. 获取订单信息
			const orderInfo = await dbJQL.collection('fishcave-orders')
				.where({
					user_id: userId,
					reservation_id: reservationId,
					status: 1 // 只统计已完成的订单
				})
				.get();
				
			if (orderInfo.data.length === 0) {
				console.log("未找到相关订单信息");
				return {
					errCode: 'ORDER_NOT_FOUND',
					errMsg: '未找到相关订单信息'
				};
			}
			
			const order = orderInfo.data[0];
			
			// 计算使用时长（分钟）
			const startTime = new Date(order.starttime);
			const endTime = new Date(order.endtime);
			const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
			
			// 提取年月信息用于月度统计
			const yearMonth = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}`;
			
			// 2. 查询用户的统计信息
			const userStatsCollection = dbJQL.collection('user-statistics');
			const userStats = await userStatsCollection
				.where({
					user_id: userId
				})
				.get();
				
			const db = uniCloud.database();
			const statsCollection = db.collection('user-statistics');
			
			if (userStats.data.length === 0) {
				// 创建新的统计记录
				console.log("创建新的用户统计记录");
				await statsCollection.add({
					user_id: userId,
					total_sessions: 1,
					total_duration: durationMinutes,
					total_spending: order.total_fee,
					monthly_stats: [{
						year_month: yearMonth,
						sessions: 1,
						duration: durationMinutes,
						spending: order.total_fee
					}],
					last_update: Date.now()
				});
			} else {
				// 更新现有统计记录
				console.log("更新现有的用户统计记录");
				const existingStats = userStats.data[0];
				const dbCmd = db.command;
				
				// 检查月度统计中是否已有该月份
				const monthIndex = existingStats.monthly_stats ? 
					existingStats.monthly_stats.findIndex(m => m.year_month === yearMonth) : -1;
					
				let updateObj = {
					total_sessions: existingStats.total_sessions + 1,
					total_duration: existingStats.total_duration + durationMinutes,
					total_spending: existingStats.total_spending + order.total_fee,
					last_update: Date.now()
				};
				
				if (monthIndex === -1) {
					// 该月份不存在，添加新的月度统计
					updateObj.monthly_stats = dbCmd.push({
						year_month: yearMonth,
						sessions: 1,
						duration: durationMinutes,
						spending: order.total_fee
					});
				} else {
					// 更新现有月份的统计
					updateObj[`monthly_stats.${monthIndex}.sessions`] = existingStats.monthly_stats[monthIndex].sessions + 1;
					updateObj[`monthly_stats.${monthIndex}.duration`] = existingStats.monthly_stats[monthIndex].duration + durationMinutes;
					updateObj[`monthly_stats.${monthIndex}.spending`] = existingStats.monthly_stats[monthIndex].spending + order.total_fee;
				}
				
				await statsCollection.doc(existingStats._id).update(updateObj);
			}
			
			console.log("用户统计信息更新成功");
			return {
				errCode: 0,
				errMsg: '统计信息更新成功'
			};
		} catch (e) {
			console.error("更新用户统计信息失败:", e);
			return {
				errCode: 'UPDATE_STATS_ERROR',
				errMsg: '更新统计信息失败: ' + e.message
			};
		}
	},
	
	/**
	 * 获取用户统计信息
	 * @param {string} userId 用户ID
	 * @returns {object} 用户统计信息
	 */
	async getUserStatistics(userId) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		
		try {
			const userStatsCollection = dbJQL.collection('user-statistics');
			const userStats = await userStatsCollection
				.where({
					user_id: userId
				})
				.get();
				
			if (userStats.data.length === 0) {
				// 用户没有统计记录，返回默认值
				return {
					errCode: 0,
					data: {
						user_id: userId,
						total_sessions: 0,
						total_duration: 0,
						total_spending: 0,
						monthly_stats: []
					},
					errMsg: '用户暂无统计数据'
				};
			}
			
			return {
				errCode: 0,
				data: userStats.data[0],
				errMsg: 'success'
			};
		} catch (e) {
			console.error("获取用户统计信息失败:", e);
			return {
				errCode: 'GET_STATS_ERROR',
				errMsg: '获取统计信息失败: ' + e.message
			};
		}
	},
	
	/**
	 * 修改后的结账函数，在完成结账的同时更新用户统计信息
	 * @param {string} signInId 签到ID
	 * @param {string} resId 预约ID
	 * @param {string} uid 用户ID
	 * @returns {string} 结果信息
	 */
	SignIn_Settle: async function(signInId, resId, uid) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		
		try {
			// 1. 更新签到状态
			await dbJQL.collection('signin').where({
				_id: signInId
			}).update({
				status: 1
			});
			
			// 2. 更新预约状态
			await dbJQL.collection('reservation-log').where({
				_id: resId
			}).update({
				status: 2
			});
			
			// 3. 更新订单状态
			const orderResult = await dbJQL.collection('fishcave-orders').where({
				user_id: uid,
				reservation_id: resId,
				status: 0
			}).update({
				status: 1
			});
			
			// 4. 更新用户统计信息
			await this.updateUserStatistics(uid, resId);
			
			return "Settle Succeed";
		} catch (e) {
			console.error("结账失败:", e);
			return "Settle Failed: " + e.message;
		}
	},
	/**
	 * 获取所有用户的消费排行榜
	 * @param {object} options 选项，包含 limit 和 sortBy
	 * @returns {object} 排行榜数据
	 */
	async getUserRankings(options = {}) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		
		const limit = options.limit || 10; // 默认获取前10名
		const sortBy = options.sortBy || 'total_spending'; // 默认按消费金额排序
		const sortOrder = options.sortOrder || 'desc'; // 默认降序排列
		
		try {
			// 获取用户统计数据
			const statsCollection = dbJQL.collection('user-statistics');
			
			// 联表查询，获取用户昵称和头像
			const usersTemp = dbJQL.collection('uni-id-users')
				.field('_id, nickname, avatar, avatar_file')
				.getTemp();
				
			const result = await statsCollection
				.where({}) // 获取所有用户
				.field(`user_id, ${sortBy}, total_sessions, total_duration, total_spending`)
				.foreignKey('user_id')
				.loadTemp(usersTemp, 'userInfo')
				.orderBy(sortBy, sortOrder)
				.limit(limit)
				.get();
				
			// 处理结果，添加排名信息
			const rankings = result.data.map((item, index) => {
				return {
					rank: index + 1,
					user_id: item.user_id,
					nickname: item.userInfo && item.userInfo.length > 0 ? item.userInfo[0].nickname : '未知用户',
					avatar: item.userInfo && item.userInfo.length > 0 ? (item.userInfo[0].avatar || '') : '',
					avatar_file: item.userInfo && item.userInfo.length > 0 ? (item.userInfo[0].avatar_file || null) : null,
					total_sessions: item.total_sessions,
					total_duration: item.total_duration,
					total_spending: item.total_spending
				};
			});
			
			return {
				errCode: 0,
				data: rankings,
				errMsg: 'success'
			};
		} catch (e) {
			console.error("获取用户排行榜失败:", e);
			return {
				errCode: 'GET_RANKINGS_ERROR',
				errMsg: '获取用户排行榜失败: ' + e.message
			};
		}
	},
	
	/**
	 * 重建所有用户的统计数据
	 * 用于系统初始化或数据修复
	 * 注意: 这个操作可能会很耗时，建议在低峰期执行
	 * @returns {object} 重建结果
	 */
	async rebuildAllUserStatistics() {
		const authError = this._checkAdminPermission();
			if (authError) {
				return authError; // 如果不是管理员，直接返回错误
			}
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		
		try {
			console.log("开始重建所有用户统计数据");
			
			// 1. 清空现有的统计数据
			const statsCollection = dbJQL.collection('user-statistics');
			await statsCollection.where({}).remove();
			
			// 2. 获取所有已完成的订单
			const ordersCollection = dbJQL.collection('fishcave-orders');
			const orders = await ordersCollection
				.where({
					status: 1 // 只统计已完成的订单
				})
				.get();
				
			if (orders.data.length === 0) {
				console.log("没有找到已完成的订单");
				return {
					errCode: 0,
					errMsg: '没有找到已完成的订单'
				};
			}
			
			// 3. 按用户分组统计
			const userStats = {};
			
			for (const order of orders.data) {
				const userId = order.user_id;
				const startTime = new Date(order.starttime);
				const endTime = new Date(order.endtime);
				const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
				const yearMonth = `${startTime.getFullYear()}-${String(startTime.getMonth() + 1).padStart(2, '0')}`;
				
				// 初始化用户统计
				if (!userStats[userId]) {
					userStats[userId] = {
						user_id: userId,
						total_sessions: 0,
						total_duration: 0,
						total_spending: 0,
						monthly_stats: {}
					};
				}
				
				// 累加总计数据
				userStats[userId].total_sessions += 1;
				userStats[userId].total_duration += durationMinutes;
				userStats[userId].total_spending += order.total_fee;
				
				// 累加月度数据
				if (!userStats[userId].monthly_stats[yearMonth]) {
					userStats[userId].monthly_stats[yearMonth] = {
						year_month: yearMonth,
						sessions: 0,
						duration: 0,
						spending: 0
					};
				}
				
				userStats[userId].monthly_stats[yearMonth].sessions += 1;
				userStats[userId].monthly_stats[yearMonth].duration += durationMinutes;
				userStats[userId].monthly_stats[yearMonth].spending += order.total_fee;
			}
			
			// 4. 批量插入统计数据
			const batchInsertData = Object.values(userStats).map(stats => {
				// 将月度统计对象转换为数组
				stats.monthly_stats = Object.values(stats.monthly_stats);
				stats.last_update = Date.now();
				return stats;
			});
			
			const db = uniCloud.database();
			const result = await db.collection('user-statistics').add(batchInsertData);
			
			console.log(`重建完成，成功更新 ${batchInsertData.length} 个用户的统计数据`);
			return {
				errCode: 0,
				data: {
					updated_users: batchInsertData.length
				},
				errMsg: '重建统计数据成功'
			};
		} catch (e) {
			console.error("重建用户统计数据失败:", e);
			return {
				errCode: 'REBUILD_ERROR',
				errMsg: '重建统计数据失败: ' + e.message
			};
		}
	},
			
	/**
	 * 获取用户月度统计报告
	 * @param {string} userId 用户ID
	 * @param {number} months 要获取的月份数，默认6个月
	 * @returns {object} 月度报告数据
	 */
	async getUserMonthlyReport(userId, months = 6) {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		
		try {
			// 获取用户统计数据
			const userStats = await dbJQL.collection('user-statistics')
				.where({
					user_id: userId
				})
				.get();
				
			if (userStats.data.length === 0) {
				// 用户没有统计记录
				return {
					errCode: 0,
					data: {
						user_id: userId,
						months: []
					},
					errMsg: '用户暂无统计数据'
				};
			}
			
			// 获取月度统计数据
			const monthlyStats = userStats.data[0].monthly_stats || [];
			
			// 按时间排序并限制返回数量
			const sortedMonths = monthlyStats
				.sort((a, b) => b.year_month.localeCompare(a.year_month))
				.slice(0, months);
				
			// 获取用户信息
			const userInfo = await dbJQL.collection('uni-id-users')
				.where({
					_id: userId
				})
				.field('nickname, avatar, avatar_file')
				.get();
				
			return {
				errCode: 0,
				data: {
					user_id: userId,
					nickname: userInfo.data.length > 0 ? userInfo.data[0].nickname : '未知用户',
					avatar: userInfo.data.length > 0 ? (userInfo.data[0].avatar || '') : '',
					total_sessions: userStats.data[0].total_sessions,
					total_duration: userStats.data[0].total_duration,
					total_spending: userStats.data[0].total_spending,
					months: sortedMonths
				},
				errMsg: 'success'
			};
		} catch (e) {
			console.error("获取用户月度报告失败:", e);
			return {
				errCode: 'GET_REPORT_ERROR',
				errMsg: '获取用户月度报告失败: ' + e.message
			};
		}
	},
	/**
	 * 获取筛选后的订单并支持分页
	 * @param {Object} params 查询参数
	 * @param {string} params.userId 用户ID
	 * @param {number} [params.status] 订单状态 (0:待确认, 1:已完成, 2:未完成, 3:已退款)，不传则查询所有状态
	 * @param {number} [params.pageSize=10] 每页数量
	 * @param {number} [params.pageNumber=1] 页码
	 * @param {string} [params.sortField="create_date"] 排序字段
	 * @param {string} [params.sortOrder="desc"] 排序方向 (desc:降序, asc:升序)
	 * @returns {Object} 订单列表及分页信息
	 
	async Get_FilteredOrders(params) {
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  // 提取参数
	  const userId = params.userId;
	  const status = params.status; // 状态筛选
	  const pageSize = params.pageSize || 10; // 默认每页10条
	  const pageNumber = params.pageNumber || 1; // 默认第一页
	  const sortField = params.sortField || "create_date"; // 默认按创建时间排序
	  const sortOrder = params.sortOrder || "desc"; // 默认降序
	  
	  // 验证必要参数
	  if (!userId) {
	    return {
	      code: -1,
	      errMsg: "缺少用户ID参数"
	    };
	  }
	  
	  // 构建查询条件
	  const query = {
	    user_id: userId
	  };
	  
	  // 如果提供了状态参数，添加到查询条件
	  if (status !== undefined && status !== null) {
	    query.status = Number(status);
	  }
	  
	  try {
	    // 构建基础查询
	    let baseQuery = dbJQL.collection('fishcave-orders')
	      .where(query)
	      .orderBy(sortField, sortOrder);
	    
	    // 1. 获取总记录数
	    const countResult = await baseQuery.count();
	    const total = countResult.total;
	    
	    // 2. 应用分页获取数据
	    const result = await baseQuery
	      .skip((pageNumber - 1) * pageSize)
	      .limit(pageSize)
	      .get();
	    
	    // 3. 计算分页信息
	    const totalPages = Math.ceil(total / pageSize);
	    
	    // 4. 构建返回数据
	    return {
	      code: 0,
	      data: result.data,
	      pagination: {
	        total,
	        totalPages,
	        pageSize,
	        pageNumber,
	        hasNext: pageNumber < totalPages,
	        hasPrev: pageNumber > 1
	      }
	    };
	  } catch (e) {
	    console.error("Get_FilteredOrders error:", e);
	    return {
	      code: -2,
	      errMsg: "获取订单数据失败: " + e.message
	    };
	  }
	},
	*/
	/**
	 * 按状态统计订单数量 (管理员视图，统计所有订单)
	 * @returns {Object} 不同状态的订单数量及总金额
	 */
	async Get_OrdersCount() {
	  // 权限检查 (仅限管理员) - 调用全局函数
	  const authError = checkAdminPermission(this.getClientInfo());
	  if (authError) {
		return authError;
	  }
	  
	  const dbJQL = uniCloud.databaseForJQL({
		clientInfo: this.getClientInfo()
	  });
	  
	  try {
		// 获取不同状态的订单数量
		const [pendingCount, completedCount, unfinishedCount, refundedCount] = await Promise.all([
		  dbJQL.collection('fishcave-orders').where({
			status: 0
		  }).count(),
		  dbJQL.collection('fishcave-orders').where({
			status: 1
		  }).count(),
		  dbJQL.collection('fishcave-orders').where({
			status: 2
		  }).count(),
		  dbJQL.collection('fishcave-orders').where({
			status: 3
		  }).count()
		]);
		
		// 计算总金额
		const totalAmountResult = await dbJQL.collection('fishcave-orders').aggregate()
		  .group({
			_id: null,
			totalAmount: {
			  $sum: '$total_fee'
			}
		  })
		  .end();
		
		const totalAmount = totalAmountResult.data.length > 0 ? totalAmountResult.data[0].totalAmount : 0;
		
		return {
		  code: 0,
		  data: {
			pending: pendingCount.total, // 待确认
			completed: completedCount.total, // 已完成
			unfinished: unfinishedCount.total, // 未完成
			refunded: refundedCount.total, // 已退款
			total: pendingCount.total + completedCount.total + unfinishedCount.total + refundedCount
			  .total, // 总订单数
			totalAmount: totalAmount // 总金额
		  }
		};
	  } catch (e) {
		console.error("Get_OrdersCount error:", e);
		return {
		  code: -2,
		  errMsg: "统计订单数量失败: " + e.message
		};
	  }
	},
	/**
	 * 获取角色为 preUser 的用户列表
	 * @returns {object} 包含 preUser 用户的列表
	 */
	async getPreUsers() {
		const dbJQL = uniCloud.databaseForJQL({
			clientInfo: this.getClientInfo()
		});
		// 权限检查 (仅限管理员) - 调用全局函数
		const authError = checkAdminPermission(this.getClientInfo());
		if (authError) {
			return authError;
		}
		try {
			const res = await dbJQL.collection('uni-id-users')
				.where({
					role: 'preUser'
				})
				.field({
					"_id": true,
					"nickname": true,
				})
				.get();

			return {
				errCode: 0,
				data: res.data
			};
		} catch (e) {
			console.error('云函数 getPreUsers 错误', e);
			return {
				errCode: 500,
				errMsg: '获取 preUser 列表失败: ' + e.message
			};
		}
	},
	/**
	* 提升用户角色从 preUser 到 user
	* @param {object} params
	* @param {string} params.userId 要提升权限的用户ID
	* @returns {object} 操作结果
	*/
	async promoteUserRole(params) {
		// 权限检查 (仅限管理员) - 调用全局函数
		const authError = checkAdminPermission(this.getClientInfo());
			if (authError) {
				return authError; // 如果不是管理员，直接返回错误
			}
		const dbJQL = uniCloud.databaseForJQL({
		  clientInfo: this.getClientInfo()
		});
		const userId = params.userId;
		const userRoleId = "user"; 

		if (!userId) {
		  return {
			errCode: 400,
			errMsg: '缺少用户ID'
		  };
		}

		try {
		  await dbJQL.collection('uni-id-users')
			.where({
			  _id: userId
			})
			.update({
			  role: [userRoleId] 
			});

		  return {
			errCode: 0,
			errMsg: '权限提升成功'
		  };
		} catch (e) {
		  console.error('云函数 promoteUserRole 错误', e);
		  return {
			errCode: 500,
			errMsg: '提升用户权限失败: ' + e.message
		  };
		}
	},
	
	/**
	 * 生成或重置用户的 connectCode
	 * @param {string} userId 用户ID，如果未提供则尝试从认证信息获取
	 * @returns {object} 包含生成的 connectCode
	 */
	async generateConnectCode(userId) {
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  // 获取当前用户ID - 多种方式尝试
	  let currentUserId = userId;
	  
	  if (!currentUserId) {
	    try {
	      const clientInfo = this.getClientInfo();
	      currentUserId = clientInfo && clientInfo.userInfo && clientInfo.userInfo.uid;
	    } catch (e) {
	      console.error("Failed to get uid from clientInfo:", e);
	    }
	  }
	  
	  // 如果仍然没有用户ID，尝试从token获取
	  if (!currentUserId) {
	    try {
	      const tokenInfo = this.getClientInfo().tokenInfo;
	      currentUserId = tokenInfo && tokenInfo.uid;
	    } catch (e) {
	      console.error("Failed to get uid from tokenInfo:", e);
	    }
	  }
	  
	  if (!currentUserId) {
	    return {
	      errCode: 401,
	      errMsg: '用户未登录或无法获取用户ID'
	    };
	  }
	  
	  try {
	    // 生成随机的 connectCode (UUID v4 格式)
	    const connectCode = generateUUID(); // 使用独立函数而不是方法
	    
	    // 查询用户是否已有 connectCode 记录
	    const connectCodeCollection = dbJQL.collection('connectCode');
	    const existingRecord = await connectCodeCollection
	      .where({
	        userid: currentUserId
	      })
	      .get();
	    
	    if (existingRecord.data.length > 0) {
	      // 用户已有记录，更新现有记录
	      await connectCodeCollection
	        .where({
	          userid: currentUserId
	        })
	        .update({
	          connectcode: [connectCode]
	        });
	    } else {
	      // 用户没有记录，创建新记录
	      await connectCodeCollection.add({
	        userid: currentUserId,
	        connectcode: [connectCode]
	      });
	    }
	    
	    return {
	      errCode: 0,
	      data: {
	        connectCode: connectCode
	      },
	      errMsg: 'connectCode 生成成功'
	    };
	  } catch (e) {
	    console.error('生成 connectCode 失败:', e);
	    return {
	      errCode: 500,
	      errMsg: '生成 connectCode 失败: ' + e.message
	    };
	  }
	},
	
	/**
	 * 获取当前用户的 connectCode
	 * @param {string} userId 用户ID，如果未提供则尝试从认证信息获取
	 * @returns {object} 包含用户的 connectCode
	 */
	async getConnectCode(userId) {
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  // 获取当前用户ID - 多种方式尝试
	  let currentUserId = userId;
	  
	  if (!currentUserId) {
	    try {
	      const clientInfo = this.getClientInfo();
	      currentUserId = clientInfo && clientInfo.userInfo && clientInfo.userInfo.uid;
	    } catch (e) {
	      console.error("Failed to get uid from clientInfo:", e);
	    }
	  }
	  
	  // 如果仍然没有用户ID，尝试从token获取
	  if (!currentUserId) {
	    try {
	      const tokenInfo = this.getClientInfo().tokenInfo;
	      currentUserId = tokenInfo && tokenInfo.uid;
	    } catch (e) {
	      console.error("Failed to get uid from tokenInfo:", e);
	    }
	  }
	  
	  if (!currentUserId) {
	    return {
	      errCode: 401,
	      errMsg: '用户未登录或无法获取用户ID'
	    };
	  }
	  
	  try {
	    // 查询用户的 connectCode 记录
	    const connectCodeCollection = dbJQL.collection('connectCode');
	    const record = await connectCodeCollection
	      .where({
	        userid: currentUserId
	      })
	      .get();
	    
	    if (record.data.length === 0) {
	      return {
	        errCode: 404,
	        errMsg: '未找到 connectCode，请先生成'
	      };
	    }
	    
	    return {
	      errCode: 0,
	      data: {
	        connectCode: record.data[0].connectcode[0]
	      },
	      errMsg: '获取 connectCode 成功'
	    };
	  } catch (e) {
	    console.error('获取 connectCode 失败:', e);
	    return {
	      errCode: 500,
	      errMsg: '获取 connectCode 失败: ' + e.message
	    };
	  }
	},
	
	
	
	/**
	 * 验证 connectCode 并绑定到QQ账号 (供 nonebot 调用的API)
	 * @param {object} params
	 * @param {string} params.connectCode 要验证的 connectCode
	 * @param {string} params.qqId QQ用户ID
	 * @returns {object} 验证结果和关联的用户信息
	 */
	async verifyConnectCode(params) {
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  const { connectCode, qqId } = params;
	  
	  if (!connectCode || !qqId) {
	    return {
	      errCode: 400,
	      errMsg: '缺少必要参数'
	    };
	  }
	  
	  try {
	    // 查询匹配的 connectCode 记录
	    const connectCodeCollection = dbJQL.collection('connectCode');
	    const record = await connectCodeCollection
	      .where({
	        connectcode: connectCode
	      })
	      .get();
	    
	    if (record.data.length === 0) {
	      return {
	        errCode: 404,
	        errMsg: '无效的 connectCode'
	      };
	    }
	    
	    const userId = record.data[0].userid;
	    
	    // 获取用户信息
	    const userInfo = await dbJQL.collection('uni-id-users')
	      .where({
	        _id: userId
	      })
	      .field({
	        "_id": true,
	        "nickname": true,
	        "username": true
	      })
	      .get();
	    
	    if (userInfo.data.length === 0) {
	      return {
	        errCode: 404,
	        errMsg: '未找到关联用户'
	      };
	    }
	    
	    // 可以在这里添加将QQ ID与用户关联的逻辑
	    // 例如，更新用户记录或创建一个新的QQ绑定表
	    
	    // 验证成功后，可以选择是否立即重置 connectCode
	    
	    return {
	      errCode: 0,
	      data: {
	        userId: userId,
	        nickname: userInfo.data[0].nickname || userInfo.data[0].username,
	        qqId: qqId
	      },
	      errMsg: 'connectCode 验证成功'
	    };
	  } catch (e) {
	    console.error('验证 connectCode 失败:', e);
	    return {
	      errCode: 500,
	      errMsg: '验证 connectCode 失败: ' + e.message
	    };
	  }
	},
	
	
	/**
	 * 更新客服电话
	 * @param {object} params - 包含新电话号码的对象
	 * @param {string} params.newPhoneNo - 新的客服电话号码
	 * @returns {object} 操作结果
	 */
	async updateCustomerServicePhone(params) {
		const { newPhoneNo } = params;
	
		// 1. 输入验证
		if (!newPhoneNo || typeof newPhoneNo !== 'string') {
			return {
				errCode: 'INVALID_PARAMS',
				errMsg: '缺少有效的 newPhoneNo 参数 (必须是字符串)'
			};
		}
	
		// 2. 权限验证 - 调用全局函数
		const authError = checkAdminPermission(this.getClientInfo());
		if (authError) {
			return authError;
		}
	
		const collection = db.collection('customer-service-phone');
	
		try {
			// 3. 查询集合中是否已有记录
			console.log("查询现有客服电话记录");
			const existingRecord = await collection.limit(1).get();
	
			if (existingRecord.data && existingRecord.data.length > 0) {
				// 记录存在，更新它
				const recordId = existingRecord.data[0]._id;
				console.log("找到现有记录，ID:", recordId, "正在更新...");
				const updateResult = await collection.doc(recordId).update({
					phoneNo: newPhoneNo,
					updateTime: Date.now() // 添加更新时间戳
				});
	
				console.log("更新结果:", JSON.stringify(updateResult));
				if (updateResult.updated === 1) {
					return {
						errCode: 0,
						errMsg: '客服电话更新成功'
					};
				} else {
					return {
						errCode: 'UPDATE_FAILED',
						errMsg: '更新客服电话失败，未找到匹配记录或数据未更改'
					};
				}
			} else {
				// 记录不存在，创建一条新记录
				console.log("未找到现有记录，创建新记录");
				const addResult = await collection.add({
					phoneNo: newPhoneNo,
					createTime: Date.now()
				});
				
				console.log("创建结果:", JSON.stringify(addResult));
				if (addResult.id) {
					return {
						errCode: 0,
						errMsg: '客服电话记录创建成功'
					};
				} else {
					return {
						errCode: 'CREATE_FAILED',
						errMsg: '创建客服电话记录失败'
					};
				}
			}
		} catch (e) {
			console.error("数据库操作失败:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '数据库操作失败: ' + e.message
			};
		}
	},
	
	
	/**
	 * 获取客服电话 (仅限 user 和 admin 角色)
	 * @returns {object} 包含客服电话的数据或错误信息
	 */
	async getCustomerServicePhone() {
		// 1. 权限验证 - 检查是否为 user 或 admin - 调用全局函数
		const authError = checkUserOrAdminPermission(this.getClientInfo());
		if (authError) {
			return authError;
		}
	
		// 2. 如果权限验证通过，执行数据库查询
		const collection = db.collection('customer-service-phone');
		try {
			console.log("权限验证通过，查询客服电话...");
			const res = await collection.limit(1).get(); // 获取第一条（也是唯一一条）记录
			if (res.data && res.data.length > 0) {
				return {
					errCode: 0,
					data: {
						phoneNo: res.data[0].phoneNo // 返回电话号码
					}
				};
			} else {
				// 记录不存在，仍然返回成功，但数据为空
				return {
					errCode: 0,
					data: { phoneNo: '' }, // 返回空字符串表示未设置
					errMsg: '未找到客服电话记录'
				};
			}
		} catch (e) {
			console.error("获取客服电话数据库操作失败:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '数据库操作失败: ' + e.message
			};
		}
	},
	Delete: function(content, statusnumber) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const order = dbJQL.collection('fishcave-orders')
		const reservation = dbJQL.collection('reservation-log')
		const singin = dbJQL.collection('signin')
		order.remove()
		reservation.remove()
		singin.remove()
		console.log("数据已全部删除")
	},
	AddVipPrices: async function(content){
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const vipprice = dbJQL.collection('prices_vip')
		await vipprice.add(content)
	},
	/**
	 * 获取帮助中心文档列表
	 * @returns {object} 包含文档列表的查询结果
	 */
	async HelpCenter_List() {
		// 读取列表不需要特殊权限，dbschema 中已配置 read: true
		try {
			const res = await helpCenterCollection.field({
				_id: true,
				helptitle: true,
				helpurl: true // 列表页可能不需要url，看前端是否需要提前加载
			}).orderBy('helptitle', 'asc').get(); // 按标题升序排列
			return {
				errCode: 0,
				errMsg: '获取成功',
				data: res.data
			};
		} catch (e) {
			console.error("HelpCenter_List error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '获取帮助列表失败: ' + e.message
			};
		}
	},

	/**
	 * 获取单个帮助文档详情 (如果列表页只传id，查看页需要调用这个)
	 * @param {string} id 文档ID
	 * @returns {object} 文档详情
	 */
	async HelpCenter_Get(id) {
		if (!id) {
			return { errCode: 'PARAM_ERROR', errMsg: '缺少文档ID' };
		}
		try {
			const res = await helpCenterCollection.doc(id).get();
			if (!res.data || res.data.length === 0) {
				return { errCode: 'NOT_FOUND', errMsg: '未找到指定的帮助文档' };
			}
			return {
				errCode: 0,
				errMsg: '获取成功',
				data: res.data[0]
			};
		} catch (e) {
			console.error("HelpCenter_Get error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '获取帮助文档详情失败: ' + e.message
			};
		}
	},

	/**
	 * 添加新的帮助文档 (仅限管理员)
	 * @param {object} data 包含 helptitle 和 helpurl 的对象
	 * @returns {object} 操作结果，包含新文档的 ID
	 */
	async HelpCenter_Add(data) {
		// 1. 权限检查 - 调用全局函数
		const authError = checkAdminPermission(this.getClientInfo());
		if (authError) {
			return authError; // 没有权限，直接返回错误
		}

		// 2. 参数校验
		if (!data || !data.helptitle || !data.helpurl) {
			return { errCode: 'PARAM_ERROR', errMsg: '缺少必要的文档信息 (标题和链接)' };
		}

		// 3. 执行添加
		try {
			const res = await helpCenterCollection.add({
				helptitle: data.helptitle,
				helpurl: data.helpurl,
				create_time: Date.now() // 可选：添加创建时间
			});
			return {
				errCode: 0,
				errMsg: '添加成功',
				id: res.id // 返回新记录的ID
			};
		} catch (e) {
			console.error("HelpCenter_Add error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '添加帮助文档失败: ' + e.message
			};
		}
	},

	/**
	 * 更新帮助文档 (仅限管理员)
	 * @param {string} id 要更新的文档 ID
	 * @param {object} data 包含要更新的 helptitle 和/或 helpurl 的对象
	 * @returns {object} 操作结果
	 */
	async HelpCenter_Update(id, data) {
		// 1. 权限检查 - 调用全局函数
		const authError = checkAdminPermission(this.getClientInfo());
		if (authError) {
			return authError;
		}

		// 2. 参数校验
		if (!id) {
			return { errCode: 'PARAM_ERROR', errMsg: '缺少文档ID' };
		}
		if (!data || (!data.helptitle && !data.helpurl)) {
			return { errCode: 'PARAM_ERROR', errMsg: '没有提供要更新的内容' };
		}

		// 3. 构建更新数据
		const updateData = {};
		if (data.helptitle) updateData.helptitle = data.helptitle;
		if (data.helpurl) updateData.helpurl = data.helpurl;
		updateData.update_time = Date.now(); // 可选：更新修改时间

		// 4. 执行更新
		try {
			const res = await helpCenterCollection.doc(id).update(updateData);
			if (res.updated === 0) {
				 return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的文档或内容无变化' };
			}
			return {
				errCode: 0,
				errMsg: '更新成功',
				updated: res.updated
			};
		} catch (e) {
			console.error("HelpCenter_Update error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '更新帮助文档失败: ' + e.message
			};
		}
	},

	/**
	 * 删除帮助文档 (仅限管理员)
	 * @param {string} id 要删除的文档 ID
	 * @returns {object} 操作结果
	 */
	async HelpCenter_Delete(id) {
		// 1. 权限检查 - 调用全局函数
		const authError = checkAdminPermission(this.getClientInfo());
		if (authError) {
			return authError;
		}

		// 2. 参数校验
		if (!id) {
			return { errCode: 'PARAM_ERROR', errMsg: '缺少文档ID' };
		}

		// 3. 执行删除
		try {
			const res = await helpCenterCollection.doc(id).remove();
			 if (res.deleted === 0) {
				 return { errCode: 'NOT_FOUND', errMsg: '未找到要删除的文档' };
			}
			return {
				errCode: 0,
				errMsg: '删除成功',
				deleted: res.deleted
			};
		} catch (e) {
			console.error("HelpCenter_Delete error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '删除帮助文档失败: ' + e.message
			};
		}
	},

	/**
	 * 修复后的获取筛选订单方法
	 */
	async Get_FilteredOrders(params = {}) {
	  try {
	    console.log('Get_FilteredOrders 开始执行，参数:', params);
	    
	    // 直接在这里进行权限检查，而不是调用方法
	    const clientInfo = this.getClientInfo();
	    console.log("权限检查 - 用户信息:", JSON.stringify(clientInfo));
	
	    if (!clientInfo || !clientInfo.uniIdToken) {
	      console.log("权限检查失败: 未找到身份令牌");
	      return { code: -1, errMsg: '用户未登录或无权访问' };
	    }
	
	    const tokenParts = clientInfo.uniIdToken.split('.');
	    if (tokenParts.length !== 3) {
	      console.log("权限检查失败: 令牌格式无效");
	      return { code: -1, errMsg: '令牌格式无效' };
	    }
	
	    let payload;
	    try {
	      const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
	      const jsonStr = Buffer.from(base64, 'base64').toString();
	      payload = JSON.parse(jsonStr);
	      console.log("解析后的令牌信息:", JSON.stringify(payload));
	    } catch (e) {
	      console.error("解析令牌失败:", e);
	      return { code: -1, errMsg: '无法解析身份令牌: ' + e.message };
	    }
	
	    const role = payload.role;
	    let hasAdminRole = false;
	
	    if (Array.isArray(role)) {
	      hasAdminRole = role.includes('admin');
	    } else if (typeof role === 'string') {
	      hasAdminRole = role === 'admin';
	    }
	
	    console.log("用户是否有管理员权限:", hasAdminRole);
	
	    if (!hasAdminRole) {
	      return { code: -1, errMsg: '只有管理员才能执行此操作' };
	    }
	
	    console.log('Get_FilteredOrders: 权限检查通过');
	
	    const {
	      pageSize = 10,
	      pageNumber = 1,
	      keyword = '',
	      status = null,
	      startDate = null,
	      endDate = null,
	      minAmount = null,
	      maxAmount = null,
	      sortField = 'create_date',
	      sortOrder = 'desc'
	    } = params;
	
	    console.log('Get_FilteredOrders 处理后的参数:', {
	      pageSize, pageNumber, keyword, status, 
	      startDate, endDate, minAmount, maxAmount,
	      sortField, sortOrder
	    });
	
	    // 构建查询条件
	    const db = uniCloud.database();
	    let query = db.collection('fishcave-orders');
	
	    // 构建where条件
	    const whereConditions = {};
	
	    // 关键词搜索
	    if (keyword && keyword.trim()) {
	      const keywordTrim = keyword.trim();
	      console.log('添加关键词搜索条件:', keywordTrim);
	      
	      whereConditions.$or = [
	        { out_trade_no: new RegExp(keywordTrim, 'i') },
	        { user_id: new RegExp(keywordTrim, 'i') },
	        { description: new RegExp(keywordTrim, 'i') }
	      ];
	    }
	
	    // 状态筛选
	    if (status !== null && status !== undefined && status !== '') {
	      const statusInt = parseInt(status);
	      console.log('添加状态筛选条件:', statusInt);
	      whereConditions.status = statusInt;
	    }
	
	    // 日期范围筛选
	    if (startDate && endDate) {
	      const startDateInt = parseInt(startDate);
	      const endDateInt = parseInt(endDate);
	      console.log('添加日期范围筛选:', startDateInt, 'to', endDateInt);
	      
	      whereConditions.create_date = {
	        $gte: startDateInt,
	        $lte: endDateInt
	      };
	    }
	
	    // 金额范围筛选
	    if (minAmount !== null && minAmount !== undefined && minAmount !== '') {
	      const minAmountInt = parseInt(minAmount);
	      console.log('添加最小金额筛选:', minAmountInt);
	      
	      if (!whereConditions.total_fee) whereConditions.total_fee = {};
	      whereConditions.total_fee.$gte = minAmountInt;
	    }
	
	    if (maxAmount !== null && maxAmount !== undefined && maxAmount !== '') {
	      const maxAmountInt = parseInt(maxAmount);
	      console.log('添加最大金额筛选:', maxAmountInt);
	      
	      if (!whereConditions.total_fee) whereConditions.total_fee = {};
	      whereConditions.total_fee.$lte = maxAmountInt;
	    }
	
	    console.log('最终查询条件:', JSON.stringify(whereConditions, null, 2));
	
	    // 应用查询条件
	    if (Object.keys(whereConditions).length > 0) {
	      query = query.where(whereConditions);
	    }
	
	    // 计算总数
	    console.log('开始计算总数...');
	    const countResult = await query.count();
	    const total = countResult.total;
	    const totalPages = Math.ceil(total / pageSize);
	    
	    console.log('查询统计结果:', { total, totalPages });
	
	    // 分页查询
	    const skip = (pageNumber - 1) * pageSize;
	    console.log('开始分页查询，skip:', skip, 'limit:', pageSize);
	    
	    const ordersResult = await query
	      .orderBy(sortField, sortOrder)
	      .skip(skip)
	      .limit(pageSize)
	      .get();
	
	    console.log('订单查询结果:', {
	      total,
	      currentPage: pageNumber,
	      pageSize,
	      dataLength: ordersResult.data?.length || 0,
	      actualData: ordersResult.data?.length > 0 ? '有数据' : '无数据'
	    });
	
	    // 处理订单数据
	    const orders = (ordersResult.data || []).map(order => {
	      // 计算时长
	      let duration = 0;
	      if (order.starttime && order.endtime) {
	        duration = Math.round((order.endtime - order.starttime) / (1000 * 60));
	      }
	
	      return {
	        _id: order._id,
	        out_trade_no: order.out_trade_no || '',
	        total_fee: order.total_fee || 0,
	        status: order.status || 0,
	        create_date: order.create_date || Date.now(),
	        starttime: order.starttime,
	        endtime: order.endtime,
	        duration: duration,
	        user_id: order.user_id,
	        reservation_id: order.reservation_id,
	        description: order.description || '',
	        order_type: order.order_type || 'normal',
	        // 添加一些计算字段
	        isOvernight: order.starttime && order.endtime ? 
	          new Date(order.starttime).getDate() !== new Date(order.endtime).getDate() : false,
	        formattedAmount: order.total_fee ? (order.total_fee / 100).toFixed(2) : '0.00',
	        statusText: getStatusText(order.status), // 使用全局函数
	        formattedCreateDate: formatDateTime(order.create_date), // 使用全局函数
	        formattedStartTime: formatDateTime(order.starttime), // 使用全局函数
	        formattedEndTime: formatDateTime(order.endtime) // 使用全局函数
	      };
	    });
	
	    console.log('处理后的订单数据条数:', orders.length);
	
	    return {
	      code: 0,
	      data: orders,
	      pagination: {
	        current: pageNumber,
	        pageSize: pageSize,
	        total: total,
	        totalPages: totalPages,
	        hasNext: pageNumber < totalPages,
	        hasPrev: pageNumber > 1
	      }
	    };
	
	  } catch (error) {
	    console.error('Get_FilteredOrders 执行错误:', error);
	    console.error('错误堆栈:', error.stack);
	    
	    return {
	      code: -1,
	      errMsg: `获取订单数据失败: ${error.message}`
	    };
	  }
	},
	/**
	 * 获取订单详情
	 */
	async GetOrderDetail(orderId) {
	  try {
	    // 直接进行权限检查
	    const clientInfo = this.getClientInfo();
	    
	    if (!clientInfo || !clientInfo.uniIdToken) {
	      return { code: -1, errMsg: '用户未登录或无权访问' };
	    }
	
	    const tokenParts = clientInfo.uniIdToken.split('.');
	    if (tokenParts.length !== 3) {
	      return { code: -1, errMsg: '令牌格式无效' };
	    }
	
	    let payload;
	    try {
	      const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
	      const jsonStr = Buffer.from(base64, 'base64').toString();
	      payload = JSON.parse(jsonStr);
	    } catch (e) {
	      return { code: -1, errMsg: '无法解析身份令牌' };
	    }
	
	    const role = payload.role;
	    let hasAdminRole = false;
	
	    if (Array.isArray(role)) {
	      hasAdminRole = role.includes('admin');
	    } else if (typeof role === 'string') {
	      hasAdminRole = role === 'admin';
	    }
	
	    if (!hasAdminRole) {
	      return { code: -1, errMsg: '只有管理员才能执行此操作' };
	    }
	
	    // 验证 orderId 参数
	    if (!orderId || (typeof orderId !== 'string' && typeof orderId !== 'number')) {
	      return { code: -1, errMsg: '订单ID无效' };
	    }
	
	    const db = uniCloud.database();
	    const orderResult = await db.collection('fishcave-orders')
	      .doc(orderId)
	      .get();
	
	    if (!orderResult.data || orderResult.data.length === 0) {
	      return { code: -1, errMsg: '订单不存在' };
	    }
	
	    const order = orderResult.data[0];
	    
	    // 计算时长
	    let duration = 0;
	    if (order.starttime && order.endtime) {
	      duration = Math.round((order.endtime - order.starttime) / (1000 * 60));
	    }
	
	    // 格式化订单详情
	    const orderDetail = {
	      _id: order._id,
	      out_trade_no: order.out_trade_no,
	      total_fee: order.total_fee || 0,
	      status: order.status || 0,
	      create_date: order.create_date,
	      starttime: order.starttime,
	      endtime: order.endtime,
	      duration: duration,
	      user_id: order.user_id,
	      reservation_id: order.reservation_id,
	      description: order.description || '',
	      order_type: order.order_type || 'normal',
	      isOvernight: order.starttime && order.endtime ? 
	        new Date(order.starttime).getDate() !== new Date(order.endtime).getDate() : false,
	      formattedAmount: order.total_fee ? (order.total_fee / 100).toFixed(2) : '0.00',
	      statusText: getStatusText(order.status),
	      formattedCreateDate: formatDateTime(order.create_date),
	      formattedStartTime: formatDateTime(order.starttime),
	      formattedEndTime: formatDateTime(order.endtime)
	    };
	
	    return {
	      code: 0,
	      data: orderDetail
	    };
	
	  } catch (error) {
	    console.error('GetOrderDetail error:', error);
	    return {
	      code: -1,
	      errMsg: `获取订单详情失败: ${error.message}`
	    };
	  }
	},
/**
 * 更新订单信息
 */
async UpdateOrder(updateData) {
  try {
    // 直接进行权限检查
    const clientInfo = this.getClientInfo();
    
    if (!clientInfo || !clientInfo.uniIdToken) {
      return { code: -1, errMsg: '用户未登录或无权访问' };
    }

    const tokenParts = clientInfo.uniIdToken.split('.');
    if (tokenParts.length !== 3) {
      return { code: -1, errMsg: '令牌格式无效' };
    }

    let payload;
    try {
      const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = Buffer.from(base64, 'base64').toString();
      payload = JSON.parse(jsonStr);
    } catch (e) {
      return { code: -1, errMsg: '无法解析身份令牌' };
    }

    const role = payload.role;
    let hasAdminRole = false;

    if (Array.isArray(role)) {
      hasAdminRole = role.includes('admin');
    } else if (typeof role === 'string') {
      hasAdminRole = role === 'admin';
    }

    if (!hasAdminRole) {
      return { code: -1, errMsg: '只有管理员才能执行此操作' };
    }

    const { orderId, status, totalFee, starttime, endtime, editReason } = updateData;

    // 验证必要参数
    if (!orderId || (typeof orderId !== 'string' && typeof orderId !== 'number')) {
      return { code: -1, errMsg: '订单ID无效' };
    }

    if (!editReason || editReason.trim() === '') {
      return { code: -1, errMsg: '请输入修改原因' };
    }

    const db = uniCloud.database();
    
    // 先获取原订单数据用于日志记录
    const originalOrder = await db.collection('fishcave-orders')
      .doc(orderId)
      .get();
      
    if (!originalOrder.data || originalOrder.data.length === 0) {
      return { code: -1, errMsg: '订单不存在' };
    }
    
    const oldData = originalOrder.data[0];
    
    // 构建更新数据
    const updateFields = {
      update_date: Date.now()
    };

    if (status !== undefined && status !== null) {
      updateFields.status = parseInt(status);
    }

    if (totalFee !== undefined && totalFee !== null) {
      updateFields.total_fee = parseInt(totalFee);
    }

    if (starttime !== undefined && starttime !== null) {
      updateFields.starttime = parseInt(starttime);
    }

    if (endtime !== undefined && endtime !== null) {
      updateFields.endtime = parseInt(endtime);
    }

    console.log('Updating order:', orderId, 'with data:', updateFields);

    // 更新订单
    const updateResult = await db.collection('fishcave-orders')
      .doc(orderId)
      .update(updateFields);

    if (updateResult.updated === 0) {
      return { code: -1, errMsg: '订单不存在或更新失败' };
    }

    // 记录编辑日志
    try {
      await logOrderEdit({
        orderId: orderId,
        operatorId: payload.uid,
        editType: 'update',
        changes: {
          old: {
            status: oldData.status,
            total_fee: oldData.total_fee,
            starttime: oldData.starttime,
            endtime: oldData.endtime
          },
          new: updateFields
        },
        reason: editReason.trim(),
        editTime: Date.now()
      });
    } catch (logError) {
      console.error('记录编辑日志失败:', logError);
      // 日志记录失败不影响订单更新
    }

    return {
      code: 0,
      message: '订单更新成功'
    };

  } catch (error) {
    console.error('UpdateOrder error:', error);
    return {
      code: -1,
      errMsg: `更新订单失败: ${error.message}`
    };
  }
},

	
	
	/**
	 * 创建补票/自定义支付订单
	 * @param {string} userId 用户ID
	 * @param {number} amountFen 支付金额，单位为分
	 * @returns {object} 操作结果，包含新订单的ID
	 */
	async createSettleOrder(userId, amountFen) {
		// 1. 参数校验
		if (!userId || !amountFen || amountFen <= 0) {
			return {
				errCode: 'INVALID_PARAMS',
				errMsg: '缺少必要参数或金额无效'
			};
		}

		const db = uniCloud.database();
		const orderCollection = db.collection('fishcave-orders');

		try {
			// 2. 创建订单数据
			const orderData = {
				user_id: userId,
				total_fee: amountFen,
				status: 0, // 0: 待支付
				order_type: 'settle', // 标记为补票订单
				description: '补票/自定义支付',
				create_date: Date.now(),
				// 这里可以不关联 reservation_id, machineId 等，因为是自定义支付
			};

			// 3. 将订单写入数据库
			const result = await orderCollection.add(orderData);

			if (!result.id) {
				return {
					errCode: 'DB_ADD_FAILED',
					errMsg: '创建订单失败'
				};
			}

			// 4. 返回成功信息和订单ID
			return {
				errCode: 0,
				errMsg: '订单创建成功',
				id: result.id
			};

		} catch (e) {
			console.error("createSettleOrder error:", e);
			return {
				errCode: 'DB_ERROR',
				errMsg: '数据库操作失败: ' + e.message
			};
		}
	},
	
	
	/**
	 * 获取订单编辑日志
	 * @param {string} orderId 订单ID
	 * @returns {Object} 编辑日志列表
	 */
	async GetOrderEditLogs(orderId) {
	  try {
	    // 直接进行权限检查
	    const clientInfo = this.getClientInfo();
	    
	    if (!clientInfo || !clientInfo.uniIdToken) {
	      return { code: -1, errMsg: '用户未登录或无权访问' };
	    }
	
	    const tokenParts = clientInfo.uniIdToken.split('.');
	    if (tokenParts.length !== 3) {
	      return { code: -1, errMsg: '令牌格式无效' };
	    }
	
	    let payload;
	    try {
	      const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
	      const jsonStr = Buffer.from(base64, 'base64').toString();
	      payload = JSON.parse(jsonStr);
	    } catch (e) {
	      return { code: -1, errMsg: '无法解析身份令牌' };
	    }
	
	    const role = payload.role;
	    let hasAdminRole = false;
	
	    if (Array.isArray(role)) {
	      hasAdminRole = role.includes('admin');
	    } else if (typeof role === 'string') {
	      hasAdminRole = role === 'admin';
	    }
	
	    if (!hasAdminRole) {
	      return { code: -1, errMsg: '只有管理员才能执行此操作' };
	    }
	
	    // 验证 orderId 参数
	    if (!orderId || (typeof orderId !== 'string' && typeof orderId !== 'number')) {
	      return { code: -1, errMsg: '订单ID无效' };
	    }
	
	    const db = uniCloud.database();
	    const logsResult = await db.collection('order-edit-logs')
	      .where({
	        orderId: orderId
	      })
	      .orderBy('editTime', 'desc')
	      .limit(50)
	      .get();
	
	    return {
	      code: 0,
	      data: logsResult.data || []
	    };
	
	  } catch (error) {
	    console.error('GetOrderEditLogs error:', error);
	    return {
	      code: -1,
	      errMsg: `获取编辑日志失败: ${error.message}`
	    };
	  }
	},
	
	// 辅助方法：获取状态文本
	_getStatusText(status) {
	  switch (parseInt(status)) {
	    case 0: return '待确认';
	    case 1: return '已完成';
	    case 2: return '未完成';
	    case 3: return '已退款';
	    default: return '未知状态';
	  }
	},
	
	// 辅助方法：格式化日期时间
	_formatDateTime(timestamp) {
	  if (!timestamp) return '--';
	  const date = new Date(timestamp);
	  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
	}
}