import axios from "axios";

const service = axios.create({
  baseURL: "/",
  timeout: 10000 * 60, // 请求超时时间（10分钟）
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在请求发送之前做一些处理
    const userData = localStorage.getItem("userInfo");
    const token = userData ? JSON.parse(userData).data.token : "";
    if (token) {
      // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 200) {
      return res;
    } else {
      console.log(res.data.message || "未知错误");
      return Promise.reject(new Error(res.data.message || "Unknown error"));
    }
  },
  (error) => {
    const payload = error.response?.data as
      | { data?: { message?: string }; message?: string }
      | undefined;
    const msg =
      payload?.data?.message ?? payload?.message ?? error.message ?? "网络异常，请稍后再试";
    console.log("网络异常，请稍后再试", msg);
    return Promise.reject(new Error(msg));
  },
);

export default service;
