# 当日累计预约计费优化方案

## 📋 问题分析

### 当前问题
用户在同一天进行分段预约时，现有计费策略会导致费用重复计算：

**示例场景：**
- 用户上午预约：3小时
- 用户下午预约：5小时  
- 总时长：8小时

**当前计费方式：**
- 上午：按3小时计费
- 下午：按5小时计费
- **总费用**：3小时费用 + 5小时费用

**问题**：超过5小时应该按整天计费，但分段预约导致用户多付费用

### 现有计费逻辑分析

根据代码分析，当前计费策略如下：

1. **普通用户**：
   - 基础价格：5元/单位时间
   - 过夜价格：50元/次

2. **会员用户**：
   - 包周/月卡：免费
   - 音游会员：4元/半小时，当日封顶40元

3. **计费时机**：
   - 在创建预约时独立计算每次费用
   - 没有考虑当日累计时长

## 🎯 解决方案设计

### 方案一：预约时智能合并计费（推荐）

#### 核心思路
在用户创建新预约时，自动检查当日已有预约，进行累计计费。

#### 实现步骤

1. **当日预约查询**
   ```javascript
   // 查询用户当天的所有有效预约
   async function getUserDayReservations(userId, targetDate) {
     const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
     const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
     
     return await db.collection('reservation-log').where({
       userId: userId,
       status: 1, // 有效预约
       startTime: dbCmd.gte(startOfDay),
       endTime: dbCmd.lte(endOfDay)
     }).get();
   }
   ```

2. **累计时长计算**
   ```javascript
   function calculateTotalDuration(existingReservations, newReservation) {
     const allReservations = [...existingReservations, newReservation];
     let totalMinutes = 0;
     
     // 合并重叠时间段并计算总时长
     const mergedRanges = mergeTimeRanges(allReservations);
     mergedRanges.forEach(range => {
       totalMinutes += (range.endTime - range.startTime) / (1000 * 60);
     });
     
     return totalMinutes / 60; // 返回小时数
   }
   ```

3. **智能计费逻辑**
   ```javascript
   function calculateSmartPrice(totalHours, userMembership, isOvernight) {
     if (isOvernight) {
       return 50; // 过夜固定价格
     }
     
     // 会员计费
     if (userMembership.hasPackage) {
       return 0; // 包周/月卡免费
     }
     
     if (userMembership.isMusicMember) {
       if (totalHours > 5) {
         return 40; // 超过5小时按封顶价
       }
       return Math.min(Math.ceil(totalHours * 2) * 4, 40);
     }
     
     // 普通用户计费
     if (totalHours > 5) {
       // 超过5小时按整天计费
       return calculateDailyPrice(totalHours);
     }
     
     // 未超过5小时按正常计费
     return calculateNormalPrice(totalHours);
   }
   ```

#### 优势
- ✅ 实时计算，用户立即看到优惠
- ✅ 避免后续退款处理
- ✅ 用户体验更好

#### 劣势
- ❌ 需要修改现有预约创建逻辑
- ❌ 增加预约创建时的计算复杂度

### 方案二：事后结算优化

#### 核心思路
保持现有预约创建逻辑，在结算时检查当日累计时长，进行费用调整。

#### 实现步骤

1. **结算时累计检查**
   ```javascript
   async function smartSettlement(signInId, userId, clientInfo) {
     // 1. 获取当日所有预约
     const dayReservations = await getUserDayReservations(userId, new Date());
     
     // 2. 计算累计时长
     const totalHours = calculateTotalDuration(dayReservations);
     
     // 3. 计算应付费用
     const shouldPayAmount = calculateSmartPrice(totalHours, userMembership);
     
     // 4. 计算已付费用
     const paidAmount = calculateTotalPaid(dayReservations);
     
     // 5. 处理差额（退款或补费）
     if (paidAmount > shouldPayAmount) {
       await processRefund(paidAmount - shouldPayAmount);
     }
     
     // 6. 完成结算
     await completeSettlement(signInId, shouldPayAmount);
   }
   ```

#### 优势
- ✅ 不影响现有预约流程
- ✅ 可以批量处理
- ✌️ 修改范围较小

#### 劣势
- ❌ 用户需要等待退款
- ❌ 涉及退款流程复杂
- ❌ 用户体验稍差

### 方案三：混合方案（最优）

#### 核心思路
结合方案一和方案二的优点，实现预测性计费 + 最终结算调整。

#### 实现架构

1. **预约创建时**
   - 显示预计费用（基于累计时长预测）
   - 按单次预约收费
   - 提示可能的费用优惠

2. **最终结算时**
   - 精确计算当日累计时长
   - 多退少补
   - 生成费用明细

## 💡 推荐实施方案

基于现有代码架构分析，**推荐方案一**（预约时智能合并计费），原因如下：

### 技术可行性高
- 现有的 `reservationService.addReservation` 函数已具备复杂的计费逻辑
- 会员判断逻辑已完整实现
- 数据库查询能力支持当日预约检查

### 用户体验最佳
- 实时显示优惠后的费用
- 避免复杂的退款流程
- 符合用户预期

### 实现成本适中
- 主要修改 `addReservation` 函数
- 需要新增时间段合并算法
- 不影响结算流程

## 📝 具体实现要点

### 1. 时间段合并算法
```javascript
function mergeTimeRanges(reservations) {
  // 按开始时间排序
  const sorted = reservations.sort((a, b) => a.startTime - b.startTime);
  const merged = [];
  
  for (const range of sorted) {
    if (merged.length === 0) {
      merged.push(range);
      continue;
    }
    
    const last = merged[merged.length - 1];
    if (range.startTime <= last.endTime) {
      // 重叠或连续，合并
      last.endTime = Math.max(last.endTime, range.endTime);
    } else {
      merged.push(range);
    }
  }
  
  return merged;
}
```

### 2. 数据库查询优化
- 为 `startTime` 和 `userId` 创建复合索引
- 使用 JQL 查询提高性能

### 3. 并发处理
- 添加乐观锁防止重复预约
- 使用事务确保数据一致性

### 4. 用户提示优化
- 在预约界面显示当日累计时长
- 明确标注费用优惠说明
- 提供费用计算明细

## 🔍 影响范围评估

### 需要修改的文件
1. `uniCloud-aliyun/cloudfunctions/todo/services/reservationService.js`
2. 前端预约页面（显示累计时长和费用说明）

### 数据库变更
- 无需结构变更
- 建议添加索引优化查询性能

### 测试范围
- 分段预约计费测试
- 会员计费测试
- 边界情况测试（跨天、重叠等）

## 🎯 预期效果

### 用户体验提升
- ✅ 费用更公平合理
- ✅ 实时看到优惠
- ✅ 透明化的计费规则

### 业务效益
- ✅ 提高用户满意度
- ✅ 减少费用争议
- ✅ 优化计费策略

---

**总结**：通过预约时智能合并计费方案，可以有效解决分段预约导致的重复计费问题，提升用户体验和系统公平性。该方案技术上可行，实现成本合理，推荐优先实施。