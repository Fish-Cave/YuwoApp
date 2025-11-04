'use strict';
const db = uniCloud.database()
const dbCmd = db.command
const $ = dbCmd.aggregate

// 权限检查函数
function checkAdminPermission(that) {
  try {
    const clientInfo = that.getClientInfo()
    if (!clientInfo || !clientInfo.uniIdToken) {
      return { errCode: 'PERMISSION_DENIED', errMsg: '用户未登录或无权访问' }
    }
    const tokenParts = clientInfo.uniIdToken.split('.')
    if (tokenParts.length !== 3) {
      return { errCode: 'INVALID_TOKEN', errMsg: '令牌格式无效' }
    }
    let payload
    try {
      const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')
      const jsonStr = Buffer.from(base64, 'base64').toString()
      payload = JSON.parse(jsonStr)
    } catch (e) {
      return { errCode: 'TOKEN_PARSE_ERROR', errMsg: '无法解析身份令牌: ' + e.message }
    }
    const role = payload.role
    let hasAdminRole = Array.isArray(role) ? role.includes('admin') : role === 'admin'
    if (!hasAdminRole) {
      return { errCode: 'PERMISSION_DENIED', errMsg: '只有管理员才能执行此操作' }
    }
    return null
  } catch (e) {
    return { errCode: 'PERMISSION_ERROR', errMsg: '权限检查失败: ' + e.message }
  }
}

