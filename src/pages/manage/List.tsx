import React, { FC, useEffect, useState, useRef, useMemo } from 'react'
import { Typography, Spin, Empty, Button, Input, message, Modal, Radio } from 'antd'
import {
  PlusOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined,
  LineChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import { useTitle, useDebounceFn, useRequest } from 'ahooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  getQuestionListService,
  updateQuestionService,
  duplicateQuestionService,
  createQuestionService,
} from '../../services/question'
import { LIST_PAGE_SIZE, LIST_SEARCH_PARAM_KEY } from '../../constant/index'
import styles from './common.module.scss'

const { Title } = Typography
const { Search } = Input

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

const List: FC = () => {
  const nav = useNavigate()
  useTitle('YierQuestionnaire - 我的问卷')

  const [started, setStarted] = useState(false) // 是否已经开始加载（防抖，有延迟时间）
  const [page, setPage] = useState(1) // List 内部的数据，不在 url 参数中体现
  const [list, setList] = useState<any[]>([]) // 全部的列表数据，上划加载更多，累计
  const [total, setTotal] = useState(0)
  const haveMoreData = total > list.length // 有没有更多的、为加载完成的数据

  const [searchParams, setSearchParams] = useSearchParams() // url 参数，虽然没有 page pageSize ，但有 keyword
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || ''
  const isPublished = searchParams.get('isPublished') // 获取发布状态筛选参数

  // 创建新问卷
  const { loading: createLoading, run: handleCreateClick } = useRequest(createQuestionService, {
    manual: true,
    onSuccess(result) {
      nav(`/question/edit/${result.id || result._id}`)
      message.success('创建成功')
    },
  })

  // 处理搜索
  const handleSearch = (value: string) => {
    const newParams: Record<string, string> = {}
    if (value) newParams[LIST_SEARCH_PARAM_KEY] = value
    if (isPublished !== null) newParams.isPublished = isPublished
    setSearchParams(newParams)
  }

  // 处理筛选
  const handleFilterChange = (e: any) => {
    const value = e.target.value
    const newParams: Record<string, string> = {}
    if (keyword) newParams[LIST_SEARCH_PARAM_KEY] = keyword
    if (value !== 'all') newParams.isPublished = value

    setSearchParams(newParams)
  }

  // keyword 或 isPublished 变化时，重置信息
  useEffect(() => {
    setStarted(false)
    setPage(1)
    setList([])
    setTotal(0)
  }, [keyword, isPublished])

  // 真正加载
  const { run: load, loading } = useRequest(
    async () => {
      const params: any = {
        page,
        pageSize: LIST_PAGE_SIZE,
        keyword,
      }

      if (isPublished === 'true') {
        params.isPublished = true
      } else if (isPublished === 'false') {
        params.isPublished = false
      }

      const data = await getQuestionListService(params)
      return data
    },
    {
      manual: true,
      onSuccess(result) {
        const { list: l = [], total = 0 } = result
        setList(list.concat(l)) // 累计
        setTotal(total)
        setPage(page + 1)
      },
    }
  )

  // 尝试去触发加载 - 防抖
  const contentRef = useRef<HTMLDivElement>(null)
  const { run: tryLoadMore } = useDebounceFn(
    () => {
      const elem = contentRef.current
      if (elem == null) return

      // 检查滚动位置
      const { scrollTop, scrollHeight, clientHeight } = elem
      // 当距离底部50px时就开始加载
      if (scrollHeight - scrollTop - clientHeight < 50 && !loading && haveMoreData) {
        load() // 加载数据
        setStarted(true)
      }
    },
    {
      wait: 100, // 减少延迟时间
    }
  )

  // 当页面加载或参数变化时重置并加载初始数据
  useEffect(() => {
    // 重置状态
    setStarted(false)
    setPage(1)
    setList([])
    setTotal(0)

    // 手动触发第一页加载
    setTimeout(() => {
      load()
      setStarted(true)
    }, 0)
  }, [keyword, isPublished])

  // 监听内容区域的滚动事件
  useEffect(() => {
    const elem = contentRef.current
    if (!elem) return

    // 定义滚动处理函数
    const scrollHandler = () => tryLoadMore()

    // 添加滚动事件监听
    elem.addEventListener('scroll', scrollHandler)

    // 检查是否需要立即加载更多（针对内容高度不足的情况）
    setTimeout(() => {
      if (elem && haveMoreData && elem.scrollHeight <= elem.clientHeight) {
        tryLoadMore()
      }
    }, 500)

    // 清理函数
    return () => {
      if (elem) {
        elem.removeEventListener('scroll', scrollHandler)
      }
    }
  }, [haveMoreData, loading, list.length])

  // 标星/取消标星功能
  const handleStar = async (id: string, isStar: boolean) => {
    try {
      await updateQuestionService(id, { isStar: !isStar })
      message.success(isStar ? '已取消标星' : '已设为标星')

      // 更新本地数据，避免刷新
      setList(
        list.map(q => {
          if (q._id === id) {
            return { ...q, isStar: !isStar }
          }
          return q
        })
      )
    } catch (error) {
      message.error('操作失败')
    }
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

      // 保留当前列表状态，避免闪烁
      const currentList = [...list]

      // 重新加载数据，但确保UI不会闪烁
      setStarted(true) // 确保显示加载状态而不是空状态

      // 重置状态但保留旧数据
      setPage(1)

      // 重新加载第一页数据 - 移除isPublished参数，使用as any类型断言避免类型错误
      const params: any = {
        page: 1,
        pageSize: LIST_PAGE_SIZE,
        keyword,
      }

      // 如果有发布状态筛选，添加到参数中
      if (isPublished === 'true') {
        params.isPublished = true
      } else if (isPublished === 'false') {
        params.isPublished = false
      }

      const newData = await getQuestionListService(params)

      // 使用新数据更新列表
      if (newData && newData.list) {
        setList(newData.list)
        setTotal(newData.total || 0)
      } else {
        // 如果加载失败，恢复原列表
        setList(currentList)
      }
    } catch (error) {
      message.error('复制失败')
      // 确保不会显示空白页面
      if (list.length === 0) {
        load()
      }
    }
  }

  // 删除问卷功能（移至回收站）
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

          // 从列表中移除
          setList(list.filter(q => q._id !== id))
          setTotal(prev => prev - 1)
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  // LoadMore Elem
  const LoadMoreContentElem = useMemo(() => {
    if (loading) {
      return (
        <div>
          <Spin size="small" /> 加载中...
        </div>
      )
    }

    if (list.length === 0 && !loading) {
      return <Empty description="暂无数据" />
    }

    // 当总数不超过6个时，不显示加载信息
    if (total <= 6) {
      return null
    }

    if (list.length > 0 && !haveMoreData) {
      return <div>已全部加载，共 {total} 条数据</div>
    }

    return (
      <div>
        向下滚动加载更多（当前 {list.length}/{total}）
      </div>
    )
  }, [loading, list.length, total, haveMoreData])

  // 添加缺失的导航函数
  const handleEdit = (id: string) => {
    nav(`/question/edit/${id}`)
  }

  const handleStat = (id: string) => {
    nav(`/question/stat/${id}`)
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3} style={{ marginBottom: 0 }}>
            我的问卷
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
      <div className={styles.content} ref={contentRef}>
        {/* 问卷列表 */}
        {list.length === 0 && !loading ? (
          <div className={styles.emptyContainer}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className={styles.emptyText}>
                  <p>暂无问卷数据</p>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateClick}>
                    创建一个新问卷
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div className={styles.questionList}>
              {list.map((q: any) => {
                const { _id, title, isPublished, isStar, answerCount, createdAt } = q

                return (
                  <div key={_id} className={styles.questionItem}>
                    <div className={styles.questionTitle} title={title || `文件标题${_id}`}>
                      {isStar && <StarFilled style={{ color: '#fadb14', marginRight: '6px' }} />}
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
                        onClick={() => handleStar(_id, isStar)}
                        title={isStar ? '取消标星' : '标星'}
                      >
                        {isStar ? <StarFilled /> : <StarOutlined />}
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
            <div className={styles.loadMore}>{LoadMoreContentElem}</div>
          </>
        )}
      </div>
    </>
  )
}

export default List
