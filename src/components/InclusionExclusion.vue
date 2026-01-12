<template>
  <div class="criteria-container">
    <el-row :gutter="40">
      <el-col :span="12">
        <h3>纳入标准 (Inclusion)</h3>
        <div class="input-area">
          <el-input
            v-model="newInclusion"
            placeholder="输入纳入标准后回车"
            @keyup.enter="addInclusion"
          >
            <template #append>
              <el-button @click="addInclusion"
                ><el-icon><Plus /></el-icon
              ></el-button>
            </template>
          </el-input>
        </div>
        <div class="tags-area">
          <el-tag
            v-for="(tag, index) in store.criteria.inclusion"
            :key="index"
            closable
            type="success"
            class="criteria-tag"
            @close="removeInclusion(index)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-col>

      <el-col :span="12">
        <h3>排除标准 (Exclusion)</h3>
        <div class="input-area">
          <el-input
            v-model="newExclusion"
            placeholder="输入排除标准后回车"
            @keyup.enter="addExclusion"
          >
            <template #append>
              <el-button @click="addExclusion"
                ><el-icon><Plus /></el-icon
              ></el-button>
            </template>
          </el-input>
        </div>
        <div class="tags-area">
          <el-tag
            v-for="(tag, index) in store.criteria.exclusion"
            :key="index"
            closable
            type="danger"
            class="criteria-tag"
            @close="removeExclusion(index)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-col>
    </el-row>

    <div class="action-area">
      <el-button type="success" @click="saveDraft" :loading="saveLoading" plain>
        <el-icon><FolderAdd /></el-icon> 暂存
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, type Ref } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { Plus, FolderAdd } from "@element-plus/icons-vue";
import { projectService } from "@/api/projects";
import { ElMessage } from "element-plus";
import type { Project } from "@/types";

const store = useMetaStore();
const newInclusion = ref("");
const newExclusion = ref("");
const saveLoading = ref(false);
const currentProject = inject<Ref<Project | null>>("currentProject");

const addInclusion = () => {
  if (newInclusion.value) {
    store.criteria.inclusion.push(newInclusion.value);
    newInclusion.value = "";
  }
};

const removeInclusion = (index: number) => {
  store.criteria.inclusion.splice(index, 1);
};

const addExclusion = () => {
  if (newExclusion.value) {
    store.criteria.exclusion.push(newExclusion.value);
    newExclusion.value = "";
  }
};

const removeExclusion = (index: number) => {
  store.criteria.exclusion.splice(index, 1);
};

const saveDraft = async () => {
  if (!currentProject?.value?.id) {
    ElMessage.warning("请先选择项目");
    return;
  }

  if (
    store.criteria.inclusion.length === 0 &&
    store.criteria.exclusion.length === 0
  ) {
    ElMessage.warning("请至少添加一条纳入或排除标准");
    return;
  }

  try {
    saveLoading.value = true;
    await projectService.saveCriteria(currentProject.value.id, {
      inclusion: store.criteria.inclusion,
      exclusion: store.criteria.exclusion,
    });
    ElMessage.success("纳入/排除标准已暂存");
  } catch (error: any) {
    ElMessage.error(error.message || "暂存失败");
  } finally {
    saveLoading.value = false;
  }
};
</script>

<style scoped>
.input-area {
  margin-bottom: 15px;
}
.tags-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.criteria-tag {
  width: 100%;
  justify-content: space-between;
  font-size: 14px;
  padding: 8px;
  height: auto;
}
h3 {
  margin-bottom: 15px;
  color: #303133;
}
.action-area {
  margin-top: 20px;
  text-align: center;
}
</style>
