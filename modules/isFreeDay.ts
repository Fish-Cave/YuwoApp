import dayjs from 'dayjs';
import holiday2025 from '@/static/holiday/2025.json'

export default function isFreeDay(timestamp?:number){
	const now = dayjs(timestamp).format('YYYY-MM-DD')
	console.log("isFreeDay" + now)
	const next = dayjs(timestamp).add(1,'day').format('YYYY-MM-DD')
	console.log("NextDay" + next)
	const result = holiday2025.days.find(data =>data.date == next)
	if(result!=null){
		if(result.isOffDay){
			return false
		}
		return true
	}else{
		if(holiday2025.days.find(data =>data.date == now)?.isOffDay){
			return false
		}
		const today = dayjs(timestamp).day()
		if(0<today&&today<5){
			return true
		}
		return false
	}
}