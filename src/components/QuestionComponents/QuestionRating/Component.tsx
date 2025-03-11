import React, { FC } from 'react'
import { Rate } from 'antd'
import { HeartFilled, StarFilled } from '@ant-design/icons'
import { QuestionRatingPropsType, QuestionRatingDefaultProps } from './interface'

const Component: FC<QuestionRatingPropsType> = (props: QuestionRatingPropsType) => {
  const newProps = { ...QuestionRatingDefaultProps, ...props }
  const { title, maxScore, icon, defaultValue, onChange } = newProps

  const handleChange = (value: number) => {
    if (onChange) {
      onChange({
        ...newProps,
        defaultValue: value,
      })
    }
  }

  return (
    <div>
      <p>{title}</p>
      <div>
        <Rate
          character={icon === 'heart' ? <HeartFilled /> : <StarFilled />}
          count={maxScore}
          value={defaultValue}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

export default Component
