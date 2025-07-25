<template>
	<uv-popup ref="pickerPopup" mode="bottom" :round="round" :close-on-click-overlay="closeOnClickOverlay"
		@change="popupChange">
		<view class="uv-picker">
			<uv-toolbar v-if="showToolbar" :cancelColor="cancelColor" :confirmColor="confirmColor"
				:cancelText="cancelText" :confirmText="confirmText" :title="title" @cancel="cancel"
				@confirm="confirm"></uv-toolbar>
			<!-- #ifdef MP-TOUTIAO -->
			<picker-view class="uv-picker__view" :indicatorStyle="`height: ${$uv.addUnit(itemHeight)}`"
				:value="innerIndex" :immediateChange="immediateChange" :style="{
					height: `${$uv.addUnit(visibleItemCount * itemHeight)}`
				}" @pickend="changeHandler">
			<!-- #endif -->
				<!-- #ifndef MP-TOUTIAO -->
				<picker-view class="uv-picker__view" :indicatorStyle="`height: ${$uv.addUnit(itemHeight)}`"
					:value="innerIndex" :immediateChange="immediateChange" :style="{
					height: `${$uv.addUnit(visibleItemCount * itemHeight)}`
				}" @change="changeHandler">
				<!-- #endif -->
					<!-- @pickend在这里为了解决抖音等滚到底不触发change兼容性问题 -->
					<picker-view-column v-for="(item, index) in innerColumns" :key="index"
						class="uv-picker__view__column">
						<text v-if="$uv.test.array(item)" class="uv-picker__view__column__item uv-line-1"
							v-for="(item1, index1) in item" :key="index1" :style="[{
								height: $uv.addUnit(itemHeight),
								lineHeight: $uv.addUnit(itemHeight),
								fontWeight: index1 === innerIndex[index] ? 'bold' : 'normal'
							},textStyle(index,index1)]">{{ getItemText(item1) }}</text>
					</picker-view-column>
				</picker-view>
				<view v-if="loading" class="uv-picker--loading">
					<uv-loading-icon mode="circle"></uv-loading-icon>
				</view>
		</view>
	</uv-popup>
</template>

