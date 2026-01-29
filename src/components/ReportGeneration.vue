<template>
  <div class="report-container">
    <div class="action-bar">
      <el-button type="primary" @click="generate" :loading="loading">
        <el-icon><Document /></el-icon> 生成报告
      </el-button>
      <el-button-group class="ml-4">
        <el-button :disabled="!store.reportContent" @click="downloadMarkdown">
          <el-icon><Download /></el-icon> 下载 Markdown
        </el-button>
        <!-- <el-button :disabled="!store.reportContent" @click="downloadPDF"
          >下载 PDF</el-button
        >
        <el-button :disabled="!store.reportContent" @click="downloadWord"
          >下载 Word</el-button
        > -->
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
import { Document, Download } from "@element-plus/icons-vue";
import { marked } from "marked";
import { ElMessage } from "element-plus";

const store = useMetaStore();
const loading = ref(false);

const generate = async () => {
  loading.value = true;
  try {
    await store.generateReport();
    ElMessage.success("报告生成成功");
  } catch (error: any) {
    ElMessage.error(error.message || "报告生成失败");
  } finally {
    loading.value = false;
  }
};

const renderedMarkdown = computed(() => {
  return marked(store.reportContent);
});

// 下载 Markdown 文件
const downloadMarkdown = () => {
  if (!store.reportContent) return;

  const blob = new Blob([store.reportContent], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meta-analysis-report-${new Date().toISOString().split("T")[0]}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  ElMessage.success("Markdown 文件下载成功");
};

// 下载 PDF（占位符）
// const downloadPDF = () => {
//   ElMessage.info("PDF 导出功能待实现");
// };

// // 下载 Word（占位符）
// const downloadWord = () => {
//   ElMessage.info("Word 导出功能待实现");
// };
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
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  line-height: 1.6;
}
</style>
