<template>
	<view class="container">
		<view class="filter-container">
			<view class="filter-button" :class="{'filter-clickable': isUser}" @click="handlePlayerCountClick">
				<uni-icons type="person-filled" size="20"></uni-icons>
				<text class="filter-text">当前签到数:</text>
				<text
					style="color: orange; padding-left: 20rpx; font-size: 30rpx; font-weight: bold;">{{howManyPlayer}}</text>
				<uni-icons v-if="isSuperUser" type="arrow-right" size="16" color="#999"
					style="margin-left: 10rpx;"></uni-icons>
			</view>
			<view class="filter-button" :class="{'filter-active': showFavoritesOnly}" @click="toggleFavoritesFilter">
				<uni-icons :type="showFavoritesOnly ? 'heart-filled' : 'heart'" size="20" color="#f472b6"></uni-icons>
				<text class="filter-text">{{ showFavoritesOnly ? '显示全部' : '只看收藏' }}</text>
			</view>
			<!-- 分组显示开关 -->
			<view class="filter-button" :class="{'filter-active': showGrouped}" @click="toggleGroupDisplay">
				<!--<uni-icons :type="showGrouped ? 'list' : 'grid'" size="15" color="#3b82f6"></uni-icons>-->
				<text class="filter-text">{{ showGrouped ? '取消分组' : '分组显示' }}</text>
			</view>
		</view>
		<view class="tips-container">
			<text class="tips">
				登录后如果为会员将会自动显示会员价格
			</text>
		</view>
		<!-- 分组显示模式 -->
		<template v-if="showGrouped">
			<!-- 未选择具体分组时，显示分组列表 -->
			<template v-if="!selectedGroupId">
				<view v-for="group in availableGroups" :key="group._id" class="group-item"
					@click="selectGroup(group._id)">
					<view class="group-card">
						<view class="group-info">
							<text class="group-name">{{ group.name }}</text>
							<text class="group-count">{{ getGroupMachineCount(group._id) }} 台机器</text>
						</view>
						<uni-icons type="arrow-right" size="20" color="#999"></uni-icons>
					</view>
				</view>

				<!-- 未分组的机台 -->
				<view v-if="ungroupedMachines.length > 0" class="group-item" @click="selectGroup(null)">
					<view class="group-card">
						<view class="group-info">
							<text class="group-name">未分组机台</text>
							<text class="group-count">{{ ungroupedMachines.length }} 台机器</text>
						</view>
						<uni-icons type="arrow-right" size="20" color="#999"></uni-icons>
					</view>
				</view>
			</template>

			<!-- 选择了具体分组时，显示该分组的机台 -->
			<template v-else>
				<view class="group-header">
					<view class="back-button" @click="backToGroupList">
						<uni-icons type="arrow-left" size="20" color="#3b82f6"></uni-icons>
						<text class="back-text">返回分组列表</text>
					</view>
					<text class="current-group-name">{{ getCurrentGroupName() }}</text>
				</view>

				<!-- 显示选中分组的机台 -->
				<view v-for="machineData in getCurrentGroupMachines().slice(0,10)"
					:key="machineData.machineInfo.machinenum" class="machine-item">
					<!-- 机台卡片内容 -->
					<view class="glass-card">
						<!-- 机台信息区域 -->
						<view class="card-header">
							<view class="icon-container">
								<uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
							</view>
							<view class="machine-info">
								<text class="machine-name">{{ machineData.machineInfo.name }}</text>
								<!-- 会员价格显示逻辑 -->
								<view class="price-status-container">
									<view v-if="membershipType === 'weekly_monthly'">
										<text class="machine-price">周卡月卡会员免费</text>
									</view>
									<view v-else>
										<text v-if="props.isFree" class="machine-price">闲时价 3元/半时</text>
										<text v-else class="machine-price">忙时价 5元/半时</text>
									</view>

									<view class="status-label"
										:class="{'status-available': machineData.machineInfo.status === 0, 'status-error': machineData.machineInfo.status !== 0 }">
										{{ machineData.machineInfo.status === 0 ? '可用' : '故障' }}
									</view>
								</view>
							</view>
							<view class="heart-icon" @click="toggleFavorite(machineData.machineInfo._id)">
								<uni-icons :type="favorites.has(machineData.machineInfo._id) ? 'heart-filled' : 'heart'"
									size="24" color="#f472b6"></uni-icons>
							</view>
						</view>
						<!-- 时间轴区域 -->
						<view class="timeline-section">
							<view class="timeline-hours">
								<text class="time-label">0:00</text>
								<text class="time-label">6:00</text>
								<text class="time-label">12:00</text>
								<text class="time-label">18:00</text>
								<text class="time-label">24:00</text>
							</view>
							<view class="timeline-container">
								<view class="timeline-bar">
									<view v-for="(reservation, index) in mergeReservations(machineData.reservations)"
										:key="index" class="timeline-segment"
										:style="calculateSegmentStyle(reservation, props.dayStartTime, props.dayEndTime)">
										<view class="timeline-segment-pulse"></view>
										<view v-if="getReservationCount(machineData.reservations, reservation) > 1"
											class="reservation-count">
											{{ getReservationCount(machineData.reservations, reservation) }}
										</view>
									</view>
								</view>
							</view>
						</view>

						<!-- 按钮区域 -->
						<view class="button-group">
							<!-- 优先判断机台故障状态 -->
							<view v-if="machineData.machineInfo.status == 1" class="error-button" @click="unuseable()">
								<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
								<text class="button-text error-text">机台故障</text>
							</view>
							<!-- 机台非故障时，根据角色判断 -->
							<template v-else>
								<!-- 超级管理员或普通用户 -->
								<template v-if="isSuperUser || isUser">
									<view v-if="machineData.machineInfo.status != 1" class="action-button view-button"
										@click="viewReservations(machineData)">
										<uni-icons type="staff" size="20" color="#4b5563"></uni-icons>
										<text class="button-text">查看预约</text>
									</view>
									<view v-if="machineData.machineInfo.status == 0"
										class="action-button reserve-button"
										@click="goOrder(machineData.machineInfo.name, machineData.machineInfo._id)">
										<uni-icons type="personadd" size="20" color="#ffffff"></uni-icons>
										<text class="button-text reserve-text">预约</text>
									</view>
								</template>
								<!-- 预备用户 -->
								<template v-else-if="isPreUser">
									<view v-if="machineData.machineInfo.status != 1"
										class="action-button no-permission-button">
										<uni-icons type="eye-slash" size="20" color="#ffffff"></uni-icons>
										<text class="button-text error-text">无权限查看</text>
									</view>
									<view v-if="machineData.machineInfo.status == 0"
										class="action-button no-permission-button">
										<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
										<text class="button-text error-text">无权限预约</text>
									</view>
								</template>
								<!-- 其他未登录或角色未知用户 -->
								<template v-else>
									<view v-if="machineData.machineInfo.status != 1"
										class="action-button needlog-button" @click="unlogin()">
										<uni-icons type="eye-slash" size="20" color="#ffffff"></uni-icons>
										<text class="button-text error-text">登陆后查看</text>
									</view>
									<view v-if="machineData.machineInfo.status == 0"
										class="action-button needlog-button" @click="unlogin()">
										<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
										<text class="button-text error-text">登陆后预约</text>
									</view>
								</template>
							</template>
						</view>
					</view>
				</view>
			</template>
		</template>

		<!-- 非分组显示模式（原来的显示方式） -->
		<template v-else>
			<view v-for="machineData in filteredMachineData" :key="machineData.machineInfo.machinenum"
				class="machine-item">
				<!-- 原来的机台卡片内容保持完全不变 -->
				<view class="glass-card">
					<!-- 机台信息区域 -->
					<view class="card-header">
						<view class="icon-container">
							<uni-icons type="headphones" size="30" color="#ffffff"></uni-icons>
						</view>
						<view class="machine-info">
							<text class="machine-name">{{ machineData.machineInfo.name }}</text>
							<!-- 会员价格显示逻辑 -->
							<view class="price-status-container">
								<view v-if="membershipType === 'weekly_monthly'">
									<text class="machine-price">周卡月卡会员免费</text>
								</view>
								<view v-else>
									<text v-if="props.isFree" class="machine-price">闲时价 3元/半时</text>
									<text v-else class="machine-price">忙时价 5元/半时</text>
								</view>

								<view class="status-label"
									:class="{'status-available': machineData.machineInfo.status === 0, 'status-error': machineData.machineInfo.status !== 0 }">
									{{ machineData.machineInfo.status === 0 ? '可用' : '故障' }}
								</view>
							</view>
						</view>
						<view class="heart-icon" @click="toggleFavorite(machineData.machineInfo._id)">
							<uni-icons :type="favorites.has(machineData.machineInfo._id) ? 'heart-filled' : 'heart'"
								size="24" color="#f472b6"></uni-icons>
						</view>
					</view>
					<!-- 时间轴区域 -->
					<view class="timeline-section">
						<view class="timeline-hours">
							<text class="time-label">0:00</text>
							<text class="time-label">6:00</text>
							<text class="time-label">12:00</text>
							<text class="time-label">18:00</text>
							<text class="time-label">24:00</text>
						</view>
						<view class="timeline-container">
							<view class="timeline-bar">
								<view v-for="(reservation, index) in mergeReservations(machineData.reservations)"
									:key="index" class="timeline-segment"
									:style="calculateSegmentStyle(reservation, props.dayStartTime, props.dayEndTime)">
									<view class="timeline-segment-pulse"></view>
									<view v-if="getReservationCount(machineData.reservations, reservation) > 1"
										class="reservation-count">
										{{ getReservationCount(machineData.reservations, reservation) }}
									</view>
								</view>
							</view>
						</view>
					</view>

					<!-- 按钮区域 -->
					<view class="button-group">
						<!-- 优先判断机台故障状态 -->
						<view v-if="machineData.machineInfo.status == 1" class="error-button" @click="unuseable()">
							<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
							<text class="button-text error-text">机台故障</text>
						</view>
						<!-- 机台非故障时，根据角色判断 -->
						<template v-else>
							<!-- 超级管理员或普通用户 -->
							<template v-if="isSuperUser || isUser">
								<view v-if="machineData.machineInfo.status != 1" class="action-button view-button"
									@click="viewReservations(machineData)">
									<uni-icons type="staff" size="20" color="#4b5563"></uni-icons>
									<text class="button-text">查看预约</text>
								</view>
								<view v-if="machineData.machineInfo.status == 0" class="action-button reserve-button"
									@click="goOrder(machineData.machineInfo.name, machineData.machineInfo._id)">
									<uni-icons type="personadd" size="20" color="#ffffff"></uni-icons>
									<text class="button-text reserve-text">预约</text>
								</view>
							</template>
							<!-- 预备用户 -->
							<template v-else-if="isPreUser">
								<view v-if="machineData.machineInfo.status != 1"
									class="action-button no-permission-button">
									<uni-icons type="eye-slash" size="20" color="#ffffff"></uni-icons>
									<text class="button-text error-text">无权限查看</text>
								</view>
								<view v-if="machineData.machineInfo.status == 0"
									class="action-button no-permission-button">
									<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
									<text class="button-text error-text">无权限预约</text>
								</view>
							</template>
							<!-- 其他未登录或角色未知用户 -->
							<template v-else>
								<view v-if="machineData.machineInfo.status != 1" class="action-button needlog-button"
									@click="unlogin()">
									<uni-icons type="eye-slash" size="20" color="#ffffff"></uni-icons>
									<text class="button-text error-text">登陆后查看</text>
								</view>
								<view v-if="machineData.machineInfo.status == 0" class="action-button needlog-button"
									@click="unlogin()">
									<uni-icons type="close" size="20" color="#ffffff"></uni-icons>
									<text class="button-text error-text">登陆后预约</text>
								</view>
							</template>
						</template>
					</view>
				</view>
			</view>
		</template>

		<!--弹出显示当前签到数-->
		<uni-popup ref="popup" type="right">
      <view v-if="activeSignIns[0]!=null">
        <view v-for="data in activeSignIns">
          <view class="glass-card">

            <view class="signin-header">
              <view class="sigin-userinfo">
              </view>

              <view class="sigin-playinfo">
				<view class="sigin-nickname">{{data.nickname}}</view>
                <text>正在游玩:</text>
                <view class="sigin-machine-name">{{data.machineName}}</view>
              </view>
            </view>

            <view class="time-container">
              <view>开始时间:</view>
              <view>{{dayjs(data.starttime).format('MM.DD HH:mm')}}</view>
            </view>

          </view>
        </view>
      </view>
			<view v-else>
        <text>当前没有人窝哟</text>
      </view>
		</uni-popup>

	</view>
