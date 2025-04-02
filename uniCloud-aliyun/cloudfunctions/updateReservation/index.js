'use strict';
const db = uniCloud.database();
exports.main = async () => {
	try {
		const now = Date.now();
		const reservation = db.collection('reservation-log');
		await reservation
			.where({
				status: 1,
				endTime: db.command.lt(now)
			})
			.update({
				status: 3
			});
		console.log(now)
		console.log('订单状态更新完成');
		return {
			success: true,
			message: '订单状态更新完成'
		};
	} catch (e) {
		console.error('预约状态更新失败:', e);
		return {
			success: false,
			message: '预约状态更新失败: ' + e.message
		};
	}
};