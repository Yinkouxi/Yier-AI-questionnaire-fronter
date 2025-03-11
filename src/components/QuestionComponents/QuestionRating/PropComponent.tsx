import React, { FC, useEffect } from 'react'
import { Form, Input, Checkbox, Select, InputNumber } from 'antd'
import { QuestionRatingPropsType } from './interface'

const PropComponent: FC<QuestionRatingPropsType> = (props: QuestionRatingPropsType) => {
  const { title, maxScore, icon, required, defaultValue, onChange } = props
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({ title, maxScore, icon, required, defaultValue })
  }, [title, maxScore, icon, required, defaultValue])

  function handleValueChange() {
    if (onChange) {
      const newValues = form.getFieldsValue()
      onChange({
        ...props,
        ...newValues,
      })
    }
  }

  return (
    <Form
      layout="vertical"
      initialValues={{ title, maxScore, icon, required, defaultValue }}
      form={form}
      onValuesChange={handleValueChange}
    >
      <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="最大分值"
        name="maxScore"
        rules={[{ required: true, message: '请选择最大分值' }]}
      >
        <InputNumber min={1} max={10} />
      </Form.Item>
      <Form.Item
        label="图标类型"
        name="icon"
        rules={[{ required: true, message: '请选择图标类型' }]}
      >
        <Select>
          <Select.Option value="star">星星</Select.Option>
          <Select.Option value="heart">心形</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="required" valuePropName="checked">
        <Checkbox>必填</Checkbox>
      </Form.Item>
      <Form.Item label="默认分数" name="defaultValue">
        <InputNumber min={0} max={10} />
      </Form.Item>
    </Form>
  )
}

export default PropComponent