const announcement = {
  /**
   * 创建公告
   * @param {Object} data - 公告数据
   * @param {string} data.title - 公告标题
   * @param {string} data.content - 公告内容（Markdown）
   * @param {Array} data.images - 图片数组（可选）
   * @param {boolean} data.isTop - 是否置顶
   * @param {boolean} data.status - 状态：1-发布，0-草稿
   * @returns {Object} 返回创建结果
   */
  async createAnnouncement(data) {
    try {
      // 检查管理员权限
      const permissionError = checkAdminPermission(this)
      if (permissionError) {
        return { code: -1, errMsg: permissionError.errMsg }
      }

      const clientInfo = this.getClientInfo()
      if (!clientInfo || !clientInfo.uid) {
        return { code: -1, errMsg: '无权访问' }
      }

      // 验证必需字段
      if (!data.title || !data.content) {
        return { code: -1, errMsg: '标题和内容不能为空' }
      }

      // 检查图片数量
      if (data.images && data.images.length > 9) {
        return { code: -1, errMsg: '图片数量不能超过9张' }
      }

      // 获取用户信息
      const userInfo = await db.collection('uni-id-users')
        .doc(clientInfo.uid)
        .field('nickname')
        .get()

      // 如果要置顶，先将其他公告设为非置顶
      if (data.isTop) {
        await db.collection('announcements')
          .where({
            isTop: true
          })
          .update({
            isTop: false
          })
      }

      // 创建公告
      const currentTime = Date.now()
      const announcementData = {
        title: data.title.trim(),
        content: data.content.trim(),
        publisher: clientInfo.uid,
        publisherName: userInfo.data?.nickname || '管理员',
        publishDate: currentTime,
        modifyDate: currentTime,
        status: data.status || 0,
        isTop: data.isTop || false,
        images: data.images || [],
        viewCount: 0
      }

      const result = await db.collection('announcements').add(announcementData)

      return {
        code: 0,
        data: { id: result.id, ...announcementData },
        message: '公告创建成功'
      }

    } catch (error) {
      console.error('创建公告失败:', error)
      return { code: -1, errMsg: '创建公告失败: ' + error.message }
    }
  },

  /**
   * 更新公告
   * @param {string} id - 公告ID
   * @param {Object} data - 更新的数据
   * @returns {Object} 返回更新结果
   */
  async updateAnnouncement(id, data) {
    try {
      // 检查管理员权限
      const permissionError = checkAdminPermission(this)
      if (permissionError) {
        return { code: -1, errMsg: permissionError.errMsg }
      }

      const clientInfo = this.getClientInfo()
      if (!clientInfo || !clientInfo.uid) {
        return { code: -1, errMsg: '无权访问' }
      }

      // 检查图片数量
      if (data.images && data.images.length > 9) {
        return { code: -1, errMsg: '图片数量不能超过9张' }
      }

      // 如果要置顶，先将其他公告设为非置顶
      if (data.isTop) {
        await db.collection('announcements')
          .where({
            isTop: true,
            _id: dbCmd.neq(id)
          })
          .update({
            isTop: false
          })
      }

      // 更新公告
      const updateData = {
        modifyDate: Date.now()
      }

      if (data.title !== undefined) updateData.title = data.title.trim()
      if (data.content !== undefined) updateData.content = data.content.trim()
      if (data.status !== undefined) updateData.status = data.status
      if (data.isTop !== undefined) updateData.isTop = data.isTop
      if (data.images !== undefined) updateData.images = data.images

      const result = await db.collection('announcements')
        .doc(id)
        .update(updateData)

      if (result.updated === 0) {
        return { code: -1, errMsg: '公告不存在' }
      }

      return {
        code: 0,
        message: '公告更新成功',
        updated: result.updated
      }

    } catch (error) {
      console.error('更新公告失败:', error)
      return { code: -1, errMsg: '更新公告失败: ' + error.message }
    }
  },

  /**
   * 删除公告
   * @param {string} id - 公告ID
   * @returns {Object} 返回删除结果
   */
  async deleteAnnouncement(id) {
    try {
      // 检查管理员权限
      const permissionError = checkAdminPermission(this)
      if (permissionError) {
        return { code: -1, errMsg: permissionError.errMsg }
      }

      const clientInfo = this.getClientInfo()
      if (!clientInfo || !clientInfo.uid) {
        return { code: -1, errMsg: '无权访问' }
      }

      // 获取公告信息，删除相关图片
      const announcement = await db.collection('announcements')
        .doc(id)
        .field('images')
        .get()

      if (announcement.data && announcement.data.images) {
        // 删除云存储中的图片
        for (const image of announcement.data.images) {
          try {
            if (image.url) {
              // 从URL中提取文件路径
              const url = new URL(image.url)
              const filePath = url.pathname
              await uniCloud.deleteFile({
                fileList: [filePath]
              })
            }
          } catch (err) {
            console.error('删除图片失败:', err)
          }
        }
      }

      const result = await db.collection('announcements')
        .doc(id)
        .remove()

      if (result.deleted === 0) {
        return { code: -1, errMsg: '公告不存在' }
      }

      return {
        code: 0,
        message: '公告删除成功',
        deleted: result.deleted
      }

    } catch (error) {
      console.error('删除公告失败:', error)
      return { code: -1, errMsg: '删除公告失败: ' + error.message }
    }
  },

  /**
   * 获取公告列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {number} params.status - 状态筛选：1-已发布，0-草稿，null-全部
   * @returns {Object} 返回公告列表
   */
  async getAnnouncementList(params = {}) {
    try {
      const {
        page = 1,
        pageSize = 10,
        status = 1, // 默认只获取已发布的公告
        keyword = null
      } = params

      let query = {}
      if (status !== null) {
        query.status = status
      }

      // 关键词搜索
      if (keyword && keyword.trim()) {
        const keywordRegex = new RegExp(keyword.trim(), 'i')
        query = dbCmd.and([
          query,
          dbCmd.or([
            { title: keywordRegex },
            { content: keywordRegex },
            { publisherName: keywordRegex }
          ])
        ])
      }

      // 获取总数
      const countResult = await db.collection('announcements')
        .where(query)
        .count()

      const total = countResult.total

      // 获取分页数据
      const listData = await db.collection('announcements')
        .where(query)
        .field({
          title: true,
          content: true,
          publisher: true,
          publisherName: true,
          publishDate: true,
          modifyDate: true,
          status: true,
          isTop: true,
          viewCount: true,
          images: true
        })
        .orderBy('isTop', 'desc') // 置顶优先
        .orderBy('publishDate', 'desc') // 按发布时间倒序
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()

      return {
        code: 0,
        data: listData.data || [],
        pagination: {
          current: page,
          pageSize: pageSize,
          total: total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page < Math.ceil(total / pageSize),
          hasPrev: page > 1
        }
      }

    } catch (error) {
      console.error('获取公告列表失败:', error)
      return { code: -1, errMsg: '获取公告列表失败: ' + error.message }
    }
  },

  /**
   * 获取公告详情
   * @param {string} id - 公告ID
   * @param {boolean} incrementView - 是否增加浏览次数
   * @returns {Object} 返回公告详情
   */
  async getAnnouncementDetail(id, incrementView = false) {
    try {
      let announcementData = await db.collection('announcements')
        .doc(id)
        .get()

      if (!announcementData.data) {
        return { code: -1, errMsg: '公告不存在' }
      }

      // 增加浏览次数
      if (incrementView) {
        await db.collection('announcements')
          .doc(id)
          .update({
            viewCount: dbCmd.inc(1)
          })

        // 重新获取数据以更新浏览次数
        announcementData = await db.collection('announcements')
          .doc(id)
          .get()
      }

      return {
        code: 0,
        data: announcementData.data
      }

    } catch (error) {
      console.error('获取公告详情失败:', error)
      return { code: -1, errMsg: '获取公告详情失败: ' + error.message }
    }
  },

  /**
   * 上传公告图片
   * @param {Object} file - 上传的文件信息
   * @returns {Object} 返回上传结果
   */
  async uploadAnnouncementImage(file) {
    try {
      // 检查管理员权限
      const permissionError = checkAdminPermission(this)
      if (permissionError) {
        return { code: -1, errMsg: permissionError.errMsg }
      }

      const clientInfo = this.getClientInfo()
      if (!clientInfo || !clientInfo.uid) {
        return { code: -1, errMsg: '无权访问' }
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.fileType)) {
        return { code: -1, errMsg: '只支持 JPG、PNG、GIF 格式的图片' }
      }

      // 检查文件大小（限制为5MB）
      const maxSize = 5 * 1024 * 1024
      if (file.fileSize > maxSize) {
        return { code: -1, errMsg: '图片大小不能超过5MB' }
      }

      // 上传到云存储
      const cloudPath = `announcements/${Date.now()}-${file.fileName}`
      const uploadResult = await uniCloud.uploadFile({
        cloudPath: cloudPath,
        fileContent: file.fileContent
      })

      if (!uploadResult.fileID) {
        return { code: -1, errMsg: '图片上传失败' }
      }

      // 获取云存储URL
      const urlResult = await uniCloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })

      if (!urlResult.fileList || urlResult.fileList.length === 0) {
        return { code: -1, errMsg: '获取图片URL失败' }
      }

      const imageUrl = urlResult.fileList[0].tempFileURL

      return {
        code: 0,
        data: {
          fileID: uploadResult.fileID,
          url: imageUrl,
          cloudPath: cloudPath,
          name: file.fileName,
          size: file.fileSize,
          uploadTime: Date.now()
        },
        message: '图片上传成功'
      }

    } catch (error) {
      console.error('上传图片失败:', error)
      return { code: -1, errMsg: '上传图片失败: ' + error.message }
    }
  },

  /**
   * 获取公告统计信息
   * @returns {Object} 返回统计结果
   */
  async getAnnouncementStats() {
    try {
      // 检查管理员权限
      const permissionError = checkAdminPermission(this)
      if (permissionError) {
        return { code: -1, errMsg: permissionError.errMsg }
      }

      const clientInfo = this.getClientInfo()
      if (!clientInfo || !clientInfo.uid) {
        return { code: -1, errMsg: '无权访问' }
      }

      const stats = await db.collection('announcements')
        .where({
          status: 1 // 只统计已发布的公告
        })
        .group()
        .groupField('status')
        .groupField('publishDate')
        .count('totalCount')
        .sum('viewCount', 'totalViews')
        .get()

      return {
        code: 0,
        data: stats.data || []
      }

    } catch (error) {
      console.error('获取公告统计失败:', error)
      return { code: -1, errMsg: '获取公告统计失败: ' + error.message }
    }
  }
}

module.exports = announcement