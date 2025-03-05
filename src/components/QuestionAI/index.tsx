import React, { FC, useState, useEffect, useRef } from 'react'
import { Button, Tooltip } from 'antd'
import { RobotOutlined, CloseOutlined } from '@ant-design/icons'
import styles from './index.module.scss'

const QuestionAI: FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showTip, setShowTip] = useState(true) // 默认显示提示
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 5秒后自动隐藏提示
    const timer = setTimeout(() => {
      setShowTip(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.ant-btn')
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={styles.aiContainer}>
      {isOpen ? (
        <div className={styles.chatContainer} ref={chatContainerRef}>
          <Button
            type="primary"
            icon={<CloseOutlined />}
            onClick={() => setIsOpen(false)}
            className={styles.minimizeBtn}
          />
          <iframe
            src="https://udify.app/chatbot/kMr1iGb2zqr8ztRU"
            className={styles.chatWindow}
            allow="microphone"
          />
        </div>
      ) : (
        <Tooltip
          title="秃头刺猬AI助手，帮您生成问卷大纲"
          open={showTip}
          placement="left"
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<RobotOutlined />}
            onClick={() => setIsOpen(true)}
            className={styles.aiButton}
          />
        </Tooltip>
      )}
    </div>
  )
}

export default QuestionAI
