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
    async getUsersForAdmin({ searchQuery, page = 1, pageSize = 10, filterMembership = false, filterSubscription = false, roleFilter = 'all' }) {
        const usersCollection = db.collection('uni-id-users');
        const currentTime = Date.now();

        let initialMatchStage = {};
        if (searchQuery) {
            // 优化搜索：同时搜索昵称或ID
            initialMatchStage.$or = [
                { nickname: new RegExp(searchQuery, 'i') },
                { _id: new RegExp(searchQuery + '$', 'i') }
            ];
        }

        // 在初始匹配阶段加入角色筛选
        if (roleFilter && roleFilter !== 'all') {
            initialMatchStage.role = roleFilter;
        }

        // 构建过滤阶段的条件 (修复：检查有效会员)
        let filterExpressions = [];
        if (filterMembership) {
            // 筛选有效的歇脚卡用户：存在记录 && status为true && validthru > 当前时间
            filterExpressions.push(
                $.and([
                    $.gt([$.size('$membershipInfo'), 0]),
                    $.eq([$.arrayElemAt(['$membershipInfo.status', 0]), true]),
                    $.gt([$.arrayElemAt(['$membershipInfo.validthru', 0]), currentTime])
                ])
            );
        }
        if (filterSubscription) {
            // 筛选有效的月卡用户：存在记录 && status为true && validthru > 当前时间
            filterExpressions.push(
                $.and([
                    $.gt([$.size('$subscriptionPackageInfo'), 0]),
                    $.eq([$.arrayElemAt(['$subscriptionPackageInfo.status', 0]), true]),
                    $.gt([$.arrayElemAt(['$subscriptionPackageInfo.validthru', 0]), currentTime])
                ])
            );
        }

        let filterMatchStage = null;
        if (filterExpressions.length > 0) {
            filterMatchStage = {
                $match: {
                    $expr: filterExpressions.length === 1 ? filterExpressions[0] : $.and(filterExpressions)
                }
            };
        }

        // 1. 获取总数 (应用所有过滤条件)
        let countPipeline = usersCollection.aggregate()
            .match(initialMatchStage) // <-- 角色和搜索筛选在这里生效
            .lookup({ from: 'membership', localField: '_id', foreignField: 'userID', as: 'membershipInfo' })
            .lookup({ from: 'subscription-package', localField: '_id', foreignField: 'userID', as: 'subscriptionPackageInfo' });

        if (filterMatchStage) { // 应用会员/月卡筛选
            countPipeline = countPipeline.match(filterMatchStage.$match);
        }

        countPipeline = countPipeline.count('total');

        const totalRes = await countPipeline.end();
        const total = totalRes.data.length > 0 ? totalRes.data[0].total : 0;

        if (total === 0) {
            return { data: [], total: 0 };
        }

        // 2. 进行聚合查询，获取当页数据
        let dataPipeline = usersCollection.aggregate()
            .match(initialMatchStage) // <-- 角色和搜索筛选在这里生效
            .lookup({ from: 'membership', localField: '_id', foreignField: 'userID', as: 'membershipInfo' })
            .lookup({ from: 'subscription-package', localField: '_id', foreignField: 'userID', as: 'subscriptionPackageInfo' });

        if (filterMatchStage) { // 应用会员/月卡筛选
            dataPipeline = dataPipeline.match(filterMatchStage.$match);
        }

        dataPipeline = dataPipeline
            .skip((page - 1) * pageSize)
            .limit(pageSize)
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