</template>

<script setup lang="ts">
	import { onMounted, reactive, ref, watch, computed } from 'vue';
	import dayjs from 'dayjs';
	import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js'
	import isFreeDay from '@/modules/isFreeDay.ts'
	const uniIdCo = uniCloud.importObject("uni-id-co")

	const isSuperUser = ref(false)
	const isUser = ref(false)
	const isPreUser = ref(false)
	const membershipType = ref("none");
	const isFree = ref(false)
	const activeSignIns = ref([]);
	const howManyPlayer = ref(0);
	const popup = ref(null);

	// 新增：分组相关的响应式数据
	const showGrouped = ref(false); // 是否显示分组模式
	const selectedGroupId = ref<string | null>(null); // 当前选中的分组ID，null表示未分组
	const allGroups = ref([]); // 所有分组数据

	// 原有的数据现在需要适配新的数据结构
	const machineReservationData = ref<Array<{
		machineInfo : machine & { groupInfo ?: any },
		reservations : Reservation[]
	}>>([])

	function roleJudge() {
		const res = uniCloud.getCurrentUserInfo('uni_id_token')
		if (res.role.includes("admin")) {
			isSuperUser.value = true
			isUser.value = false
			isPreUser.value = false
		} else if (res.role.includes("user")) {
			isSuperUser.value = false
			isUser.value = true
			isPreUser.value = false
		} else if (res.role.includes("preUser")) {
			isSuperUser.value = false
			isUser.value = false
			isPreUser.value = true
		} else {
			isSuperUser.value = false
			isUser.value = false
			isPreUser.value = false
		}
		getMembershipStatus();
	}

	async function getMembershipStatus() {
		try {
			const userInfo = uniCloud.getCurrentUserInfo();
			if (!userInfo || !userInfo.uid) {
				console.log('未登录或无法获取用户ID');
				membershipType.value = "none";
				return;
			}

			const result = await todo.getUserMembershipInfo(userInfo.uid);
			console.log("会员信息查询结果:", result);
			if (result) {
				if (result.subscriptionPackage && result.subscriptionPackage.length > 0) {
					membershipType.value = "weekly_monthly";
					console.log('用户拥有包周/月会员');
				}
				else if (result.membership && result.membership.length > 0) {
					membershipType.value = "music_game";
					console.log('用户拥有音游会员');
				}
				else {
					membershipType.value = "none";
					console.log('用户没有会员');
				}
			} else {
				membershipType.value = "none";
				console.log('获取会员信息失败或用户没有会员');
			}
		} catch (error) {
			console.error("获取会员信息失败:", error);
			membershipType.value = "none";
		}
	}

	uni.$on('uni-id-pages-login-success', () => {
		roleJudge();
	});

	const todo = uniCloud.importObject('todo')

	interface machine {
		"_id" : string;
		"name" : string;
		"capacity" : number;
		"status" : number;
		"machinenum" : number;
		"description" : string;
		"groupId" ?: string;
		"groupDisplayOrder" ?: number;
	}
	interface Reservation {
		"_id" : string;
		"machineId" : string;
		"isOvernight" : boolean;
		"status" : string;
		"startTime" : number;
		"endTime" : number;
		"userId" : string;
		"username" ?: string;
		"avatar" ?: string;
		"avatar_file" ?: any;
	}

	interface DisplayReservation extends Reservation {
	}

	const favorites = ref<Set<string>>(new Set());

	// 新增：分组相关的计算属性和方法
	const availableGroups = computed(() => {
		// 过滤掉没有机台的分组
		return allGroups.value.filter(group =>
			getGroupMachineCount(group._id) > 0
		);
	});

	const ungroupedMachines = computed(() => {
		const processedData = machineReservationData.value.map(machine => ({
			...machine,
			reservations: processReservationsForDisplay(machine.reservations, props.dayStartTime, props.dayEndTime)
		}));

		return processedData.filter(machine =>
			!machine.machineInfo.groupId &&
			(!showFavoritesOnly.value || favorites.value.has(machine.machineInfo._id))
		);
	});

	function getGroupMachineCount(groupId : string) {
		return machineReservationData.value.filter(machine =>
			machine.machineInfo.groupId === groupId &&
			(!showFavoritesOnly.value || favorites.value.has(machine.machineInfo._id))
		).length;
	}

	function toggleGroupDisplay() {
		showGrouped.value = !showGrouped.value;
		if (!showGrouped.value) {
			selectedGroupId.value = null; // 退出分组模式时重置选中的分组
		}

		uni.showToast({
			icon: 'none',
			title: showGrouped.value ? '已开启分组显示' : '已关闭分组显示',
			duration: 1500
		});
	}

	function selectGroup(groupId : string | null) {
		selectedGroupId.value = groupId;
	}

	function backToGroupList() {
		selectedGroupId.value = null;
	}

	function getCurrentGroupName() {
		if (selectedGroupId.value === null) {
			return '未分组机台';
		}
		const group = allGroups.value.find(g => g._id === selectedGroupId.value);
		return group ? group.name : '未知分组';
	}

	function getCurrentGroupMachines() {
		const processedData = machineReservationData.value.map(machine => ({
			...machine,
			reservations: processReservationsForDisplay(machine.reservations, props.dayStartTime, props.dayEndTime)
		}));

		let filteredMachines;
		if (selectedGroupId.value === null) {
			// 显示未分组的机台
			filteredMachines = processedData.filter(machine => !machine.machineInfo.groupId);
		} else {
			// 显示指定分组的机台
			filteredMachines = processedData.filter(machine =>
				machine.machineInfo.groupId === selectedGroupId.value
			);
		}

		// 应用收藏筛选
		if (showFavoritesOnly.value) {
			filteredMachines = filteredMachines.filter(machine =>
				favorites.value.has(machine.machineInfo._id)
			);
		}

		return filteredMachines;
	}

	function unuseable() {
		uni.showToast({
			icon: "error",
			title: "机台故障",
		})
	}

	function unlogin() {
		uni.showToast({
			icon: "error",
			title: "请先登录",
		})
		uni.reLaunch({
			url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
		})
	}

	function viewReservations(machineData) {
		const detailData = {
			GetMachineReservationInfo: machineData,
			dayStartTime: props.dayStartTime,
			dayEndTime: props.dayEndTime
		};
		uni.setStorageSync('detailData', JSON.stringify(detailData));

		console.log("查看预约信息：", machineData);
		uni.navigateTo({
			url: '/pages/usageDetail/usageDetail',
			success: function (res) {
			}
		});
	}

	const props = defineProps({
		dayStartTime: {
			type: Number,
			required: true
		},
		dayEndTime: {
			type: Number,
			required: true
		},
		fetchStartTime: {
			type: Number,
			required: true
		},
		fetchEndTime: {
			type: Number,
			required: true
		},
		isFree: {
			type: Boolean,
			required: true
		}
	})

	function goOrder(machineName : String, machineID : String) {
		const orderData = {
			name: machineName,
			id: machineID,
			startTime: props.dayStartTime,
			endTime: props.dayEndTime
		};
		uni.setStorageSync('orderData', JSON.stringify(orderData));

		uni.navigateTo({
			url: '/pages/order/order',
			success: function (res) {
				res.eventChannel.emit('acceptDataFromOpenerPage', {
					'name': machineName,
					'id': machineID,
					'startTime': props.dayStartTime,
					'endTime': props.dayEndTime
				})
			}
		});
	}

	async function loadMachineReservations() {
		try {
			if (!props.fetchStartTime || !props.fetchEndTime) {
				console.log("fetchStartTime 或 fetchEndTime 为空，不加载数据");
				return;
			}
			console.log("准备调用 GetMachineReservationInfo 云函数，范围:", dayjs(props.fetchStartTime).format('YYYY-MM-DD HH:mm:ss'), '-', dayjs(props.fetchEndTime).format('YYYY-MM-DD HH:mm:ss'));
			let res = await todo.GetMachineReservationInfo(props.fetchStartTime, props.fetchEndTime);
			console.log("GetMachineReservationInfo 云函数调用完成，返回结果:", res);

			// 更新数据结构处理
			if (res && res.machines && Array.isArray(res.machines)) {
				machineReservationData.value = res.machines;
				allGroups.value = res.groups || [];
			} else if (Array.isArray(res)) {
				// 兼容旧数据格式 (如果后端没有返回groups或machines字段)
				machineReservationData.value = res;
				allGroups.value = [];
			} else if (res && res.result) { // 兼容旧的uniCloud云函数返回格式
				machineReservationData.value = res.result;
				allGroups.value = [];
			} else {
				console.error("返回的数据格式不正确:", res);
				machineReservationData.value = [];
				allGroups.value = [];
			}

			console.log("machineReservationData.value 赋值后:", machineReservationData.value);
			console.log("allGroups.value 赋值后:", allGroups.value);
		} catch (e) {
			console.error("加载机台预约信息失败:", e);
		}
	}

	// 监听 fetchStartTime 和 fetchEndTime 的变化，重新加载预约数据
	watch(() => [props.fetchStartTime, props.fetchEndTime], ([newFetchStartTime, newFetchEndTime]) => {
		console.log("watch 监听器被触发，fetchStartTime:", newFetchStartTime, "fetchEndTime:", newFetchEndTime);
		if (newFetchStartTime && newFetchEndTime) {
			loadMachineReservations();
		}
	})

	function processReservationsForDisplay(
		rawReservations : Reservation[],
		dayStartTime : number,
		dayEndTime : number
	) : DisplayReservation[] {
		const displayReservations : DisplayReservation[] = [];
		const dayStartMoment = dayjs(dayStartTime);

		const currentDay8h = dayStartMoment.hour(8).minute(0).second(0).millisecond(0).valueOf();
		const currentDay22h = dayStartMoment.hour(22).minute(0).second(0).millisecond(0).valueOf();
		const prevDay22h = dayStartMoment.clone().subtract(1, 'day').hour(22).minute(0).second(0).millisecond(0).valueOf();

		for (const res of rawReservations) {
			if (res.isOvernight) {
				// 情况1: 前一天的过夜预约，覆盖当前日期的 00:00-08:00 部分
				if (res.startTime >= prevDay22h && res.startTime < dayStartTime && res.endTime > dayStartTime) {
					const segmentStart = dayStartTime;
					const segmentEnd = Math.min(res.endTime, currentDay8h);

					if (segmentStart < segmentEnd) {
						displayReservations.push({ ...res, startTime: segmentStart, endTime: segmentEnd });
					}
				}

				// 情况2: 今天的过夜预约，覆盖当前日期的 22:00-24:00 部分
				if (res.startTime >= currentDay22h && res.startTime < dayEndTime && res.endTime > dayEndTime) {
					const segmentStart = Math.max(res.startTime, currentDay22h);
					const segmentEnd = dayEndTime;

					if (segmentStart < segmentEnd) {
						displayReservations.push({ ...res, startTime: segmentStart, endTime: segmentEnd });
					}
				}
			} else {
				// 非过夜预约：直接将其时间段限制在当前显示日期内
				const effectiveStartTime = Math.max(res.startTime, dayStartTime);
				const effectiveEndTime = Math.min(res.endTime, dayEndTime);

				if (effectiveStartTime < effectiveEndTime) {
					displayReservations.push({ ...res, startTime: effectiveStartTime, endTime: effectiveEndTime });
				}
			}
		}
		return displayReservations;
	}

	// 计算条形图 segment 的样式
	function calculateSegmentStyle(reservation : DisplayReservation, dayStartTime : number, dayEndTime : number) {
		const totalDayTime = dayEndTime - dayStartTime;
		const reservationStartTimeInDay = Math.max(reservation.startTime, dayStartTime) - dayStartTime;
		const reservationEndTimeInDay = Math.min(reservation.endTime, dayEndTime) - dayStartTime;

		const segmentLeftPercentage = (reservationStartTimeInDay / totalDayTime) * 100;
		const segmentRightPercentage = 100 - (reservationEndTimeInDay / totalDayTime) * 100;

		return {
			left: `${segmentLeftPercentage}%`,
			right: `${segmentRightPercentage}%`,
			background: 'linear-gradient(90deg, rgba(255,193,7,0.5) 0%, rgba(252,211,77,0.8) 100%)'
		};
	}

	function mergeReservations(reservations : DisplayReservation[]) {
		if (!reservations || reservations.length === 0) return [];

		const sortedReservations = [...reservations].sort((a, b) => a.startTime - b.startTime);
		const mergedReservations = [];
		let currentMerged = { ...sortedReservations[0] };

		for (let i = 1; i < sortedReservations.length; i++) {
			const current = sortedReservations[i];

			if (current.startTime <= currentMerged.endTime) {
				currentMerged.endTime = Math.max(currentMerged.endTime, current.endTime);
			} else {
				mergedReservations.push(currentMerged);
				currentMerged = { ...current };
			}
		}

		mergedReservations.push(currentMerged);
		return mergedReservations;
	}

	function getReservationCount(allReservations : DisplayReservation[], mergedReservation : DisplayReservation) {
		return allReservations.filter(res =>
			(res.startTime < mergedReservation.endTime && res.endTime > mergedReservation.startTime)
		).length;
	}

	// 添加收藏筛选的状态
	const showFavoritesOnly = ref(false);

	// 修改原有的计算属性以兼容分组模式
	const filteredMachineData = computed(() => {
		// 对原始数据进行预处理，生成适合显示在当前时间条上的预约段
		const processedData = machineReservationData.value.map(machine => ({
			...machine,
			reservations: processReservationsForDisplay(machine.reservations, props.dayStartTime, props.dayEndTime)
		}));

		// 应用收藏筛选
		if (!showFavoritesOnly.value) {
			return processedData;
		}

		// 只显示已收藏的机台
		return processedData.filter(machine =>
			favorites.value.has(machine.machineInfo._id)
		);
	});

	// 切换收藏筛选状态
	function toggleFavoritesFilter() {
		showFavoritesOnly.value = !showFavoritesOnly.value;

		uni.showToast({
			icon: 'none',
			title: showFavoritesOnly.value ? '只显示收藏的机台' : '显示全部机台',
			duration: 1500
		});
	}

	// 更新收藏状态到本地存储
	function saveUserFavorites() {
		try {
			uni.setStorageSync('machine_favorites', JSON.stringify([...favorites.value]));
		} catch (e) {
			console.error("保存收藏状态失败:", e);
		}
	}

	// 收藏/取消收藏功能
	async function toggleFavorite(machineId : string) {
		try {
			const userInfo = uniCloud.getCurrentUserInfo();
			if (!userInfo || !userInfo.uid) {
				uni.showToast({
					icon: 'none',
					title: '请先登录',
					duration: 1500
				});
				return;
			}

			if (favorites.value.has(machineId)) {
				favorites.value.delete(machineId);
			} else {
				favorites.value.add(machineId);
			}

			// 保存到本地存储
			saveUserFavorites();

			// 同步到云端
			await todo.Loved_Update(userInfo.uid, machineId);

			uni.showToast({
				icon: 'success',
				title: favorites.value.has(machineId) ? '已加入收藏' : '已取消收藏',
				duration: 1500
			});
		} catch (error) {
			console.error("收藏操作失败:", error);
			uni.showToast({
				icon: 'error',
				title: '操作失败',
				duration: 1500
			});
		}
	}

	// 加载用户收藏数据
	async function loadUserFavorites() {
		try {
			const userInfo = uniCloud.getCurrentUserInfo();
			if (!userInfo || !userInfo.uid) {
				console.log('未登录，不加载收藏数据');
				return;
			}

			// 调用云函数获取收藏数据
			const result = await todo.Loved_Query(userInfo.uid);
			if (result && result.data) {
				// 更新收藏集合
				favorites.value = new Set(result.data);
				// 同步到本地存储
				saveUserFavorites();
			}
		} catch (error) {
			console.error("加载收藏数据失败:", error);
		}
	}

	async function HowManyPlayer() {
		try {
			const result = await todo.HowManyPlayer();
			console.log("当前签到用户数据:", result.data);
			if (result && result.data) {
				activeSignIns.value = result.data;
				howManyPlayer.value = result.data.length;
			} else {
				activeSignIns.value = [];
				howManyPlayer.value = 0;
			}
		} catch (e) {
			console.error("获取签到人数失败:", e);
			activeSignIns.value = [];
			howManyPlayer.value = 0;
		}
	}

	// 处理"当前窝内签到数"点击事件
	function handlePlayerCountClick() {
		if (isSuperUser.value) {
			//showPlayerDetails();
		}
		popup.value.open();
	}

	// 显示签到用户详情的弹窗
	function showPlayerDetails() {
		if (activeSignIns.value.length === 0) {
			uni.showToast({
				icon: 'none',
				title: '当前无用户签到',
				duration: 2000
			});
			return;
		}

		// 格式化用户列表字符串
		const userListText = activeSignIns.value.map(player => {
			const startTime = dayjs(player.starttime).format('HH:mm');
			const userName = player.nickname || `用户ID: ${player.userid.substring(0, 6)}...`;
			return `用户: ${userName} (签到时间: ${startTime})`;
		}).join('\n');

		uni.showModal({
			title: '当前签到用户列表',
			content: userListText,
			showCancel: false,
			confirmText: '知道了'
		});
	}

	// 组件挂载时执行
	onMounted(() => {
		console.log("usage 组件 onMounted");
		if (props.fetchStartTime && props.fetchEndTime) {
			loadMachineReservations();
		}
		console.log(machineReservationData.value);
		roleJudge();

		// 加载用户分组显示偏好
		try {
			const storedGroupPreference = uni.getStorageSync('machine_group_preference');
			if (storedGroupPreference !== '') {
				showGrouped.value = JSON.parse(storedGroupPreference);
			}
		} catch (e) {
			console.error("读取分组偏好失败:", e);
		}

		// 先从本地存储加载收藏状态
		try {
			const storedFavorites = uni.getStorageSync('machine_favorites');
			if (storedFavorites) {
				favorites.value = new Set(JSON.parse(storedFavorites));
			}
		} catch (e) {
			console.error("读取收藏状态失败:", e);
		}

		// 从云端加载收藏数据
		loadUserFavorites();
		// 多少人在签到
		HowManyPlayer();
	})

	// 保存分组显示偏好
	watch(showGrouped, (newValue) => {
		try {
			uni.setStorageSync('machine_group_preference', JSON.stringify(newValue));
		} catch (e) {
			console.error("保存分组偏好失败:", e);
		}
	});

	// 页面显示时刷新数据和会员状态
	uni.$on('onShow', () => {
		loadMachineReservations();
		getMembershipStatus();
	});

	// 预约成功后刷新数据
	uni.$on('reservationSuccess', () => {
		loadMachineReservations();
	});
