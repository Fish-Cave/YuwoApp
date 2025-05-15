'use strict';
exports.main = async () => {
	const dbJQL = uniCloud.databaseForJQL({ // 获取JQL database引用，此处需要传入云对象的clientInfo
		clientInfo: this.getClientInfo()
	})
	const db = uniCloud.database();
	const order = db.collection('fishcave-orders')
	const signin = db.collection('signin')
	const reservation = db.collection('reservation-log')
	//将状态为-1(待确认)付费订单状态修改为0(待支付)
	await order.where({
		status : -1
	}).update({
		status : 0
	})
	//将状态为4(使用中)预约订单状态修改为5(使用完成)
	await reservation.where({
		status : 4
	}).update({
		status : 5
	})
	//将状态为0(使用中)预约订单状态修改为2(已结束待支付)
	await signin.where({
		status : 0
	}).update({
		status : 2
	})
};
