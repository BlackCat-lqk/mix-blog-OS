import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateEmail,
  validateUserName,
  validatePassword,
  validateInvitationCode,
} from '../src/utils/validation.ts'

test('所有字段均为必填，邮箱校验格式并允许提交前去除首尾空白', () => {
  for (const validate of [
    validateEmail,
    validateUserName,
    validatePassword,
    validateInvitationCode,
  ]) {
    assert.notEqual(validate(''), '')
  }
  for (const value of ['test@example.com', ' user+tag@mail.example.com ']) {
    assert.equal(validateEmail(value), '')
  }
  for (const value of [' ', 'test', 'test@', '@example.com', 'a@@example.com', 'a b@example.com']) {
    assert.notEqual(validateEmail(value), '', value)
  }
})

test('用户名允许中英文数字及其混合，拒绝符号、空白和表情', () => {
  for (const value of ['中文', 'English', '123456', '用户Alice123', '𠮷同学']) {
    assert.equal(validateUserName(value), '', value)
  }
  for (const value of ['user_name', 'user-name', '用户！', 'a b', 'user\n', '😀', 'éclair']) {
    assert.notEqual(validateUserName(value), '', value)
  }
})

test('密码保留至少4位限制，允许半角特殊字符，拒绝中文和不可见字符', () => {
  for (const value of ['abcd', '1234', 'Ab12!@#', '!@#$%^&*()_+-=[]{};:\'",.<>/?`~\\|']) {
    assert.equal(validatePassword(value), '', value)
  }
  for (const value of ['abc', '密码1234', 'abcd！', 'ab cd', 'abcd\n', 'abcd\t', 'abcd😀']) {
    assert.notEqual(validatePassword(value), '', value)
  }
})

test('邀请码必须恰好6位半角数字，保留开头的零', () => {
  for (const value of ['123456', '000001', '000000']) {
    assert.equal(validateInvitationCode(value), '', value)
  }
  for (const value of [
    '12345',
    '1234567',
    'abcdef',
    '12345a',
    '１２３４５６',
    '123456\n',
    ' 123456',
  ]) {
    assert.notEqual(validateInvitationCode(value), '', value)
  }
})
