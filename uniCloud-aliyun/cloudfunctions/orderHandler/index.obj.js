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
	GennerateOrder: async function(content, prices) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const order = dbJQL.collection('fishcave-orders')
		try {
			const result = order.add({
				...content,
				singlePrice: prices,
				type: 'goods'
			})
		} catch (e) {
			console.error("GennerateOrder failed:", e); // 建议添加错误日志
		}
	},

	UpdateOrder: async function(uid, isPlay, isOvernight) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const dayjs = require('dayjs')
		const order = dbJQL.collection('fishcave-orders')
		const priceslist = dbJQL.collection('prices')
		const endtime = Math.floor(Date.now() / 1000) * 1000

		//获取订单的基础信息
		let orderID = ""
		let starttime = 0
		let singlePrice = true
		try {
			console.log("NOW GET ORDER")
			const result = await order.where({
				user_id: uid,
				status: -1
			}).field({
				_id: true,
				starttime: true,
				singlePrice: true,
			}).limit(1).get()
			if(result.data.length == 0){
				return {
				  errCode: 0, // 错误码
				  errMsg: "", // 错误信息
				}
			}
			console.log(result.data)
			orderID = result.data[0]._id
			starttime = result.data[0].starttime
			singlePrice = result.data[0].singlePrice
		} catch (e) {}
		//获取储存在云端的价格表
		let price = {
			singlePrice: 3,
			overNightPrice: 30,
			noplayPrice: 1,
		}
		totalPrice = 0
		//console.log(endtime)
		try {
			console.log("NOW GET PRICE")
			const result = await priceslist.where({
				type: singlePrice
			}).get()
			console.log(result.data)
			price.singlePrice = result.data[0].price
			price.noplayPrice = result.data[0].noplayprice
			price.overNightPrice = result.data[1].price
		} catch (e) {}
		//计算价格
		//只处理非会员的情况,会员的情况单独处理
		if (orderID != "") {
			//判断签到是否跨日
			const formatStarttime = dayjs(starttime).format('YYYY-MM-DD')
			const formatendtime = dayjs(endtime).format('YYYY-MM-DD')
			let isSameDay = true
			if (formatStarttime != formatendtime) {
				isSameDay = false
			}
			console.log(isSameDay)
			const elapsedMilliseconds = endtime - starttime;
			const elapsedMinutes = elapsedMilliseconds / (1000 * 60);
			// 向上取整，不满半小时也算半小时
			const halfHourUnits = Math.ceil(elapsedMinutes / 30);
			if (isOvernight) {
				// 过夜预约使用固定价格
				totalPrice = isPlay ? price.overNightPrice : (price.overNightPrice * 0.2);
				// 不玩机台按20%收费
			} else {
				//普通预约按游玩时间计算，先确认是否游玩机台
				if (isPlay) {
					// 普通预约按时间计费
					const baseRate = price.singlePrice;
					const calculatedPrice = halfHourUnits * baseRate;
					// 如果玩机台且超过封顶价格，使用封顶价格
					if (calculatedPrice > price.overNightPrice) {
						totalPrice = price.overNightPrice;
					} else {
						totalPrice = calculatedPrice;
					}
					//跨日逻辑
					if (!isSameDay && !isOvernight) {
						if (totalPrice != price.overNightPrice) {
							totalPrice += (price.overNightPrice - (4 * baseRate))
						} else {
							totalPrice += price.overNightPrice
						}
					}
				} else {
					const baseRate = 1; // 不玩机台每半小时1元
					const calculatedPrice = halfHourUnits * baseRate;
					totalPrice = calculatedPrice;
				}
			}
			//以分为单位
			totalPrice = totalPrice * 100
			console.log(totalPrice)

			//将最后得到的价格存入订单表,并且修改订单状态作为最终订单
			try {
				const result = await order.where({
					_id: orderID
				}).update({
					status: 0,
					endtime: endtime,
					total_fee: totalPrice,
				})
				return {
					errCode: 0, // 错误码
					errMsg: "", // 错误信息
				}
			} catch (e) {}
		}
	},

	SetFreePlayStatus: async function(uid, isPlay) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const order = dbJQL.collection('fishcave-orders')
		const membershipCollection = dbJQL.collection('membership');
		const subscriptionPackageCollection = dbJQL.collection('subscription-package');
		const [membership, subscriptionPackage] = await Promise.all([
			//是否为歇脚卡会员
			membershipCollection
			.where({
				userID: uid,
				status: true, // 只查询有效的会员
				validthru: dbJQL.command.gt(Date.now()) //并且会员到期时间大于当前时间，注意这里也要用 dbJQL.command
			})
			.get(),
			//是否为月卡周卡会员
			subscriptionPackageCollection
			.where({
				userID: uid,
				status: true, // 只查询有效的会员
				validthru: dbJQL.command.gt(Date.now()) //并且会员到期时间大于当前时间，注意这里也要用 dbJQL.command
			})
			.get(),
		])
		console.log(membership.data)
		console.log(subscriptionPackage.data)
		if (isPlay) {
			if (subscriptionPackage.data) {
				console.log('执行月卡会员免费游玩逻辑')
				return order.where({
					user_id: uid,
					status: -1,
				}).update({
					status: 1,
					total_fee: 0,
					endtime: Date.now()
				})
			} else {
				console.log('返回没有会员的提示信息')
				return {
					errCode: "PERMISSION_ERROR", // 错误码
					errMsg: "您不是月卡周卡会员", // 错误信息
				}
			}
		} else {
			if (membership.data || subscriptionPackage.data) {
				console.log('执行会员免费游玩逻辑')
				return order.where({
					user_id: uid,
					status: -1,
				}).update({
					status: 1,
					total_fee: 0,
					endtime: Date.now()
				})
			}
		}

	},

	GetUnhandleOrder: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const order = dbJQL.collection('fishcave-orders')
		return order.where({
			user_id: uid,
			status: -1
		}).limit(1).field({
			_id: true
		}).get()
	},
	
	GetHandleOrderByuid: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const order = dbJQL.collection('fishcave-orders')
		return order.where({
			user_id: uid,
			status: 0
		}).limit(1).field({
			_id: true
		}).get()
	},

	GetHandledOrder: async function(orderID) {
			const dbJQL = uniCloud.databaseForJQL({
				clientInfo: this.getClientInfo()
			})
			const order = dbJQL.collection('fishcave-orders')
			return order.where({
				_id: orderID
			}).limit(1).field({
				_id: true,
				total_fee: true,
				type: true, 
				description: true
			}).get()
		},

	GetUserOrderList: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const order = dbJQL.collection('fishcave-orders')
		return order.where({
			user_id: uid,
		}).limit(10).field({
			_id: true,
			status: true,
			reservation_id: true,
			starttime: true,
			total_fee: true,
			type: true
		}).get()
	},

	GennerateVipOrder: async function(uid, content) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const viporder = dbJQL.collection('fishcave-viporders')
		const orderData = await viporder.where({
			user_id: uid,
			status: -1
		}).get()
		if (orderData.data.length != 0) {
			const orderID = orderData.data[0]._id
			try {
				const result = await viporder.where({
					_id: orderID
				}).update({
					type: content.type
				})
			} catch (e) {}
		} else {
			try {
				const result = viporder.add(content)
			} catch (e) {}
		}
	},

	SearchVipOrder: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const viporder = dbJQL.collection('fishcave-viporders')
		return viporder.where({
			user_id: uid,
			status: -1
		}).field({
			_id: true
		}).get()
	},


	CalculateVipOder: async function(uid) {
		const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
			clientInfo: this.getClientInfo()
		})
		const viporder = dbJQL.collection('fishcave-viporders')
		const vippricelist = dbJQL.collection('prices_vip')
		const orderData = await viporder.where({
			user_id: uid,
			status: -1
		}).get()
		const orderID = orderData.data[0]._id
		const pricetype = orderData.data[0].type
		//查找价格并修改总价
		if (pricetype) {
			try {
				const result = await vippricelist.where({
					type: pricetype
				}).field({
					price: true
				}).get()
				const price = result.data[0].price
				const update = await viporder.where({
					_id: orderID
				}).update({
					total_fee: price
				})
				return {
					errCode: 0,
					errMsg: '',
				}
			} catch (e) {}
		} else {
			return {
				errCode: "VALIDATION_ERROR",
				errMsg: '未找到会员类型',
			}
		}
	},
	/**
	 * 创建一个自定义金额的补票订单
	 * @param {string} userId 用户ID
	 * @param {number} amountFen 支付金额 (分)
	 * @returns {object} 包含新订单ID的结果
	 */
	async createSettleOrder(userId, amountFen) {
	  const dbJQL = uniCloud.databaseForJQL({
	    clientInfo: this.getClientInfo()
	  });
	  const startTimeMillis = Date.now();
	  
	  // 简单的参数验证
	  if (!userId) {
	    return {
	      errCode: 400,
	      errMsg: '缺少用户ID'
	    };
	  }
	  if (typeof amountFen !== 'number' || amountFen <= 0) {
	     return {
	       errCode: 400,
	       errMsg: '无效的支付金额'
	     };
	  }
	
	  try {
	    // 创建新的订单记录
	    const result = await dbJQL.collection('fishcave-orders').add({
	      user_id: userId,
	      total_fee: amountFen,
	      status: 0, // 0: 待支付
	      // 移除 create_date: Date.now(), 让数据库根据 schema 自动设置
	      description: '补票支付', // 订单描述
	      type: 'settle', // 订单类型，用于区分普通预约订单
	      // 可以添加其他字段，例如关联的签到ID或预约ID，如果补票是针对特定记录的话
	      // signInId: null,
	      reservation_id: "0",
		  singlePrice: false,
		  starttime: startTimeMillis,
	    });
	
	    if (!result || !result.id) {
	      console.error("创建补票订单失败:", result);
	      return {
	        errCode: 500,
	        errMsg: '创建订单失败'
	      };
	    }
	
	    console.log("补票订单创建成功, ID:", result.id);
	    return {
	      errCode: 0,
	      id: result.id,
	      errMsg: '订单创建成功'
	    };
	
	  } catch (e) {
	    console.error("创建补票订单异常:", e);
	    return {
	      errCode: 500,
	      errMsg: '创建订单异常: ' + e.message
	    };
	  }
	},
}