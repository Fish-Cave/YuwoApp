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

			// 2. 获取用户会员信息 - 修改这里的调用方式
			// ===== 修改开始 =====
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
			// ===== 修改结束 =====

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

	SignIn_Settle: function(signInId, resId, uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const signin = dbJQL.collection('signin')
		signin.where({
			_id: signInId
		}).update({
			status: 1
		})
		const res = dbJQL.collection('reservation-log')
		res.where({
			_id: resId
		}).update({
			status: 2
		})
		const order = dbJQL.collection('fishcave-orders')
		order.where({
			user_id: uid,
			status: 0
		}).update({
			status: 1
		})
		return "Settle Succeed"
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
}