<template>
  <div class="screening-container">
    <div class="search-action-area">
      <el-alert
        title="数据库对接模式"
        type="info"
        description="本工具将根据步骤 2 生成的检索策略，直接对接选中的数据库获取文献列表。"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <div class="fetch-controls">
        <el-button
          type="primary"
          size="large"
          @click="fetchDocs"
          :loading="fetching"
        >
          <el-icon><Download /></el-icon> 执行检索并获取文献 (Fetch from
          Databases)
        </el-button>
        <span v-if="store.literatures.length > 0" class="result-count">
          共检索到 {{ store.literatures.length }} 篇文献
        </span>
      </div>
    </div>

    <el-divider />

    <div class="action-bar">
      <el-button
        type="success"
        @click="autoScreen"
        :loading="screening"
        :disabled="store.literatures.length === 0"
      >
        <el-icon><Cpu /></el-icon> 自动筛选建议 (AI)
      </el-button>
    </div>

    <el-table
      :data="store.literatures"
      style="width: 100%"
      border
      empty-text="暂无文献，请先执行检索"
    >
      <el-table-column prop="title" label="Title" min-width="200" />
      <el-table-column prop="authors" label="Authors" width="150" />
      <el-table-column prop="year" label="Year" width="80" />
      <el-table-column prop="status" label="Status" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{
            scope.row.status
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="AI Reason" min-width="150" />
    </el-table>

    <div class="prisma-placeholder" v-if="store.literatures.length > 0">
      <h4>PRISMA Flow Diagram (Simulation)</h4>
      <div class="prisma-chart">
        <div class="box">Identification (n={{ store.literatures.length }})</div>
        <div class="arrow">↓</div>
        <div class="box-row">
          <div class="box">Screening (n={{ store.literatures.length }})</div>
          <div class="arrow-right">→</div>
          <div class="box excluded">
            Excluded (n={{ screeningExcludedCount }})
          </div>
        </div>
        <div class="arrow">↓</div>
        <div class="box-row">
          <div class="box">Eligibility (n={{ eligibilityCount }})</div>
          <div class="arrow-right">→</div>
          <div class="box excluded">
            Excluded (n={{ eligibilityExcludedCount }})
          </div>
        </div>
        <div class="arrow">↓</div>
        <div class="box included">Included (n={{ includedCount }})</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { Download, Cpu } from "@element-plus/icons-vue";

const store = useMetaStore();
const fetching = ref(false);
const screening = ref(false);

const includedCount = computed(
  () => store.literatures.filter((l) => l.status === "included").length
);

const screeningExcludedCount = computed(
  () =>
    store.literatures.filter(
      (l) => l.status === "excluded" && l.exclusionPhase === "screening"
    ).length
);

const eligibilityCount = computed(
  () => store.literatures.length - screeningExcludedCount.value
);

const eligibilityExcludedCount = computed(
  () =>
    store.literatures.filter(
      (l) => l.status === "excluded" && l.exclusionPhase === "eligibility"
    ).length
);

const fetchDocs = async () => {
  fetching.value = true;
  await store.fetchLiteraturesFromDatabase();
  fetching.value = false;
};

const autoScreen = async () => {
  screening.value = true;
  await store.autoScreenLiteratures();
  screening.value = false;
};

const getStatusType = (status: string) => {
  switch (status) {
    case "included":
      return "success";
    case "excluded":
      return "danger";
    default:
      return "info";
  }
};
</script>

<style scoped>
.search-action-area {
  margin-bottom: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.fetch-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 15px;
}
.result-count {
  font-weight: bold;
  color: #606266;
}
.action-bar {
  margin-bottom: 15px;
  text-align: right;
}
.prisma-placeholder {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border: 1px dashed #ccc;
  text-align: center;
}
.prisma-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.box {
  border: 1px solid #333;
  padding: 10px 20px;
  background: white;
  width: 200px;
}
.box.included {
  background: #e1f3d8;
  border-color: #67c23a;
}
.box.excluded {
  background: #fef0f0;
  border-color: #f56c6c;
  border-style: dashed;
}
.arrow {
  font-size: 20px;
  color: #666;
}
.arrow-right {
  font-size: 20px;
  color: #666;
}
.box-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
