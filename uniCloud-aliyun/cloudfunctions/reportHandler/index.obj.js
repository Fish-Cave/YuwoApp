// reportHandler/index.obj.js
const db = uniCloud.database();
const dbCmd = db.command;
const dayjs = require('dayjs');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(isoWeek);

// 全局函数：检查管理员权限
// 建议将此函数抽离到 common/utils.js 中，并通过 require 引入
function checkAdminPermission(clientInfo) {
    try {
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

        return null; // 权限验证通过
    } catch (e) {
        console.error("权限验证过程中发生异常:", e);
        return { errCode: 'AUTH_ERROR', errMsg: '权限验证失败: ' + e.message };
    }
};

module.exports = {
  _before: function() {
    // 权限验证：所有报表相关方法都只允许管理员访问
    const authError = checkAdminPermission(this.getClientInfo());
    if (authError) {
      throw new Error(authError.errMsg); // 抛出错误，阻止后续方法执行
    }
  },
  
  /**
   * 获取指定时间范围内的预约报表分析数据
   * @param {Object} params 查询参数
   * @param {Date|Number} params.startDate 开始日期
   * @param {Date|Number} params.endDate 结束日期
   * @returns {Object} 报表数据
   */
  async getReservationReport(params) {
    const { startDate, endDate } = params;
    const startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();
    
    const dbJQL = uniCloud.databaseForJQL({
      clientInfo: this.getClientInfo()
    });
    
    // 查询时间范围内的所有预约记录
    const reservations = await dbJQL.collection('reservation-log')
      .where({
        startTime: dbJQL.command.gte(startTime),
        endTime: dbJQL.command.lte(endTime),
        // 只统计已确认、已签到、使用中、已结算的预约
        status: dbJQL.command.in([1, 2, 4, 5])
      })
      .field({
        machineId: true,
        machineName: true,
        startTime: true,
        endTime: true,
        isOvernight: true,
        isPlay: true,
        status: true,
        userId: true
      })
      .get();
      
    // 查询所有机台信息
    const machines = await dbJQL.collection('machines')
      .field({
        _id: true,
        name: true,
        type: true
      })
      .get();
      
    // 分析数据 - 使用 .call(this) 确保上下文
    const result = module.exports._analyzeReservationData.call(this, reservations.data, machines.data, startTime, endTime);
    
    return {
      errCode: 0,
      errMsg: '',
      data: result
    };
  },
  
  /**
   * 获取指定时间范围内的付费报表分析数据
   * @param {Object} params 查询参数
   * @param {Date|Number} params.startDate 开始日期
   * @param {Date|Number} params.endDate 结束日期
   * @returns {Object} 报表数据
   */
  async getPaymentReport(params) {
    const { startDate, endDate } = params;
    const startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();
    
    const dbJQL = uniCloud.databaseForJQL({
      clientInfo: this.getClientInfo()
    });
    
    // 查询时间范围内的所有已支付订单
    const orders = await dbJQL.collection('fishcave-orders')
      .where({
        create_date: dbJQL.command.gte(startTime),
        create_date: dbJQL.command.lte(endTime),
        status: 1 // 已支付
      })
      .field({
        _id: true,
        user_id: true,
        reservation_id: true,
        total_fee: true,
        singlePrice: true,
        overNightPrice: true,
        starttime: true,
        endtime: true,
        type: true,
        create_date: true
      })
      .get();
      
    // 查询与这些订单关联的签到记录
    const reservationIds = orders.data.map(order => order.reservation_id).filter(id => id); // 过滤掉空的 reservation_id
    const signins = await dbJQL.collection('signin')
      .where({
        reservationid: dbJQL.command.in(reservationIds)
      })
      .field({
        reservationid: true,
        isPlay: true,
        isOvernight: true,
        starttime: true,
        endtime: true,
        status: true
      })
      .get();
      
    // 分析数据 - 使用 .call(this) 确保上下文
    const result = module.exports._analyzePaymentData.call(this, orders.data, signins.data);
    
    return {
      errCode: 0,
      errMsg: '',
      data: result
    };
  },
  
  /**
   * 获取每周报表数据
   * @param {Object} params 查询参数
   * @param {Number} params.year 年份
   * @param {Number} params.week ISO周数 (1-53)
   * @returns {Object} 周报表数据
   */
  async getWeeklyReport(params) {
    const { year, week } = params;
    
    // 根据ISO周计算开始和结束日期
    const startDate = dayjs().year(year).isoWeek(week).startOf('isoWeek').valueOf();
    const endDate = dayjs().year(year).isoWeek(week).endOf('isoWeek').valueOf();
    
    // 获取预约数据 - 使用 .call(this) 确保上下文
    const reservationReport = await module.exports.getReservationReport.call(this, {
      startDate,
      endDate
    });
    
    // 获取付费数据 - 使用 .call(this) 确保上下文
    const paymentReport = await module.exports.getPaymentReport.call(this, {
      startDate,
      endDate
    });
    
    // 整合数据 - 使用 .call(this) 确保上下文
    const weeklyData = {
      timeRange: {
        startDate,
        endDate,
        weekNumber: week,
        year
      },
      reservationStats: reservationReport.data,
      paymentStats: paymentReport.data,
      // 按日期分组的数据
      dailyStats: module.exports._generateDailyStats.call(this, startDate, endDate, 
                                          reservationReport.data, 
                                          paymentReport.data)
    };
    
    return {
      errCode: 0,
      errMsg: '',
      data: weeklyData
    };
  },
  
  /**
   * 分析预约数据
   * @private
   */
  _analyzeReservationData(reservations, machines, startTime, endTime) {
    // 初始化结果对象
    const result = {
      totalReservations: reservations.length,
      totalPlayTime: 0, // 总游玩时长(分钟)
      machineStats: {}, // 按机台分组的统计
      hourlyDistribution: Array(24).fill(0), // 按小时分布
      overnightCount: 0, // 过夜人数
    };
    
    // 创建机台映射
    const machineMap = {};
    machines.forEach(machine => {
      machineMap[machine._id] = machine;
      
      // 初始化每台机器的统计数据
      result.machineStats[machine._id] = {
        machineId: machine._id,
        machineName: machine.name,
        machineType: machine.type,
        reservationCount: 0, // 预约次数
        totalPlayTime: 0, // 总游玩时长(分钟)
        avgPlayTime: 0, // 平均游玩时长
        overnightCount: 0, // 过夜次数
        hourlyDistribution: Array(24).fill(0) // 按小时分布
      };
    });
    
    // 分析每条预约记录
    reservations.forEach(reservation => {
      // 只统计真正游玩的预约
      if (!reservation.isPlay) return;
      
      const machineId = reservation.machineId;
      const machineStats = result.machineStats[machineId];
      
      if (!machineStats) return; // 跳过没有对应机台的记录
      
      // 计算游玩时长(分钟)
      const playTimeMinutes = Math.round((reservation.endTime - reservation.startTime) / (1000 * 60));
      
      // 更新机台统计
      machineStats.reservationCount++;
      machineStats.totalPlayTime += playTimeMinutes;
      
      // 更新总统计
      result.totalPlayTime += playTimeMinutes;
      
      // 统计过夜
      if (reservation.isOvernight) {
        machineStats.overnightCount++;
        result.overnightCount++;
      }
      
      // 按小时统计分布
      // 将预约时间划分为小时块
      const startHour = dayjs(reservation.startTime).hour();
      const endHour = dayjs(reservation.endTime).hour();
      
      // 如果开始和结束是同一小时
      if (startHour === endHour) {
        machineStats.hourlyDistribution[startHour]++;
        result.hourlyDistribution[startHour]++;
      } else {
        // 跨多个小时的情况
        for (let hour = startHour; hour <= endHour; hour++) {
          const actualHour = hour % 24; // 处理跨天的情况
          machineStats.hourlyDistribution[actualHour]++;
          result.hourlyDistribution[actualHour]++;
        }
      }
    });
    
    // 计算每台机器的平均游玩时长
    Object.values(result.machineStats).forEach(stats => {
      if (stats.reservationCount > 0) {
        stats.avgPlayTime = Math.round(stats.totalPlayTime / stats.reservationCount);
      }
    });
    
    // 计算总体平均游玩时长
    result.avgPlayTime = result.totalReservations > 0 
      ? Math.round(result.totalPlayTime / result.totalReservations) 
      : 0;
    
    return result;
  },
  
  /**
   * 分析付费数据
   * @private
   */
  _analyzePaymentData(orders, signins) {
    // 初始化结果对象
    const result = {
      totalOrders: orders.length,
      totalRevenue: 0, // 总收入(分)
      avgOrderAmount: 0, // 平均订单金额
      orderTypeDistribution: { // 按订单类型分布
        goods: 0, // 标准商品订单
        settle: 0, // 补票/结算订单
        other: 0 // 其他类型
      },
      dailyRevenue: {}, // 按日期分组的收入
      signinStats: { // 签到相关统计
        withPlay: 0, // 游玩机台的签到数
        withoutPlay: 0, // 不游玩机台的签到数
        overnight: 0 // 过夜签到数
      }
    };
    
    // 分析订单
    orders.forEach(order => {
      // 累计总收入
      result.totalRevenue += order.total_fee || 0;
      
      // 按订单类型统计
      if (order.type === 'goods') {
        result.orderTypeDistribution.goods++;
      } else if (order.type === 'settle') {
        result.orderTypeDistribution.settle++;
      } else {
        result.orderTypeDistribution.other++;
      }
      
      // 按日期统计收入
      const orderDate = dayjs(order.create_date).format('YYYY-MM-DD');
      if (!result.dailyRevenue[orderDate]) {
        result.dailyRevenue[orderDate] = 0;
      }
      result.dailyRevenue[orderDate] += order.total_fee || 0;
    });
    
    // 分析签到记录
    signins.forEach(signin => {
      if (signin.isPlay) {
        result.signinStats.withPlay++;
      } else {
        result.signinStats.withoutPlay++;
      }
      
      if (signin.isOvernight) {
        result.signinStats.overnight++;
      }
    });
    
    // 计算平均订单金额
    result.avgOrderAmount = result.totalOrders > 0 
      ? Math.round(result.totalRevenue / result.totalOrders) 
      : 0;
    
    return result;
  },
  
  /**
   * 生成按日期分组的统计数据
   * @private
   */
  _generateDailyStats(startDate, endDate, reservationStats, paymentStats) {
    const dailyStats = {};
    
    // 初始化日期范围内的每一天
    let currentDate = dayjs(startDate);
    const lastDate = dayjs(endDate);
    
    while (currentDate.isBefore(lastDate) || currentDate.isSame(lastDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      dailyStats[dateStr] = {
        date: dateStr,
        dayOfWeek: currentDate.day(), // 0-6, 0表示周日
        reservationCount: 0, // 预约数需要从 reservationStats 中提取
        revenue: (paymentStats.dailyRevenue[dateStr] || 0) / 100, // 转换为元
        playTimeMinutes: 0, // 游玩时长需要从 reservationStats 中提取
        overnightCount: 0 // 过夜数需要从 reservationStats 中提取
      };
      
      currentDate = currentDate.add(1, 'day');
    }
    
    // 填充预约相关的每日数据
    // 注意：reservationStats 并没有直接提供按日期的预约数、游玩时长和过夜数
    // 如果需要这些数据，需要修改 _analyzeReservationData 来生成 dailyReservationStats
    // 这里暂时只填充了收入，其他字段保持0或需要进一步处理
    
    return dailyStats;
  }, 
  
  /**
   * 获取机台使用热力图数据
   * @param {Object} params 查询参数
   * @param {Date|Number} params.startDate 开始日期
   * @param {Date|Number} params.endDate 结束日期
   * @returns {Object} 热力图数据
   */
  async getMachineHeatmapData(params) {
    const { startDate, endDate } = params;
    const startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();
    
    const dbJQL = uniCloud.databaseForJQL({
      clientInfo: this.getClientInfo()
    });
    
    // 查询时间范围内的所有预约记录
    const reservations = await dbJQL.collection('reservation-log')
      .where({
        startTime: dbJQL.command.gte(startTime),
        endTime: dbJQL.command.lte(endTime),
        status: dbJQL.command.in([1, 2, 4, 5]),
        isPlay: true // 只统计游玩的预约
      })
      .field({
        machineId: true,
        machineName: true,
        startTime: true,
        endTime: true
      })
      .get();
      
    // 查询所有机台
    const machines = await dbJQL.collection('machines')
      .field({
        _id: true,
        name: true
      })
      .get();
    
    // 创建热力图数据
    // 热力图是一个二维表格，行是机台，列是小时
    const heatmapData = {
      machines: machines.data.map(m => ({ id: m._id, name: m.name })),
      hours: Array.from({ length: 24 }, (_, i) => i), // 0-23小时
      data: [] // 将包含每个机台每小时的使用频率
    };
    
    // 初始化数据矩阵
    const dataMatrix = {};
    machines.data.forEach(machine => {
      dataMatrix[machine._id] = Array(24).fill(0);
    });
    
    // 填充数据
    reservations.data.forEach(reservation => {
      const startHour = dayjs(reservation.startTime).hour();
      const endHour = dayjs(reservation.endTime).hour();
      const machineId = reservation.machineId;
      
      if (!dataMatrix[machineId]) return;
      
      // 如果开始和结束是同一小时
      if (startHour === endHour) {
        dataMatrix[machineId][startHour]++;
      } else {
        // 跨多个小时的情况
        for (let hour = startHour; hour <= endHour; hour++) {
          const actualHour = hour % 24; // 处理跨天的情况
          dataMatrix[machineId][actualHour]++;
        }
      }
    });
    
    // 转换为热力图数据格式
    heatmapData.data = Object.entries(dataMatrix).map(([machineId, hourData]) => {
      const machine = machines.data.find(m => m._id === machineId);
      return {
        machineId,
        machineName: machine ? machine.name : machineId,
        hourData
      };
    });
    
    return {
      errCode: 0,
      errMsg: '',
      data: heatmapData
    };
  },
  
  /**
   * 获取用户行为分析数据
   * @param {Object} params 查询参数
   * @param {Date|Number} params.startDate 开始日期
   * @param {Date|Number} params.endDate 结束日期
   * @returns {Object} 用户分析数据
   */
  async getUserBehaviorAnalysis(params) {
    const { startDate, endDate } = params;
    const startTime = dayjs(startDate).startOf('day').valueOf();
    const endTime = dayjs(endDate).endOf('day').valueOf();
    
    const dbJQL = uniCloud.databaseForJQL({
      clientInfo: this.getClientInfo()
    });
    
    // 查询时间范围内的所有签到记录
    const signins = await dbJQL.collection('signin')
      .where({
        starttime: dbJQL.command.gte(startTime),
        endtime: dbJQL.command.lte(endTime)
      })
      .field({
        userid: true,
        isPlay: true,
        isOvernight: true,
        starttime: true,
        endtime: true,
        status: true
      })
      .get();
      
    // 查询这些用户的预约记录
    const userIds = [...new Set(signins.data.map(signin => signin.userid))];
    const reservations = await dbJQL.collection('reservation-log')
      .where({
        userId: dbJQL.command.in(userIds),
        startTime: dbJQL.command.gte(startTime),
        endTime: dbJQL.command.lte(endTime)
      })
      .field({
        userId: true,
        machineId: true,
        machineName: true,
        startTime: true,
        endTime: true,
        isPlay: true,
        isOvernight: true
      })
      .get();
      
    // 分析用户行为数据
    const userBehaviorData = {
      userCount: userIds.length,
      averagePlayTimePerUser: 0,
      userPreferences: {}, // 用户偏好的机台
      playPatterns: {
        morningCount: 0, // 6-12点
        afternoonCount: 0, // 12-18点
        eveningCount: 0, // 18-24点
        nightCount: 0 // 0-6点
      },
      overnightRatio: 0 // 过夜率
    };
    
    // 计算每个用户的游玩时长
    const userPlayTimes = {};
    signins.data.forEach(signin => {
      if (!signin.isPlay) return;
      
      const userId = signin.userid;
      const playTimeMinutes = Math.round((signin.endtime - signin.starttime) / (1000 * 60));
      
      if (!userPlayTimes[userId]) {
        userPlayTimes[userId] = 0;
      }
      userPlayTimes[userId] += playTimeMinutes;
      
      // 统计时段
      const hour = dayjs(signin.starttime).hour();
      if (hour >= 6 && hour < 12) {
        userBehaviorData.playPatterns.morningCount++;
      } else if (hour >= 12 && hour < 18) {
        userBehaviorData.playPatterns.afternoonCount++;
      } else if (hour >= 18 && hour < 24) {
        userBehaviorData.playPatterns.eveningCount++;
      } else {
        userBehaviorData.playPatterns.nightCount++;
      }
    });
    
    // 计算平均游玩时长
    const totalUsers = Object.keys(userPlayTimes).length;
    if (totalUsers > 0) {
      const totalPlayTime = Object.values(userPlayTimes).reduce((sum, time) => sum + time, 0);
      userBehaviorData.averagePlayTimePerUser = Math.round(totalPlayTime / totalUsers);
    }
    
    // 分析用户偏好
    const machinePreferences = {};
    reservations.data.forEach(reservation => {
      if (!reservation.isPlay) return;
      
      const machineId = reservation.machineId;
      const machineName = reservation.machineName;
      
      if (!machinePreferences[machineId]) {
        machinePreferences[machineId] = {
          machineId,
          machineName,
          count: 0
        };
      }
      machinePreferences[machineId].count++;
    });
    
    // 按使用次数排序
    userBehaviorData.userPreferences = Object.values(machinePreferences)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 取前5个最受欢迎的机台
    
    // 计算过夜率
    const overnightCount = signins.data.filter(signin => signin.isOvernight).length;
    userBehaviorData.overnightRatio = signins.data.length > 0 
      ? (overnightCount / signins.data.length).toFixed(2) 
      : 0;
    
    return {
      errCode: 0,
      errMsg: '',
      data: userBehaviorData
    };
  },

  /**
   * 导出报表数据为Excel
   * @param {Object} params 查询参数
   * @param {Date|Number} params.startDate 开始日期
   * @param {Date|Number} params.endDate 结束日期
   * @param {String} params.reportType 报表类型 ('reservation', 'payment', 'weekly')
   * @returns {Object} Excel文件的下载链接
   */
  async exportReportToExcel(params) {
    const { startDate, endDate, reportType } = params;
    
    // 根据报表类型获取数据 - 使用 .call(this) 确保上下文
    let reportData;
    
    if (reportType === 'weekly') {
      const year = dayjs(startDate).year();
      const week = dayjs(startDate).isoWeek();
      const result = await module.exports.getWeeklyReport.call(this, { year, week });
      reportData = result.data;
    } else if (reportType === 'reservation') {
      const result = await module.exports.getReservationReport.call(this, { startDate, endDate });
      reportData = result.data;
    } else if (reportType === 'payment') {
      const result = await module.exports.getPaymentReport.call(this, { startDate, endDate });
      reportData = result.data;
    } else {
      throw new Error('未知的报表类型');
    }
    
    // 使用xlsx库生成Excel文件
    // 注意：在 uniCloud 云函数中，需要安装 xlsx 依赖
    // npm install xlsx
    const XLSX = require('xlsx');
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 根据报表类型创建不同的工作表
    if (reportType === 'reservation' || reportType === 'weekly') {
      // 机台统计工作表
      const machineStats = Object.values(reportData.reservationStats.machineStats || {});
      const machineWorksheet = XLSX.utils.json_to_sheet(machineStats.map(machine => ({
        '机台名称': machine.machineName,
        '游玩人次': machine.reservationCount,
        '游玩总时长(分钟)': machine.totalPlayTime,
        '平均游玩时长(分钟)': machine.avgPlayTime,
        '过夜次数': machine.overnightCount
      })));
      XLSX.utils.book_append_sheet(workbook, machineWorksheet, '机台统计');
      
      // 小时分布工作表
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        hourlyData.push({
          '小时': `${i}:00-${i+1}:00`,
          '预约数': reportData.reservationStats.hourlyDistribution[i] || 0
        });
      }
      const hourlyWorksheet = XLSX.utils.json_to_sheet(hourlyData);
      XLSX.utils.book_append_sheet(workbook, hourlyWorksheet, '时段分布');
    }
    
    if (reportType === 'payment' || reportType === 'weekly') {
      // 收入统计工作表
      const paymentData = [
        { '指标': '总订单数', '值': reportData.paymentStats.totalOrders },
        { '指标': '总收入(元)', '值': (reportData.paymentStats.totalRevenue / 100).toFixed(2) },
        { '指标': '平均订单金额(元)', '值': (reportData.paymentStats.avgOrderAmount / 100).toFixed(2) },
        { '指标': '标准订单数', '值': reportData.paymentStats.orderTypeDistribution.goods },
        { '指标': '补票订单数', '值': reportData.paymentStats.orderTypeDistribution.settle }
      ];
      const paymentWorksheet = XLSX.utils.json_to_sheet(paymentData);
      XLSX.utils.book_append_sheet(workbook, paymentWorksheet, '收入统计');
      
      // 日收入工作表
      const dailyRevenueData = Object.entries(reportData.paymentStats.dailyRevenue || {}).map(([date, revenue]) => ({
        '日期': date,
        '收入(元)': (revenue / 100).toFixed(2)
      }));
      const dailyRevenueWorksheet = XLSX.utils.json_to_sheet(dailyRevenueData);
      XLSX.utils.book_append_sheet(workbook, dailyRevenueWorksheet, '日收入');
    }
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 上传到云存储
    const { fileID } = await uniCloud.uploadFile({
      cloudPath: `reports/${reportType}_${dayjs(startDate).format('YYYYMMDD')}_${dayjs(endDate).format('YYYYMMDD')}.xlsx`,
      fileContent: excelBuffer
    });
    
    // 获取临时下载链接
    const downloadUrl = await uniCloud.getTempFileURL({
      fileList: [fileID]
    });
    
    return {
      errCode: 0,
      errMsg: '',
      data: {
        fileID,
        downloadUrl: downloadUrl.fileList[0].tempFileURL
      }
    };
  }
};
