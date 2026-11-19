/** 公共表单校验：返回空字符串表示通过，否则返回错误提示。 */
export function validateEmail(value: string): string {
  if (!value.trim()) return "请输入邮箱";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "请输入有效的邮箱地址";
  return "";
}

export function validateUserName(value: string): string {
  if (!value) return "请输入用户名";
  if (/[^\p{Script=Han}a-zA-Z0-9]/u.test(value)) return "用户名只能包含中文、英文和数字";
  return "";
}

export function validatePassword(value: string): string {
  if (!value) return "请输入密码";
  // ASCII 可见字符（不含空格）：英文字母、数字和半角特殊字符。
  if (/[^\x21-\x7e]/.test(value)) return "密码只能包含英文、数字和半角特殊字符";
  if (value.length < 4) return "密码至少 4 个字符";
  return "";
}

export function validateInvitationCode(value: string): string {
  if (!value) return "请输入邀请码";
  if (value.length !== 6 || /[^0-9]/.test(value)) return "邀请码必须是 6 位数字";
  return "";
}
