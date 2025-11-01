<template>
	<view class="container">
		<view class="header">
			<text class="title">分类数据诊断工具</text>
			<text class="subtitle">检查product-categories集合中的数据完整性问题</text>
		</view>

		<view class="actions">
			<button class="btn-primary" @click="queryAllCategories" :disabled="loading">
				{{ loading ? '查询中...' : '查询所有分类数据' }}
			</button>
			<button class="btn-secondary" @click="testAddCategory" :disabled="loading">
				测试添加分类
			</button>
			<button class="btn-danger" @click="cleanIncompleteRecords" :disabled="loading || !result || !result.incompleteRecordsDetails || result.incompleteRecordsDetails.length === 0">
				清理不完整记录
			</button>
			<button class="btn-secondary" @click="clearResults">
				清空结果
			</button>
		</view>

		<view v-if="result" class="result">
			<view class="summary">
				<text class="summary-title">数据概览:</text>
				<text>总记录数: {{ result.total }}</text>
				<text>完整记录: {{ result.completeRecords }}</text>
				<text>不完整记录: {{ result.incompleteRecords }}</text>
			</view>

			<view v-if="result.incompleteRecordsDetails && result.incompleteRecordsDetails.length > 0" class="incomplete">
				<text class="section-title">不完整记录详情:</text>
				<view v-for="(item, index) in result.incompleteRecordsDetails" :key="index" class="incomplete-item">
					<text class="item-id">ID: {{ item.id }}</text>
					<text class="item-issue">问题: {{ item.issue }}</text>
					<text class="item-fields">字段: {{ item.fields.join(', ') }}</text>
				</view>
			</view>

			<view v-if="result.allData && result.allData.length > 0" class="all-data">
				<text class="section-title">所有数据详情:</text>
				<text class="json-content">{{ JSON.stringify(result.allData, null, 2) }}</text>
			</view>
		</view>

		<view v-if="error" class="error">
			<text class="error-title">错误信息:</text>
			<text>{{ error }}</text>
		</view>

		<view class="test-section">
			<view class="section-title">测试数据:</view>
			<view class="test-form">
				<view class="form-item">
					<text class="form-label">分类名称:</text>
					<input v-model="testCategory.name" class="form-input" placeholder="输入分类名称" />
				</view>
				<view class="form-item">
					<text class="form-label">状态:</text>
					<picker @change="onStatusChange" :value="testCategory.statusIndex" :range="statusOptions">
						<view class="picker-input">{{ statusOptions[testCategory.statusIndex] }}</view>
					</picker>
				</view>
				<view class="form-item">
					<text class="form-label">排序:</text>
					<input v-model.number="testCategory.sort" class="form-input" type="number" placeholder="输入排序权重" />
				</view>
				<view class="form-item">
					<text class="form-label">描述:</text>
					<textarea v-model="testCategory.description" class="form-textarea" placeholder="输入分类描述" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loading: false,
			result: null,
			error: null,
			testCategory: {
				name: '测试分类' + new Date().getTime(),
				status: 'active',
				statusIndex: 0,
				sort: 0,
				description: '这是一个测试分类'
			},
			statusOptions: ['active', 'inactive']
		}
	},

	methods: {
		async queryAllCategories() {
			this.loading = true
			this.result = null
			this.error = null

			try {
				const productObj = uniCloud.importObject('product')
				const response = await productObj.GetAllCategoriesRaw({ data: {} })

				console.log('云函数响应:', response)

				if (response.errCode === 0) {
					this.result = response.data
				} else {
					this.error = response.errMsg || '查询失败'
				}
			} catch (e) {
				console.error('调用云函数失败:', e)
				this.error = e.message || '调用云函数失败'
			} finally {
				this.loading = false
			}
		},

		async testAddCategory() {
			if (!this.testCategory.name) {
				this.error = '请输入分类名称'
				return
			}

			this.loading = true
			try {
				const productObj = uniCloud.importObject('product')

				// 测试不同的数据格式
				const testData = {
					name: this.testCategory.name,
					status: this.testCategory.status,
					sort: this.testCategory.sort || 0,
					description: this.testCategory.description || ''
				}

				console.log('准备发送测试数据:', testData)
				console.log('数据类型检查:', {
					name: typeof testData.name,
					status: typeof testData.status,
					sort: typeof testData.sort,
					description: typeof testData.description
				})

				const response = await productObj.AddCategory({ data: testData })

				console.log('添加分类响应:', response)

				if (response.errCode === 0) {
					uni.showToast({
						title: '添加成功',
						icon: 'success'
					})
					// 成功后重新查询
					await this.queryAllCategories()
				} else {
					this.error = response.errMsg || '添加分类失败'
				}
			} catch (e) {
				console.error('添加分类失败:', e)
				this.error = e.message || '添加分类失败'
			} finally {
				this.loading = false
			}
		},

		onStatusChange(e) {
			this.testCategory.statusIndex = parseInt(e.detail.value)
			this.testCategory.status = this.statusOptions[this.testCategory.statusIndex]
		},

		async cleanIncompleteRecords() {
			if (!this.result || !this.result.incompleteRecordsDetails) {
				this.error = '没有可清理的记录'
				return
			}

			uni.showModal({
				title: '确认清理',
				content: `确定要清理 ${this.result.incompleteRecordsDetails.length} 条不完整记录吗？`,
				success: async (res) => {
					if (res.confirm) {
						this.loading = true
						try {
							const productObj = uniCloud.importObject('product')
							const ids = this.result.incompleteRecordsDetails.map(item => item.id)

							for (const id of ids) {
								try {
									await productObj.DeleteCategory({ data: { categoryId: id } })
								} catch (e) {
									console.error('删除记录失败:', id, e)
								}
							}

							uni.showToast({
								title: '清理完成',
								icon: 'success'
							})

							// 清理后重新查询
							await this.queryAllCategories()
						} catch (e) {
							console.error('清理失败:', e)
							this.error = e.message || '清理失败'
						} finally {
							this.loading = false
						}
					}
				}
			})
		},

		clearResults() {
			this.result = null
			this.error = null
		}
	}
}
</script>

