<template>
  <view class="test-container">
    <view class="test-header">
      <text class="test-title">后端功能测试面板</text>
      <text class="test-subtitle">Comprehensive Backend Testing Suite</text>
    </view>

    <!-- 测试分类选项卡 -->
    <view class="test-tabs">
      <view
        v-for="(category, index) in testCategories"
        :key="index"
        class="tab-item"
        :class="{ active: activeCategory === index }"
        @click="switchCategory(index)"
      >
        <text>{{ category.name }}</text>
      </view>
    </view>

    <!-- 测试控制面板 -->
    <view class="control-panel">
      <view class="control-group">
        <button
          class="control-btn run-all"
          @click="runAllTests"
          :disabled="isRunning"
        >
          {{ isRunning ? '测试中...' : '运行所有测试' }}
        </button>
        <button
          class="control-btn clear-results"
          @click="clearResults"
        >
          清空结果
        </button>
        <button
          class="control-btn export-results"
          @click="exportResults"
          :disabled="testResults.length === 0"
        >
          导出报告
        </button>
      </view>

      <!-- 测试配置 -->
      <view class="config-section">
        <view class="config-item">
          <text class="config-label">测试用户ID:</text>
          <input
            v-model="testConfig.userId"
            class="config-input"
            placeholder="输入测试用户ID"
          />
        </view>
        <view class="config-item">
          <text class="config-label">并发测试数:</text>
          <input
            v-model.number="testConfig.concurrency"
            type="number"
            class="config-input"
            min="1"
            max="10"
          />
        </view>
        <view class="config-item">
          <text class="config-label">超时时间(ms):</text>
          <input
            v-model.number="testConfig.timeout"
            type="number"
            class="config-input"
            min="1000"
            max="30000"
          />
        </view>
      </view>
    </view>

    <!-- 测试统计 -->
    <view class="stats-panel">
      <view class="stat-item">
        <text class="stat-value total">{{ totalTests }}</text>
        <text class="stat-label">总测试数</text>
      </view>
      <view class="stat-item">
        <text class="stat-value passed">{{ passedTests }}</text>
        <text class="stat-label">通过</text>
      </view>
      <view class="stat-item">
        <text class="stat-value failed">{{ failedTests }}</text>
        <text class="stat-label">失败</text>
      </view>
      <view class="stat-item">
        <text class="stat-value duration">{{ totalDuration }}ms</text>
        <text class="stat-label">总耗时</text>
      </view>
    </view>

    <!-- 测试列表 -->
    <scroll-view class="test-list" scroll-y>
      <view
        v-for="(test, index) in currentTests"
        :key="index"
        class="test-item"
        :class="{
          'running': test.status === 'running',
          'passed': test.status === 'passed',
          'failed': test.status === 'failed',
          'pending': test.status === 'pending'
        }"
      >
        <view class="test-header" @click="toggleTestDetail(index)">
          <view class="test-info">
            <text class="test-name">{{ test.name }}</text>
            <text class="test-description">{{ test.description }}</text>
          </view>
          <view class="test-status">
            <text v-if="test.status === 'pending'" class="status-pending">待执行</text>
            <text v-if="test.status === 'running'" class="status-running">执行中...</text>
            <text v-if="test.status === 'passed'" class="status-passed">✓ 通过</text>
            <text v-if="test.status === 'failed'" class="status-failed">✗ 失败</text>
            <text class="test-duration">{{ test.duration || '-' }}ms</text>
          </view>
        </view>

        <!-- 测试详情 -->
        <view v-if="test.showDetail" class="test-detail">
          <view class="test-params">
            <text class="detail-title">测试参数:</text>
            <text class="param-content">{{ JSON.stringify(test.params, null, 2) }}</text>
          </view>
          <view v-if="test.response" class="test-response">
            <text class="detail-title">响应结果:</text>
            <text class="response-content">{{ JSON.stringify(test.response, null, 2) }}</text>
          </view>
          <view v-if="test.error" class="test-error">
            <text class="detail-title">错误信息:</text>
            <text class="error-content">{{ test.error }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 实时日志 -->
    <view class="log-panel">
      <view class="log-header">
        <text class="log-title">实时测试日志</text>
        <button class="log-clear" @click="clearLogs">清空</button>
      </view>
      <scroll-view class="log-content" scroll-y>
        <view
          v-for="(log, index) in testLogs"
          :key="index"
          class="log-item"
          :class="log.level"
        >
          <text class="log-time">{{ formatTime(log.timestamp) }}</text>
          <text class="log-level">{{ log.level.toUpperCase() }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activeCategory: 0,
      isRunning: false,
      testConfig: {
        userId: '',
        concurrency: 3,
        timeout: 10000
      },
      testResults: [],
      testLogs: [],

      testCategories: [
        {
          name: '用户管理',
          key: 'user',
          tests: [
            {
              name: '用户统计信息',
              description: '获取用户总数、活跃用户、VIP用户等统计信息',
              function: 'Get_UserStats',
              params: {},
              validate: (result) => result.code === 0 && result.data
            },
            {
              name: '用户搜索 - 关键词',
              description: '通过用户名搜索用户',
              function: 'Get_FilteredUsers',
              params: { keyword: 'test', pageNumber: 1, pageSize: 10 },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            },
            {
              name: '用户搜索 - 会员筛选',
              description: '筛选VIP会员用户',
              function: 'Get_FilteredUsers',
              params: { userType: 'vip', pageNumber: 1, pageSize: 10 },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            },
            {
              name: '用户搜索 - 日期范围',
              description: '按注册日期范围搜索用户',
              function: 'Get_FilteredUsers',
              params: {
                registerStartDate: '2024-01-01',
                registerEndDate: '2024-12-31',
                pageNumber: 1,
                pageSize: 10
              },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            }
          ]
        },
        {
          name: '订单管理',
          key: 'order',
          tests: [
            {
              name: '订单统计',
              description: '获取订单统计数据',
              function: 'Get_OrdersCount',
              params: {},
              validate: (result) => result.code === 0 && typeof result.total === 'number'
            },
            {
              name: '订单搜索',
              description: '搜索和筛选订单',
              function: 'Get_FilteredOrders',
              params: { pageNumber: 1, pageSize: 10 },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            },
            {
              name: '订单详情',
              description: '获取特定订单的详细信息',
              function: 'GetOrderDetail',
              params: { orderId: 'test_order_id' },
              validate: (result) => result.code === 0 && result.data
            }
          ]
        },
        {
          name: '预约管理',
          key: 'reservation',
          tests: [
            {
              name: '预约信息查询',
              description: '获取用户预约信息',
              function: 'GetReservationInfo',
              params: { userId: 'test_user_id' },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            },
            {
              name: '预约搜索',
              description: '搜索特定预约',
              function: 'SearchReservationInfo',
              params: { reservationId: 'test_reservation_id' },
              validate: (result) => result.code === 0 && result.data
            }
          ]
        },
        {
          name: '签到管理',
          key: 'signin',
          tests: [
            {
              name: '签到记录搜索',
              description: '搜索活跃的签到记录',
              function: 'SignIn_Search',
              params: { status: 'active' },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            }
          ]
        },
        {
          name: '报表生成',
          key: 'report',
          tests: [
            {
              name: '预约统计报表',
              description: '生成预约分析报表',
              function: 'getReservationReport',
              params: { startDate: '2024-01-01', endDate: '2024-12-31' },
              validate: (result) => result.code === 0 && result.data
            },
            {
              name: '支付统计报表',
              description: '生成支付分析报表',
              function: 'getPaymentReport',
              params: { startDate: '2024-01-01', endDate: '2024-12-31' },
              validate: (result) => result.code === 0 && result.data
            },
            {
              name: '机器使用热力图',
              description: '生成机器使用热力图数据',
              function: 'getMachineHeatmapData',
              params: { startDate: '2024-01-01', endDate: '2024-12-31' },
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            }
          ]
        },
        {
          name: '数据库连接',
          key: 'database',
          tests: [
            {
              name: '数据库连接测试',
              description: '测试数据库连接是否正常',
              function: 'Test_DatabaseConnection',
              params: {},
              validate: (result) => result.code === 0
            },
            {
              name: '用户数据查询测试',
              description: '测试基础用户数据查询',
              function: 'Test_GetAllUsers',
              params: {},
              validate: (result) => result.code === 0 && Array.isArray(result.data)
            }
          ]
        }
      ]
    }
  },

  computed: {
    currentTests() {
      return this.testCategories[this.activeCategory]?.tests || []
    },

    totalTests() {
      return this.testResults.length
    },

    passedTests() {
      return this.testResults.filter(t => t.status === 'passed').length
    },

    failedTests() {
      return this.testResults.filter(t => t.status === 'failed').length
    },

    totalDuration() {
      return this.testResults.reduce((sum, test) => sum + (test.duration || 0), 0)
    }
  },

  methods: {
    switchCategory(index) {
      this.activeCategory = index
    },

    async runAllTests() {
      if (this.isRunning) return

      this.isRunning = true
      this.addLog('info', '开始执行测试套件')

      const tests = this.currentTests
      this.testResults = tests.map(test => ({
        ...test,
        status: 'pending',
        showDetail: false,
        startTime: null,
        duration: null,
        response: null,
        error: null
      }))

      for (let i = 0; i < tests.length; i++) {
        const testIndex = i
        const test = this.testResults[testIndex]

        try {
          await this.runSingleTest(testIndex)
        } catch (error) {
          this.testResults[testIndex] = {
            ...test,
            status: 'failed',
            error: error.message,
            duration: 0
          }
          this.addLog('error', `测试失败: ${test.name} - ${error.message}`)
        }
      }

      this.isRunning = false
      this.addLog('info', `测试完成 - 通过: ${this.passedTests}, 失败: ${this.failedTests}`)
    },

    async runSingleTest(index) {
      const test = this.testResults[index]

      this.testResults[index] = {
        ...test,
        status: 'running',
        startTime: Date.now()
      }

      this.addLog('info', `执行测试: ${test.name}`)

      try {
        const todo = uniCloud.importObject('todo')

        // 应用测试配置中的用户ID
        const params = {
          ...test.params,
          ...(this.testConfig.userId && { userId: this.testConfig.userId })
        }

        const response = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('测试超时'))
          }, this.testConfig.timeout)

          todo[test.function](params)
            .then(result => {
              clearTimeout(timeoutId)
              resolve(result)
            })
            .catch(error => {
              clearTimeout(timeoutId)
              reject(error)
            })
        })

        const duration = Date.now() - this.testResults[index].startTime
        const isValid = test.validate(response)

        this.testResults[index] = {
          ...test,
          status: isValid ? 'passed' : 'failed',
          duration,
          response,
          params,
          error: isValid ? null : '验证失败: 响应格式不符合预期'
        }

        this.addLog(
          isValid ? 'info' : 'error',
          `测试 ${isValid ? '通过' : '失败'}: ${test.name} (${duration}ms)`
        )

      } catch (error) {
        const duration = Date.now() - this.testResults[index].startTime

        this.testResults[index] = {
          ...test,
          status: 'failed',
          duration,
          error: error.message,
          params: {
            ...test.params,
            ...(this.testConfig.userId && { userId: this.testConfig.userId })
          }
        }

        this.addLog('error', `测试异常: ${test.name} - ${error.message}`)
      }
    },

    toggleTestDetail(index) {
      this.testResults[index].showDetail = !this.testResults[index].showDetail
    },

    clearResults() {
      this.testResults = []
      this.addLog('info', '测试结果已清空')
    },

    clearLogs() {
      this.testLogs = []
    },

    exportResults() {
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          total: this.totalTests,
          passed: this.passedTests,
          failed: this.failedTests,
          duration: this.totalDuration
        },
        results: this.testResults,
        logs: this.testLogs
      }

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backend-test-report-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.addLog('info', '测试报告已导出')
    },

    addLog(level, message) {
      this.testLogs.push({
        timestamp: Date.now(),
        level,
        message
      })

      // 保持最新的100条日志
      if (this.testLogs.length > 100) {
        this.testLogs = this.testLogs.slice(-100)
      }
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    }
  }
}
</script>

