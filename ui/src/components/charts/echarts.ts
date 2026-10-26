import { use } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

/**
 * 按需注册：当前控制台只用到条形图与环形图。
 * 新增图表类型时在这里补注册，避免整包引入 echarts。
 */
use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
