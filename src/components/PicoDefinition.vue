<template>
  <div class="pico-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-form-item label="研究人群 (P)">
          <el-input
            v-model="store.pico.population"
            placeholder="e.g. Adults with Diabetes"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="干预/暴露 (I)">
          <el-input
            v-model="store.pico.intervention"
            placeholder="e.g. Metformin"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="对照组 (C)">
          <el-input
            v-model="store.pico.comparison"
            placeholder="e.g. Placebo"
          />
        </el-form-item>
      </el-col>
      <el-col :span="6">
        <el-form-item label="结局指标 (O)">
          <el-input
            v-model="store.pico.outcome"
            placeholder="e.g. HbA1c levels"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <div class="action-area">
      <el-button type="primary" @click="generateQuestion" :loading="loading">
        <el-icon><MagicStick /></el-icon> 生成问题描述
      </el-button>
    </div>

    <el-alert
      v-if="store.pico.question"
      :title="store.pico.question"
      type="success"
      :closable="false"
      class="mt-4"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMetaStore } from "../stores/metaStore";
import { MagicStick } from "@element-plus/icons-vue";

const store = useMetaStore();
const loading = ref(false);

const generateQuestion = async () => {
  loading.value = true;
  await store.generatePicoQuestion();
  loading.value = false;
};
</script>

<style scoped>
.action-area {
  margin-top: 10px;
  text-align: right;
}
.mt-4 {
  margin-top: 16px;
}
</style>
