import dayjs from 'dayjs';
import holiday2025 from '@/static/holiday/2025.json';

export default function isFreeDay(timestamp?: number) {
	const now = dayjs(timestamp).format('YYYY-MM-DD');
	// console.log("isFreeDay " + now)
	const next = dayjs(timestamp).add(1, 'day').format('YYYY-MM-DD');
	// console.log("NextDay " + next)
	const nextDayResult = holiday2025.days.find((data) => data.date == next);
	const nowDayResult = holiday2025.days.find((data) => data.date == now) || 'empty';
	console.log(nowDayResult);
	console.log(nextDayResult);
	if (nextDayResult != undefined) {
		if (nextDayResult.isOffDay) {
			return !nextDayResult.isOffDay;
		} else {
			if (nowDayResult != 'empty') {
				return !nowDayResult.isOffDay;
			}else{
				return !nextDayResult.isOffDay;
			}
		}
	} else {
		const res = holiday2025.days.find((data) => data.date == now);
		console.log(res);
		if (res != undefined) {
			if (res?.isOffDay) {
				return !res.isOffDay;
			} else {
				return true;
			}
		}
		const today = dayjs(timestamp).day();
		console.log(today);
		if (0 < today && today < 5) {
			return true;
		}
		return false;
	}

}
