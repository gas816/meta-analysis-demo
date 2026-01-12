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
      <div>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon> 创建文献
        </el-button>
        <el-button
          type="success"
          @click="autoScreen"
          :loading="screening"
          :disabled="store.literatures.length === 0"
        >
          <el-icon><Cpu /></el-icon> 自动筛选建议 (AI)
        </el-button>
      </div>
    </div>

    <el-table
      :data="store.literatures"
      style="width: 100%"
      border
      empty-text="暂无文献，请先执行检索"
    >
      <el-table-column prop="title" label="Title" min-width="200" />
      <el-table-column prop="authors" label="Authors" width="180" />
      <el-table-column prop="year" label="Year" width="80" />
      <el-table-column prop="journal" label="Journal" width="150" />
      <el-table-column prop="status" label="Status" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{
            scope.row.status
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="AI Reason" min-width="150" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="openEditDialog(scope.row)"
            link
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
            link
          >
            删除
          </el-button>
        </template>
      </el-table-column>
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

    <!-- 创建/编辑文献对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入文献标题"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="作者" prop="authors">
          <el-input
            v-model="formData.authors"
            placeholder="请输入作者，多个作者用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="期刊" prop="journal">
          <el-input v-model="formData.journal" placeholder="请输入期刊名称" />
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-input-number
            v-model="formData.year"
            :min="1900"
            :max="2100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="DOI" prop="doi">
          <el-input v-model="formData.doi" placeholder="请输入 DOI" />
        </el-form-item>
        <el-form-item label="PMID" prop="pmid">
          <el-input v-model="formData.pmid" placeholder="请输入 PMID" />
        </el-form-item>
        <el-form-item label="数据库来源" prop="source_database">
          <el-select
            v-model="formData.source_database"
            placeholder="请选择数据库来源"
            style="width: 100%"
          >
            <el-option label="PubMed" value="PubMed" />
            <el-option label="Web of Science" value="Web of Science" />
            <el-option label="Embase" value="Embase" />
            <el-option label="Cochrane Library" value="Cochrane Library" />
            <el-option label="其他" value="Other" />
          </el-select>
        </el-form-item>
        <el-form-item label="摘要" prop="abstract">
          <el-input
            v-model="formData.abstract"
            placeholder="请输入摘要"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? "更新" : "创建" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, reactive, onUnmounted } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { Download, Cpu, Plus } from "@element-plus/icons-vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { recordService } from "@/api/records";
import { jobService } from "@/api/jobs";
import type {
  Project,
  CreateRecordDto,
  UpdateRecordDto,
  Job,
  CrawlAndScreenParams,
} from "@/types";

const store = useMetaStore();
const fetching = ref(false);
const screening = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const currentJob = ref<Job | null>(null);
const jobPollingTimer = ref<number | null>(null);

// 获取当前项目
const currentProject = inject<{ value: Project | null }>("currentProject");

// 表单数据
const formData = reactive({
  title: "",
  authors: "",
  journal: "",
  year: new Date().getFullYear(),
  doi: "",
  pmid: "",
  abstract: "",
  source_database: "PubMed",
});

// 表单验证规则
const formRules: FormRules = {
  title: [{ required: true, message: "请输入文献标题", trigger: "blur" }],
  authors: [{ required: true, message: "请输入作者", trigger: "blur" }],
  journal: [{ required: true, message: "请输入期刊名称", trigger: "blur" }],
  year: [{ required: true, message: "请选择年份", trigger: "change" }],
  source_database: [
    { required: true, message: "请选择数据库来源", trigger: "change" },
  ],
};

const dialogTitle = computed(() => (isEdit.value ? "编辑文献" : "创建文献"));

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
  if (!currentProject?.value?.id) {
    ElMessage.error("请先选择项目");
    return;
  }

  fetching.value = true;

  try {
    // 获取检索策略（从项目配置中）
    const searchStrategy =
      currentProject.value?.search_keywords || "dementia AND sleep";
    const databases = ["pubmed"]; // 可以从项目配置中获取

    // 构建任务参数
    const params: CrawlAndScreenParams = {
      databases,
      keywords: searchStrategy,
    };

    // 创建后台任务
    const job = await jobService.createJob({
      project_id: currentProject.value.id,
      job_type: "crawl_and_screen",
      parameters: JSON.stringify(params),
    });

    currentJob.value = job;
    ElMessage.success("文献检索任务已启动，正在后台处理...");

    // 开始轮询任务状态
    startJobPolling(job.id);
  } catch (error: any) {
    ElMessage.error(`启动检索任务失败: ${error.message || "未知错误"}`);
    fetching.value = false;
  }
};

// 开始轮询任务状态
const startJobPolling = (jobId: number) => {
  // 清除之前的定时器
  if (jobPollingTimer.value) {
    clearInterval(jobPollingTimer.value);
  }

  // 每 2 秒轮询一次任务状态
  jobPollingTimer.value = window.setInterval(async () => {
    try {
      const job = await jobService.getJob(jobId);
      currentJob.value = job;

      // 更新进度提示
      if (job.current_step) {
        ElMessage.info(
          `${job.current_step} (${job.progress}% - ${job.processed_items}/${job.total_items})`
        );
      }

      // 任务完成
      if (job.status === "completed") {
        stopJobPolling();
        fetching.value = false;
        ElMessage.success(`文献检索完成！共获取 ${job.processed_items} 篇文献`);
        // 重新加载文献列表
        if (currentProject?.value?.id) {
          await store.fetchLiteraturesFromDatabase(currentProject.value.id);
        }
      }

      // 任务失败
      if (job.status === "failed") {
        stopJobPolling();
        fetching.value = false;
        ElMessage.error(`任务失败: ${job.error_message || "未知错误"}`);
      }

      // 任务取消
      if (job.status === "cancelled") {
        stopJobPolling();
        fetching.value = false;
        ElMessage.warning("任务已取消");
      }
    } catch (error: any) {
      console.error("轮询任务状态失败:", error);
      stopJobPolling();
      fetching.value = false;
      ElMessage.error("获取任务状态失败");
    }
  }, 2000);
};

