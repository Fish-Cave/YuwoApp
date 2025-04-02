'use strict';
const db = uniCloud.database();
exports.main = async () => {
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
		console.log(now);
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
};