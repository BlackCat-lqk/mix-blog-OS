import request from "@/utils/request";
import type { ApiResult } from "@/tsInterface/index";

export async function sendRegistrationCodeApi(email: string, signal?: AbortSignal) {
  const result = await request.post<never, ApiResult<{ retryAfter: number; expiresIn: number }>>(
    "/user/register-code", { email }, { signal },
  );
  return result.data.data;
}
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
export function registerUserApi(params: {
  email: string;
  userName: string;
  password: string;
  verificationCode: string;
}) {
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
