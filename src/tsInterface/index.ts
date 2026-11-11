/**
 * @description: 登录和账户设置共用的用户信息类型
 */
export interface UserInfo {
  isLogin: boolean;
  _id: string;
  userName: string;
  email: string;
  desc: string;
  avatar: string;
  sex: string;
  birthday: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  token: string;
  user: UserInfo;
}
