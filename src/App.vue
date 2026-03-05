<script setup lang="ts">
import { provide, ref, computed } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import AnalysisCharts from "./components/AnalysisCharts.vue";
import DataExtraction from "./components/DataExtraction.vue";
import GradeEvaluation from "./components/GradeEvaluation.vue";
import InclusionExclusion from "./components/InclusionExclusion.vue";
import LiteratureScreening from "./components/LiteratureScreening.vue";
import PicoDefinition from "./components/PicoDefinition.vue";
import ProjectList from "./components/ProjectList.vue";
import ReportGeneration from "./components/ReportGeneration.vue";
import SearchStrategy from "./components/SearchStrategy.vue";
import { useMetaStore } from "./stores/metaStore";
import type { Project } from "./types";

// 当前视图
const currentView = ref<"project-list" | "project-detail">("project-list");
const currentProject = ref<Project | null>(null);

// store
const store = useMetaStore();

// 步骤条相关
const currentStep = ref(0);

// 步骤配置
const steps = [
  { title: "问题定义", description: "PICO Framework" },
  { title: "检索策略构建", description: "Search Strategy" },
  { title: "纳入与排除标准", description: "Eligibility Criteria" },
  { title: "文献爬取与筛选", description: "Literature Screening" },
  { title: "数据提取模板", description: "Data Extraction" },
  { title: "分析设置与图表", description: "Analysis & Charts" },
  { title: "GRADE评价", description: "Evidence Quality" },
  { title: "自动生成报告", description: "Report Generation" },
];

// 判断是否可以进行下一步/上一步
const canGoNext = computed(() => currentStep.value < steps.length - 1);
const canGoPrev = computed(() => currentStep.value > 0);

/**
 * 查看项目详情
 */
const viewProjectDetail = (project: Project) => {
  currentProject.value = project;
  currentView.value = "project-detail";
  currentStep.value = 0; // 重置到第一步

  // 加载项目数据到 store
  store.loadProjectData(project);
};

/**
 * 返回项目列表
 */
const backToProjectList = () => {
  currentView.value = "project-list";
  currentProject.value = null;
  currentStep.value = 0;
};

/**
 * 一键填充案例数据
 */
const fillExample = async () => {
  await store.fillXuExampleData();
};

/**
 * 下一步
 */
const nextStep = () => {
  if (canGoNext.value) {
    currentStep.value++;
  }
};

/**
 * 上一步
 */
const prevStep = () => {
  if (canGoPrev.value) {
    currentStep.value--;
  }
};

/**
 * 跳转到指定步骤
 */
const goToStep = (index: number) => {
  currentStep.value = index;
};

// 提供方法给子组件
provide("viewProjectDetail", viewProjectDetail);
provide("currentProject", currentProject);
</script>

<template>
  <div class="app-container">
    <!-- 项目列表视图 -->
    <ProjectList v-if="currentView === 'project-list'" />

    <!-- 项目详情视图 -->
    <div
      v-else-if="currentView === 'project-detail'"
      class="project-detail-view"
    >
      <header class="app-header">
        <div class="header-left">
          <el-button @click="backToProjectList" style="margin-right: 16px">
            ← 返回项目列表
          </el-button>
          <div>
            <h1>{{ currentProject?.name || "项目详情" }}</h1>
            <p class="subtitle">{{ currentProject?.description }}</p>
          </div>
        </div>
        <div style="margin-top: 20px">
          <el-button type="success" size="large" @click="fillExample">
            一键填充 Xu et al. (2020) 案例数据
          </el-button>
        </div>
      </header>

      <!-- 步骤条 -->
      <el-steps
        :active="currentStep"
        finish-status="success"
        align-center
        class="steps-container"
      >
        <el-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
          @click="goToStep(index)"
          style="cursor: pointer"
        />
      </el-steps>

      <main class="main-content">
        <!-- 步骤内容区域 -->
        <div class="step-content">
          <PicoDefinition v-if="currentStep === 0" />
          <SearchStrategy v-else-if="currentStep === 1" />
          <InclusionExclusion v-else-if="currentStep === 2" />
          <LiteratureScreening v-else-if="currentStep === 3" />
          <DataExtraction v-else-if="currentStep === 4" />
          <AnalysisCharts v-else-if="currentStep === 5" />
          <GradeEvaluation v-else-if="currentStep === 6" />
          <ReportGeneration v-else-if="currentStep === 7" />
        </div>

        <!-- 导航按钮 -->
        <div class="step-navigation">
          <el-button :disabled="!canGoPrev" @click="prevStep" size="large">
            <el-icon style="margin-right: 5px"><ArrowLeft /></el-icon>
            上一步
          </el-button>
          <el-button
            type="primary"
            :disabled="!canGoNext"
            @click="nextStep"
            size="large"
          >
            下一步
            <el-icon style="margin-left: 5px"><ArrowRight /></el-icon>
          </el-button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  font-family:
    "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.project-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: left;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

h1 {
  color: #303133;
  margin: 0 0 8px 0;
  font-size: 28px;
}

.subtitle {
  color: #606266;
  margin: 0;
  font-size: 14px;
}

.main-content {
  margin-top: 30px;
}

.steps-container {
  margin-bottom: 40px;
  padding: 0 20px;
}

.step-content {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.step-navigation {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 30px;
}

:deep(.el-step__title) {
  font-size: 14px;
}

:deep(.el-step__description) {
  font-size: 12px;
}

:deep(.el-step.is-horizontal .el-step__line) {
  top: 15px;
}
</style>
