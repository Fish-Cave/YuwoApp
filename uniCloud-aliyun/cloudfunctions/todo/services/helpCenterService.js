// services/helpCenterService.js
const db = uniCloud.database();

// 引入工具模块
const authUtils = require('../utils/auth');

/**
 * @module helpCenterService
 * @description 帮助中心相关服务模块
 */
module.exports = {
  /**
   * 添加新的帮助文章 (仅限管理员)。
   * @param {object} articleData - 包含 title, content, category, sort_order 的文章数据。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果，成功时包含新文章的 ID。
   */
  async addArticle(articleData, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    const { title, content, category } = articleData;
    if (!title || !content || !category) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少标题、内容或分类' };
    }

    try {
      const collection = db.collection('help-articles');
      const res = await collection.add({
        ...articleData,
        create_time: Date.now(),
        update_time: Date.now()
      });
      return { errCode: 0, errMsg: '文章添加成功', id: res.id };
    } catch (e) {
      console.error("helpCenterService.addArticle error:", e);
      return { errCode: 'DB_ERROR', errMsg: '添加文章失败: ' + e.message };
    }
  },

  /**
   * 更新帮助文章 (仅限管理员)。
   * @param {string} articleId - 要更新的文章 ID。
   * @param {object} updateData - 包含要更新字段的对象。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async updateArticle(articleId, updateData, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!articleId || !updateData) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少文章ID或更新数据' };
    }

    try {
      const collection = db.collection('help-articles');
      const res = await collection.doc(articleId).update({
        ...updateData,
        update_time: Date.now()
      });
      if (res.updated === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要更新的文章或数据无变化' };
      }
      return { errCode: 0, errMsg: '文章更新成功', updated: res.updated };
    } catch (e) {
      console.error("helpCenterService.updateArticle error:", e);
      return { errCode: 'DB_ERROR', errMsg: '更新文章失败: ' + e.message };
    }
  },

  /**
   * 删除帮助文章 (仅限管理员)。
   * @param {string} articleId - 要删除的文章 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 操作结果。
   */
  async deleteArticle(articleId, clientInfo) {
    const authError = authUtils.checkAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!articleId) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少文章ID' };
    }

    try {
      const collection = db.collection('help-articles');
      const res = await collection.doc(articleId).remove();
      if (res.deleted === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到要删除的文章' };
      }
      return { errCode: 0, errMsg: '文章删除成功', deleted: res.deleted };
    } catch (e) {
      console.error("helpCenterService.deleteArticle error:", e);
      return { errCode: 'DB_ERROR', errMsg: '删除文章失败: ' + e.message };
    }
  },

  /**
   * 获取帮助文章列表 (对所有登录用户开放)。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含文章列表的查询结果。
   */
  async getArticleList(clientInfo) {
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    try {
      const collection = db.collection('help-articles');
      const res = await collection
        .field({ title: true, category: true, sort_order: true, _id: true })
        .orderBy('sort_order', 'asc')
        .orderBy('create_time', 'desc')
        .get();
      return { errCode: 0, data: res.data };
    } catch (e) {
      console.error("helpCenterService.getArticleList error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取文章列表失败: ' + e.message };
    }
  },

  /**
   * 获取单篇帮助文章的详细内容 (对所有登录用户开放)。
   * @param {string} articleId - 文章 ID。
   * @param {object} clientInfo - 客户端信息，用于权限验证。
   * @returns {Promise<object>} 包含文章详情的查询结果。
   */
  async getArticleDetail(articleId, clientInfo) {
    const authError = authUtils.checkUserOrAdminPermission(clientInfo);
    if (authError) {
      return authError;
    }

    if (!articleId) {
      return { errCode: 'PARAM_ERROR', errMsg: '缺少文章ID' };
    }

    try {
      const collection = db.collection('help-articles');
      const res = await collection.doc(articleId).get();
      if (!res.data || res.data.length === 0) {
        return { errCode: 'NOT_FOUND', errMsg: '未找到指定的文章' };
      }
      return { errCode: 0, data: res.data[0] };
    } catch (e) {
      console.error("helpCenterService.getArticleDetail error:", e);
      return { errCode: 'DB_ERROR', errMsg: '获取文章详情失败: ' + e.message };
    }
  }
};
