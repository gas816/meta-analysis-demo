<template>
  <div class="analysis-container">
    <div class="controls">
      <el-form :inline="true">
        <el-form-item label="效应量指标">
          <el-select v-model="store.analysis.effectModel" style="width: 120px">
            <el-option label="OR" value="OR" />
            <el-option label="RR" value="RR" />
            <el-option label="MD" value="MD" />
            <el-option label="SMD" value="SMD" />
          </el-select>
        </el-form-item>
        <el-form-item label="剂量反应模型">
          <el-radio-group v-model="doseModel">
            <el-radio-button label="Linear" />
            <el-radio-button label="Non-linear" />
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="runAnalysis" :loading="loading">
            <el-icon><TrendCharts /></el-icon> 执行Meta分析
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="store.analysis.isAnalyzed" class="results-area">
      <el-alert
        title="异质性检验结果"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #default>
          <div>
            I² = {{ store.analysis.heterogeneity.i2 }}%, Q =
            {{ store.analysis.heterogeneity.q }}, p =
            {{ store.analysis.heterogeneity.p }}
          </div>
        </template>
      </el-alert>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-wrapper">
            <h4>森林图 (Forest Plot)</h4>
            <div ref="forestChartRef" class="chart"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-wrapper">
            <h4>漏斗图 (Funnel Plot)</h4>
            <div ref="funnelChartRef" class="chart"></div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { TrendCharts } from "@element-plus/icons-vue";
import * as echarts from "echarts";

const store = useMetaStore();
const loading = ref(false);
const doseModel = ref("Linear");
const forestChartRef = ref<HTMLElement | null>(null);
const funnelChartRef = ref<HTMLElement | null>(null);

const runAnalysis = async () => {
  loading.value = true;
  await store.runMetaAnalysis();
  loading.value = false;

  await nextTick();
  initCharts();
};

const initCharts = () => {
  // 使用静态数据示例，确保图表展示
  const mockData = [
    { author: "Smith et al.", effect_size: 1.2, ci_lower: 0.8, ci_upper: 1.6 },
    {
      author: "Johnson et al.",
      effect_size: 1.5,
      ci_lower: 1.1,
      ci_upper: 1.9,
    },
    { author: "Brown et al.", effect_size: 0.9, ci_lower: 0.6, ci_upper: 1.2 },
    { author: "Davis et al.", effect_size: 1.1, ci_lower: 0.9, ci_upper: 1.3 },
    { author: "Wilson et al.", effect_size: 1.8, ci_lower: 1.4, ci_upper: 2.2 },
  ];

  if (forestChartRef.value) {
    const forestChart = echarts.init(forestChartRef.value);
    forestChart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "value", splitLine: { show: true } },
      yAxis: {
        type: "category",
        data: mockData.map((d) => d.author),
      },
      series: [
        {
          name: "Placeholder",
          type: "bar",
          stack: "total",
          itemStyle: { color: "transparent" },
          data: mockData.map((d) => d.ci_lower),
        },
        {
          name: "95% CI",
          type: "bar",
          stack: "total",
          itemStyle: { color: "#409EFF" },
          data: mockData.map((d) => d.ci_upper - d.ci_lower),
        },
        {
          name: "Effect Size",
          type: "scatter",
          symbolSize: 10,
          itemStyle: { color: "#000" },
          z: 10,
          data: mockData.map((d, i) => [d.effect_size, i]),
        },
      ],
    });
  }

  if (funnelChartRef.value) {
    const funnelChart = echarts.init(funnelChartRef.value);
    funnelChart.setOption({
      tooltip: { trigger: "item" },
      xAxis: { name: "Effect Size", type: "value" },
      yAxis: { name: "SE", type: "value", inverse: true },
      series: [
        {
          symbolSize: 10,
          data: mockData.map((d) => [
            d.effect_size,
            (d.ci_upper - d.ci_lower) / 3.92,
          ]),
          type: "scatter",
        },
        // 添加漏斗辅助线
        {
          type: "line",
          markLine: {
            symbol: "none",
            lineStyle: { type: "dashed", color: "#999" },
            data: [{ xAxis: 1.3 }], // 假设平均效应量
          },
        },
      ],
    });
  }
};
</script>

<style scoped>
.controls {
  margin-bottom: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.chart-wrapper {
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 4px;
}
.chart {
  width: 100%;
  height: 300px;
}
h4 {
  text-align: center;
  margin-bottom: 10px;
}
</style>
