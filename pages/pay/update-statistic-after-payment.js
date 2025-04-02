// 在结账完成后更新用户统计
async function completeCheckout(signInId, reservationId, userId) {
  try {
    // 调用云函数进行结账并更新统计
    const cloudObject = uniCloud.importObject('todo');
    const result = await cloudObject.SignIn_Settle(signInId, reservationId, userId);
    
    // 结账成功后，可以获取最新的用户统计数据
    const userStats = await cloudObject.getUserStatistics(userId);
    
    // 显示用户的使用情况
    if (userStats.errCode === 0) {
      const stats = userStats.data;
      console.log(`使用次数: ${stats.total_sessions}`);
      console.log(`总时长: ${formatDuration(stats.total_duration)}`);
      console.log(`总消费: ${(stats.total_spending / 100).toFixed(2)}元`);
    }
    
    return result;
  } catch (e) {
    console.error("结账失败:", e);
    throw e;
  }
}