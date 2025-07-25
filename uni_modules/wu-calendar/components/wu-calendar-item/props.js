export default {
	props: {
		color: {
			type: String,
			default: '#3c9cff'
		},
		startText: {
			type: String,
			default: '开始'
		},
		endText: {
			type: String,
			default: '结束'
		},
		weeks: {
			type: Object,
			default () {
				return {}
			}
		},
		calendar: {
			type: Object,
			default: () => {
				return {}
			}
		},
		selected: {
			type: Array,
			default: () => {
				return []
			}
		},
		lunar: {
			type: Boolean,
			default: false
		},
		itemHeight: {
			type: Number,
			default: 64
		},
		actBadgeColor: {
			type: String,
			default: '#fff',
		},
		weekItemStyle: {
			type: Object,
			default: {}
		},
		// 是否显示今日默认样式(默认为true)
		todayDefaultStyle: {
			type: Boolean,
			default: true
		},
	}
}