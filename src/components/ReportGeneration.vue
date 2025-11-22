<template>
  <div class="report-container">
    <div class="action-bar">
      <el-button type="primary" @click="generate" :loading="loading">
        <el-icon><Document /></el-icon> 生成报告
      </el-button>
      <el-button-group class="ml-4">
        <el-button :disabled="!store.reportContent">导出 PDF</el-button>
        <el-button :disabled="!store.reportContent">导出 Word</el-button>
        <el-button :disabled="!store.reportContent">导出 Markdown</el-button>
      </el-button-group>
    </div>

    <div v-if="store.reportContent" class="preview-area">
      <div v-html="renderedMarkdown" class="markdown-body"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { Document } from "@element-plus/icons-vue";
import { marked } from "marked";

const store = useMetaStore();
const loading = ref(false);

const generate = async () => {
  loading.value = true;
  await store.generateReport();
  loading.value = false;
};

const renderedMarkdown = computed(() => {
  return marked(store.reportContent);
});
</script>

<style scoped>
.action-bar {
  margin-bottom: 20px;
}
.ml-4 {
  margin-left: 16px;
}
.preview-area {
  border: 1px solid #ddd;
  padding: 30px;
  border-radius: 4px;
  background: white;
  min-height: 300px;
}
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  line-height: 1.6;
}
</style>
