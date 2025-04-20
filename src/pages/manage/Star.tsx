import React, { FC, useState, useEffect, useRef, useMemo } from 'react'
import { useTitle } from 'ahooks'
import {
  Typography,
  Empty,
  Spin,
  Button,
  Input,
  message,
  Modal,
  Radio,
  Badge,
  Checkbox,
} from 'antd'
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
import { LIST_SEARCH_PARAM_KEY, LIST_PAGE_SIZE } from '../../constant/index'
import styles from './common.module.scss'
import {
  updateQuestionService,
  duplicateQuestionService,
  createQuestionService,
  getQuestionListService,
} from '../../services/question'
import { useRequest, useDebounceFn } from 'ahooks'

const { Title } = Typography
const { Search } = Input

// 日期格式化函数
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

  // 分页相关状态
  const [list, setList] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)

  // 管理模式相关状态
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 计算是否还有更多数据
  const haveMoreData = total > list.length

  // 内容区域的ref，用于监听滚动
  const contentRef = useRef<HTMLDivElement>(null)

  // 加载数据的核心函数
  const loadData = async (p = 1, append = false) => {
    const params: Record<string, any> = {
      page: p,
      pageSize: LIST_PAGE_SIZE,
      isStar: true,
    }

    if (keyword) {
      params.keyword = keyword
    }

    if (isPublished === 'true') {
      params.isPublished = true
    } else if (isPublished === 'false') {
      params.isPublished = false
    }

    setLoading(true)
    try {
      const res = await getQuestionListService(params)
      const { list: newList = [], total: newTotal = 0 } = res || {}

      // 根据append判断是追加还是覆盖
      if (append) {
        setList(l => [...l, ...newList])
      } else {
        setList(newList)
      }
      setTotal(newTotal)
      setPage(p)
      setStarted(true)
    } catch (error) {
      console.error('加载出错:', error)
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载更多
  const loadMore = async () => {
    if (loading || !haveMoreData) return
    await loadData(page + 1, true)
  }

  // 初始加载
  useEffect(() => {
    setStarted(false)
    setPage(1)
    setList([])
    loadData(1, false)
  }, [keyword, isPublished])

  // 防抖处理滚动加载
  const { run: tryLoadMore } = useDebounceFn(
    () => {
      const elem = contentRef.current
      if (elem == null) return

      const { scrollTop, scrollHeight, clientHeight } = elem
      const distance = scrollHeight - scrollTop - clientHeight

      if (distance < 50 && !loading && haveMoreData) {
        loadMore()
      }
    },
    { wait: 100 }
  )

  // 滚动监听
  useEffect(() => {
    const elem = contentRef.current
    if (elem == null) return

    elem.addEventListener('scroll', tryLoadMore)

    return () => {
      elem.removeEventListener('scroll', tryLoadMore)
    }
  }, [tryLoadMore])

  // 初次渲染后检查是否需要立即加载更多
  useEffect(() => {
    const elem = contentRef.current
    if (elem && started && haveMoreData && elem.scrollHeight <= elem.clientHeight) {
      loadMore()
    }
  }, [started, haveMoreData])

  // 搜索处理
  const handleSearch = (value: string) => {
    const newParams: Record<string, string> = {}
    if (value) newParams[LIST_SEARCH_PARAM_KEY] = value
    if (isPublished !== null && isPublished !== 'all') newParams.isPublished = isPublished
    setSearchParams(newParams)
  }

  // 筛选处理
  const handleFilterChange = (e: any) => {
    const value = e.target.value
    const newParams: Record<string, string> = {}
    if (keyword) newParams[LIST_SEARCH_PARAM_KEY] = keyword
    if (value !== 'all') newParams.isPublished = value
    setSearchParams(newParams)
  }

  // 添加切换管理模式的函数
  const toggleManageMode = () => {
    setIsManageMode(!isManageMode)
    setSelectedIds([])
  }

  // 添加选择项的函数
  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(item => item !== id))
    }
  }

  // 添加全选功能
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map((q: any) => q._id))
    } else {
      setSelectedIds([])
    }
  }

  // 批量取消标星函数
  const handleBatchUnstar = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择问卷')
      return
    }

    try {
      const loadingMsg = message.loading({ content: '操作中...', duration: 0 })

      const promises = selectedIds.map(id => updateQuestionService(id, { isStar: false }))

      await Promise.all(promises)
      loadingMsg()

      message.success(`已取消 ${selectedIds.length} 个问卷的标星`)

      // 从本地列表中移除
      setList(prevList => prevList.filter(q => !selectedIds.includes(q._id)))
      setTotal(prev => prev - selectedIds.length)

      // 退出管理模式并刷新
      setIsManageMode(false)
      setSelectedIds([])
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

      // 刷新第一页数据
      loadData(1, false)
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
          setList(prevList => prevList.filter((q: any) => q._id !== id))
          setTotal(prev => prev - 1)
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

  // 添加取消标星功能
  const handleStar = async (id: string) => {
    try {
      await updateQuestionService(id, { isStar: false })
      message.success('已取消标星')

      // 从列表中移除
      setList(prevList => prevList.filter(q => q._id !== id))
      setTotal(prev => prev - 1)
    } catch (error) {
      message.error('操作失败')
    }
  }

  // LoadMore元素
  const LoadMoreContentElem = useMemo(() => {
    if (loading && page === 1) {
      return (
        <div>
          <Spin size="small" /> 加载中...
        </div>
      )
    }

    if (list.length === 0 && !loading) {
      return null
    }

    if (total <= 6) {
      return null
    }

    if (list.length >= total) {
      return <div>已全部加载，共 {total} 条数据</div>
    }

    if (loading) {
      return (
        <div>
          <Spin size="small" /> 加载更多...
        </div>
      )
    }

    return (
      <div>
        向下滚动加载更多（当前 {list.length}/{total}）
      </div>
    )
  }, [loading, list.length, total, page])

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
            style={{ marginRight: '8px' }}
          >
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="true">已发布</Radio.Button>
            <Radio.Button value="false">未发布</Radio.Button>
          </Radio.Group>
          <Button
            type={isManageMode ? 'primary' : 'default'}
            onClick={toggleManageMode}
            style={{ marginRight: '8px' }}
          >
            {isManageMode ? '退出管理' : '管理'}
          </Button>
          {isManageMode && (
            <Badge count={selectedIds.length}>
              <Button danger onClick={handleBatchUnstar} disabled={selectedIds.length === 0}>
                批量取消标星
              </Button>
            </Badge>
          )}
        </div>
      </div>
      <div className={styles.content} ref={contentRef}>
        {loading && page === 1 && (
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
                  <p>暂无星标问卷</p>
                  <p className={styles.emptySubText}>收藏重要的问卷，它们会显示在这里</p>
                </div>
              }
            />
          </div>
        )}
        {list.length > 0 && (
          <div className={styles.questionList}>
            {isManageMode && (
              <div className={styles.batchActions}>
                <Checkbox
                  onChange={e => handleSelectAll(e.target.checked)}
                  checked={selectedIds.length === list.length && list.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < list.length}
                >
                  全选
                </Checkbox>
                <div>
                  <Button danger onClick={handleBatchUnstar} disabled={selectedIds.length === 0}>
                    批量取消标星
                  </Button>
                </div>
              </div>
            )}
            {list.map((q: any) => {
              const { _id, title, isPublished, answerCount, createdAt } = q

              return (
                <div
                  key={_id}
                  className={`${styles.questionItem} ${isManageMode ? styles.manageMode : ''} ${
                    selectedIds.includes(_id) ? styles.selected : ''
                  }`}
                  onClick={e => {
                    if (
                      (e.target as HTMLElement).closest(`.${styles.questionActions}`) ||
                      (e.target as HTMLElement).closest(`.${styles.itemCheckbox}`)
                    ) {
                      return
                    }
                    handleEdit(_id)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {isManageMode && (
                    <Checkbox
                      className={styles.itemCheckbox}
                      onChange={e => handleSelect(_id, e.target.checked)}
                      checked={selectedIds.includes(_id)}
                    />
                  )}
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
                      title="取消标星"
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
        {list.length > 0 && <div className={styles.loadMore}>{LoadMoreContentElem}</div>}
      </div>
    </>
  )
}

export default Star
