// 引入本地腾讯地图SDK
import QQMapWX from './qqmap-wx-jssdk.js'
import { MAP_CONFIG } from '../config.js'

// 腾讯地图服务封装
// AI辅助生成：Claude, 2025-03
// - 驾车路径规划、途经点支持
// - Polyline解码算法
// - 路线结果格式化
class TencentMapService {
  constructor() {
    this.key = MAP_CONFIG.key
    this.qqmapsdk = new QQMapWX({ key: this.key })
    this.checkinRadius = MAP_CONFIG.checkinRadius
  }

  /**
   * 驾车路径规划
   * @param {Object} params
   * @param {Array} params.from - 起点坐标 [lat, lng]
   * @param {Array} params.to - 终点坐标 [lat, lng]
   * @param {Array} params.waypoints - 途径点数组 [[lat, lng], ...]
   * @param {String} params.policy - 策略: LEAST_TIME(最快) / LEAST_DISTANCE(最短) / REAL_TRAFFIC(实时)
   * @returns {Promise} 路径规划结果
   */
  async drivingRoute(params) {
    const { from, to, waypoints = [], policy = 'LEAST_TIME' } = params

    return new Promise((resolve, reject) => {
      this.qqmapsdk.direction({
        mode: 'driving',
        from: from.join(','),
        to: to.join(','),
        waypoints: waypoints.map(point => point.join(',')).join(';'),
        policy: policy === 'LEAST_TIME' ? 0 : policy === 'LEAST_DISTANCE' ? 1 : 2,
        success: (res) => {
          if (res.status === 0) {
            resolve(this._formatRouteResult(res.result))
          } else {
            reject(new Error(res.message || '路径规划失败'))
          }
        },
        fail: (error) => {
          console.error('路径规划请求失败:', error)
          reject(error)
        }
      })
    })
  }

  /**
   * 格式化路径规划结果
   */
  _formatRouteResult(result) {
    if (!result.routes || result.routes.length === 0) {
      return null
    }

    const route = result.routes[0] // 取第一条路线

    return {
      distance: route.distance, // 距离(米)
      duration: route.duration, // 时间(秒)
      polyline: this._decodePolyline(route.polyline), // 解码折线
      steps: route.steps.map(step => ({
        instruction: step.instruction,
        road_name: step.road_name,
        distance: step.distance,
        duration: step.duration,
        direction: step.direction
      })),
      toll_distance: route.toll_distance,
      restriction: route.restriction
    }
  }

  /**
   * 解码腾讯地图polyline
   */
  _decodePolyline(polyline) {
    if (!polyline) return []

    const points = []
    let index = 0
    let lat = 0
    let lng = 0

    const coordinates = polyline.split(';')

    coordinates.forEach(coord => {
      const [dlat, dlng] = coord.split(',')
      if (dlat && dlng) {
        lat += parseFloat(dlat) / 1000000
        lng += parseFloat(dlng) / 1000000
        points.push({ latitude: lat, longitude: lng })
      }
    })

    return points
  }

  /**
   * 获取实时交通信息
   */
  async getTraffic(from, to) {
    // 这里可以扩展获取实时路况
    return null
  }

  /**
   * 地点搜索
   */
  async searchPlace(keyword, location = null) {
    return new Promise((resolve) => {
      const options = {
        keyword: keyword,
        page_size: 20,
        page_index: 1
      }

      if (location) {
        options.location = `${location.latitude},${location.longitude}`
      }

      this.qqmapsdk.search({
        ...options,
        success: (res) => {
          if (res.status === 0) {
            resolve(res.data)
          } else {
            resolve([])
          }
        },
        fail: (error) => {
          console.error('地点搜索失败:', error)
          resolve([])
        }
      })
    })
  }
}

export default new TencentMapService()