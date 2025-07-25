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
	const db = uniCloud.database();
	let orderRes = await db.collection("fishcave-orders").where({
		_id: order_no
	}).get();
	let orderInfo = orderRes.data[0];
	//比对此次支付金额是否与系统中订单金额一致
	if (orderInfo.total_fee == total_fee) {
		await db.collection("fishcave-orders").where({
			_id: order_no
		}).update({
			status: 1
		})
		await db.collection("reservation-log").where({
			_id: orderInfo.reservation_id
		}).update({
			status: 2
		})
		await db.collection("signin").where({
			reservationid: orderInfo.reservation_id
		}).update({
			status: 1
		})
		user_order_success = true
	}else{
		await db.collection("fishcave-orders").where({
			_id: order_no
		}).update({
			status: 2
		})
		user_order_success = false
	}

	// user_order_success =  true 代表你自己的逻辑处理成功 返回 false 代表你自己的处理逻辑失败。
	return user_order_success;
};