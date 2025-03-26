// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
const uniPay = require('uni-pay');

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
			"isPlay": true
		}).orderBy("startTime", "desc").get()
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
		}).orderBy("startTime", "desc")

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

	/**
	 * 定时任务：更新会员状态
	 * 此函数应该配置为定时触发，例如每天凌晨执行一次
	 */
	async updateMembershipStatus() {
		try {
			const now = Date.now();
			const membershipCollection = db.collection('membership');
			const subscriptionPackageCollection = db.collection('subscription-package');

			// 更新 membership
			await membershipCollection
				.where({
					status: true,
					validthru: db.command.lt(now)
				})
				.update({
					status: false
				});

			// 更新 subscription-package
			await subscriptionPackageCollection
				.where({
					status: true,
					validthru: db.command.lt(now)
				})
				.update({
					status: false
				});

			console.log('会员状态更新完成');
			return {
				success: true,
				message: '会员状态更新完成'
			};
		} catch (e) {
			console.error('会员状态更新失败:', e);
			return {
				success: false,
				message: '会员状态更新失败: ' + e.message
			};
		}
	},
	
	/**
	 * 结束签到
	 * @param {Object} params 包含签到ID和结束时间的对象
	 * @returns {Object} 操作结果
	 */
	async SignIn_End(params) {
	  const { signinId, endtime } = params;
	  
	  if (!signinId || !endtime) {
	    return {
	      code: -1,
	      message: '缺少必要参数'
	    };
	  }
	  
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  try {
	    // 1. 查询签到信息，获取关联的预约ID
	    const signinInfo = await dbJQL.collection('signin')
	      .where({
	        _id: signinId,
	        status: 0 // 确保只能结束"使用中"的签到
	      })
	      .get();
	      
	    if (signinInfo.data.length === 0) {
	      return {
	        code: -1,
	        message: '未找到有效的签到记录'
	      };
	    }
	    
	    const reservationId = signinInfo.data[0].reservationid;
	    
	    // 2. 更新签到记录
	    await dbJQL.collection('signin')
	      .where({
	        _id: signinId
	      })
	      .update({
	        endtime: endtime,
	        status: 1, // 更新为已完成
	        updateTime: Date.now()
	      });
	      
	    // 3. 更新预约状态为已完成
	    await dbJQL.collection('reservation-log')
	      .where({
	        _id: reservationId
	      })
	      .update({
	        status: 2, // 更新为已完成
	        updateTime: Date.now()
	      });
	      
	    // 4. 返回结果，包含预约ID（可用于后续跳转到订单页面）
	    return {
	      code: 0,
	      message: '签到结束成功',
	      data: {
	        reservationId: reservationId,
	        signinId: signinId
	      }
	    };
	  } catch (error) {
	    console.error('结束签到失败:', error);
	    return {
	      code: -1,
	      message: '结束签到失败: ' + error.message
	    };
	  }
	},

	/**
	* 获取当前使用中的签到详情
	* @param {string} userId 用户ID
	* @returns {Object} 签到详情，包含关联的预约信息
	*/
	async GetActiveSigninDetail(userId) {
	if (!userId) {
	  return {
		code: -1,
		message: '缺少用户ID参数'
	  };
	}

	const dbJQL = uniCloud.databaseForJQL({
	  clientInfo: this.getClientInfo()
	});

	try {
	  // 1. 查询用户当前的签到记录
	  const signinResult = await dbJQL.collection('signin')
		.where({
		  userid: userId,
		  status: 0 // 使用中的状态
		})
		.get();
		
	  if (signinResult.data.length === 0) {
		return {
		  code: -1,
		  message: '未找到使用中的签到记录'
		};
	  }
	  
	  const signinData = signinResult.data[0];
	  
	  // 2. 查询关联的预约信息
	  const reservationResult = await dbJQL.collection('reservation-log')
		.where({
		  _id: signinData.reservationid
		})
		.get();
		
	  if (reservationResult.data.length === 0) {
		return {
		  code: -1,
		  message: '未找到关联的预约记录'
		};
	  }
	  
	  // 3. 查询机台信息
	  const machineResult = await dbJQL.collection('machines')
		.where({
		  _id: reservationResult.data[0].machineId
		})
		.get();
	  
	  const machineData = machineResult.data.length > 0 ? machineResult.data[0] : null;
	  
	  // 4. 合并数据并返回
	  return {
		code: 0,
		message: '获取成功',
		data: {
		  signin: signinData,
		  reservation: reservationResult.data[0],
		  machine: machineData
		}
	  };
	} catch (error) {
	  console.error('获取签到详情失败:', error);
	  return {
		code: -1,
		message: '获取签到详情失败: ' + error.message
	  };
	}
	},

	/**
	 * 计算签到费用
	 * @param {Object} params 包含签到ID、开始时间和结束时间的对象
	 * @returns {Object} 计算的费用信息
	 */
	async CalculateSigninFee(params) {
	  const { signinId, starttime, endtime } = params;
	  
	  if (!signinId || !starttime || !endtime) {
	    return {
	      code: -1,
	      message: '缺少必要参数'
	    };
	  }
	  
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  try {
	    // 1. 获取签到信息
	    const signinResult = await dbJQL.collection('signin')
	      .where({
	        _id: signinId
	      })
	      .get();
	      
	    if (signinResult.data.length === 0) {
	      return {
	        code: -1,
	        message: '未找到签到记录'
	      };
	    }
	    
	    const signinData = signinResult.data[0];
	    
	    // 2. 获取关联的预约信息
	    const reservationResult = await dbJQL.collection('reservation-log')
	      .where({
	        _id: signinData.reservationid
	      })
	      .get();
	      
	    if (reservationResult.data.length === 0) {
	      return {
	        code: -1,
	        message: '未找到关联的预约记录'
	      };
	    }
	    
	    const reservationData = reservationResult.data[0];
	    
	    // 3. 获取用户会员信息 - 直接查询而不是调用方法
	    const userId = signinData.userid;
	    
	    // 查询会员信息
	    const membershipResult = await dbJQL.collection('membership')
	      .where({
	        userID: userId,
	        status: true,
	        validthru: dbJQL.command.gt(Date.now())
	      })
	      .get();
	    
	    const subscriptionResult = await dbJQL.collection('subscription-package')
	      .where({
	        userID: userId,
	        status: true,
	        validthru: dbJQL.command.gt(Date.now())
	      })
	      .get();
	    
	    const hasMembership = membershipResult.data.length > 0;
	    const hasSubscription = subscriptionResult.data.length > 0;
	    
	    // 4. 计算使用时长（小时）
	    const durationMs = endtime - starttime;
	    const durationHours = durationMs / (1000 * 60 * 60);
	    
	    // 5. 根据预约类型、会员信息和是否玩机台计算费用
	    let fee = 0;
	    
	    // 获取价格信息
	    const priceResult = await dbJQL.collection('prices')
	      .where({
	        type: reservationData.isOvernight ? 'overnight' : 'normal'
	      })
	      .get();
	      
	    const priceData = priceResult.data.length > 0 ? priceResult.data[0] : null;
	    
	    if (reservationData.isOvernight) {
	      // 过夜预约，使用固定价格
	      fee = priceData ? priceData.price : 50; // 默认50
	      
	      // 如果不玩机台，使用不玩机台价格
	      if (!signinData.isPlay && priceData && priceData.noplayprice !== undefined) {
	        fee = priceData.noplayprice;
	      }
	    } else {
	      // 普通预约，按小时计费
	      const basePrice = priceData ? priceData.price : 5; // 默认5元/半小时
	      const noPlayPrice = priceData && priceData.noplayprice !== undefined ? priceData.noplayprice : 1; // 默认1元/半小时
	      
	      // 根据是否玩机台选择价格
	      const hourlyRate = signinData.isPlay ? basePrice : noPlayPrice;
	      
	      // 计算半小时单位数
	      const halfHourUnits = Math.ceil(durationHours / 0.5);
	      
	      if (hasSubscription) {
	        // 包周/月卡会员，免费
	        fee = 0;
	      } else if (hasMembership && signinData.isPlay) {
	        // 音游会员，每半小时4元，当日封顶40元
	        fee = Math.min(halfHourUnits * 4, 40);
	      } else {
	        // 非会员，正常计费
	        fee = halfHourUnits * hourlyRate;
	        
	        // 如果玩机台且超过5小时，使用过夜价格
	        if (signinData.isPlay && durationHours >= 5) {
	          fee = priceData ? priceData.price : 50; // 默认过夜价50
	        }
	      }
	    }
	    
	    return {
	      code: 0,
	      message: '计算成功',
	      data: {
	        fee: fee,
	        duration: durationHours,
	        durationText: `${Math.floor(durationHours)}小时${Math.round((durationHours % 1) * 60)}分钟`,
	        isPlay: signinData.isPlay,
	        isOvernight: reservationData.isOvernight,
	        startTime: starttime,
	        endTime: endtime,
	        isMember: hasMembership || hasSubscription
	      }
	    };
	  } catch (error) {
	    console.error('计算费用失败:', error);
	    return {
	      code: -1,
	      message: '计算费用失败: ' + error.message
	    };
	  }
	},

	async CreateOrder(params) {
	  const { signinId, fee, userId } = params;
	  
	  if (!signinId || fee === undefined || !userId) {
	    return {
	      code: -1,
	      message: '缺少必要参数'
	    };
	  }
	  
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  
	  try {
	    // 1. 创建基础订单
	    const baseOrderResult = await dbJQL.collection('uni-id-base-order').add({
	      user_id: userId,
	      order_type: 'seat_usage', // 座位使用订单
	      create_date: Date.now(),
	      status: 0, // 0: 待支付
	      total_fee: fee,
	      description: '座位使用费用',
	      signinId: signinId // 关联签到记录
	    });
	    
	    const baseOrderId = baseOrderResult.id;
	    
	    // 2. 返回订单ID
	    return {
	      code: 0,
	      message: '订单创建成功',
	      data: {
	        orderId: baseOrderId,
	        fee: fee
	      }
	    };
	  } catch (error) {
	    console.error('创建订单失败:', error);
	    return {
	      code: -1,
	      message: '创建订单失败: ' + error.message
	    };
	  }
	},
	/**
	   * 创建订单并获取支付参数
	   */
	  async CreateOrderAndPay(params) {
	    const { signinId, fee, userId, provider = 'wxpay' } = params;
	    
	    if (!signinId || fee === undefined || !userId) {
	      return {
	        code: -1,
	        message: '缺少必要参数'
	      };
	    }
	    
	    const db = uniCloud.database();
	    
	    try {
	      // 1. 获取签到信息和用户信息
	      const signinInfo = await db.collection('signin').doc(signinId).get();
	      if (!signinInfo.data || signinInfo.data.length === 0) {
	        return {
	          code: -1,
	          message: '签到记录不存在'
	        };
	      }
	      
	      // 2. 创建基础订单
	      const baseOrderData = {
	        user_id: userId,
	        order_type: 'seat_usage', // 座位使用订单
	        create_date: Date.now(),
	        status: 0, // 0: 待支付
	        total_fee: fee,
	        description: '座位使用费用',
	        signin_id: signinId, // 关联签到记录
	        seat_id: signinInfo.data[0].seatid,
	        start_time: signinInfo.data[0].starttime,
	        end_time: signinInfo.data[0].endtime || Date.now()
	      };
	      
	      const baseOrderResult = await db.collection('uni-id-base-order').add(baseOrderData);
	      
	      const orderId = baseOrderResult.id;
	      
	      // 3. 使用 uni-pay 创建支付订单
	      // 获取客户端平台信息
	      const clientInfo = this.getClientInfo();
	      const platform = clientInfo.platform;
	      
	      // 根据平台和支付方式选择合适的支付方式
	      let providerOptions = {};
	      if (provider === 'wxpay') {
	        if (platform === 'mp-weixin') {
	          // 小程序支付
	          providerOptions = {
	            openid: clientInfo.openId // 小程序支付需要 openid
	          };
	        } else if (platform.includes('app')) {
	          // App 支付
	          providerOptions.trade_type = 'APP';
	        } else if (platform.includes('h5')) {
	          // H5 支付
	          providerOptions.trade_type = 'MWEB';
	          providerOptions.scene_info = JSON.stringify({
	            h5_info: {
	              type: 'Wap',
	              wap_url: clientInfo.origin,
	              wap_name: '座位使用费用'
	            }
	          });
	        }
	      }
	      
	      const payOrderParams = {
	        provider: provider, // 'wxpay'或'alipay'
	        orderId: orderId, // 商户订单号
	        subject: '座位使用费用', // 订单标题
	        body: `签到ID:${signinId}的座位使用费用`,
	        totalFee: Math.round(fee * 100), // 金额，单位为分
	        notifyUrl: 'https://你的服务空间域名/http/uni-pay-co/notify', // 支付结果通知地址
	        ...providerOptions
	      };
	      
	      console.log('创建支付订单参数:', payOrderParams);
	      
	      const payOrderResult = await uniPay.createOrder(payOrderParams);
	      
	      console.log('创建支付订单结果:', payOrderResult);
	      
	      if (payOrderResult.code !== 0) {
	        return {
	          code: -1,
	          message: '创建支付订单失败: ' + payOrderResult.message
	        };
	      }
	      
	      // 4. 返回支付所需数据
	      return {
	        code: 0,
	        message: '创建订单成功',
	        data: {
	          orderId: orderId,
	          paymentData: payOrderResult.data // 包含了调起支付所需的参数
	        }
	      };
	    } catch (error) {
	      console.error('创建订单失败:', error);
	      return {
	        code: -1,
	        message: '创建订单失败: ' + error.message
	      };
	    }
	  },
	  
	  /**
	   * 获取订单详情
	   */
	  async GetOrderDetail(params) {
	    const { orderId } = params;
	    
	    if (!orderId) {
	      return {
	        code: -1,
	        message: '缺少订单ID'
	      };
	    }
	    
	    const db = uniCloud.database();
	    
	    try {
	      // 查询基础订单
	      const baseOrderResult = await db.collection('uni-id-base-order')
	        .doc(orderId)
	        .get();
	      
	      if (!baseOrderResult.data || baseOrderResult.data.length === 0) {
	        return {
	          code: -1,
	          message: '订单不存在'
	        };
	      }
	      
	      const baseOrder = baseOrderResult.data[0];
	      
	      // 查询支付订单
	      const payOrderResult = await db.collection('uni-pay-orders')
	        .where({
	          order_no: orderId
	        })
	        .get();
	      
	      const payOrder = payOrderResult.data.length > 0 ? payOrderResult.data[0] : null;
	      
	      // 如果有签到记录，获取签到信息
	      let signinInfo = null;
	      if (baseOrder.signin_id) {
	        const signinResult = await db.collection('signin')
	          .doc(baseOrder.signin_id)
	          .get();
	        
	        signinInfo = signinResult.data.length > 0 ? signinResult.data[0] : null;
	      }
	      
	      // 合并订单信息
	      const orderDetail = {
	        ...baseOrder,
	        payment_info: payOrder,
	        signin_info: signinInfo
	      };
	      
	      return {
	        code: 0,
	        message: '获取成功',
	        data: orderDetail
	      };
	    } catch (error) {
	      console.error('获取订单详情失败:', error);
	      return {
	        code: -1,
	        message: '获取订单详情失败: ' + error.message
	      };
	    }
	  }
}