<style lang="scss" scoped>
.test-container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 30rpx;

  .test-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 10rpx;
  }

  .test-subtitle {
    font-size: 24rpx;
    color: #666;
  }
}

.test-tabs {
  display: flex;
  background: white;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  overflow: hidden;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx;
    font-size: 28rpx;
    color: #666;
    border-bottom: 4rpx solid transparent;
    transition: all 0.3s;

    &.active {
      color: #007AFF;
      border-bottom-color: #007AFF;
      background: #f0f8ff;
    }
  }
}

.control-panel {
  background: white;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;

  .control-group {
    display: flex;
    gap: 15rpx;
    margin-bottom: 20rpx;

    .control-btn {
      flex: 1;
      padding: 15rpx;
      border: none;
      border-radius: 8rpx;
      font-size: 26rpx;

      &.run-all {
        background: #007AFF;
        color: white;

        &:disabled {
          background: #ccc;
        }
      }

      &.clear-results {
        background: #ff9500;
        color: white;
      }

      &.export-results {
        background: #34c759;
        color: white;

        &:disabled {
          background: #ccc;
        }
      }
    }
  }

  .config-section {
    .config-item {
      display: flex;
      align-items: center;
      margin-bottom: 15rpx;

      .config-label {
        width: 200rpx;
        font-size: 26rpx;
        color: #333;
      }

      .config-input {
        flex: 1;
        padding: 10rpx 15rpx;
        border: 1rpx solid #ddd;
        border-radius: 6rpx;
        font-size: 26rpx;
      }
    }
  }
}

