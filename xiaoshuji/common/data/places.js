// common/data/places.js
export const localPlaces = [{
		id: 1,
		name: "宽窄巷子",
		address: "成都市青羊区金河路口",
		latitude: 30.666667,
		longitude: 104.066667,
		description: "成都三大历史文化名城保护街区之一",
		category: "历史建筑",
		tags: ["古街", "文化", "旅游"],
		rating: 4.8
	},
	{
		id: 2,
		name: "锦里古街",
		address: "成都市武侯区武侯祠大街231号",
		latitude: 30.650000,
		longitude: 104.050000,
		description: "西蜀历史上最古老、最具有商业气息的街道之一",
		category: "古街",
		tags: ["三国", "小吃", "商业"],
		rating: 4.7
	},
	{
		id: 3,
		name: "杜甫草堂",
		address: "成都市青羊区青华路37号",
		latitude: 30.670000,
		longitude: 104.030000,
		description: "唐代著名诗人杜甫流寓成都时的故居",
		category: "纪念馆",
		tags: ["诗词", "文化", "历史"],
		rating: 4.6
	},
	{
		id: 4,
		name: "文殊院",
		address: "成都市青羊区文殊院街66号",
		latitude: 30.674167,
		longitude: 104.068889,
		description: "中国长江上下游四大禅林之首",
		category: "寺庙",
		tags: ["佛教", "禅宗", "古建筑"],
		rating: 4.5
	},
	{
		id: 5,
		name: "都江堰",
		address: "成都市都江堰市公园路",
		latitude: 31.001550,
		longitude: 103.606651,
		description: "世界文化遗产，中国古代水利工程的杰作",
		category: "水利工程",
		tags: ["水利", "古代", "世界遗产"],
		rating: 4.9
	},
	{
		id: 6,
		name: "青城山",
		address: "成都市都江堰市青城山镇",
		latitude: 30.901000,
		longitude: 103.569000,
		description: "中国道教发源地之一，世界文化遗产",
		category: "名山",
		tags: ["道教", "自然", "登山"],
		rating: 4.7
	},
	{
		id: 7,
		name: "武侯祠",
		address: "成都市武侯区武侯祠大街231号",
		latitude: 30.648611,
		longitude: 104.047222,
		description: "中国唯一的一座君臣合祀祠庙",
		category: "祠堂",
		tags: ["三国", "诸葛亮", "历史"],
		rating: 4.6
	},
	{
		id: 8,
		name: "大熊猫繁育研究基地",
		address: "成都市成华区熊猫大道1375号",
		latitude: 30.733333,
		longitude: 104.150000,
		description: "世界著名的大熊猫迁地保护基地",
		category: "动物园",
		tags: ["大熊猫", "动物", "保护"],
		rating: 4.8
	},
	{
		id: 9,
		name: "金沙遗址博物馆",
		address: "成都市青羊区金沙遗址路2号",
		latitude: 30.680000,
		longitude: 104.011944,
		description: "展示商周时期四川地区古蜀文化的遗址博物馆",
		category: "博物馆",
		tags: ["考古", "古蜀", "文物"],
		rating: 4.5
	},
	{
		id: 10,
		name: "春熙路",
		address: "成都市锦江区春熙路",
		latitude: 30.658889,
		longitude: 104.081667,
		description: "成都最繁华的商业街",
		category: "商业街",
		tags: ["购物", "美食", "时尚"],
		rating: 4.4
	}
]

// 按距离排序的函数
export function sortByDistance(places, centerLat, centerLng) {
	return places.sort((a, b) => {
		const distanceA = getDistance(centerLat, centerLng, a.latitude, a.longitude)
		const distanceB = getDistance(centerLat, centerLng, b.latitude, b.longitude)
		return distanceA - distanceB
	})
}

// 计算距离
function getDistance(lat1, lng1, lat2, lng2) {
	const radLat1 = (lat1 * Math.PI) / 180.0
	const radLat2 = (lat2 * Math.PI) / 180.0
	const a = radLat1 - radLat2
	const b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0
	let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math
		.sin(b / 2), 2)))
	s = s * 6378.137
	return s
}