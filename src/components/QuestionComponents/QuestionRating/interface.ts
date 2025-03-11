import { QuestionComponentPropsType } from '../interface'

export type QuestionRatingPropsType = {
  title?: string
  maxScore?: number
  icon?: 'star' | 'heart'
  required?: boolean
  defaultValue?: number
} & QuestionComponentPropsType

export const QuestionRatingDefaultProps: QuestionRatingPropsType = {
  title: '评分标题',
  maxScore: 5,
  icon: 'star',
  required: false,
  defaultValue: 0,
}
