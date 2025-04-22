import React, { FC, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Typography, Card, Empty, Spin, Tabs, message, Button, Dropdown } from 'antd'
import { useRequest } from 'ahooks'
import { getComponentStatService } from '../../../services/stat'
import { getComponentConfByType } from '../../../components/QuestionComponents'
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import SimpleChart from './SimpleChart'
import { STAT_COLORS } from '../../../constant'
import styles from './ChartStat.module.scss'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

const { Title } = Typography

type PropsType = {
  selectedComponentId: string
  selectedComponentType: string
}

// 定义图表类型
type ChartType = 'pie' | 'bar' | 'line' | 'area'

const ChartStat: FC<PropsType> = (props: PropsType) => {
  const { selectedComponentId, selectedComponentType } = props
  const { id = '' } = useParams()
  const [chartType, setChartType] = useState<ChartType>('pie')
  const [stat, setStat] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chartKey, setChartKey] = useState(0)
  const [exportLoading, setExportLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  // 检查是否是可视化图表组件
  const canUseChart =
    selectedComponentType.includes('Radio') || selectedComponentType.includes('Checkbox')

  // 获取组件统计数据
  const { run } = useRequest(
    async () => {
      if (!selectedComponentId || !id) return null
      setIsLoading(true)
      try {
        return await getComponentStatService(id, selectedComponentId)
      } catch (error) {
        message.error('获取统计数据失败')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    {
      manual: true,
      onSuccess: res => {
        if (res && res.stat) {
          setStat(res.stat)
        } else {
          setStat([])
        }
      },
    }
  )

  // 组件ID变化时获取数据
  useEffect(() => {
    if (selectedComponentId) {
      run()
    } else {
      setStat([])
    }
  }, [selectedComponentId, run])

  // 切换图表类型
  const handleChartTypeChange = (key: string) => {
    setChartType(key as ChartType)
    setChartKey(prev => prev + 1)
  }

  // 修改导出图表为图片的函数
  const exportAsImage = async () => {
    if (!chartRef.current || !stat.length) {
      message.info('没有可导出的图表')
      return
    }

    try {
      setExportLoading(true)
      const element = chartRef.current

      // 使用类型断言绕过TypeScript检查
      const options = {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      } as any // 强制转换为any类型

      const canvas = await html2canvas(element, options)

      const imageData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `图表统计_${chartType}_${new Date().getTime()}.png`
      link.href = imageData
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      message.success('图表已导出为图片')
    } catch (error) {
      console.error('导出图片失败:', error)
      message.error('导出失败，请重试')
    } finally {
      setExportLoading(false)
    }
  }

  // 导出统计数据为Excel
  const exportAsExcel = () => {
    if (!stat.length) {
      message.info('没有可导出的数据')
      return
    }

    try {
      setExportLoading(true)

      // 处理数据
      const processedData = stat.map(item => ({
        选项: item.text || item.name || '',
        数量: item.count !== undefined ? item.count : item.value || 0,
        百分比: `${(
          ((item.count || item.value || 0) /
            stat.reduce((sum, i) => sum + (i.count || i.value || 0), 0)) *
          100
        ).toFixed(2)}%`,
      }))

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(processedData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '统计数据')

      // 设置列宽
      const colWidths = [{ wch: 20 }, { wch: 10 }, { wch: 10 }]
      ws['!cols'] = colWidths

      // 导出文件
      XLSX.writeFile(wb, `统计数据_${chartType}_${new Date().getTime()}.xlsx`)

      message.success('数据已导出为Excel')
    } catch (error) {
      console.error('导出Excel失败:', error)
      message.error('导出失败，请重试')
    } finally {
      setExportLoading(false)
    }
  }

  // 恢复导出菜单的两个选项
  const exportMenu = {
    items: [
      {
        key: 'image',
        label: '导出为图片',
        icon: <BarChartOutlined />,
        onClick: exportAsImage,
      },
      {
        key: 'excel',
        label: '导出为Excel',
        icon: <DownloadOutlined />,
        onClick: exportAsExcel,
      },
    ],
  }

  // Tab选项
  const items = [
    {
      key: 'pie',
      label: (
        <span>
          <PieChartOutlined /> 饼图
        </span>
      ),
    },
    {
      key: 'bar',
      label: (
        <span>
          <BarChartOutlined /> 柱状图
        </span>
      ),
    },
    {
      key: 'line',
      label: (
        <span>
          <LineChartOutlined /> 折线图
        </span>
      ),
    },
    {
      key: 'area',
      label: (
        <span>
          <AreaChartOutlined /> 面积图
        </span>
      ),
    },
  ]

  // 渲染图表内容
  const renderContent = () => {
    if (!selectedComponentId) {
      return (
        <div className={styles.emptyHolder}>
          <Empty description="请先选择一个组件" />
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className={styles.loadingHolder}>
          <Spin tip="加载中..." />
        </div>
      )
    }

    if (!canUseChart) {
      // 获取组件类型的展示名称
      const componentConf = getComponentConfByType(selectedComponentType)
      const componentTypeName = componentConf?.title || selectedComponentType

      return (
        <div className={styles.unsupportedHolder}>
          <div className={styles.unsupportedContent}>
            <InfoCircleOutlined className={styles.unsupportedIcon} />
            <h3 className={styles.unsupportedTitle}>{componentTypeName} 组件数据展示</h3>
            <p className={styles.unsupportedDesc}>
              当前组件类型为 &ldquo;{componentTypeName}
              &rdquo;，该类型组件以表格形式展示数据更为合适。
            </p>
            <p className={styles.unsupportedTips}>
              请在左侧表格中查看详细数据，或选择单选/多选类型的组件以查看图表统计。
            </p>
            <Button
              type="primary"
              className={styles.viewTableBtn}
              onClick={() => message.info('查看左侧表格数据')}
            >
              查看表格数据
            </Button>
          </div>
        </div>
      )
    }

    if (!stat || stat.length === 0) {
      return (
        <div className={styles.emptyHolder}>
          <Empty description="暂无统计数据" />
        </div>
      )
    }

    // 渲染对应图表
    return <SimpleChart key={`chart-${chartType}-${chartKey}`} type={chartType} data={stat} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={3}>图表统计</Title>
        {stat.length > 0 && canUseChart && (
          <Dropdown menu={exportMenu} placement="bottomRight">
            <Button
              type="default"
              className={styles.exportButton}
              icon={<DownloadOutlined />}
              loading={exportLoading}
            >
              导出
            </Button>
          </Dropdown>
        )}
      </div>

      <Card className={styles.chartCard} bordered={false}>
        {canUseChart && (
          <Tabs
            className={styles.chartTabs}
            activeKey={chartType}
            onChange={handleChartTypeChange}
            items={items}
            destroyInactiveTabPane
          />
        )}

        <div className={styles.chartContent} ref={chartRef}>
          {renderContent()}
        </div>

        {stat && stat.length > 0 && canUseChart && (
          <div className={styles.chartLegend}>
            {stat.map((item, index) => {
              // 处理不同格式的数据
              const name = item.text || item.name || ''
              const value = item.count !== undefined ? item.count : item.value || 0

              return (
                <div key={index} className={styles.legendItem}>
                  <span
                    className={styles.colorBlock}
                    style={{ backgroundColor: STAT_COLORS[index % STAT_COLORS.length] }}
                  />
                  <span className={styles.legendName}>{name}</span>
                  <span className={styles.legendValue}>{value}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

export default ChartStat
