import React, { useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'
import { Empty } from 'antd'
import { STAT_COLORS } from '../../../constant'

// 支持原始统计数据格式
interface SimpleChartProps {
  type: 'pie' | 'bar' | 'line' | 'area'
  data: Array<{ name: string; value: number; text?: string; count?: number }>
}

// 为所有图表类型添加相同的容器样式
const chartContainerStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

// 图表组件
const SimpleChart: React.FC<SimpleChartProps> = ({ type, data }) => {
  // 数据预处理 - 确保数据格式正确
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // 兼容不同的数据格式 - 有些数据可能使用count而不是value
    return data.map(item => ({
      name: item.text || item.name, // 使用text字段如果存在，否则使用name
      value: item.count !== undefined ? item.count : item.value, // 使用count字段如果存在，否则使用value
    }))
  }, [data])

  // 调试日志
  useEffect(() => {
    console.log('原始数据:', data)
    console.log('处理后数据:', processedData)
  }, [data, processedData])

  // 无数据时显示空状态
  if (!processedData || processedData.length === 0) {
    return <Empty description="暂无数据" className="chart-empty" />
  }

  // 饼图
  if (type === 'pie') {
    return (
      <div className="chart-container" style={chartContainerStyle}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              dataKey="value"
              data={processedData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STAT_COLORS[index % STAT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={value => [`${value}`, '数量']} labelFormatter={name => `${name}`} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 柱状图
  if (type === 'bar') {
    return (
      <div className="chart-container" style={chartContainerStyle}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={value => [`${value}`, '数量']} />
            <Legend />
            <Bar dataKey="value" name="数量" barSize={30}>
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STAT_COLORS[index % STAT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 折线图
  if (type === 'line') {
    return (
      <div className="chart-container" style={chartContainerStyle}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={value => [`${value}`, '数量']} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="数量"
              stroke="#1890ff"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 面积图
  if (type === 'area') {
    return (
      <div className="chart-container" style={chartContainerStyle}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={value => [`${value}`, '数量']} />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              name="数量"
              fill="url(#colorValue)"
              stroke="#1890ff"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return <Empty description="未知图表类型" className="chart-empty" />
}

export default SimpleChart
