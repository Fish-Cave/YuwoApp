<template>

	<view class="view">
		<swiper class="banner-wrap" :previous-margin="previousflag?previousDistance+'rpx':'0'"
			:next-margin="previousflag?previousDistance+'rpx':'0'" :indicator-dots="false" :current="current"
			:circular="circular" :interval="interval" :autoplay="autoplay" :indicator-color="dotNColor"
			:indicator-active-color="dotInColor" @change="change" @transition="transition">
			<swiper-item v-for="(item,index) in list" @tap="tapbanner(item)" :key="index" >
				<view class="view-wrap"
					:style="{'transform':(index!=currentIndex-1)&&previousflag? `scaleY(${scale})`:'scaleY(1)'}">
					<image class="image" :src="keySource!=''?item[keySource]:item" :style="{'border-radius':radius}">
					</image>
					<view v-if="type=='text'&&previousflag" class="text-wrap">
						<view class="title-box"
							:style="{'border-bottom-right-radius':radius,'border-bottom-left-radius':radius}"></view>
						<view class="view-wrap">
							<view class="title-text" :style="{'color':titleColor,'font-size':titleSize,'z-index':'2'}">
								{{titleSource!=''? list[currentIndex-1][titleSource] :  list[currentIndex-1].title}}
							</view>
							<view v-if="inNumIc&&type=='text'" class="num-block">
								<view class="num-text">{{currentIndex}}/{{list.length}}</view>
							</view>
						</view>
					</view>


				</view>
			</swiper-item>
		</swiper>

		<view v-if="type=='text'&&!previousflag" class="text-wrap">

			<view class="title-box"
				:style="{'border-bottom-right-radius':radius,'border-bottom-left-radius':radius,'left':titleLeft+'px','right':titleRight+'px'}">
			</view>
			<view class="view-wrap">
				<view class="title-text" :style="{'color':titleColor,'font-size':titleSize,'z-index':'2'}">
					{{titleSource!=''? list[currentIndex-1][titleSource] :  list[currentIndex-1].title}}
				</view>
				<view v-if="inNumIc&&type=='text'" class="num-block">
					<view class="num-text">{{currentIndex}}/{{list.length}}</view>
				</view>
			</view>
		</view>

		<view v-if="type=='dot'||type=='square'" class="text-wrap">
			<view class="indicator-wrap" id="indicator-wrap">
				<view v-if="type=='dot'" class="dot" v-for="(item,index) in list" :style="{'margin-left':index==0?'0':dot_margin_left,
				 'background':index==currentIndex-1?dotInColor:dotNColor}"></view>
				<view v-if="type=='square'" :class="index==currentIndex-1?'squareSelect':'squareInSelect'"
					v-for="(item,index) in list" :style="{'margin-left':index==0?'0':dot_margin_left,
				  'background':index==currentIndex-1?dotInColor:dotNColor}"></view>
			</view>
		</view>


	</view>


</template>

