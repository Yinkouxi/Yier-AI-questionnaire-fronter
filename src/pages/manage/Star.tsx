import React, { FC, useState, useEffect } from 'react'
import { useTitle } from 'ahooks'
import { Typography, Empty, Spin, Button, Input, message, Modal, Radio } from 'antd'
import {
  StarFilled,
  StarOutlined,
  EditOutlined,
  LineChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useLoadQuestionListData from '../../hooks/useLoadQuestionListData'
import { LIST_SEARCH_PARAM_KEY } from '../../constant/index'
import styles from './common.module.scss'
import {
  updateQuestionService,
  duplicateQuestionService,
  createQuestionService,
} from '../../services/question'
import { useRequest } from 'ahooks'

const { Title } = Typography
const { Search } = Input

// 添加与List.tsx相同的日期格式化函数
const formatDateTime = (dateString: string) => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const Star: FC = () => {
  const nav = useNavigate()
  useTitle('YierQuestionnaire - 星标问卷')

  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || ''
  const isPublished = searchParams.get('isPublished') // 获取发布状态筛选参数

  // 修复: 只传递isStar参数，不传递keyword参数
  const { data = {}, loading, refresh } = useLoadQuestionListData({ isStar: true })
  const { list = [], total = 0 } = data

  // 本地过滤关键词搜索和发布状态
  const filteredList = list.filter((q: any) => {
    // 关键词筛选
    const matchKeyword = !keyword || q.title?.toLowerCase().includes(keyword.toLowerCase())

    // 发布状态筛选
    let matchPublished = true
    if (isPublished === 'true') {
      matchPublished = q.isPublished === true
    } else if (isPublished === 'false') {
      matchPublished = q.isPublished === false
    }

    return matchKeyword && matchPublished
  })

  // 用于本地更新数据的状态
  const [localList, setLocalList] = useState<any[]>([])

  // 在组件顶部添加started状态
  const [started, setStarted] = useState(false)

  // 数据加载完成后，更新本地状态
  useEffect(() => {
    if (!loading) {
      if (filteredList.length > 0) {
        setLocalList(filteredList)
      } else {
        setLocalList([])
      }
      setStarted(true) // 数据加载完成，设置started为true
    }
  }, [loading, filteredList, keyword])

  // 使用本地状态或过滤后的数据
  const displayList = localList.length > 0 || keyword ? localList : filteredList

  // 处理搜索
  const handleSearch = (value: string) => {
    setStarted(false) // 筛选条件变化，重置started
    const newParams: Record<string, string> = {}
    if (value) newParams[LIST_SEARCH_PARAM_KEY] = value
    if (isPublished !== null) newParams.isPublished = isPublished
    setSearchParams(newParams)
  }

  // 处理筛选
  const handleFilterChange = (e: any) => {
    setStarted(false) // 筛选条件变化，重置started
    const value = e.target.value
    const newParams: Record<string, string> = {}
    if (keyword) newParams[LIST_SEARCH_PARAM_KEY] = keyword
    if (value !== 'all') newParams.isPublished = value

    setSearchParams(newParams)
  }

  // 取消标星功能
  const handleStar = async (id: string) => {
    try {
      await updateQuestionService(id, { isStar: false })
      message.success('已取消星标')

      // 从本地列表中移除
      setLocalList(prevList => prevList.filter((q: any) => q._id !== id))
      // 刷新数据
      refresh()
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 编辑功能
  const handleEdit = (id: string) => {
    nav(`/question/edit/${id}`)
  }

  // 数据统计功能
  const handleStat = (id: string) => {
    nav(`/question/stat/${id}`)
  }

  // 复制问卷功能
  const handleCopy = async (id: string) => {
    try {
      // 显示加载状态
      const loadingMsg = message.loading({ content: '复制中...', duration: 0 })

      // 执行复制操作
      await duplicateQuestionService(id)

      // 关闭加载提示
      loadingMsg()

      message.success('复制成功')

      // 复制成功后，刷新数据但保持UI状态
      // 先设置loading状态，避免界面闪烁
      const tempList = [...localList]
      setLocalList([])

      // 刷新数据
      refresh()

      // 立即恢复原有列表，等待下一次useEffect自动更新
      setTimeout(() => {
        if (localList.length === 0) {
          setLocalList(tempList)
        }
      }, 100)
    } catch (error) {
      message.error('复制失败')
    }
  }

  // 删除问卷功能
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定将该问卷放入回收站吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await updateQuestionService(id, { isDeleted: true })
          message.success('已移至回收站')

          // 从本地列表中移除
          setLocalList(prevList => prevList.filter((q: any) => q._id !== id))
          refresh() // 确保数据同步
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  // 创建新问卷功能
  const { loading: createLoading, run: handleCreateClick } = useRequest(createQuestionService, {
    manual: true,
    onSuccess(result) {
      nav(`/question/edit/${result.id || result._id}`)
      message.success('创建成功')
    },
  })

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3} style={{ marginBottom: 0 }}>
            星标问卷
          </Title>
        </div>
        <div className={styles.right}>
          <Search
            placeholder="输入关键字"
            onSearch={handleSearch}
            style={{ width: 200, marginRight: '8px' }}
            allowClear
            defaultValue={keyword}
          />
          <Radio.Group
            onChange={handleFilterChange}
            value={isPublished === null ? 'all' : isPublished}
            optionType="button"
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="true">已发布</Radio.Button>
            <Radio.Button value="false">未发布</Radio.Button>
          </Radio.Group>
        </div>
      </div>
      <div className={styles.content}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        )}
        {!loading && started && displayList.length === 0 && (
          <div className={styles.emptyContainer}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className={styles.emptyText}>
                  <p>暂无星标问卷</p>
                  <p className={styles.emptySubText}>收藏重要的问卷，它们会显示在这里</p>
                </div>
              }
            />
          </div>
        )}
        {!loading && displayList.length > 0 && (
          <div className={styles.questionList}>
            {displayList.map((q: any) => {
              const { _id, title, isPublished, answerCount, createdAt } = q

              return (
                <div key={_id} className={styles.questionItem}>
                  <div className={styles.questionTitle} title={title || `文件标题${_id}`}>
                    <StarFilled style={{ color: '#fadb14', marginRight: '6px' }} />
                    {title || `文件标题${_id}`}
                  </div>
                  <div className={styles.questionInfo}>
                    <div className={styles.infoItem}>
                      <span>状态：</span>
                      <span>{isPublished ? '已发布' : '未发布'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span>答卷：</span>
                      <span>{answerCount || 0}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span>创建时间：</span>
                      <span>{formatDateTime(createdAt)}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span>更新时间：</span>
                      <span>{formatDateTime(q.updatedAt || createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.questionActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleStar(_id)}
                      title="取消星标"
                    >
                      <StarFilled />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEdit(_id)}
                      title="编辑问卷"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      className={`${styles.actionButton} ${!isPublished ? styles.disabled : ''}`}
                      onClick={() => isPublished && handleStat(_id)}
                      title={isPublished ? '数据统计' : '问卷未发布'}
                      disabled={!isPublished}
                    >
                      <LineChartOutlined />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleCopy(_id)}
                      title="复制问卷"
                    >
                      <CopyOutlined />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.danger}`}
                      onClick={() => handleDelete(_id)}
                      title="删除问卷"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {!loading && displayList.length > 0 && (
          <div className={styles.loadMore}>
            {total > 6 && (
              <div>
                显示 {displayList.length} / {total} 项
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Star
