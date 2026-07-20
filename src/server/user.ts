import request from "@/utils/request";
/**
 * 用户登录
 * @returns {Promise}
 */
export function loginUserApi(params: { email: string; password: string }) {
  return request.post("/user/login", params);
}

/**
 * 用户注册
 * @returns {Promise}
 */
export function registerUserApi(params: { email: string; password: string }) {
  return request.post("/user/register", params);
}

/**
 * 用户退出登录
 * @returns {Promise}
 */
export function logOutUserApi() {
  return request.post("/user/logout");
}
/**
 * 更新用户信息
 * @returns {Promise}
 */
export function updateUsersInfoApi(data: FormData) {
  return request.put(`/user/edit`, data);
}