<script>
	/**
	 * @prop type:banner类型 dot/square(圆点指示器/方形指示器) text(显示标题类型)
	 * @prop previousflag:是否支持两端缩进
	 * @prop previousDistance:两端缩进距离
	 * @prop radius:圆角大小
	 * @prop dotNColor:指示器未选中颜色
	 * @prop dotInColor:指示器选中颜色
	 * @prop interval:切换时长
	 * @prop circular:是否采用衔接滑动，即播放到末尾后重新回到开头
	 * @prop current:指定位置
	 * @prop keySource:指定接收的图片字段
	 * @prop titleSource:指定标题接收字段
	 * @prop scale：缩进模式下，缩进系数0-1
	 * @prop autoplay:是否自动播放
	 */
	export default {
		name: "wxn-banner.",
		props: {

			previousflag: {
				type: Boolean,
				default: false
			},
			previousDistance: {
				type: [Number, String],
				default: 40
			},
			autoplay: {
				type: Boolean,
				default: true
			},
			scale: {
				type: [Number, String],
				default: 0.9
			},
			keySource: {
				type: String,
				default: ""
			},
			titleSource: {
				type: String,
				default: ""
			},
			type: {
				type: String,
				default: 'dot'
			},
			list: {
				type: Array,
				default: []
			},
			indiPostion: {
				type: String,
				default: 'center'

			},

			interval: {
				type: [Number, String],
				default: 3500
			},
			current: {
				type: [Number, String],
				default: 0
			},
			circular: {
				type: Boolean,
				default: true
			},
			dotNColor: {
				type: String,
				default: '#ffffff'
			},
			dotInColor: {
				type: String,
				default: 'orange'
			},
			radius: {
				type: String,
				default: '15rpx'
			},
			titleColor: {
				type: String,
				default: '#000000'
			},
			titleSize: {
				type: String,
				default: "24rpx"
			},
			ditalIndicator: {
				type: Boolean,
				default: true
			},

		},


		watch: {
			type: {
				handler(newValue, oldValue) {
					if (newValue == 'text') {
						this.inNumIc = true
					}
				},
				immediate: true
			},
			ditalIndicator: {
				handler(newValue, oldValue) {
					this.inNumIc = newValue
				},
				immediate: true
			}
		},
		data() {
			return {
				currentIndex: 1, //当前位置
				inNumIc: false,
				dot_margin_left: '10rpx',
				item_width: 0,
				titleLeft: 0, //标题栏距离左边的位置
				titleRight: 0, //标题栏距离右边的位置



			};
		},
		mounted() {
			var that = this
			uni.createSelectorQuery().in(this).select('.view').boundingClientRect((data) => {
				
				uni.createSelectorQuery().in(this).select('.image').boundingClientRect((data2) => {
					that.titleLeft = (data.width - data2.width) / 2
					that.titleRight = (data.width - data2.width) / 2
				}).exec(function() {

				})
			}).exec(function() {

			})


			if (this.type == 'dot' || this.type == 'square')
				uni.createSelectorQuery().in(this).select('.indicator-wrap').boundingClientRect((data) => {
					this.item_width = data.width
				}).exec(function() {

				})
		},

		methods: {

			tapbanner(item) {
				this.$emit('banner', item)
			},


			//切换时触发
			change(ev) {
				this.currentPostion
				this.currentIndex = (ev.detail.current) + 1
			},
			//滑动细节
			transition(ev) {
				// if (ev.detail.dx > 0) {
				// 	//向右滑动
				// }else {
				// 	//向左滑动
				// }
				// this.offset_present = Math.abs(ev.detail.dx)/this.item_width
				// this.opc1=1-this.offset_present
				// this.opc2=this.offset_present
				// if(this.opc1==0){
				// 	this.opc1=1
				// }
				// if(this.opc2==0){
				// 	this.opc2=1
				// }
			},


		}

	}
</script>

<style scoped lang="scss">
	.view {
		position: relative;
		height: 100%;
		width: 100%;

		.text-wrap {
			position: absolute;
			width: 100%;
			height: 55rpx;
			bottom: 0;
			width: 100%;


			.view-wrap {
				width: 100%;
				height: 100%;

				// opacity: 0.5;
				display: flex;
				align-items: center;
				// padding: 0 25rpx;
				// box-sizing: border-box;

				.title-text {
					width: 90%;
					padding: 0 20rpx;
					word-break: break-all;
					display: -webkit-box;
					-webkit-line-clamp: 1;
					-webkit-box-orient: vertical;
					overflow: hidden;

				}

				.num-block {
					width: 20%;
					display: flex;
					align-items: center;
					background: #007AFF;
					position: relative;

					.num-text {
						position: absolute;
						right: 20rpx;
						color: white;
					}
				}



			}

			.indicator-wrap {
				display: flex;
				height: 100%;
				align-items: center;
				justify-content: center;

				// margin-left:25rpx;
				// margin-right:25rpx;
				.dot {
					width: 15rpx;
					height: 15rpx;
					border-radius: 50%;

				}

				.squareSelect {
					width: 30rpx;
					height: 10rpx;
					border-radius: 25px
				}

				.squareInSelect {
					width: 14rpx;
					height: 14rpx;
					border-radius: 50%;
					opacity: 0.8;

				}

			}


		}



	}

	.banner-wrap {
		width: 100%;
		height: 100%;

		.view-wrap {
			position: relative;
			height: 100%;
			margin: 0 10rpx;

			.image {
				height: 100%;
				width: 100%;
			}





		}

	}

	.title-box {
		position: absolute;
		left: 0;
		right: 0;
		background-color: #efefef;
		height: 55rpx;
		opacity: 0.8;
		z-index: 1;
	}
</style>
