/**
 * @description: ts接口类封装
 */
import type { Component } from 'vue'
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

export interface AppItem {
  zhName?: string
  enName: string
  title?: string
  icon?: string
  component: Component
}
