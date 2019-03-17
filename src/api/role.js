import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/api/roles',
    method: 'get',
    params: query
  })
}

export function roles(data) {
  return request({
    url: '/api/roles',
    method: 'post',
    data
  })
}

export function getAllPermission() {
  return request({
    url: '/api/getAllPermission',
    method: 'get'
  })
}

export function getAdminerRoles(id) {
  return request({
    url: '/api/getAdminerRoles/' + id,
    method: 'get',
  })
}

export function deleteRole(id) {
  return request({
    url: '/api/roles/' + id,
    method: 'delete',
  })
}

export function updateRole(data) {
  return request({
    url: '/api/roles/' + data.id,
    method: 'put',
    data
  })
}