// 停止轮询
const stopJobPolling = () => {
  if (jobPollingTimer.value) {
    clearInterval(jobPollingTimer.value);
    jobPollingTimer.value = null;
  }
};

const autoScreen = async () => {
  if (!currentProject?.value?.id) {
    ElMessage.error("请先选择项目");
    return;
  }

  if (store.literatures.length === 0) {
    ElMessage.warning("没有可筛选的文献");
    return;
  }

  screening.value = true;

  try {
    // 获取所有待筛选文献的 ID
    const recordIds = store.literatures.map((lit) => lit.id);

    // 创建全文筛选任务
    const job = await jobService.createJob({
      project_id: currentProject.value.id,
      job_type: "fulltext_screen",
      parameters: JSON.stringify({ record_ids: recordIds }),
    });

    currentJob.value = job;
    ElMessage.success("AI 筛选任务已启动，正在后台处理...");

    // 开始轮询任务状态
    startScreeningJobPolling(job.id);
  } catch (error: any) {
    ElMessage.error(`启动筛选任务失败: ${error.message || "未知错误"}`);
    screening.value = false;
  }
};

// 筛选任务轮询
const startScreeningJobPolling = (jobId: number) => {
  if (jobPollingTimer.value) {
    clearInterval(jobPollingTimer.value);
  }

  jobPollingTimer.value = window.setInterval(async () => {
    try {
      const job = await jobService.getJob(jobId);
      currentJob.value = job;

      if (job.current_step) {
        ElMessage.info(
          `${job.current_step} (${job.progress}% - ${job.processed_items}/${job.total_items})`
        );
      }

      if (job.status === "completed") {
        stopJobPolling();
        screening.value = false;
        ElMessage.success(`AI 筛选完成！已处理 ${job.processed_items} 篇文献`);
        // 重新加载文献列表
        if (currentProject?.value?.id) {
          await store.fetchLiteraturesFromDatabase(currentProject.value.id);
        }
      }

      if (job.status === "failed") {
        stopJobPolling();
        screening.value = false;
        ElMessage.error(`筛选任务失败: ${job.error_message || "未知错误"}`);
      }

      if (job.status === "cancelled") {
        stopJobPolling();
        screening.value = false;
        ElMessage.warning("筛选任务已取消");
      }
    } catch (error: any) {
      console.error("轮询筛选任务状态失败:", error);
      stopJobPolling();
      screening.value = false;
    }
  }, 2000);
};

// 重置表单
const resetForm = () => {
  formData.title = "";
  formData.authors = "";
  formData.journal = "";
  formData.year = new Date().getFullYear();
  formData.doi = "";
  formData.pmid = "";
  formData.abstract = "";
  formData.source_database = "PubMed";
  formRef.value?.clearValidate();
};

// 打开创建对话框
const openCreateDialog = () => {
  if (!currentProject?.value?.id) {
    ElMessage.error("请先选择项目");
    return;
  }
  isEdit.value = false;
  editingId.value = null;
  resetForm();
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row: any) => {
  isEdit.value = true;
  editingId.value = row.id;
  formData.title = row.title;
  formData.authors = row.authors;
  formData.journal = row.journal;
  formData.year = row.year;
  formData.doi = row.doi || "";
  formData.pmid = row.pmid || "";
  formData.abstract = row.abstract || "";
  formData.source_database = row.source_database || "PubMed";
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    if (!currentProject?.value?.id) {
      ElMessage.error("请先选择项目");
      return;
    }

    submitting.value = true;
    if (isEdit.value && editingId.value) {
      // 更新文献
      const updateData: UpdateRecordDto = {
        title: formData.title,
        authors: formData.authors,
        journal: formData.journal,
        year: formData.year,
        doi: formData.doi,
        pmid: formData.pmid,
        abstract: formData.abstract,
        source_database: formData.source_database,
      };
      await recordService.updateRecord(editingId.value, updateData);
      ElMessage.success("文献更新成功");
    } else {
      // 创建文献
      const createData: CreateRecordDto = {
        title: formData.title,
        authors: formData.authors,
        journal: formData.journal,
        year: formData.year,
        doi: formData.doi,
        pmid: formData.pmid,
        abstract: formData.abstract,
        source_database: formData.source_database,
        project_id: currentProject.value.id,
      };
      await recordService.createRecord(createData);
      ElMessage.success("文献创建成功");
    }

    dialogVisible.value = false;
    submitting.value = false;
    // 重新加载文献列表
    await fetchDocs();
  });
};

// 删除文献
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文献 "${row.title}" 吗？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await recordService.deleteRecord(row.id);
    ElMessage.success("文献删除成功");

    // 从本地列表中移除
    const index = store.literatures.findIndex((l) => l.id === row.id);
    if (index > -1) {
      store.literatures.splice(index, 1);
    }
  } catch (error) {
    // 用户取消操作，不做处理
  }
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

// 组件卸载时清理定时器
onUnmounted(() => {
  stopJobPolling();
});
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.action-bar > div {
  display: flex;
  gap: 10px;
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
