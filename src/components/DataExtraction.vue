<template>
  <div class="extraction-container">
    <div class="action-bar">
      <el-button
        type="primary"
        @click="generateTemplate"
        :loading="generating"
        v-if="store.extractionHeaders.length === 0"
      >
        <el-icon><MagicStick /></el-icon> 生成数据提取模板 (AI)
      </el-button>
      <template v-else>
        <el-button type="primary" plain @click="openAddColumnDialog">
          <el-icon><Plus /></el-icon> 添加列
        </el-button>
        <el-button type="success" @click="extractData" :loading="loading">
          <el-icon><DocumentCopy /></el-icon> 从文献中提取 (AI)
        </el-button>
      </template>
    </div>

    <div v-if="store.extractionHeaders.length > 0" class="column-tags">
      <span class="tag-label">当前列:</span>
      <el-tag
        v-for="header in store.extractionHeaders"
        :key="header.prop"
        closable
        @close="handleCloseColumn(header.prop)"
        class="mx-1"
      >
        {{ header.label }}
      </el-tag>
    </div>

    <el-empty
      v-if="store.extractionHeaders.length === 0"
      description="请先生成数据提取模板"
    />

    <el-table
      v-else
      :data="store.extractionData"
      style="width: 100%"
      border
      stripe
    >
      <el-table-column
        v-for="header in store.extractionHeaders"
        :key="header.prop"
        :prop="header.prop"
        :label="header.label"
        :min-width="header.width || '100'"
      >
        <template #default="scope">
          <el-input v-model="scope.row[header.prop]" size="small" />
        </template>
      </el-table-column>

      <el-table-column label="Actions" width="80" fixed="right">
        <template #default="scope">
          <el-button
            type="danger"
            link
            size="small"
            @click="removeRow(scope.$index)"
            >Del</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- Add Column Dialog -->
    <el-dialog v-model="dialogVisible" title="添加自定义列" width="400px">
      <el-form :model="newColumn" label-width="80px">
        <el-form-item label="列名">
          <el-input v-model="newColumn.label" placeholder="例如: 随访时间" />
        </el-form-item>
        <el-form-item label="字段名">
          <el-input v-model="newColumn.prop" placeholder="例如: follow_up" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newColumn.type">
            <el-option label="文本" value="text" />
            <el-option label="数字" value="number" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addColumn">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { DocumentCopy, MagicStick, Plus } from "@element-plus/icons-vue";
import { jobService } from "../api/jobs";
import { recordService } from "../api/records";
import { ElMessage } from "element-plus";
import type { DataExtractionParams } from "../types/job";

const store = useMetaStore();
const loading = ref(false);
const generating = ref(false);
const dialogVisible = ref(false);

const newColumn = reactive({
  label: "",
  prop: "",
  type: "text" as "text" | "number",
});

const generateTemplate = async () => {
  generating.value = true;
  await store.generateExtractionTemplate();
  generating.value = false;
};

const extractData = async () => {
  loading.value = true;
  try {
    // 获取纳入的文献记录ID列表
    const includedLiteratures = store.literatures.filter(
      (lit) => !lit.status.toLocaleLowerCase().startsWith("ex"),
    );

    if (includedLiteratures.length === 0) {
      ElMessage.warning("没有已纳入的文献可供数据提取");
      loading.value = false;
      return;
    }

    const includedRecordIds = includedLiteratures.map((lit) => lit.id);

    // 从文献中获取 project_id（所有文献应该属于同一个项目）
    const projectId =
      store.currentProjectId || includedLiteratures[0]?.project_id || 1;

    // 获取需要提取的列名数组
    const columns = store.extractionHeaders.map((header) => header.prop);

    // 创建数据提取异步任务
    const params: DataExtractionParams = {
      record_ids: includedRecordIds,
      columns: columns,
    };

    const job = await jobService.createJob({
      project_id: projectId,
      job_type: "data_extraction",
      parameters: JSON.stringify(params),
    });

    ElMessage.success(`数据提取任务已创建 (ID: ${job.id})，正在后台处理...`);

    // 轮询任务状态
    const pollInterval = setInterval(async () => {
      try {
        const updatedJob = await jobService.getJob(job.id);

        // 显示进度信息
        if (updatedJob.current_step && updatedJob.status === "running") {
          ElMessage.info(
            `${updatedJob.current_step} (${updatedJob.progress}% - ${updatedJob.processed_items}/${updatedJob.total_items})`,
          );
        }

        if (updatedJob.status === "completed") {
          clearInterval(pollInterval);
          ElMessage.success(
            `数据提取完成！已处理 ${updatedJob.processed_items} 篇文献`,
          );

          // 任务完成后，从API获取所有记录并筛选出已纳入的记录
          await fetchExtractedData(projectId);

          loading.value = false;
        } else if (updatedJob.status === "failed") {
          clearInterval(pollInterval);
          ElMessage.error(
            `数据提取失败: ${updatedJob.error_message || "未知错误"}`,
          );
          loading.value = false;
        } else if (updatedJob.status === "cancelled") {
          clearInterval(pollInterval);
          ElMessage.warning("数据提取任务已取消");
          loading.value = false;
        }
      } catch (error) {
        clearInterval(pollInterval);
        console.error("轮询任务状态失败:", error);
        ElMessage.error("检查任务状态失败");
        loading.value = false;
      }
    }, 2000); // 每2秒轮询一次
  } catch (error) {
    console.error("创建数据提取任务失败:", error);
    ElMessage.error("创建数据提取任务失败");
    loading.value = false;
  }
};