<script>
	/**
	 * uv-picker
	 * @description 选择器
	 * @property {Boolean}			showToolbar			是否显示顶部的操作栏（默认 true ）
	 * @property {String}			title				顶部标题
	 * @property {Array}			columns				对象数组，设置每一列的数据
	 * @property {Boolean}			loading				是否显示加载中状态（默认 false ）
	 * @property {String | Number}	itemHeight			各列中，单个选项的高度（默认 44 ）
	 * @property {String}			cancelText			取消按钮的文字（默认 '取消' ）
	 * @property {String}			confirmText			确认按钮的文字（默认 '确定' ）
	 * @property {String}			cancelColor			取消按钮的颜色（默认 '#909193' ）
	 * @property {String}			confirmColor		确认按钮的颜色（默认 '#3c9cff' ）
	 * @property {String}			color		文字颜色（默认 '' ）
	 * @property {String}			activeColor		选中文字的颜色（默认 '' ）
	 * @property {String | Number}	visibleItemCount	每列中可见选项的数量（默认 5 ）
	 * @property {String}			keyName				选项对象中，需要展示的属性键名（默认 'text' ）
	 * @property {Boolean}			closeOnClickOverlay	是否允许点击遮罩关闭选择器（默认 false ）
	 * @property {Array}			defaultIndex		各列的默认索引
	 * @property {Boolean}			immediateChange		是否在手指松开时立即触发change事件（默认 false ）
	 * @event {Function} close		关闭选择器时触发
	 * @event {Function} cancel		点击取消按钮触发
	 * @event {Function} change		当选择值变化时触发
	 * @event {Function} confirm	点击确定按钮，返回当前选择的值
	 */
	import mpMixin from '@/uni_modules/uv-ui-tools/libs/mixin/mpMixin.js'
	import mixin from '@/uni_modules/uv-ui-tools/libs/mixin/mixin.js'
	import props from './props.js';
	export default {
		name: 'uv-picker',
		emits: ['confirm', 'cancel', 'close', 'change'],
		mixins: [mpMixin, mixin, props],
		computed: {
			// 为了解决支付宝不生效
			textStyle() {
				return (index, index1) => {
					const style = {};
					// #ifndef APP-NVUE 
					style.display = 'block';
					// #endif
					if (this.color) {
						style.color = this.color;
					}
					if (this.activeColor && index1 === this.innerIndex[index]) {
						style.color = this.activeColor;
					}
					return style;
				}
			}
		},
		data() {
			return {
				// 上一次选择的列索引
				lastIndex: [],
				// 索引值 ，对应picker-view的value
				innerIndex: [],
				// 各列的值
				innerColumns: [],
				// 上一次的变化列索引
				columnIndex: 0,
			}
		},
		watch: {
			// 监听默认索引的变化，重新设置对应的值
			defaultIndex: {
				immediate: true,
				handler(n) {
					this.setIndexs(n, true)
				}
			},
			// 监听columns参数的变化
			columns: {
				deep: true,
				immediate: true,
				handler(n) {
					this.setColumns(n)
				}
			},
		},
		methods: {
			open() {
				this.$refs.pickerPopup.open();
			},
			close() {
				this.$refs.pickerPopup.close();
			},
			popupChange(e) {
				if (!e.show) this.$emit('close');
			},
			// 获取item需要显示的文字，判别为对象还是文本
			getItemText(item) {
				if (this.$uv.test.object(item)) {
					return item[this.keyName]
				} else {
					return item
				}
			},
			// 点击工具栏的取消按钮
			cancel() {
				this.$emit('cancel');
				this.close();
			},
			// 点击工具栏的确定按钮
			confirm() {
				// 在这里使用deepClone拷贝后，vue3会自动转换成原始对象，这样处理是因为cli项目可能出现不返回值的情况
				this.$emit('confirm', this.$uv.deepClone({
					indexs: this.innerIndex,
					value: this.innerColumns.map((item, index) => item[this.innerIndex[index]]),
					values: this.innerColumns
				}));
				if (this.closeOnClickConfirm) {
					this.close();
				}
			},
			// 选择器某一列的数据发生变化时触发
			changeHandler(e) {
				const {
					value
				} = e.detail
				let index = 0,
					columnIndex = 0
				// 通过对比前后两次的列索引，得出当前变化的是哪一列
				for (let i = 0; i < value.length; i++) {
					let item = value[i]
					if (item !== (this.lastIndex[i] || 0)) { // 把undefined转为合法假值0
						// 设置columnIndex为当前变化列的索引
						columnIndex = i
						// index则为变化列中的变化项的索引
						index = item
						break // 终止循环，即使少一次循环，也是性能的提升
					}
				}
				this.columnIndex = columnIndex
				const values = this.innerColumns
				// 将当前的各项变化索引，设置为"上一次"的索引变化值
				this.setLastIndex(value)
				this.setIndexs(value)

				this.$emit('change', {
					value: this.innerColumns.map((item, index) => item[value[index]]),
					index,
					indexs: value,
					// values为当前变化列的数组内容
					values,
					columnIndex
				})
			},
			// 设置index索引，此方法可被外部调用设置
			setIndexs(index, setLastIndex) {
				this.innerIndex = this.$uv.deepClone(index)
				if (setLastIndex) {
					this.setLastIndex(index)
				}
			},
			// 记录上一次的各列索引位置
			setLastIndex(index) {
				// 当能进入此方法，意味着当前设置的各列默认索引，即为“上一次”的选中值，需要记录，是因为changeHandler中
				// 需要拿前后的变化值进行对比，得出当前发生改变的是哪一列
				this.lastIndex = this.$uv.deepClone(index)
			},
			// 设置对应列选项的所有值
			setColumnValues(columnIndex, values) {
				// 替换innerColumns数组中columnIndex索引的值为values，使用的是数组的splice方法
				this.innerColumns.splice(columnIndex, 1, values)
				// 拷贝一份原有的innerIndex做临时变量，将大于当前变化列的所有的列的默认索引设置为0
				let tmpIndex = this.$uv.deepClone(this.innerIndex)
				for (let i = 0; i < this.innerColumns.length; i++) {
					if (i > this.columnIndex) {
						tmpIndex[i] = 0
					}
				}
				// 一次性赋值，不能单个修改，否则无效
				this.setIndexs(tmpIndex)
			},
			// 获取对应列的所有选项
			getColumnValues(columnIndex) {
				// 进行同步阻塞，因为外部得到change事件之后，可能需要执行setColumnValues更新列的值
				// 索引如果在外部change的回调中调用getColumnValues的话，可能无法得到变更后的列值，这里进行一定延时，保证值的准确性
				(async () => {
					await this.$uv.sleep()
				})()
				return this.innerColumns[columnIndex]
			},
			// 设置整体各列的columns的值
			setColumns(columns) {
				this.innerColumns = this.$uv.deepClone(columns)
				// 如果在设置各列数据时，没有被设置默认的各列索引defaultIndex，那么用0去填充它，数组长度为列的数量
				if (this.innerIndex.length === 0) {
					this.innerIndex = new Array(columns.length).fill(0)
				}
			},
			// 获取各列选中值对应的索引
			getIndexs() {
				return this.innerIndex
			},
			// 获取各列选中的值
			getValues() {
				// 进行同步阻塞，因为外部得到change事件之后，可能需要执行setColumnValues更新列的值
				// 索引如果在外部change的回调中调用getValues的话，可能无法得到变更后的列值，这里进行一定延时，保证值的准确性
				(async () => {
					await this.$uv.sleep()
				})()
				return this.innerColumns.map((item, index) => item[this.innerIndex[index]])
			}
		},
	}
