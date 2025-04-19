import React, { FC } from 'react'
import { Typography, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, SmileOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useRequest } from 'ahooks'
import { LOGIN_PATHNAME } from '../router'
import { registerService } from '../services/user'
import loginSvg from '../assets/image/login.svg'
import styles from './Register.module.scss'

const { Title } = Typography

const Register: FC = () => {
  const nav = useNavigate()

  const { run } = useRequest(
    async values => {
      const { username, password, nickname } = values
      await registerService(username, password, nickname)
    },
    {
      manual: true,
      onSuccess() {
        message.success('注册成功')
        nav(LOGIN_PATHNAME)
      },
    }
  )

  const onFinish = (values: any) => {
    run(values)
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.imageSection}>
          <img src={loginSvg} alt="注册插图" className={styles.registerImage} />
          <h2 className={styles.brandTitle}>YierQuestionnaire</h2>
          <p className={styles.brandDesc}>智能问卷系统，让调研更简单，分析更智能</p>
        </div>
        <div className={styles.formSection}>
          <div className={styles.registerCard}>
            <div className={styles.header}>
              <Title level={3}>账号注册</Title>
              <p className={styles.subTitle}>创建您的账号开始使用系统</p>
            </div>
            <Form layout="vertical" onFinish={onFinish} className={styles.form}>
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { type: 'string', min: 5, max: 20, message: '字符长度在 5-20 之间' },
                  { pattern: /^\w+$/, message: '只能是字母数字下划线' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
              </Form.Item>
              <Form.Item
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      } else {
                        return Promise.reject(new Error('两次密码不一致'))
                      }
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" size="large" />
              </Form.Item>
              <Form.Item name="nickname">
                <Input prefix={<SmileOutlined />} placeholder="请输入昵称（选填）" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large">
                  注册
                </Button>
              </Form.Item>
              <div className={styles.footer}>
                <Link to={LOGIN_PATHNAME}>已有账号？立即登录</Link>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
