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
  await store.extractDataFromLit();
  loading.value = false;
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