</script>

<style lang="scss" scoped>
	$show-lines: 1;
	@import '@/uni_modules/uv-ui-tools/libs/css/variable.scss';
	@import '@/uni_modules/uv-ui-tools/libs/css/components.scss';
	@import '@/uni_modules/uv-ui-tools/libs/css/color.scss';

	.uv-picker {
		position: relative;

		&__view {

			&__column {
				@include flex;
				flex: 1;
				justify-content: center;

				&__item {
					@include flex;
					justify-content: center;
					align-items: center;
					font-size: 16px;
					text-align: center;
					/* #ifndef APP-NVUE */
					display: block;
					/* #endif */
					color: $uv-main-color;

					&--disabled {
						/* #ifndef APP-NVUE */
						cursor: not-allowed;
						/* #endif */
						opacity: 0.35;
					}
				}
			}
		}

		&--loading {
			position: absolute;
			top: 0;
			right: 0;
			left: 0;
			bottom: 0;
			@include flex;
			justify-content: center;
			align-items: center;
			background-color: rgba(255, 255, 255, 0.87);
			z-index: 1000;
		}
	}

	@media (prefers-color-scheme: dark) {
		.uv-picker {
			position: relative;

			&__view {

				&__column {
					@include flex;
					flex: 1;
					justify-content: center;
					background-color: rgb(0,0,0);

					&__item {
						@include flex;
						justify-content: center;
						align-items: center;
						font-size: 16px;
						text-align: center;
						/* #ifndef APP-NVUE */
						display: block;
						/* #endif */
						color: lightgray;

						&--disabled {
							/* #ifndef APP-NVUE */
							cursor: not-allowed;
							/* #endif */
							opacity: 0.35;
						}
					}
				}
			}

			&--loading {
				position: absolute;
				top: 0;
				right: 0;
				left: 0;
				bottom: 0;
				@include flex;
				justify-content: center;
				align-items: center;
				background-color: rgba(255, 255, 255, 0.87);
				z-index: 1000;
			}
		}
	}
</style>