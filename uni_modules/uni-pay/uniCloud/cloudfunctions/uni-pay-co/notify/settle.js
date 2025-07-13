const db = uniCloud.database();

module.exports = async (obj) => {
	let user_order_success = false; // 默认失败
	let {
		data = {}
	} = obj;
	let {
		order_no,
		out_trade_no,
		total_fee
	} = data;

	try {
		// 1. 根据订单号查询系统中的订单
		const orderRes = await db.collection("fishcave-orders").doc(order_no).get();

		if (!orderRes.data || orderRes.data.length === 0) {
			console.error(`补票回调：未找到订单 ${order_no}`);
			return false;
		}

		const orderInfo = orderRes.data[0];

		// 2. 校验订单金额是否一致
		if (orderInfo.total_fee !== total_fee) {
			console.error(`补票回调：订单 ${order_no} 金额不匹配。系统金额: ${orderInfo.total_fee}, 支付金额: ${total_fee}`);
			// 金额不匹配，可以将订单标记为异常
			await db.collection("fishcave-orders").doc(order_no).update({
				status: 2, // 2: 支付异常/未完成
				remark: `支付金额不匹配，系统金额: ${orderInfo.total_fee}, 支付金额: ${total_fee}`
			});
			return false;
		}

		// 3. 更新订单状态为已完成
		await db.collection("fishcave-orders").doc(order_no).update({
			status: 1, // 1: 已完成/已支付
			pay_time: Date.now(), // 记录支付时间
			out_trade_no: out_trade_no // 记录微信/支付宝的交易号
		});

		console.log(`补票订单 ${order_no} 支付成功`);
		user_order_success = true;

	} catch (e) {
		console.error(`补票回调处理异常: ${e.message}`);
		user_order_success = false;
	}

	// user_order_success = true 代表你自己的逻辑处理成功
	return user_order_success;
};
