<script setup lang="ts">
import { ref } from "vue";
import { useMetaStore } from "./stores/metaStore";
import PicoDefinition from "./components/PicoDefinition.vue";
import SearchStrategy from "./components/SearchStrategy.vue";
import InclusionExclusion from "./components/InclusionExclusion.vue";
import LiteratureScreening from "./components/LiteratureScreening.vue";
import DataExtraction from "./components/DataExtraction.vue";
import AnalysisCharts from "./components/AnalysisCharts.vue";
import GradeEvaluation from "./components/GradeEvaluation.vue";
import ReportGeneration from "./components/ReportGeneration.vue";

const activeNames = ref(["1"]);
const store = useMetaStore();

const fillExample = async () => {
  await store.fillXuExampleData();
  // Expand all panels to show the filled data
  activeNames.value = ["1", "2", "3", "4", "5", "6", "7", "8"];
};
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>大模型驱动的 Meta 分析工具 (Demo)</h1>
      <p class="subtitle">AI-Driven Meta-Analysis Assistant</p>
      <div style="margin-top: 20px">
        <el-button type="success" size="large" @click="fillExample">
          一键填充 Xu et al. (2020) 案例数据
        </el-button>
      </div>
    </header>

    <main class="main-content">
      <el-collapse v-model="activeNames">
        <el-collapse-item title="1. 问题定义 (PICO Framework)" name="1">
          <PicoDefinition />
        </el-collapse-item>

        <el-collapse-item title="2. 检索策略构建 (Search Strategy)" name="2">
          <SearchStrategy />
        </el-collapse-item>

        <el-collapse-item
          title="3. 纳入与排除标准 (Eligibility Criteria)"
          name="3"
        >
          <InclusionExclusion />
        </el-collapse-item>

        <el-collapse-item
          title="4. 文献爬取与筛选 (Literature Screening)"
          name="4"
        >
          <LiteratureScreening />
        </el-collapse-item>

        <el-collapse-item title="5. 数据提取模板 (Data Extraction)" name="5">
          <DataExtraction />
        </el-collapse-item>

        <el-collapse-item
          title="6. 分析设置与图表生成 (Analysis & Charts)"
          name="6"
        >
          <AnalysisCharts />
        </el-collapse-item>

        <el-collapse-item
          title="7. GRADE 证据质量评价 (Evidence Quality)"
          name="7"
        >
          <GradeEvaluation />
        </el-collapse-item>

        <el-collapse-item title="8. 自动生成报告 (Report Generation)" name="8">
          <ReportGeneration />
        </el-collapse-item>
      </el-collapse>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: #303133;
  margin-bottom: 10px;
}

.subtitle {
  color: #909399;
  font-size: 1.2em;
}

.main-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  background-color: #f5f7fa;
  padding-left: 15px;
  border-radius: 4px;
  margin-bottom: 5px;
  border: none;
}

:deep(.el-collapse-item__wrap) {
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 20px;
}
</style>
