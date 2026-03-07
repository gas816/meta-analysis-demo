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
      :data="paginatedLiteratures"
      style="width: 100%"
      border
      empty-text="暂无文献，请先执行检索"
    >
      <el-table-column label="Title" min-width="200">
        <template #default="scope">
          <span
            class="title-link"
            @click="visitLiterature(scope.row)"
            :class="{ 'title-disabled': !canVisitLiterature(scope.row) }"
          >
            {{ scope.row.title }}
          </span>
        </template>
      </el-table-column>
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
            v-if="!scope.row.pdf_path"
            type="warning"
            size="small"
            @click="openUploadDialog(scope.row)"
            link
          >
            上传PDF
          </el-button>
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

    <!-- 分页组件 -->
    <div class="pagination-container" v-if="store.literatures.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalRecords"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <div class="prisma-placeholder" v-if="totalRecords > 0">
      <h4>PRISMA Flow Diagram (Simulation)</h4>
      <div class="prisma-chart">
        <div class="box">Identification (n={{ totalRecords }})</div>
        <div class="arrow">↓</div>
        <div class="box-row">
          <div class="box">Screening (n={{ totalRecords }})</div>
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

    <!-- 上传PDF对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传全文PDF"
      width="600px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 20px">
        <p style="color: #606266; margin-bottom: 10px">
          <strong>文献：</strong>{{ uploadingRecord?.title }}
        </p>
        <p
          style="color: #909399; font-size: 13px"
          v-if="uploadingRecord?.fulltext_available"
        >
          <el-icon><WarningFilled /></el-icon>
          该文献已有PDF文件，上传新文件将覆盖原文件。
        </p>
      </div>
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".pdf"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽PDF文件到此处 或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">只能上传 PDF 文件，且不超过 50MB</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleUploadSubmit"
          :loading="uploading"
          :disabled="!selectedFile"
        >
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, reactive, onMounted, onUnmounted } from "vue";
import { useMetaStore } from "../stores/metaStore";
import {
  Download,
  Cpu,
  Plus,
  UploadFilled,
  WarningFilled,
} from "@element-plus/icons-vue";
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
const uploadDialogVisible = ref(false);
const uploadingRecord = ref<any>(null);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadRef = ref();

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);
const paginatedLiteratures = ref<any[]>([]);

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
  () =>
    paginatedLiteratures.value.filter((l) => l.status === "included").length,
);

const screeningExcludedCount = computed(
  () =>
    paginatedLiteratures.value.filter(
      (l) => l.status === "excluded" && l.exclusionPhase === "screening",
    ).length,
);

const eligibilityCount = computed(
  () => totalRecords.value - screeningExcludedCount.value,
);

const eligibilityExcludedCount = computed(
  () =>
    paginatedLiteratures.value.filter(
      (l) => l.status === "excluded" && l.exclusionPhase === "eligibility",
    ).length,
);

// 加载文献列表
const loadRecords = async () => {
  if (!currentProject?.value?.id) {
    return;
  }

  try {
    fetching.value = true;
    const skip = (currentPage.value - 1) * pageSize.value;
    const response = await recordService.getRecords({
      project_id: currentProject.value.id,
      skip,
      limit: pageSize.value,
    });

    // 处理响应数据 - 支持两种格式：数组或分页响应对象
    let records: any[] = [];
    let total = 0;

    if (Array.isArray(response)) {
      // API 直接返回数组
      records = response;
      total = response.length;
    } else if (response && response.items && Array.isArray(response.items)) {
      // API 返回分页响应对象
      records = response.items;
      total = response.total || records.length;
    } else {
      // 未知格式
      records = [];
      total = 0;
    }

    // 将records转换为literatures格式
    paginatedLiteratures.value = records.map((record) => {
      // 确定最终状态：优先使用 final_decision，否则根据筛选阶段判断
      let status = "pending";
      let exclusionPhase = undefined;

      if (record.final_decision) {
        status = record.final_decision;
      } else if (record.fulltext_screening) {
        status =
          record.fulltext_screening === "excluded" ? "excluded" : "included";
        if (record.fulltext_screening === "excluded") {
          exclusionPhase = "eligibility";
        }
      } else if (record.title_abstract_screening) {
        status =
          record.title_abstract_screening === "excluded"
            ? "excluded"
            : "pending";
        if (record.title_abstract_screening === "excluded") {
          exclusionPhase = "screening";
        }
      }

      return {
        id: record.id,
        title: record.title,
        authors: record.authors,
        year: record.year,
        journal: record.journal,
        doi: record.doi,
        pmid: record.pmid,
        abstract: record.abstract,
        source_database: record.source_database,
        status,
        reason: record.fulltext_reason || record.title_abstract_reason || "",
        exclusionPhase,
        fulltext_available: record.fulltext_available || false,
        pdf_path: record.pdf_path || null,
      };
    });

    // 更新总数
    totalRecords.value = total;

    // 同时更新store中的literatures以保持兼容
    store.literatures = paginatedLiteratures.value;
  } catch (error: any) {
    ElMessage.error(`加载文献列表失败: ${error.message || "未知错误"}`);
    paginatedLiteratures.value = [];
    totalRecords.value = 0;
  } finally {
    fetching.value = false;
  }
};

// 分页大小变化
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  currentPage.value = 1;
  loadRecords();
};

// 当前页变化
const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  loadRecords();
};

