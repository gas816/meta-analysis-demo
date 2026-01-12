<script setup lang="ts">
import { ref, onMounted, computed, inject } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search, Edit, Delete, View } from "@element-plus/icons-vue";
import { projectService } from "@/api";
import type { Project, CreateProjectDto } from "@/types";

// 注入父组件提供的方法
const viewProjectDetail =
  inject<(project: Project) => void>("viewProjectDetail");

// 组件状态
const loading = ref(false);
const projects = ref<Project[]>([]);
const searchQuery = ref("");

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 创建项目对话框
const createDialogVisible = ref(false);
const createFormRef = ref();
const createForm = ref<CreateProjectDto>({
  name: "",
  description: "",
});

// 编辑项目对话框
const editDialogVisible = ref(false);
const editFormRef = ref();
const editForm = ref<CreateProjectDto>({
  name: "",
  description: "",
});
const editingProject = ref<Project | null>(null);

// 表单验证规则
const createFormRules = {
  name: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "项目名称长度在 2 到 100 个字符",
      trigger: "blur",
    },
  ],
  description: [
    { required: true, message: "请输入项目描述", trigger: "blur" },
    {
      min: 5,
      max: 500,
      message: "项目描述长度在 5 到 500 个字符",
      trigger: "blur",
    },
  ],
};

// 计算分页后的项目列表
const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredProjects.value.slice(start, end);
});

// 过滤后的项目列表（支持搜索）
const filteredProjects = computed(() => {
  if (!searchQuery.value.trim()) {
    return projects.value;
  }
  const query = searchQuery.value.toLowerCase();
  return projects.value.filter(
    (project) =>
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
  );
});

/**
 * 加载项目列表
 */
