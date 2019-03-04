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

export function getAdminerRoles(id) {
  return request({
    url: '/api/getAdminerRoles/' + id,
    method: 'get',
  })
}

export function deleteAdminer(id) {
  return request({
    url: '/api/adminers/' + id,
    method: 'delete',
  })
}

export function updateAdminer(data) {
  return request({
    url: '/api/adminers/' + data.id,
    method: 'put',
    data
  })
}