const fetchDocs = async () => {
  if (!currentProject?.value?.id) {
    ElMessage.error("请先选择项目");
    return;
  }

  if (!currentProject.value?.search_keywords) {
    ElMessage.warning(
      "请先在步骤 2（检索策略构建）中生成检索式并点击「暂存」后再执行检索",
    );
    return;
  }

  fetching.value = true;

  try {
    // 获取检索策略（从项目配置中）
    const searchStrategy = currentProject.value.search_keywords;
    // 从项目配置中获取数据库列表
    const databases = currentProject.value?.search_databases
      ? currentProject.value.search_databases
          .split(",")
          .map((db) => db.trim().toLowerCase())
      : ["pubmed"];

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
          `${job.current_step} (${job.progress}% - ${job.processed_items}/${job.total_items})`,
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
          // 重新加载分页数据
          currentPage.value = 1;
          await loadRecords();
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
          `${job.current_step} (${job.progress}% - ${job.processed_items}/${job.total_items})`,
        );
      }

      if (job.status === "completed") {
        stopJobPolling();
        screening.value = false;
        ElMessage.success(`AI 筛选完成！已处理 ${job.processed_items} 篇文献`);
        // 重新加载文献列表
        if (currentProject?.value?.id) {
          await store.fetchLiteraturesFromDatabase(currentProject.value.id);
          // 重新加载分页数据
          await loadRecords();
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
      },
    );

    await recordService.deleteRecord(row.id);
    ElMessage.success("文献删除成功");

    // 从本地列表中移除
    const index = store.literatures.findIndex((l) => l.id === row.id);
    if (index > -1) {
      store.literatures.splice(index, 1);
    }

    // 从分页列表中移除并更新总数
    const pageIndex = paginatedLiteratures.value.findIndex(
      (l) => l.id === row.id,
    );
    if (pageIndex > -1) {
      paginatedLiteratures.value.splice(pageIndex, 1);
      totalRecords.value--;
    }

    // 如果当前页没有数据且不是第一页，返回上一页
    if (paginatedLiteratures.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
    }

    // 重新加载数据以更新PRISMA图表
    await loadRecords();
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

// 判断是否可以访问文献
const canVisitLiterature = (row: any) => {
  return !!(row.doi || row.pmid);
};

// 访问文献
const visitLiterature = (row: any) => {
  let url = "";

  // 优先使用DOI
  if (row.doi) {
    url = `https://doi.org/${row.doi}`;
  }
  // 其次使用PMID
  else if (row.pmid) {
    url = `https://pubmed.ncbi.nlm.nih.gov/${row.pmid}/`;
  }
  // 根据数据库来源构建URL
  else if (row.source_database) {
    const db = row.source_database.toLowerCase();
    if (db === "pubmed" && row.title) {
      // 使用标题搜索PubMed
      const searchQuery = encodeURIComponent(row.title);
      url = `https://pubmed.ncbi.nlm.nih.gov/?term=${searchQuery}`;
    } else if (db === "web of science" && row.title) {
      const searchQuery = encodeURIComponent(row.title);
      url = `https://www.webofscience.com/wos/woscc/general-summary?queryJson=[{"rowBoolean":null,"rowField":"TI","rowText":"${searchQuery}"}]`;
    }
  }

  if (url) {
    window.open(url, "_blank");
  } else {
    ElMessage.warning("该文献缺少访问信息（DOI 或 PMID）");
  }
};

// 打开上传对话框
const openUploadDialog = (row: any) => {
  uploadingRecord.value = row;
  selectedFile.value = null;
  uploadDialogVisible.value = true;
  // 清空上传组件
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

// 处理文件选择
const handleFileChange = (file: any) => {
  const rawFile = file.raw;

  // 验证文件类型
  if (rawFile.type !== "application/pdf") {
    ElMessage.error("只能上传PDF格式的文件！");
    uploadRef.value?.clearFiles();
    selectedFile.value = null;
    return;
  }

  // 验证文件大小（50MB）
  const maxSize = 50 * 1024 * 1024;
  if (rawFile.size > maxSize) {
    ElMessage.error("文件大小不能超过 50MB！");
    uploadRef.value?.clearFiles();
    selectedFile.value = null;
    return;
  }

  selectedFile.value = rawFile;
};

// 处理文件数量超限
const handleExceed = () => {
  ElMessage.warning("只能上传一个PDF文件");
};

// 提交上传
const handleUploadSubmit = async () => {
  if (!selectedFile.value || !uploadingRecord.value) {
    ElMessage.warning("请先选择文件");
    return;
  }

  uploading.value = true;

  try {
    // 创建 FormData
    const formData = new FormData();
    formData.append("file", selectedFile.value);

    // 调用 API 上传文件
    const response = await recordService.uploadPdf(
      uploadingRecord.value.id,
      formData,
    );

    ElMessage.success("PDF上传成功！");
    uploadDialogVisible.value = false;
    selectedFile.value = null;

    // 更新本地记录状态
    const index = paginatedLiteratures.value.findIndex(
      (l) => l.id === uploadingRecord.value.id,
    );
    if (index > -1) {
      paginatedLiteratures.value[index].fulltext_available = true;
      paginatedLiteratures.value[index].pdf_path = response.pdf_path;
    }

    // 同步更新store
    const storeIndex = store.literatures.findIndex(
      (l) => l.id === uploadingRecord.value.id,
    );
    if (storeIndex > -1 && store.literatures[storeIndex]) {
      store.literatures[storeIndex].fulltext_available = true;
    }
  } catch (error: any) {
    ElMessage.error(`上传失败: ${error.message || "未知错误"}`);
  } finally {
    uploading.value = false;
  }
};

// 组件挂载时加载文献列表
onMounted(() => {
  loadRecords();
});

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
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.title-link {
  cursor: pointer;
  color: #409eff;
  transition: color 0.2s;
}
.title-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
.title-disabled {
  cursor: not-allowed;
  color: #909399;
}
.title-disabled:hover {
  text-decoration: none;
}
</style>
