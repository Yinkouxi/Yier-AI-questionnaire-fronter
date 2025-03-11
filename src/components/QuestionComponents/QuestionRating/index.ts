import Component from './Component'
import PropComponent from './PropComponent'
import { QuestionRatingDefaultProps } from './interface'
import { StarOutlined } from '@ant-design/icons'

export * from './interface'

export default {
  title: '评分',
  type: 'questionRating',
  Component,
  PropComponent,
  defaultProps: QuestionRatingDefaultProps,
  icon: StarOutlined,
}