.stats-panel {
  display: flex;
  background: white;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;

  .stat-item {
    flex: 1;
    text-align: center;

    .stat-value {
      display: block;
      font-size: 32rpx;
      font-weight: bold;
      margin-bottom: 8rpx;

      &.total { color: #333; }
      &.passed { color: #34c759; }
      &.failed { color: #ff3b30; }
      &.duration { color: #007AFF; }
    }

    .stat-label {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.test-list {
  background: white;
  border-radius: 10rpx;
  max-height: 600rpx;
  margin-bottom: 20rpx;

  .test-item {
    border-bottom: 1rpx solid #eee;

    &:last-child {
      border-bottom: none;
    }

    &.running { background: #fff3cd; }
    &.passed { background: #d4edda; }
    &.failed { background: #f8d7da; }

    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx;

      .test-info {
        flex: 1;

        .test-name {
          display: block;
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }

        .test-description {
          font-size: 24rpx;
          color: #666;
        }
      }

      .test-status {
        text-align: right;
        min-width: 150rpx;

        .status-pending { color: #6c757d; }
        .status-running { color: #007AFF; }
        .status-passed { color: #34c759; }
        .status-failed { color: #ff3b30; }

        .test-duration {
          display: block;
          font-size: 22rpx;
          color: #666;
          margin-top: 5rpx;
        }
      }
    }

    .test-detail {
      padding: 0 20rpx 20rpx;
      border-top: 1rpx solid #eee;

      .detail-title {
        display: block;
        font-size: 24rpx;
        font-weight: bold;
        color: #333;
        margin: 15rpx 0 8rpx;
      }

      .param-content,
      .response-content,
      .error-content {
        font-size: 22rpx;
        color: #666;
        background: #f8f9fa;
        padding: 10rpx;
        border-radius: 4rpx;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .error-content {
        color: #ff3b30;
        background: #fff5f5;
      }
    }
  }
}

.log-panel {
  background: white;
  border-radius: 10rpx;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15rpx 20rpx;
    border-bottom: 1rpx solid #eee;

    .log-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }

    .log-clear {
      font-size: 24rpx;
      color: #007AFF;
      background: none;
      border: none;
      padding: 5rpx 10rpx;
    }
  }

  .log-content {
    max-height: 300rpx;
    padding: 10rpx;

    .log-item {
      display: flex;
      font-size: 22rpx;
      margin-bottom: 8rpx;
      padding: 8rpx;
      border-radius: 4rpx;

      &.info { background: #e3f2fd; }
      &.error { background: #ffebee; }
      &.warn { background: #fff3e0; }

      .log-time {
        color: #666;
        margin-right: 10rpx;
        min-width: 80rpx;
      }

      .log-level {
        color: white;
        padding: 2rpx 6rpx;
        border-radius: 3rpx;
        margin-right: 10rpx;
        font-size: 20rpx;

        &.INFO { background: #2196f3; }
        &.ERROR { background: #f44336; }
        &.WARN { background: #ff9800; }
      }

      .log-message {
        flex: 1;
        color: #333;
      }
    }
  }
}
</style>