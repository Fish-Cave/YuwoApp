/**
 * utils/auth.js
 * 权限验证相关工具函数
 */

/**
 * 解析 uniIdToken 中的 payload
 * @param {string} uniIdToken 用户的 uniIdToken
 * @returns {object|null} 解析后的 payload 对象，或 null 如果解析失败
 */
function parseTokenPayload(uniIdToken) {
  if (!uniIdToken) {
    console.log("解析令牌失败: 未找到身份令牌");
    return null;
  }

  const tokenParts = uniIdToken.split('.');
  if (tokenParts.length !== 3) {
    console.log("解析令牌失败: 令牌格式无效");
    return null;
  }

  try {
    const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Buffer 是 Node.js 环境下的全局对象，uniCloud 云函数中可用
    const jsonStr = Buffer.from(base64, 'base64').toString();
    const payload = JSON.parse(jsonStr);
    return payload;
  } catch (e) {
    console.error("解析令牌失败:", e);
    return null;
  }
}

/**
 * 检查用户是否具有管理员权限
 * @param {object} clientInfo uniCloud 云函数上下文中的 clientInfo 对象
 * @returns {object|null} 如果没有权限返回错误对象，否则返回 null
 */
function checkAdminPermission(clientInfo) {
  try {
    if (!clientInfo || !clientInfo.uniIdToken) {
      console.log("权限检查失败: 未找到身份令牌");
      return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
    }

    const payload = parseTokenPayload(clientInfo.uniIdToken);
    if (!payload) {
      return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌' };
    }

    // Extract user info from token payload and add to clientInfo
    clientInfo.uid = payload.uid;
    clientInfo.role = payload.role;

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

    return null; // 权限验证通过
  } catch (e) {
    console.error("权限验证过程中发生异常:", e);
    return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
  }
}

/**
 * 检查用户是否为 'user' 或 'admin' 角色
 * @param {object} clientInfo uniCloud 云函数上下文中的 clientInfo 对象
 * @returns {object|null} 如果没有权限返回错误对象，否则返回 null
 */
function checkUserOrAdminPermission(clientInfo) {
  try {
    if (!clientInfo || !clientInfo.uniIdToken) {
      return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' };
    }

    const payload = parseTokenPayload(clientInfo.uniIdToken);
    if (!payload) {
      return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌' };
    }

    // Extract user info from token payload and add to clientInfo
    clientInfo.uid = payload.uid;
    clientInfo.role = payload.role;

    const role = payload.role;
    let hasRequiredRole = false;

    if (Array.isArray(role)) {
      hasRequiredRole = role.includes('user') || role.includes('admin');
    } else if (typeof role === 'string') {
      hasRequiredRole = role === 'user' || role === 'admin';
    }

    if (!hasRequiredRole) {
      return { errCode: 'PERMISSION_DENIED', errMsg: '无权访问此功能' };
    }

    return null; // 权限验证通过
  } catch (e) {
    console.error("权限验证过程中发生异常:", e);
    return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
  }
}

module.exports = {
  checkAdminPermission,
  checkUserOrAdminPermission,
  // 内部辅助函数，不直接导出给外部使用，但可以在模块内部共享
  _parseTokenPayload: parseTokenPayload
};