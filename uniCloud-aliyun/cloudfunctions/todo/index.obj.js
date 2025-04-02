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
	 */
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
	
	/**
	 * 按状态统计订单数量
	 * @param {string} userId 用户ID
	 * @returns {Object} 不同状态的订单数量
	 */
	async Get_OrdersCount(userId) {
	  if (!userId) {
	    return {
	      code: -1,
	      errMsg: "缺少用户ID参数"
	    };
	  }
	  
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  try {
	    // 获取不同状态的订单数量
	    const [pendingCount, completedCount, unfinishedCount, refundedCount] = await Promise.all([
	      dbJQL.collection('fishcave-orders').where({ user_id: userId, status: 0 }).count(),
	      dbJQL.collection('fishcave-orders').where({ user_id: userId, status: 1 }).count(),
	      dbJQL.collection('fishcave-orders').where({ user_id: userId, status: 2 }).count(),
	      dbJQL.collection('fishcave-orders').where({ user_id: userId, status: 3 }).count()
	    ]);
	    
	    return {
	      code: 0,
	      data: {
	        pending: pendingCount.total, // 待确认
	        completed: completedCount.total, // 已完成
	        unfinished: unfinishedCount.total, // 未完成
	        refunded: refundedCount.total, // 已退款
	        total: pendingCount.total + completedCount.total + unfinishedCount.total + refundedCount.total
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
		const dbJQL = uniCloud.databaseForJQL({
		  clientInfo: this.getClientInfo()
		});
		const userId = params.userId;
		const userRoleId = "user"; // **Corrected role_id: "user" for "普通会员"

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
}