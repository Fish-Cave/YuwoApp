// 新的云对象入口(index.obj.js)
// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

// 引入各个模块
const authUtils = require('./utils/auth');
const commonUtils = require('./utils/common');
const formatUtils = require('./utils/format');
const logUtils = require('./utils/log');

const machineService = require('./services/machineService');
const priceService = require('./services/priceService');
const reservationService = require('./services/reservationService');
const orderService = require('./services/orderService');
const userService = require('./services/userService');
const statisticsService = require('./services/statisticsService');
const helpCenterService = require('./services/helpCenterService');
const connectCodeService = require('./services/connectCodeService');

module.exports = {
  _before: function() {
    // 通用预处理器
  },
  
  // 权限检查方法 - 可以保留在入口，也可以移到 auth.js 中
  _checkAdminPermission() {
    return authUtils.checkAdminPermission(this.getClientInfo());
  },
  
  // 机台相关 API
  Machines_Add: machineService.addMachine,
  Machines_List: machineService.listMachines,
  GetMachinesInfo: machineService.getMachineInfo,
  Machines_Update: machineService.updateMachine,
  GetMachineDetail: machineService.getMachineDetail,
  GetMachineReservationInfo: machineService.getMachineReservationInfo,
  
  // 价格相关 API
  Prices_Add: priceService.addPrice,
  Prices_List: priceService.listPrices,
  GetPriceInfoByRole: priceService.getPriceInfoByRole,
  GetPriceInfoByWeekdays: priceService.getPriceInfoByWeekdays,
  Prices_Update: priceService.updatePrice,
  GetPriceDetail: priceService.getPriceDetail,
  GetVipPrices: priceService.getVipPrices,
  GetVipPriceDetail: priceService.getVipPriceDetail,
  VipPrices_Update: priceService.updateVipPrice,
  AddVipPrices: priceService.addVipPrices,
  
  // 预约相关 API
  Reservation_Add: reservationService.addReservation,
  Reservation_Update: reservationService.updateReservation,
  GetReservationInfo: reservationService.getReservationInfo,
  SearchReservationInfo: reservationService.searchReservationInfo,
  
  // 签到相关 API
  SignIn_Add: reservationService.addSignIn,
  SignIn_Search: reservationService.searchSignIn,
  SignIn_Settle: reservationService.settleSignIn,
  
  // 订单相关 API
  Order_Add: orderService.addOrder,
  Order_Get: orderService.getOrder,
  Get_fishOrderList: orderService.getFishOrderList,
  GetOrderInfo: orderService.getOrderInfo,
  Get_FilteredOrders: orderService.getFilteredOrders,
  GetOrderDetail: orderService.getOrderDetail,
  UpdateOrder: orderService.updateOrder,
  GetOrderEditLogs: orderService.getOrderEditLogs,
  Get_OrdersCount: orderService.getOrdersCount,
  createSettleOrder: orderService.createSettleOrder,
  
  // 用户相关 API
  GetUserInfo: userService.getUserInfo,
  getUserMembershipInfo: userService.getUserMembershipInfo,
  Loved_Update: userService.updateLoved,
  Loved_Query: userService.queryLoved,
  getPreUsers: userService.getPreUsers,
  promoteUserRole: userService.promoteUserRole,
  HowManyPlayer: userService.howManyPlayer,
  
  // 用户统计相关 API
  updateUserStatistics: statisticsService.updateUserStatistics,
  getUserStatistics: statisticsService.getUserStatistics,
  rebuildAllUserStatistics: statisticsService.rebuildAllUserStatistics,
  getUserRankings: statisticsService.getUserRankings,
  getUserMonthlyReport: statisticsService.getUserMonthlyReport,
  
  // 帮助中心相关 API
  HelpCenter_List: helpCenterService.listHelpCenter,
  HelpCenter_Get: helpCenterService.getHelpCenter,
  HelpCenter_Add: helpCenterService.addHelpCenter,
  HelpCenter_Update: helpCenterService.updateHelpCenter,
  HelpCenter_Delete: helpCenterService.deleteHelpCenter,
  
  // 连接码相关 API
  generateConnectCode: connectCodeService.generateConnectCode,
  getConnectCode: connectCodeService.getConnectCode,
  verifyConnectCode: connectCodeService.verifyConnectCode,
  
  // 客服电话相关 API
  updateCustomerServicePhone: userService.updateCustomerServicePhone,
  getCustomerServicePhone: userService.getCustomerServicePhone,
  
  // 数据清理（谨慎使用）
  Delete: function(content, statusnumber) {
    // 建议将此功能单独隔离，并添加额外的安全检查
    return orderService.deleteAll(content, statusnumber, this.getClientInfo());
  }
};
