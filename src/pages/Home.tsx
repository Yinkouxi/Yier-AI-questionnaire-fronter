import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography } from 'antd'
import { MANAGE_INDEX_PATHNAME } from '../router'
import styles from './Home.module.scss'
import { RocketOutlined, ApiOutlined, BarChartOutlined, BulbOutlined } from '@ant-design/icons'
import { getPlatformStats } from '../services/stat'
import { useRequest } from 'ahooks'

// import axios from 'axios'
// import '../_mock/index.ts'

const { Title, Paragraph, Text } = Typography

const Home: FC = () => {
  const nav = useNavigate()

  // useEffect(() => {
  //   // fetch('/api/test')
  //   //   .then(res => res.json())
  //   //   .then(data => console.log('fetch data', data))
  //   // mock.js 只能劫持 XMLHttpRequest ，不能劫持 fetch

  //   // axios 内部使用 XMLHttpRequest API ，没用 fetch
  //   axios.get('/api/test').then(res => console.log('axios data', res.data))
  // }, [])

  // useEffect(() => {
  //   // fetch('/api/test')
  //   //   .then(res => res.json())
  //   //   .then(data => console.log('fetch data', data))
  //   // axios.get('/api/test').then(res => console.log('axios data', res.data))
  // })

  // function clickHandler() {
  //   // nav('/login')
  //   nav({
  //     pathname: '/login',
  //     search: 'b=21',
  //   })
  // }

  // 获取平台统计数据
  const { data = { totalQuestions: 0, totalAnswers: 0 } } = useRequest(getPlatformStats)

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Title level={1}>YierQuestionnaire</Title>
          <Title level={3} type="secondary">
            智能问卷系统 - 让调研更简单，分析更智能
          </Title>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <RocketOutlined className={styles.icon} />
            <Title level={4}>简单高效</Title>
            <Paragraph>
              直观的界面设计，让创建和填写问卷变得轻松自如。已累计创建问卷{data.totalQuestions}
              份，收到答卷{data.totalAnswers}份。
            </Paragraph>
          </div>

          <div className={styles.feature}>
            <ApiOutlined className={styles.icon} />
            <Title level={4}>AI 驱动</Title>
            <Paragraph>
              即将接入 <Text strong>deepseek R1</Text> 大模型，为问卷分析带来革命性的突破。
            </Paragraph>
          </div>

          <div className={styles.feature}>
            <BarChartOutlined className={styles.icon} />
            <Title level={4}>智能分析</Title>
            <Paragraph>提供智能数据分析、自动生成分析报告、深度洞察用户反馈等功能。</Paragraph>
          </div>

          <div className={styles.feature}>
            <BulbOutlined className={styles.icon} />
            <Title level={4}>持续创新</Title>
            <Paragraph>
              持续优化系统功能，通过AI技术的加持，为用户提供更有价值的数据洞察。
            </Paragraph>
          </div>
        </div>

        <div className={styles.action}>
          <Button type="primary" size="large" onClick={() => nav(MANAGE_INDEX_PATHNAME)}>
            立即开始使用
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Home