<style scoped>
.container {
	padding: 20px;
	background: #f5f5f5;
	min-height: 100vh;
}

.header {
	text-align: center;
	margin-bottom: 30px;
}

.title {
	display: block;
	font-size: 20px;
	font-weight: bold;
	color: #333;
	margin-bottom: 8px;
}

.subtitle {
	display: block;
	font-size: 14px;
	color: #666;
}

.actions {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-bottom: 20px;
}

.btn-primary, .btn-secondary, .btn-danger {
	padding: 12px;
	border-radius: 6px;
	font-size: 14px;
	border: none;
	color: white;
}

.btn-primary {
	background: #007AFF;
	grid-column: span 2;
}

.btn-secondary {
	background: #6C757D;
}

.btn-danger {
	background: #DC3545;
}

.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
	opacity: 0.6;
}

.result {
	background-color: #f8f9fa;
	padding: 15px;
	border-radius: 8px;
	margin-bottom: 20px;
}

.summary {
	background-color: #e8f4fd;
	padding: 10px;
	border-radius: 4px;
	margin-bottom: 15px;
}

.summary-title {
	font-weight: bold;
	display: block;
	margin-bottom: 5px;
}

.summary text {
	display: block;
	margin: 3px 0;
}

.incomplete {
	background-color: #fff2e8;
	padding: 10px;
	border-radius: 4px;
	margin-bottom: 15px;
}

.incomplete-item {
	background-color: white;
	padding: 8px;
	margin: 5px 0;
	border-radius: 4px;
	border-left: 3px solid #ff9800;
}

.item-id {
	font-weight: bold;
	display: block;
}

.item-issue {
	color: #f57c00;
	display: block;
	margin: 2px 0;
}

.item-fields {
	color: #666;
	font-size: 12px;
	display: block;
}

.all-data {
	background-color: #f9f9f9;
	padding: 10px;
	border-radius: 4px;
	margin-bottom: 15px;
}

.section-title {
	font-weight: bold;
	display: block;
	margin-bottom: 10px;
	color: #333;
}

.json-content {
	font-family: monospace;
	font-size: 12px;
	line-height: 1.4;
	white-space: pre-wrap;
	word-break: break-all;
	max-height: 300px;
	overflow-y: auto;
	background: white;
	padding: 8px;
	border-radius: 4px;
}

.error {
	background-color: #ffebee;
	padding: 15px;
	border-radius: 4px;
	border-left: 3px solid #f44336;
}

.error-title {
	font-weight: bold;
	color: #d32f2f;
	display: block;
	margin-bottom: 5px;
}

.test-section {
	background-color: white;
	padding: 15px;
	border-radius: 8px;
	margin-bottom: 20px;
}

.test-form {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.form-item {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.form-label {
	font-size: 14px;
	font-weight: 500;
	color: #333;
}

.form-input, .picker-input {
	padding: 8px 12px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	background: white;
}

.form-textarea {
	padding: 8px 12px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	min-height: 60px;
	resize: vertical;
	background: white;
}
</style>