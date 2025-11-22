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
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { Plus } from "@element-plus/icons-vue";

const store = useMetaStore();
const newInclusion = ref("");
const newExclusion = ref("");

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
</style>