const loadProjects = async () => {
  loading.value = true;
  try {
    const data = await projectService.getProjects({
      skip: 0,
      limit: 100, // 先加载所有项目，前端分页
    });
    projects.value = data;
  } catch (error) {
    console.error("加载项目列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 打开创建项目对话框
 */
const openCreateDialog = () => {
  createForm.value = {
    name: "",
    description: "",
  };
  createDialogVisible.value = true;
};

/**
 * 创建项目
 */
const handleCreate = async () => {
  if (!createFormRef.value) return;

  try {
    await createFormRef.value.validate();
  } catch (error) {
    return;
  }

  loading.value = true;
  try {
    const newProject = await projectService.createProject(createForm.value);
    projects.value.unshift(newProject);
    ElMessage.success("项目创建成功");
    createDialogVisible.value = false;
  } catch (error) {
    console.error("创建项目失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 查看项目详情
 */
const handleView = async (project: Project) => {
  if (!viewProjectDetail) {
    ElMessage.warning("页面跳转功能暂不可用");
    return;
  }

  loading.value = true;
  try {
    // 调用 GET 接口获取最新的项目数据
    const latestProject = await projectService.getProjectById(project.id);
    viewProjectDetail(latestProject);
  } catch (error) {
    console.error("获取项目详情失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 打开编辑项目对话框
 */
const handleEdit = async (project: Project) => {
  loading.value = true;
  try {
    // 获取最新的项目信息
    const latestProject = await projectService.getProjectById(project.id);
    editingProject.value = latestProject;
    editForm.value = {
      name: latestProject.name,
      description: latestProject.description,
    };
    editDialogVisible.value = true;
  } catch (error) {
    console.error("获取项目信息失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 更新项目
 */
const handleUpdate = async () => {
  if (!editFormRef.value || !editingProject.value) return;

  try {
    await editFormRef.value.validate();
  } catch (error) {
    return;
  }

  loading.value = true;
  try {
    const updatedProject = await projectService.updateProject(
      editingProject.value.id,
      editForm.value
    );

    // 更新列表中的项目
    const index = projects.value.findIndex(
      (p) => p.id === editingProject.value!.id
    );
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }

    ElMessage.success("项目更新成功");
    editDialogVisible.value = false;
  } catch (error) {
    console.error("更新项目失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 删除项目
 */
const handleDelete = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${project.name}" 吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    loading.value = true;
    await projectService.deleteProject(project.id);
    projects.value = projects.value.filter((p) => p.id !== project.id);
    ElMessage.success("项目删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除项目失败:", error);
    }
  } finally {
    loading.value = false;
  }
};

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 获取进度百分比
 */
const getProgress = (project: Project) => {
  if (project.total_records === 0) return 0;
  return Math.round((project.screened_records / project.total_records) * 100);
};

/**
 * 获取进度状态颜色
 */
const getProgressStatus = (percentage: number) => {
  if (percentage === 0) return "";
  if (percentage < 30) return "exception";
  if (percentage < 70) return "warning";
  return "success";
};

// 组件挂载时加载数据
onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div class="project-list-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Meta 分析项目管理</h1>
        <p class="page-subtitle">管理您的所有 Meta 分析项目</p>
      </div>
      <el-button
        type="primary"
        size="large"
        :icon="Plus"
        @click="openCreateDialog"
      >
        创建新项目
      </el-button>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索项目名称或描述..."
        :prefix-icon="Search"
        size="large"
        clearable
        style="max-width: 400px"
      />
    </div>

    <!-- 项目列表 -->
    <div v-loading="loading" class="project-list">
      <el-empty
        v-if="filteredProjects.length === 0 && !loading"
        description="暂无项目数据"
      >
        <el-button type="primary" @click="openCreateDialog">
          创建第一个项目
        </el-button>
      </el-empty>

      <div v-else class="project-grid">
        <el-card
          v-for="project in paginatedProjects"
          :key="project.id"
          class="project-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <h3>{{ project.name }}</h3>
                <span class="project-id">ID: {{ project.id }}</span>
              </div>
              <div class="card-actions">
                <el-button
                  type="primary"
                  :icon="View"
                  circle
                  size="small"
                  @click="handleView(project)"
                />
                <el-button
                  type="warning"
                  :icon="Edit"
                  circle
                  size="small"
                  @click="handleEdit(project)"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="handleDelete(project)"
                />
              </div>
            </div>
          </template>

          <div class="card-content">
            <div class="project-description">
              {{ project.description }}
            </div>

            <el-divider />

            <div class="project-stats">
              <div class="stat-item">
                <span class="stat-label">总记录数</span>
                <span class="stat-value">{{ project.total_records }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已筛选</span>
                <span class="stat-value">{{ project.screened_records }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已纳入</span>
                <span class="stat-value">{{ project.included_records }}</span>
              </div>
            </div>

            <div class="project-progress">
              <span class="progress-label">筛选进度</span>
              <el-progress
                :percentage="getProgress(project)"
                :status="getProgressStatus(getProgress(project))"
              />
            </div>

            <div class="project-meta">
              <div class="meta-item">
                <span class="meta-label">创建时间：</span>
                <span class="meta-value">{{
                  formatDate(project.created_at)
                }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">更新时间：</span>
                <span class="meta-value">{{
                  formatDate(project.updated_at)
                }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div v-if="filteredProjects.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredProjects.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建新项目"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入项目名称"
            clearable
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="请输入项目描述"
            :rows="4"
            clearable
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑项目对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑项目"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="createFormRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入项目名称"
            clearable
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入项目描述"
            :rows="4"
            clearable
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleUpdate">
          更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.project-list-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: bold;
}

.page-subtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.search-bar {
  margin-bottom: 24px;
  padding: 0 20px;
}

.project-list {
  padding: 0 20px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.project-card {
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title {
  flex: 1;
}

.card-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #303133;
}

.project-id {
  font-size: 12px;
  color: #909399;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-description {
  color: #606266;
  line-height: 1.6;
  min-height: 48px;
}

.project-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.project-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.meta-item {
  font-size: 12px;
  color: #909399;
}

.meta-label {
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
