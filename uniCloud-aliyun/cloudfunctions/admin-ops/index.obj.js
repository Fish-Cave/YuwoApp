// uniCloud/cloudfunctions/admin-ops/index.obj.js

const db = uniCloud.database();
const dbCmd = db.command;
const $ = dbCmd.aggregate; // $ 现在只用于聚合操作符，如 $.size, $.gt, $.and 等

// 权限检查函数 (保持不变)
function checkAdminPermission(that) {
    try {
        const clientInfo = that.getClientInfo();
        if (!clientInfo || !clientInfo.uniIdToken) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
        }
        const tokenParts = clientInfo.uniIdToken.split('.');
        if (tokenParts.length !== 3) { return { errCode: 'INVALID_TOKEN', errMsg: '令牌格式无效' }; }
        let payload;
        try {
            const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = Buffer.from(base64, 'base64').toString();
            payload = JSON.parse(jsonStr);
        } catch (e) {
            return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌: ' + e.message };
        }
        const role = payload.role;
        let hasAdminRole = Array.isArray(role) ? role.includes('admin') : role === 'admin';
        if (!hasAdminRole) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '只有管理员才能执行此操作' };
        }
        return null;
    } catch (e) {
        return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
    }
}

module.exports = {
    _before: function() {
        const authError = checkAdminPermission(this);
        if (authError) {
            throw new Error(authError.errMsg);
        }
    },

    /**
     * 获取用户列表
     * @param {object} params
     * @param {string} params.searchQuery - 搜索关键词
     * @param {number} params.page - 当前页码
     * @param {number} params.pageSize - 每页数量
     * @param {boolean} params.filterMembership - 是否只显示有歇脚卡的用户
     * @param {boolean} params.filterSubscription - 是否只显示有月卡的用户
     * @returns {object} { data: Array, total: Number }
     */
    async getUsersForAdmin({ searchQuery, page = 1, pageSize = 10, filterMembership = false, filterSubscription = false }) {
        const usersCollection = db.collection('uni-id-users');

        let initialMatchStage = {};
        if (searchQuery) {
            initialMatchStage.nickname = new RegExp(searchQuery, 'i');
        }

        // 构建过滤阶段的条件 (使用聚合表达式)
        let filterExpressions = [];
        if (filterMembership) {
            // 过滤掉 membershipInfo 数组为空的用户: { $gt: [ { $size: '$membershipInfo' }, 0 ] }
            filterExpressions.push($.gt([ $.size('$membershipInfo'), 0 ]));
        }
        if (filterSubscription) {
            // 过滤掉 subscriptionPackageInfo 数组为空的用户: { $gt: [ { $size: '$subscriptionPackageInfo' }, 0 ] }
            filterExpressions.push($.gt([ $.size('$subscriptionPackageInfo'), 0 ]));
        }

        // 如果有过滤条件，构建一个 $match 阶段，使用 $expr 包含聚合表达式
        let filterMatchStage = null;
        if (filterExpressions.length > 0) {
             filterMatchStage = {
                 $match: {
                     $expr: filterExpressions.length === 1 ? filterExpressions[0] : $.and(filterExpressions)
                 }
             };
        }


        // 1. 获取总数 (需要应用所有过滤条件)
        // 使用聚合管道来获取应用过滤后的总数
        let countPipeline = usersCollection.aggregate()
             .match(initialMatchStage) // 应用搜索过滤
             .lookup({ from: 'membership', localField: '_id', foreignField: 'userID', as: 'membershipInfo' }) // 关联会员信息
             .lookup({ from: 'subscription-package', localField: '_id', foreignField: 'userID', as: 'subscriptionPackageInfo' }); // 关联月卡信息

        // 在 count 管道中应用过滤，这里继续使用 addFields + match 的方式，因为它在 count 之前更直观
        if (filterExpressions.length > 0) { // 使用 filterExpressions 来判断是否有过滤条件
             countPipeline = countPipeline.addFields({ // 添加临时字段用于过滤
                 _membershipInfoSize: { $size: '$membershipInfo' },
                 _subscriptionPackageInfoSize: { $size: '$subscriptionPackageInfo' }
            });

            let tempFilterConditions = [];
            if (filterMembership) {
                 tempFilterConditions.push({ _membershipInfoSize: dbCmd.gt(0) });
            }
            if (filterSubscription) {
                 tempFilterConditions.push({ _subscriptionPackageInfoSize: dbCmd.gt(0) });
            }

            countPipeline = countPipeline.match(tempFilterConditions.length === 1 ? tempFilterConditions[0] : { $and: tempFilterConditions });

            // 清理临时字段 (可选，但推荐)
            countPipeline = countPipeline.project({
                 _membershipInfoSize: 0,
                 _subscriptionPackageInfoSize: 0
            });
        }

        countPipeline = countPipeline.count('total'); // 计算总数

        const totalRes = await countPipeline.end();
        const total = totalRes.data.length > 0 ? totalRes.data[0].total : 0;


        if (total === 0) {
            return { data: [], total: 0 };
        }

        // 2. 进行聚合查询，获取当页数据 (应用所有过滤条件)
        let dataPipeline = usersCollection.aggregate()
            .match(initialMatchStage) // 应用搜索过滤
            .lookup({ from: 'membership', localField: '_id', foreignField: 'userID', as: 'membershipInfo' }) // 关联会员信息
            .lookup({ from: 'subscription-package', localField: '_id', foreignField: 'userID', as: 'subscriptionPackageInfo' }); // 关联月卡信息

        if (filterMatchStage) {
             // 直接使用 filterMatchStage 应用过滤
             dataPipeline = dataPipeline.match(filterMatchStage.$match); // <-- 这里是 { $match: { $expr: ... } }
        }

        dataPipeline = dataPipeline
            .skip((page - 1) * pageSize) // 跳过前面的页
            .limit(pageSize) // 获取当前页数量
            .project({
                username: 1,
                nickname: 1,
                role: 1,
                membership_expiry: $.arrayElemAt(['$membershipInfo.validthru', 0]),
                membership_status: $.arrayElemAt(['$membershipInfo.status', 0]),
                subscription_package_expiry: $.arrayElemAt(['$subscriptionPackageInfo.validthru', 0]),
                subscription_package_status: $.arrayElemAt(['$subscriptionPackageInfo.status', 0]),
            });

        const users = await dataPipeline.end();

        return { data: users.data, total: total };
    },

    // batchGrantMembership 方法保持不变
    async batchGrantMembership({ userIds, membershipType, durationInDays }) {
        if (!userIds || userIds.length === 0) throw new Error('未选择任何用户');
        if (!membershipType) throw new Error('未选择会员类型');
        if (!durationInDays || durationInDays <= 0) throw new Error('天数必须为正数');

        let collectionName;
        if (membershipType === 'membership') collectionName = 'membership';
        else if (membershipType === 'subscription-package') collectionName = 'subscription-package';
        else throw new Error('无效的会员类型');

        const collection = db.collection(collectionName);
        const now = Date.now();
        let successCount = 0;
        let failCount = 0;

        for (const userId of userIds) { // <-- 遍历用户ID
            try {
                const { data: [record] } = await collection.where({ userID: userId }).limit(1).get();

                let baseTime = (record && record.status === true && record.validthru > now) ? record.validthru : now;

                let expiryDate = new Date(baseTime);
                expiryDate.setDate(expiryDate.getDate() + durationInDays);
                expiryDate.setHours(23, 59, 59, 999);
                const newValidThru = expiryDate.getTime();

                if (record) {
                    await collection.doc(record._id).update({
                        status: true,
                        validthru: newValidThru,
                        updateTime: now
                    });
                } else {
                    await collection.add({
                        userID: userId,
                        status: true,
                        validstart: now,
                        validthru: newValidThru,
                        createTime: now,
                        updateTime: now
                    });
                }
                successCount++;
            } catch (e) {
                console.error(`为用户 ${userId} 操作失败:`, e);
                failCount++;
            }
        }
        return { errCode: 0, errMsg: `操作完成: ${successCount}个成功, ${failCount}个失败` };
    },

    // batchUpdateMembership 方法保持不变 
    async batchUpdateMembership({ userIds, membershipType, action, expiryTimestamp }) {
        console.log('batchUpdateMembership params:', { userIds, membershipType, action, expiryTimestamp }); // 添加日志
        if (!userIds || userIds.length === 0) throw new Error('未选择任何用户');
        if (!membershipType) throw new Error('未选择会员类型');
        if (action === 'setExpiry' && !expiryTimestamp) throw new Error('设置到期日时必须提供时间戳');

        let collectionName;
        if (membershipType === 'membership') collectionName = 'membership';
        else if (membershipType === 'subscription-package') collectionName = 'subscription-package';
        else throw new Error('无效的会员类型');

        const collection = db.collection(collectionName);
        const now = Date.now();
        let successCount = 0;
        let failCount = 0;

        for (const userId of userIds) { // <-- 遍历用户ID
            try {
                // 查询当前用户的会员记录
                const { data: [record] } = await collection.where({ userID: userId }).limit(1).get();
                console.log(`Processing user ${userId} for ${membershipType}, found record:`, record); // 添加日志

                let updateData = {};
                let addData = {
                    userID: userId,
                    createTime: now,
                    updateTime: now
                };

                if (action === 'cancel') {
                    if (!record) {
                        // 用户没有该会员记录，无需取消，跳过
                        console.log(`User ${userId} has no ${membershipType} record to cancel. Skipping.`);
                        continue; // 跳到下一个用户
                    }
                    // 如果有记录，设置状态为 false，到期日设为过去
                    updateData = {
                        status: false,
                        validthru: now - 1,
                        updateTime: now
                    };
                    // 执行更新
                    await collection.doc(record._id).update(updateData);
                    console.log(`Cancelled ${membershipType} for user ${userId}`);

                } else if (action === 'setExpiry') {
                    // 设置更新/新增的数据
                    updateData = {
                        status: expiryTimestamp > now, // 根据新的到期日判断状态
                        validthru: expiryTimestamp,
                        updateTime: now
                    };
                    addData = { // 新增记录的数据
                        ...addData, // 包含 userID, createTime, updateTime
                        status: expiryTimestamp > now,
                        validstart: now, // 新会员通常从当前时间开始
                        validthru: expiryTimestamp
                    };

                    if (record) {
                        // 如果有记录，执行更新
                        await collection.doc(record._id).update(updateData);
                        console.log(`Updated ${membershipType} expiry for user ${userId}`);
                    } else {
                        // 如果没有记录，执行新增
                        await collection.add(addData);
                        console.log(`Added new ${membershipType} record with expiry for user ${userId}`);
                    }
                } else {
                    // 无效操作类型，理论上前端已校验，这里作为兜底
                    console.warn(`Invalid action "${action}" for user ${userId}. Skipping.`);
                    continue; // 跳到下一个用户
                }

                successCount++; // 操作成功（更新或新增）

            } catch (e) {
                console.error(`为用户 ${userId} 操作失败 (${membershipType}, ${action}):`, e);
                failCount++;
            }
        }

        return { errCode: 0, errMsg: `操作完成: ${successCount}个成功, ${failCount}个失败` };
    },

    // promoteUser 方法保持不变
    async promoteUser({ userId }) {
        if (!userId) {
            throw new Error('缺少用户ID');
        }
        const usersCollection = db.collection('uni-id-users');
        const {
            data: [user]
        } = await usersCollection.doc(userId).field({
            'role': true
        }).get();
        if (!user) {
            return {
                errCode: 404,
                errMsg: '用户不存在'
            };
        }
        if (user.role.includes('user') || user.role.includes('admin')) {
             return {
                errCode: 1,
                errMsg: '用户已经是 User 或 Admin，无需提权'
            };
        }
        await usersCollection.doc(userId).update({
            role: ['user']
        });
        return {
            errCode: 0,
            errMsg: '用户权限提升成功！'
        };
    }
};
