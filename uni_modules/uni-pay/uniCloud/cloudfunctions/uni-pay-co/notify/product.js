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
	// 此处写你自己的支付成功逻辑结束-----------------------------------------------------------

	const db = uniCloud.database();
	try {
		// 获取商品订单信息
		let orderRes = await db.collection("product-orders").where({
			order_no: order_no
		}).get();

		if (orderRes.data.length === 0) {
			console.error("商品订单不存在:", order_no);
			return false;
		}

		let orderInfo = orderRes.data[0];

		// 比对此次支付金额是否与系统中订单金额一致
		if (orderInfo.total_fee !== total_fee) {
			console.error("支付金额不匹配:", { expected: orderInfo.total_fee, actual: total_fee });
			// 标记订单为异常状态
			await db.collection("product-orders").where({
				order_no: order_no
			}).update({
				status: 3, // 异常状态
				pay_time: new Date(),
				pay_order_no: out_trade_no
			});
			return false;
		}

		// 更新订单状态为已支付
		await db.collection("product-orders").where({
			order_no: order_no
		}).update({
			status: 1, // 已支付状态
			pay_time: new Date(),
			pay_order_no: out_trade_no
		});

		// 减少商品库存
		for (let item of orderInfo.items) {
			await db.collection("products").doc(item.productId).update({
				stock: db.command.inc(-item.quantity),
				sales: db.command.inc(item.quantity)
			});

			// 添加库存记录
			await db.collection("inventory-logs").add({
				productId: item.productId,
				type: 'out',
				quantity: item.quantity,
				beforeStock: item.stock || 0,
				afterStock: (item.stock || 0) - item.quantity,
				reason: '商品销售出库',
				operator: orderInfo.user_id,
				order_no: order_no,
				create_time: new Date(),
				note: `订单${order_no}商品销售`
			});
		}

		user_order_success = true;
		console.log("商品订单支付成功:", order_no);

	} catch (e) {
		console.error("商品订单支付处理失败:", e);
		user_order_success = false;
	}

	// user_order_success =  true 代表你自己的逻辑处理成功 返回 false 代表你自己的处理逻辑失败。
	return user_order_success;
};