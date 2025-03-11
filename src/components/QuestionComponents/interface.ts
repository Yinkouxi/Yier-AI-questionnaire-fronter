export type QuestionComponentPropsType = {
  fe_id?: string
  type?: string
  isLocked?: boolean
  onChange?: (newProps: any) => void
}

export type QuestionStatPropsType<T> = {
  stat: string[]
  question: T
}