</script>

<style>
	/* 基础容器样式 */
	.container {
		width: 100%;
		padding: 20rpx;
		box-sizing: border-box;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		min-height: 100vh;
	}

	.machine-item {
		margin-bottom: 30rpx;
	}
	.tips {
		font-size: 24rpx;
		color: #999;
		text-align: center;
	}
	.tips-container {
		padding: 0 20rpx;
		margin: 20rpx 0;
		display: flex;
		justify-content: center;
		
	}
	/* 玻璃拟态卡片 */
	.glass-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20rpx;
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		overflow: hidden;
		padding: 24rpx;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		position: relative;
	}

	.glass-card:active {
		transform: translateY(2rpx);
		box-shadow: 0 2px 8px rgba(31, 38, 135, 0.08);
	}

	/* 卡片头部区域 */
	.card-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20rpx;
		position: relative;
	}

	.icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		width: 60px;
		height: 60px;
		border-radius: 16px;
		box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
	}

	.machine-info {
		display: flex;
		flex-direction: column;
		padding: 0 24rpx;
		flex: 1;
	}

	.machine-name {
		font-weight: bold;
		font-size: 34rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.4;
		color: #333;
		margin-bottom: 8rpx;
	}


	.machine-price {
		font-size: 26rpx;
		color: #6b7280;
		line-height: 1.4;
		background: rgba(59, 130, 246, 0.1);
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
		align-self: flex-start;
		font-weight: 500;
	}

	.heart-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease;
	}

	.heart-icon:active {
		transform: scale(0.9);
		background: rgba(252, 165, 165, 0.2);
	}

	.status-label {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
		padding: 4rpx 16rpx;
		border-radius: 12rpx;
		font-size: 24rpx;
		font-weight: 600;
		margin-left: 10rpx;
	}

	.status-available {
		background-color: rgba(76, 175, 80, 0.2);
		color: #4CAF50;
	}

	.status-error {
		background-color: rgba(244, 67, 54, 0.2);
		color: #f44336;
	}

	
	/* 时间轴样式 */
	.timeline-section {
		padding: 16rpx 0 24rpx;
	}

	.timeline-hours {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}

	.time-label {
		color: #9ca3af;
		font-size: 22rpx;
		font-weight: 500;
	}

	.timeline-container {
		position: relative;
		width: 100%;
		margin-bottom: 20rpx;
	}

	.timeline-bar {
		height: 36rpx;
		width: 100%;
		background-color: rgba(243, 244, 246, 0.7);
		border-radius: 18rpx;
		position: relative;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.timeline-segment {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 18rpx;
		z-index: 2;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.timeline-segment-pulse {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.3);
		animation: pulse 2s infinite;
		border-radius: 18rpx;
	}

	.reservation-count {
		position: absolute;
		top: 5rpx;
		right: 15rpx;
		background-color: #e29a09;
		color: white;
		border-radius: 50%;
		width: 20rpx;
		height: 20rpx;
		font-size: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	@keyframes pulse {
		0% {
			opacity: 0.4;
		}

		50% {
			opacity: 0.8;
		}

		100% {
			opacity: 0.4;
		}
	}

	.button-group {
		display: flex;
		justify-content: space-around;
		padding: 20rpx 0 10rpx;
		flex-wrap: wrap;
		gap: 20rpx;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12rpx;
		padding: 18rpx 24rpx;
		flex: 1;
		min-width: 180rpx;
		max-width: 240rpx;
		height: 80rpx;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.action-button:active {
		transform: translateY(2rpx);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.view-button {
		background: rgba(249, 250, 251, 0.8);
		border: 1px solid rgba(209, 213, 219, 0.5);
		color: #4b5563;
	}

	.reserve-button {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: #ffffff;
	}

	.error-button {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12rpx;
		padding: 18rpx 24rpx;
		width: 85%;
		height: 80rpx;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
		color: #ffffff;
	}

	.needlog-button {
		background: linear-gradient(135deg, #D3D3D3 0%, #B0B0B0 100%);
		color: #ffffff;
	}

	.button-text {
		margin-left: 10rpx;
		font-size: 28rpx;
		white-space: nowrap;
		font-weight: 500;
	}

	.reserve-text,
	.error-text {
		color: #ffffff;
	}

	/* 新增样式：为管理员的按钮添加可点击的视觉效果 */
	.filter-clickable {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.filter-clickable:active {
		background-color: rgba(255, 255, 255, 0.9);
	}

	/* 签到情况查询 */
	.avatar {
		width: 64px;
		height: 64px;
    border-radius: 50%;
    align-items: center;
	}
  .time-container{
    display: flex;
    justify-content: space-between;
    padding: 8rpx;
  }
  .signin-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8rpx;
  }
  .sigin-machine-name{
    font-size: 32rpx;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300rpx;
  }
  .sigin-userinfo{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .sigin-playinfo{
    display: flex;
    flex-direction: column;
    padding-left: 10px;
    width: 100%;
  }
  .sigin-nickname{
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

	/* 媒体查询：针对不同尺寸设备的响应式样式 */
	/* 小屏幕设备 */
	@media screen and (max-width: 375px) {
		.container {
			padding: 16rpx;
		}

		.glass-card {
			padding: 20rpx;
		}

		.machine-name {
			font-size: 30rpx;
		}

		.icon-container {
			width: 50px;
			height: 50px;
		}

		.action-button {
			padding: 16rpx 18rpx;
			min-width: 150rpx;
			height: 70rpx;
		}

		.button-text {
			font-size: 26rpx;
		}

		.timeline-bar {
			height: 30rpx;
			border-radius: 15rpx;
		}

		.timeline-segment {
			border-radius: 15rpx;
		}
	}

	/* 大屏幕设备 */
	@media screen and (min-width: 768px) {
		.container {
			padding: 30rpx;
		}

		.machine-item {
			margin-bottom: 40rpx;
		}

		.glass-card {
			padding: 30rpx;
			border-radius: 24rpx;
		}

		.icon-container {
			width: 70px;
			height: 70px;
			border-radius: 20px;
		}

		.machine-name {
			font-size: 38rpx;
		}

		.machine-price {
			font-size: 28rpx;
		}

		.action-button {
			min-width: 200rpx;
			padding: 20rpx 30rpx;
			height: 90rpx;
			border-radius: 16rpx;
		}

		.button-text {
			font-size: 30rpx;
			margin-left: 12rpx;
		}

		.timeline-bar {
			height: 44rpx;
			border-radius: 22rpx;
		}

		.timeline-segment {
			border-radius: 22rpx;
		}

		.status-label {
			font-size: 26rpx;
			padding: 6rpx 20rpx;
		}
	}

	.price-status-container {
		display: flex;
		align-items: center;
	}

	/* 更新 filter-container 样式，使其可以容纳三个按钮 */
	.filter-container {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		/* 允许换行 */
		padding: 10rpx 10rpx;
		margin-bottom: 10rpx;
		gap: 15rpx;
		/* 按钮之间的间距 */
	}

	.filter-button {
		display: flex;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.7);
		padding: 15rpx 20rpx;
		border-radius: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		flex: 1;
		/* 允许按钮弹性伸缩 */
		min-width: 200rpx;
		/* 最小宽度，防止过小 */
		justify-content: center;
		/* 内部内容居中 */
	}

	.filter-active {
		background-color: #fdf2f8;
		box-shadow: 0 2rpx 10rpx rgba(244, 114, 182, 0.3);
	}

	.filter-text {
		margin-left: 10rpx;
		font-size: 26rpx;
		color: #666;
	}

	.filter-active .filter-text {
		color: #f472b6;
	}

	.no-permission-button {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12rpx;
		padding: 18rpx 24rpx;
		flex: 1;
		min-width: 180rpx;
		max-width: 240rpx;
		height: 80rpx;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		background-color: rgba(224, 224, 224, 0.8);
		/* 浅灰色背景，略微透明 */
		border: 1px solid rgba(209, 213, 219, 0.3);
		/* 浅色边框，可选 */
		color: #94a3b8;
		/* 深灰色文字 */
		cursor: not-allowed;
		/* 鼠标悬停时显示禁止图标 */
		pointer-events: none;
		/* 阻止点击事件和hover效果 */
	}

	.no-permission-button:active {
		transform: none;
		/* 取消 active 时的位移效果 */
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		/* 保持默认阴影或略微调整 */
	}

	/* 新增样式：分组相关 */
	.group-item {
		margin-bottom: 30rpx;
	}

	.group-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border-radius: 20rpx;
		box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.group-card:active {
		transform: translateY(2rpx);
		box-shadow: 0 2px 8px rgba(31, 38, 135, 0.08);
	}

	.group-info {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	.group-name {
		font-weight: bold;
		font-size: 34rpx;
		color: #333;
	}

	.group-count {
		font-size: 28rpx;
		color: #6b7280;
		background: rgba(59, 130, 246, 0.1);
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
		align-self: flex-start;
	}

	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
		padding: 0 10rpx;
	}

	.back-button {
		display: flex;
		align-items: center;
		background: rgba(59, 130, 246, 0.1);
		padding: 10rpx 20rpx;
		border-radius: 10rpx;
	}

	.back-text {
		margin-left: 10rpx;
		color: #3b82f6;
		font-weight: 500;
	}

	.current-group-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}

	@media (prefers-color-scheme: dark) {

		/* 基础容器样式 */
		.container {
			width: 100%;
			padding: 20rpx;
			box-sizing: border-box;
			background: rgb(0, 0, 0);
			min-height: 100vh;
		}

		/* 玻璃拟态卡片 */
		.glass-card {
			background: rgb(22, 22, 24);
			backdrop-filter: blur(10px);
			border-radius: 20rpx;
			box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.18);
			overflow: hidden;
			padding: 24rpx;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
			position: relative;
		}

		.icon-container {
			display: flex;
			justify-content: center;
			align-items: center;
			background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
			width: 60px;
			height: 60px;
			border-radius: 16px;
		}

		.machine-name {
			font-weight: bold;
			font-size: 34rpx;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: 1.4;
			color: white;
			margin-bottom: 8rpx;
		}

		.machine-price {
			font-size: 26rpx;
			color: lightgray;
			line-height: 1.4;
			background: rgb(59, 59, 61);
			padding: 4rpx 16rpx;
			border-radius: 20rpx;
			align-self: flex-start;
			font-weight: 500;
		}

		.heart-icon {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: gray;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
			transition: all 0.2s ease;
		}

		/* 时间轴样式 */
		.time-label {
			color: white;
			font-size: 22rpx;
			font-weight: 500;
		}

		.timeline-bar {
			height: 36rpx;
			width: 100%;
			background-color: rgb(59, 59, 61);
			border-radius: 18rpx;
			position: relative;
			box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
			overflow: hidden;
		}

		.timeline-segment-pulse {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(255, 255, 255, 0.3);
			animation: pulse 2s infinite;
			border-radius: 18rpx;
		}

		.filter-button {
			display: flex;
			align-items: center;
			background-color: rgba(255, 255, 255, 0.3);
			padding: 10rpx 20rpx;
			border-radius: 30rpx;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		}

		.filter-text {
			margin-left: 10rpx;
			font-size: 26rpx;
			color: white;
		}

		.filter-clickable:active {
			background-color: rgba(255, 255, 255, 0.4);
		}

		/* 分组相关 */
		.group-card {
			background: rgb(22, 22, 24);
		}

		.group-name,
		.current-group-name {
			color: white;
		}

		.group-count {
			color: lightgray;
			background: rgb(59, 59, 61);
		}

		.back-text {
			color: #60a5fa;
		}
	}
</style>
