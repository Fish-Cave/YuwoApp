const db = uniCloud.database();
module.exports = async (obj) => {
	let user_order_success = true;
	let {
		data = {}
	} = obj;
	let {
		order_no,
		out_trade_no,
		total_fee
	} = data; // uni-pay-orders 表内的数据均可获取到

	// 此处写你自己的支付成功逻辑开始-----------------------------------------------------------
	// 有三种方式
	// 方式一：直接写数据库操作
	// 方式二：使用 await uniCloud.callFunction 调用其他云函数
	// 方式三：使用 await uniCloud.httpclient.request 调用http接口地址
	// 此处写你自己的支付成功逻辑结束-----------------------------------------------------------
	//获取系统中的订单信息
	const db = uniCloud.database();
	let orderRes = await db.collection("fishcave-viporders").where({
		_id: order_no
	}).get();
	let orderInfo = orderRes.data[0];
	let type = orderInfo.type
	//比对此次支付金额是否与系统中订单金额一致
	if (orderInfo.total_fee == total_fee) {
		await db.collection("fishcave-viporders").where({
			_id: order_no
		}).update({
			status: 1
		})
		//处理鱼窝歇脚卡的情况
		if (type == "member") {
			let membershipRes = await db.collection("membership").where({
				userID: orderInfo.user_id
			}).get();
			if (membershipRes.data.length != 0) {
				//已经充值过鱼窝歇脚卡,本次充值为续费
				let updateMembership = await db.collection("membership").where({
					userID: orderInfo.user_id
				}).update({
					validthru: Date.now() + 2628000000,
					status: true
				})
			} else {
				//还未充值过鱼窝歇脚卡,本次充值为开通
				let updateMembership = await db.collection("membership").add({
					userID: orderInfo.user_id,
					validstart: Date.now(),
					validthru: Date.now() + 2628000000,
					status: true
				})
			}
		} else {
			//处理大月卡和大周卡的情况
			let subscriptionRes = await db.collection("subscription-package").where({
				userID: orderInfo.user_id
			}).get();
			if(subscriptionRes.data.length != 0){
				if(type == "monthly"){
					//月卡
					let updateSubscrip = await db.collection("subscription-package").where({
						userID: orderInfo.user_id
					}).update({
						validthru: Date.now() + 2628000000,
						status: true
					})
				}else{
					//周卡
					let updateSubscrip = await db.collection("subscription-package").where({
						userID: orderInfo.user_id
					}).update({
						validthru: Date.now() + 604800000,
						status: true
					})
				}
			}else{
				if(type == "monthly"){
					//月卡
					let updateSubscrip = await db.collection("subscription-package").add({
						userID: orderInfo.user_id,
						validstart: Date.now(),
						validthru: Date.now() + 2628000000,
						status: true
					})
				}else{
					//周卡
					let updateSubscrip = await db.collection("subscription-package").add({
						userID: orderInfo.user_id,
						validstart: Date.now(),
						validthru: Date.now() + 604800000,
						status: true
					})
				}
			}
		}
		user_order_success = true
	} else {
		await db.collection("fishcave-viporders").where({
			_id: order_no
		}).update({
			status: 2
		})
		user_order_success = false
	}

	// user_order_success =  true 代表你自己的逻辑处理成功 返回 false 代表你自己的处理逻辑失败。
	return user_order_success;
};