const removeRow = (index: number) => {
  store.extractionData.splice(index, 1);
};

const openAddColumnDialog = () => {
  newColumn.label = "";
  newColumn.prop = "";
  newColumn.type = "text";
  dialogVisible.value = true;
};

const addColumn = () => {
  if (!newColumn.label || !newColumn.prop) return;
  store.addExtractionHeader({
    label: newColumn.label,
    prop: newColumn.prop,
    type: newColumn.type,
    width: "120",
  });
  dialogVisible.value = false;
};

const handleCloseColumn = (prop: string) => {
  store.removeExtractionHeader(prop);
};

/**
 * 从API获取已提取的数据
 * 获取项目的所有记录，筛选 final_decision == "included" 且存在 extracted_data 的记录
 */
const fetchExtractedData = async (projectId: number) => {
  try {
    // 获取项目的所有记录
    const response = await recordService.getRecords({
      project_id: projectId,
      skip: 0,
      limit: 1000, // 获取足够多的记录
    });

    // 处理响应数据 - 支持两种格式：数组或分页响应对象
    let records: any[] = [];
    if (Array.isArray(response)) {
      records = response;
    } else if (response && response.items && Array.isArray(response.items)) {
      records = response.items;
    }

    // 筛选出 final_decision == "include"/"included" 且存在 extracted_data 的记录
    const includedRecords = records.filter(
      (record) =>
        record.final_decision &&
        !record.final_decision.toLowerCase().startsWith("ex") &&
        record.extracted_data,
    );

    // 解析并提取 extracted_data 字段
    const extractedData = includedRecords.map((record) => {
      try {
        // 如果 extracted_data 是字符串，解析为 JSON 对象
        const data =
          typeof record.extracted_data === "string"
            ? JSON.parse(record.extracted_data)
            : record.extracted_data;

        // 移除元数据字段（以_开头的字段）
        const cleanData: any = {};
        Object.keys(data).forEach((key) => {
          if (!key.startsWith("_")) {
            // 处理嵌套对象和数组，将其转换为字符串以便在表格中显示
            if (typeof data[key] === "object") {
              cleanData[key] = JSON.stringify(data[key], null, 2);
            } else {
              cleanData[key] = data[key];
            }
          }
        });

        // 添加记录基本信息
        return {
          record_id: record.id,
          title: record.title,
          authors: record.authors,
          ...cleanData, // 展开提取的数据
        };
      } catch (error) {
        console.error(`解析记录 ${record.id} 的 extracted_data 失败:`, error);
        return {
          record_id: record.id,
          title: record.title,
          authors: record.authors,
          error: "数据解析失败",
        };
      }
    });

    // 更新 store 中的提取数据
    store.extractionData = extractedData;

    if (extractedData.length > 0) {
      ElMessage.success(`成功加载 ${extractedData.length} 条已提取的数据记录`);
    } else {
      ElMessage.warning("没有找到已提取数据的记录");
    }
  } catch (error) {
    console.error("获取已提取数据失败:", error);
    ElMessage.error("获取已提取数据失败");
  }
};
</script>

<style scoped>
.action-bar {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.column-tags {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}
.tag-label {
  font-size: 14px;
  color: #606266;
  margin-right: 5px;
}
.mx-1 {
  margin-left: 0.25rem;
  margin-right: 0.25rem;
}
</style>
