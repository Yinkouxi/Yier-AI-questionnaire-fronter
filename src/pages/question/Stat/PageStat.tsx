import React, { FC, useState, useMemo } from 'react'
import { Typography, Spin, Table, Pagination, Button, message } from 'antd'
import { useRequest } from 'ahooks'
import { useParams } from 'react-router-dom'
import { getQuestionStatListService } from '../../../services/stat'
import useGetComponentInfo from '../../../hooks/useGetComponentInfo'
import { STAT_PAGE_SIZE } from '../../../constant'
import { DownloadOutlined } from '@ant-design/icons'
import styles from './PageStat.module.scss'
import useGetPageInfo from '../../../hooks/useGetPageInfo'
import * as XLSX from 'xlsx'

const { Title } = Typography

type PropsType = {
  selectedComponentId: string
  setSelectedComponentId: (id: string) => void
  setSelectedComponentType: (type: string) => void
}

const PageStat: FC<PropsType> = (props: PropsType) => {
  const { selectedComponentId, setSelectedComponentId, setSelectedComponentType } = props
  const { id = '' } = useParams()
  const { title } = useGetPageInfo()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(STAT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [list, setList] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  const { loading } = useRequest(
    async () => {
      const res = await getQuestionStatListService(id, { page, pageSize })
      return res
    },
    {
      refreshDeps: [id, page, pageSize],
      onSuccess(res) {
        const { total, list = [] } = res
        setTotal(total)
        setList(list)
      },
    }
  )

  const { componentList } = useGetComponentInfo()

  const columns = useMemo(() => {
    return componentList.map(c => {
      const { fe_id, title, props = {}, type } = c
      const colTitle = props!.title || title

      return {
        title: (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedComponentId(fe_id)
              setSelectedComponentType(type)
            }}
          >
            <span style={{ color: fe_id === selectedComponentId ? '#1890ff' : 'inherit' }}>
              {colTitle}
            </span>
          </div>
        ),
        dataIndex: fe_id,
      }
    })
  }, [componentList, selectedComponentId, setSelectedComponentId, setSelectedComponentType])

  const dataSource = useMemo(() => {
    return list.map((i: any) => ({ ...i, key: i._id }))
  }, [list])

  // 获取所有数据的函数
  const fetchAllData = async (): Promise<any[]> => {
    try {
      // 这里设置一个较大的页面大小，保证一次获取所有数据
      const res = await getQuestionStatListService(id, { page: 1, pageSize: total || 1000 })
      return res.list || []
    } catch (error) {
      console.error('获取所有数据失败:', error)
      message.error('获取数据失败')
      return []
    }
  }

  // 导出所有数据到Excel
  const exportToExcel = async () => {
    if (total <= 0) {
      message.info('没有数据可导出')
      return
    }

    try {
      setExportLoading(true)

      // 获取所有数据
      const allData = await fetchAllData()
      if (allData.length === 0) {
        message.info('没有数据可导出')
        return
      }

      // 准备表头
      const headerRow = columns.map(col => {
        if (typeof col.title === 'object' && col.title.props && col.title.props.children) {
          return col.title.props.children.props.children
        }
        return col.title || ''
      })

      // 准备数据
      const worksheetData = [headerRow]
      allData.forEach((item: Record<string, any>) => {
        const row = columns.map(col => {
          const key = col.dataIndex as string
          return item[key] || ''
        })
        worksheetData.push(row)
      })

      // 创建工作簿
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '问卷数据')

      // 生成文件名
      const fileName = `${title || '问卷'}_数据_${new Date().toLocaleDateString()}.xlsx`

      // 导出
      XLSX.writeFile(workbook, fileName)
      message.success(`导出成功，共${allData.length}条数据`)
    } catch (error) {
      console.error('导出失败:', error)
      message.error('导出失败')
    } finally {
      setExportLoading(false)
    }
  }

  // 更新自定义表格样式
  const customTableStyle = `
    .ant-table-body {
      height: calc(100% - 48px) !important;
    }

    /* 标准化表格行高，但不使用flex布局 */
    .ant-table-tbody > tr {
      height: 44px;
    }
  `

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <style>{customTableStyle}</style>
      <div className={styles.header}>
        <Title level={3} className={styles.headerTitle}>
          答卷数量: {total}
        </Title>
        <Button
          className={styles.exportButton}
          icon={<DownloadOutlined />}
          onClick={exportToExcel}
          loading={exportLoading}
        >
          导出
        </Button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.table}>
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="middle"
            bordered={false}
            rowClassName={() => styles.tableRow}
          />
        </div>

        <div className={styles.footer}>
          <Pagination
            total={total}
            pageSize={pageSize}
            current={page}
            onChange={page => setPage(page)}
            onShowSizeChange={(page, pageSize) => {
              setPage(page)
              setPageSize(pageSize)
            }}
            size="small"
            showSizeChanger={false}
          />
        </div>
      </div>
    </div>
  )
}

export default PageStat
