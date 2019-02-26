import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/api/adminers',
    method: 'get',
    params: query
  })
}

export function adminers(data) {
  return request({
    url: '/api/adminers',
    method: 'post',
    data
  })
}

export function getAllRole() {
  return request({
    url: '/api/getAllRole',
    method: 'get'
  })
}
