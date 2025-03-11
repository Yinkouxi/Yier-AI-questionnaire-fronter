import React, { FC } from 'react'
import { QuestionRatingPropsType } from './interface'
import { Typography } from 'antd'
import { QuestionStatPropsType } from '../interface'

const { Text } = Typography

const StatComponent: FC<QuestionStatPropsType<QuestionRatingPropsType>> = ({
  stat = [],
  question,
}) => {
  const { title } = question

  // 转换统计数据格式
  const statData = stat.reduce((acc: { [key: string]: number }, score: string) => {
    const val = parseInt(score) || 0
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})

  // 计算平均分
  const totalScore = Object.entries(statData).reduce((sum, [score, count]) => {
    return sum + parseInt(score) * count
  }, 0)
  const totalCount = Object.values(statData).reduce((sum, count) => sum + count, 0)
  const average = totalCount ? totalScore / totalCount : 0

  // 转换为需要的格式
  const formattedStat = Object.entries(statData).map(([score, count]) => ({
    name: `${score}分`,
    count,
  }))

  return (
    <div>
      <Text strong>{title}</Text>
      <div>
        <Text>平均分：{average.toFixed(1)}</Text>
      </div>
      <div>
        <Text>答题人数：{totalCount}</Text>
      </div>
      <div>
        {formattedStat.map(item => (
          <div key={item.name}>
            <Text>
              {item.name}: {item.count}人
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatComponent
