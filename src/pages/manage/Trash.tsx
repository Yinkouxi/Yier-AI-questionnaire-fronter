import React, { FC, useState, useEffect, useRef, useMemo } from 'react'
import { useTitle } from 'ahooks'
import { Typography, Empty, Button, Spin, message, Input, Modal, Badge, Checkbox } from 'antd'
import {
  ExclamationCircleOutlined,
  UndoOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { useSearchParams } from 'react-router-dom'
import useLoadQuestionListData from '../../hooks/useLoadQuestionListData'
import {
  updateQuestionService,
  deleteQuestionsService,
  createQuestionService,
  getQuestionListService,
} from '../../services/question'
import { LIST_SEARCH_PARAM_KEY, LIST_PAGE_SIZE } from '../../constant/index'
import styles from './common.module.scss'
import { useNavigate } from 'react-router-dom'
import { useDebounceFn } from 'ahooks'

const { Title } = Typography
const { Search } = Input
const { confirm } = Modal

const Trash: FC = () => {
  useTitle('YierQuestionnaire - 回收站')

  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || ''

  const { data = {}, loading, refresh } = useLoadQuestionListData({ isDeleted: true })
  const { list: initialList = [], total: initialTotal = 0 } = data

  const nav = useNavigate()

  const { loading: createLoading, run: handleCreateClick } = useRequest(createQuestionService, {
    manual: true,
    onSuccess(result) {
      nav(`/question/edit/${result.id || result._id}`)
      message.success('创建成功')
    },
  })

  const [started, setStarted] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const haveMoreData = initialTotal > initialList.length

  const contentRef = useRef<HTMLDivElement>(null)
  const { run: tryLoadMore } = useDebounceFn(
    () => {
      const elem = contentRef.current
      if (elem == null) return

      const { scrollTop, scrollHeight, clientHeight } = elem
      if (scrollHeight - scrollTop - clientHeight < 50 && !loading && haveMoreData) {
        loadMore()
      }
    },
    {
      wait: 100,
    }
  )

  const [localList, setLocalList] = useState<any[]>([])
  const [localTotal, setLocalTotal] = useState(0)

  const displayList = localList.length > 0 ? localList : initialList
  const displayTotal = localTotal > 0 ? localTotal : initialTotal

  useEffect(() => {
    if (!loading) {
      setLocalList(initialList)
      setLocalTotal(initialTotal)
      setStarted(true)
    }
  }, [loading, initialList, initialTotal])

  const loadMore = async () => {
    if (!haveMoreData || loading) return

    const params: any = {
      page: page + 1,
      pageSize: LIST_PAGE_SIZE,
      isDeleted: true,
      keyword,
    }

    try {
      const data = await getQuestionListService(params)
      if (data && data.list) {
        const newList = [...displayList, ...data.list]
        const { total: newTotal } = data

        setLocalList(newList)
        setLocalTotal(newTotal || 0)
        setPage(page + 1)
      }
    } catch (error) {
      message.error('加载失败')
    }
  }

  useEffect(() => {
    const elem = contentRef.current
    if (!elem) return

    const scrollHandler = () => tryLoadMore()
    elem.addEventListener('scroll', scrollHandler)

    setTimeout(() => {
      if (elem && haveMoreData && elem.scrollHeight <= elem.clientHeight) {
        tryLoadMore()
      }
    }, 500)

    return () => {
      if (elem) {
        elem.removeEventListener('scroll', scrollHandler)
      }
    }
  }, [haveMoreData, loading, displayList.length])

  const LoadMoreContentElem = useMemo(() => {
    if (loading && page === 1) {
      return (
        <div>
          <Spin size="small" /> 加载中...
        </div>
      )
    }

    if (displayList.length === 0 && !loading) {
      return null
    }

    if (displayTotal <= 6) {
      return null
    }

    if (displayList.length > 0 && !haveMoreData) {
      return <div>已全部加载，共 {displayTotal} 条数据</div>
    }

    if (loading && page > 1) {
      return (
        <div>
          <Spin size="small" /> 加载更多...
        </div>
      )
    }

    return (
      <div>
        向下滚动加载更多（当前 {displayList.length}/{displayTotal}）
      </div>
    )
  }, [loading, displayList.length, displayTotal, haveMoreData, page])

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

  // 切换管理模式
  const toggleManageMode = () => {
    setIsManageMode(!isManageMode)
    setSelectedIds([])
  }

  // 选择项
  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(item => item !== id))
    }
  }

  // 全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayList.map((q: any) => q._id))
    } else {
      setSelectedIds([])
    }
  }

  // 批量恢复
  const handleBatchRecover = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择问卷')
      return
    }

    confirm({
      title: '确定恢复所选问卷?',
      icon: <ExclamationCircleOutlined />,
      content: `此操作将恢复 ${selectedIds.length} 个问卷`,
      onOk: async () => {
        try {
          const loadingMsg = message.loading({ content: '操作中...', duration: 0 })

          const promises = selectedIds.map(id => updateQuestionService(id, { isDeleted: false }))

          await Promise.all(promises)
          loadingMsg()

          message.success(`已恢复 ${selectedIds.length} 个问卷`)

          // 退出管理模式并刷新
          setIsManageMode(false)
          setSelectedIds([])
          refresh()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  // 批量彻底删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择问卷')
      return
    }

    confirm({
      title: '确定彻底删除所选问卷?',
      icon: <ExclamationCircleOutlined />,
      content: `此操作将永久删除 ${selectedIds.length} 个问卷，无法恢复`,
      okType: 'danger',
      onOk: async () => {
        try {
          const loadingMsg = message.loading({ content: '删除中...', duration: 0 })

          // 批量删除的API
          await deleteQuestionsService(selectedIds)

          loadingMsg()

          message.success(`已彻底删除 ${selectedIds.length} 个问卷`)

          // 退出管理模式并刷新
          setIsManageMode(false)
          setSelectedIds([])
          refresh()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // 编辑问卷
  const handleEdit = (id: string) => {
    nav(`/question/edit/${id}`)
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
            style={{ width: 200, marginRight: '8px' }}
            allowClear
            defaultValue={keyword}
          />
          <Button
            type={isManageMode ? 'primary' : 'default'}
            onClick={toggleManageMode}
            style={{ marginRight: '8px' }}
          >
            {isManageMode ? '退出管理' : '管理'}
          </Button>
          {isManageMode && (
            <Badge count={selectedIds.length}>
              <Button.Group>
                <Button
                  type="primary"
                  onClick={handleBatchRecover}
                  disabled={selectedIds.length === 0}
                >
                  批量恢复
                </Button>
                <Button danger onClick={handleBatchDelete} disabled={selectedIds.length === 0}>
                  批量彻底删除
                </Button>
              </Button.Group>
            </Badge>
          )}
        </div>
      </div>
      <div className={styles.content} ref={contentRef}>
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
                  <p>回收站为空</p>
                  <p className={styles.emptySubText}>删除的问卷将会保存在这里30天</p>
                </div>
              }
            />
          </div>
        )}
        {!loading && displayList.length > 0 && (
          <div className={styles.questionList}>
            {isManageMode && (
              <div className={styles.batchActions}>
                <Checkbox
                  onChange={e => handleSelectAll(e.target.checked)}
                  checked={selectedIds.length === displayList.length && displayList.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < displayList.length}
                >
                  全选
                </Checkbox>
                <div>
                  <Button
                    type="primary"
                    style={{ marginRight: 8 }}
                    onClick={handleBatchRecover}
                    disabled={selectedIds.length === 0}
                  >
                    批量恢复
                  </Button>
                  <Button danger onClick={handleBatchDelete} disabled={selectedIds.length === 0}>
                    批量彻底删除
                  </Button>
                </div>
              </div>
            )}
            {displayList.map((q: any) => {
              const { _id, title, createdAt } = q

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
        {!loading && displayList.length > 0 && (
          <div className={styles.loadMore}>{LoadMoreContentElem}</div>
        )}
      </div>
    </>
  )
}

export default Trash
