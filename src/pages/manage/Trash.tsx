import React, { FC, useState, useEffect } from 'react'
import { useTitle } from 'ahooks'
import { Typography, Empty, Button, Spin, message, Input, Modal } from 'antd'
import {
  ExclamationCircleOutlined,
  UndoOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { useSearchParams } from 'react-router-dom'
import useLoadQuestionListData from '../../hooks/useLoadQuestionListData'
import { updateQuestionService, deleteQuestionsService } from '../../services/question'
import { LIST_SEARCH_PARAM_KEY } from '../../constant/index'
import styles from './common.module.scss'
import { createQuestionService } from '../../services/question'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography
const { Search } = Input
const { confirm } = Modal

const Trash: FC = () => {
  useTitle('YierQuestionnaire - 回收站')

  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || ''

  const { data = {}, loading, refresh } = useLoadQuestionListData({ isDeleted: true })
  const { list = [], total = 0 } = data

  const nav = useNavigate()

  const { loading: createLoading, run: handleCreateClick } = useRequest(createQuestionService, {
    manual: true,
    onSuccess(result) {
      nav(`/question/edit/${result.id || result._id}`)
      message.success('创建成功')
    },
  })

  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!loading) {
      setStarted(true)
    }
  }, [loading])

  // 处理搜索
  const handleSearch = (value: string) => {
    setStarted(false)
    setSearchParams({ [LIST_SEARCH_PARAM_KEY]: value })
  }

  // 恢复问卷
  const handleRecover = (id: string) => {
    confirm({
      title: '确定恢复该问卷?',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await updateQuestionService(id, { isDeleted: false })
        message.success('恢复成功')
        refresh()
      },
    })
  }

  // 彻底删除问卷
  const handleDelete = (id: string) => {
    confirm({
      title: '确定彻底删除该问卷?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后无法恢复',
      okType: 'danger',
      onOk: async () => {
        await deleteQuestionsService([id])
        message.success('删除成功')
        refresh()
      },
    })
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3} style={{ marginBottom: 0 }}>
            回收站
          </Title>
        </div>
        <div className={styles.right}>
          <Search
            placeholder="输入关键字"
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
            defaultValue={keyword}
          />
        </div>
      </div>
      <div className={styles.content}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        )}
        {!loading && started && list.length === 0 && (
          <div className={styles.emptyContainer}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className={styles.emptyText}>
                  <p>回收站为空</p>
                  <p className={styles.emptySubText}>删除的问卷将会保存在这里30天</p>
                </div>
              }
            />
          </div>
        )}
        {!loading && list.length > 0 && (
          <div className={styles.questionList}>
            {list.map((q: any) => {
              const { _id, title, createdAt } = q

              return (
                <div key={_id} className={styles.questionItem}>
                  <div className={styles.questionTitle} title={title || `文件标题${_id}`}>
                    {title || `文件标题${_id}`}
                  </div>
                  <div className={styles.questionInfo}>
                    <div className={styles.infoItem}>
                      <span>删除时间：</span>
                      <span>{new Date(createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={styles.questionActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleRecover(_id)}
                      title="恢复问卷"
                    >
                      <UndoOutlined />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.danger}`}
                      onClick={() => handleDelete(_id)}
                      title="彻底删除"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {!loading && list.length > 0 && (
          <div className={styles.loadMore}>{total > 6 && <div>共 {total} 项</div>}</div>
        )}
      </div>
    </>
  )
}

export default Trash
