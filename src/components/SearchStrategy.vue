<template>
  <div class="search-strategy">
    <el-form label-position="top">
      <el-form-item label="检索数据库">
        <el-checkbox-group v-model="store.search.databases">
          <el-checkbox label="PubMed" />
          <el-checkbox label="EMBASE" />
          <el-checkbox label="Web of Science" />
          <el-checkbox label="Scopus" />
          <el-checkbox label="Cochrane" />
        </el-checkbox-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="store.search.dateRange"
              type="daterange"
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="keyword-builder">
        <h4 class="section-title">关键词构建</h4>
        <div
          v-for="(item, index) in store.search.terms"
          :key="item.id"
          class="keyword-row"
        >
          <div class="logic-col">
            <el-select
              v-if="index > 0"
              v-model="item.logic"
              style="width: 90px"
            >
              <el-option label="AND" value="AND" />
              <el-option label="OR" value="OR" />
              <el-option label="NOT" value="NOT" />
            </el-select>
            <span v-else class="start-label">Start</span>
          </div>

          <div class="term-col">
            <el-input
              v-model="item.term"
              placeholder="输入关键词 (e.g. Diabetes)"
            />
          </div>

          <div class="action-col">
            <el-button
              type="danger"
              circle
              :icon="Delete"
              @click="removeTerm(index)"
              :disabled="store.search.terms.length === 1"
              plain
              size="small"
            />
          </div>
        </div>

        <el-button
          type="primary"
          plain
          @click="addTerm"
          class="add-btn"
          size="small"
        >
          <el-icon><Plus /></el-icon> 添加关键词
        </el-button>
      </div>

      <div class="action-area">
        <el-button type="primary" @click="generateString" :loading="loading">
          <el-icon><Search /></el-icon> 生成PRISMA标准检索表达式
        </el-button>
      </div>

      <div v-if="store.search.searchString" class="search-string-box">
        <p class="label">生成的检索式：</p>
        <el-input
          v-model="store.search.searchString"
          type="textarea"
          :rows="3"
          readonly
        />
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { Search, Delete, Plus } from "@element-plus/icons-vue";

const store = useMetaStore();
const loading = ref(false);

const generateString = async () => {
  loading.value = true;
  await store.generateSearchString();
  loading.value = false;
};

const addTerm = () => {
  store.search.terms.push({
    id: Date.now(),
    logic: "AND",
    term: "",
  });
};

const removeTerm = (index: number) => {
  store.search.terms.splice(index, 1);
};
</script>

<style scoped>
.action-area {
  margin-top: 10px;
  margin-bottom: 20px;
}
.search-string-box {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}
.label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #606266;
}

.keyword-builder {
  border: 1px solid #dcdfe6;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  background-color: #fff;
}

.section-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
}

.keyword-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.logic-col {
  width: 90px;
  display: flex;
  justify-content: center;
}

.start-label {
  font-size: 12px;
  color: #909399;
  font-weight: bold;
  line-height: 32px;
}

.term-col {
  flex: 1;
}

.action-col {
  width: 40px;
  display: flex;
  justify-content: center;
}

.add-btn {
  margin-top: 5px;
}
</style>
