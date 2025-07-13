// uniCloud/cloudfunctions/admin-ops/index.obj.js

const db = uniCloud.database();
const dbCmd = db.command;

// 独立的权限检查函数 (保持不变)
function checkAdminPermission(that) {
    // ... (代码与之前提供的完全一致)
    try {
        const clientInfo = that.getClientInfo();
        if (!clientInfo || !clientInfo.uniIdToken) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
        }
        const tokenParts = clientInfo.uniIdToken.split('.');
        if (tokenParts.length !== 3) {
            return { errCode: 'INVALID_TOKEN', errMsg: '令牌格式无效' };
        }
        let payload;
        try {
            const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = Buffer.from(base64, 'base64').toString();
            payload = JSON.parse(jsonStr);
        } catch (e) {
            console.error("解析令牌失败:", e);
            return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌: ' + e.message };
        }
        const role = payload.role;
        let hasAdminRole = false;
        if (Array.isArray(role)) {
            hasAdminRole = role.includes('admin');
        } else if (typeof role === 'string') {
            hasAdminRole = role === 'admin';
        }
        if (!hasAdminRole) {
            return { errCode: 'PERMISSION_DENIED', errMsg: '只有管理员才能执行此操作' };
        }
        return null;
    } catch (e) {
        console.error("权限验证过程中发生异常:", e);
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
     * 获取用户列表（用于前端选择器）
     */
    async getUsersForAdmin() {
        const users = await db.collection('uni-id-users')
            .field({
                'username': true,
                'nickname': true,
                'role': true,
                '_id': true
            })
            .limit(500)
            .get();
        return users.data;
    },

    /**
     * 计算预计会员到期时间 (不进行数据库操作)
     */
    async calculateMembershipExpiry({ userId, membershipType, durationInDays }) {
         // ... (代码与之前提供的完全一致)
        if (!userId || !membershipType || !durationInDays) {
            throw new Error('缺少必要参数 (用户ID, 会员类型, 天数)');
        }
        if (durationInDays <= 0) {
            throw new Error('天数必须为正数');
        }
        let collectionName;
        if (membershipType === 'membership') {
            collectionName = 'membership';
        } else if (membershipType === 'subscription-package') {
            collectionName = 'subscription-package';
        } else {
            throw new Error('无效的会员类型');
        }
        const collection = db.collection(collectionName);
        const now = Date.now();
        const {
            data: existingRecords
        } = await collection.where({
            userID: userId
        }).limit(1).get();
        let baseTime;
        if (existingRecords.length > 0) {
            const record = existingRecords[0];
            baseTime = (record.status === true && record.validthru > now) ? record.validthru : now;
        } else {
            baseTime = now;
        }
        let expiryDate = new Date(baseTime);
        expiryDate.setDate(expiryDate.getDate() + durationInDays);
        expiryDate.setHours(23, 59, 59, 999);
        const newValidThru = expiryDate.getTime();
        return {
            errCode: 0,
            data: {
                newValidThru: newValidThru
            }
        };
    },


    /**
     * 为指定用户发放会员
     */
    async grantMembership({
        userId,
        membershipType,
        durationInDays
    }) {
        // ... (代码与之前提供的完全一致)
        if (!userId || !membershipType || !durationInDays) {
            throw new Error('缺少必要参数 (用户ID, 会员类型, 天数)');
        }
        if (durationInDays <= 0) {
            throw new Error('天数必须为正数');
        }
        let collectionName;
        if (membershipType === 'membership') {
            collectionName = 'membership';
        } else if (membershipType === 'subscription-package') {
            collectionName = 'subscription-package';
        } else {
            throw new Error('无效的会员类型');
        }
        const collection = db.collection(collectionName);
        const now = Date.now();
        const {
            data: existingRecords
        } = await collection.where({
            userID: userId
        }).limit(1).get();
        let baseTime;
        if (existingRecords.length > 0) {
            const record = existingRecords[0];
            let newValidThru;
            baseTime = (record.status === true && record.validthru > now) ? record.validthru : now;
            let expiryDate = new Date(baseTime);
            expiryDate.setDate(expiryDate.getDate() + durationInDays);
            expiryDate.setHours(23, 59, 59, 999);
            newValidThru = expiryDate.getTime();
            await collection.doc(record._id).update({
                status: true,
                validthru: newValidThru,
                updateTime: now
            });
            return {
                errCode: 0,
                errMsg: '会员续期成功！'
            };
        } else {
            baseTime = now;
            let expiryDate = new Date(baseTime);
            expiryDate.setDate(expiryDate.getDate() + durationInDays);
            expiryDate.setHours(23, 59, 59, 999);
            const newValidThru = expiryDate.getTime();
            await collection.add({
                userID: userId,
                status: true,
                validstart: now,
                validthru: newValidThru,
                createTime: now,
                updateTime: now
            });
            return {
                errCode: 0,
                errMsg: '会员发放成功！'
            };
        }
    },

    /**
     * 获取指定用户的会员状态
     * @param {object} params
     * @param {string} params.userId - 要查询的用户ID
     * @returns {object} 包含用户的会员记录 { membership: [], subscriptionPackage: [] }
     */
    async getUserMembershipStatus({ userId }) {
         // _before 方法已经确保了调用者是管理员
        if (!userId) {
            throw new Error('缺少用户ID');
        }

        // 查询歇脚卡会员记录
        const membershipRecords = await db.collection('membership')
            .where({ userID: userId })
            .limit(1) // 假设一个用户只有一条记录
            .get();

        // 查询月卡会员记录
        const subscriptionPackageRecords = await db.collection('subscription-package')
            .where({ userID: userId })
            .limit(1) // 假设一个用户只有一条记录
            .get();

        return {
            errCode: 0,
            data: {
                membership: membershipRecords.data,
                subscriptionPackage: subscriptionPackageRecords.data
            }
        };
    },


    /**
     * 提升用户权限 (preUser -> user)
     */
    async promoteUser({
        userId
    }) {
        // ... (代码与之前提供的完全一致)
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
