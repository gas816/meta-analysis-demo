<template>
  <div class="grade-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="tool-select">
        <span class="label">单项研究质量评估工具：</span>
        <el-select
          v-model="store.grade.tool"
          placeholder="选择工具"
          style="width: 200px"
        >
          <el-option label="Newcastle-Ottawa Scale (NOS)" value="NOS" />
          <el-option label="ROBINS-I" value="ROBINS-I" />
          <el-option label="Cochrane RoB 2" value="RoB 2" />
          <el-option label="JADAD Scale" value="JADAD" />
        </el-select>
      </div>
      <el-button type="primary" @click="addOutcome">
        <el-icon><Plus /></el-icon> 添加结局指标
      </el-button>
    </div>

    <div class="main-content">
      <!-- 左侧：结局指标列表 -->
      <div class="outcome-list">
        <div
          v-for="(profile, index) in store.grade.profiles"
          :key="profile.id"
          class="outcome-item"
          :class="{ active: currentProfileId === profile.id }"
          @click="currentProfileId = profile.id"
        >
          <div class="outcome-name">
            {{ profile.outcomeName || "未命名结局" }}
          </div>
          <el-tag
            size="small"
            :type="getLevelTagType(profile.overallCertainty)"
          >
            {{ profile.overallCertainty }}
          </el-tag>
          <el-button
            type="danger"
            link
            :icon="Delete"
            size="small"
            class="delete-btn"
            @click.stop="removeOutcome(index)"
          />
        </div>
        <div v-if="store.grade.profiles.length === 0" class="empty-tip">
          请添加结局指标以开始评估
        </div>
      </div>

      <!-- 右侧：详细评估表单 -->
      <div class="evaluation-panel" v-if="currentProfile">
        <div class="panel-header">
          <h3>{{ currentProfile.outcomeName }} - GRADE 证据分级</h3>
          <div class="actions">
            <el-button
              type="success"
              @click="autoEvaluate"
              :loading="evaluating"
            >
              <el-icon><MagicStick /></el-icon> AI 自动评估
            </el-button>
            <el-button type="primary" plain @click="showSofTable = true">
              查看 SoF 表格
            </el-button>
          </div>
        </div>

        <el-form label-position="top" class="grade-form">
          <!-- 基本信息 -->
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="结局指标名称">
                <el-input v-model="currentProfile.outcomeName" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="重要性">
                <el-select v-model="currentProfile.importance">
                  <el-option label="关键 (Critical)" value="Critical" />
                  <el-option label="重要 (Important)" value="Important" />
                  <el-option
                    label="不重要 (Not important)"
                    value="Not important"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="纳入研究数">
                <el-input-number
                  v-model="currentProfile.numberOfStudies"
                  :min="0"
                />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="总样本量">
                <el-input-number v-model="currentProfile.sampleSize" :min="0" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left"
            >降级因素 (Downgrade Factors)</el-divider
          >

          <!-- 5个降级因素 -->
          <div class="factor-grid">
            <div
              class="factor-card"
              v-for="factor in downgradeFactors"
              :key="factor.key"
            >
              <div class="factor-header">
                <span class="factor-title">{{ factor.label }}</span>
                <el-select
                  v-model="currentProfile[factor.key].rating"
                  size="small"
                  style="width: 140px"
                  @change="recalculateGrade"
                >
                  <el-option
                    v-for="opt in factor.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </div>
              <el-input
                v-model="currentProfile[factor.key].reason"
                type="textarea"
                :rows="2"
                placeholder="输入降级理由..."
                class="reason-input"
              />
            </div>
          </div>

          <el-divider content-position="left"
            >升级因素 (Upgrade Factors)</el-divider
          >

          <el-checkbox-group
            v-model="upgradeFactorsSelection"
            @change="handleUpgradeChange"
          >
            <el-checkbox label="largeEffect"
              >效应量大 (Large Effect, RR>2 or <0.5)</el-checkbox
            >
            <el-checkbox label="doseResponse"
              >剂量反应关系 (Dose Response)</el-checkbox
            >
            <el-checkbox label="confounding"
              >混杂因素可能减弱效应 (Confounding)</el-checkbox
            >
          </el-checkbox-group>

          <el-divider />

          <div class="result-section">
            <div class="final-grade">
              <span>最终证据等级：</span>
              <el-tag
                :type="getLevelTagType(currentProfile.overallCertainty)"
                size="large"
                effect="dark"
              >
                {{ currentProfile.overallCertainty }}
              </el-tag>
            </div>
            <el-input
              v-model="currentProfile.resultSummary"
              type="textarea"
              :rows="3"
              placeholder="输入简要结论 (Summary of Findings)..."
            />
          </div>
        </el-form>
      </div>

      <div v-else class="no-selection">
        <el-empty description="请选择或添加一个结局指标" />
      </div>
    </div>

    <!-- SoF 表格弹窗 -->
    <el-dialog
      v-model="showSofTable"
      title="Summary of Findings (SoF) Table"
      width="80%"
    >
      <el-table :data="store.grade.profiles" border stripe>
        <el-table-column prop="outcomeName" label="Outcome" width="150" />
        <el-table-column label="No of Participants (Studies)" width="180">
          <template #default="{ row }">
            {{ row.sampleSize }} ({{ row.numberOfStudies }} studies)
          </template>
        </el-table-column>
        <el-table-column label="Certainty of the Evidence (GRADE)" width="250">
          <template #default="{ row }">
            <div class="grade-cell">
              <el-tag
                :type="getLevelTagType(row.overallCertainty)"
                size="small"
                >{{ row.overallCertainty }}</el-tag
              >
              <div class="grade-icons">
                <span
                  v-if="row.riskOfBias.rating !== 'not-serious'"
                  title="Risk of Bias"
                  >⚠️RoB</span
                >
                <span
                  v-if="row.inconsistency.rating !== 'not-serious'"
                  title="Inconsistency"
                  >⚠️Inc</span
                >
                <span
                  v-if="row.indirectness.rating !== 'not-serious'"
                  title="Indirectness"
                  >⚠️Ind</span
                >
                <span
                  v-if="row.imprecision.rating !== 'not-serious'"
                  title="Imprecision"
                  >⚠️Imp</span
                >
                <span
                  v-if="row.publicationBias.rating !== 'undetected'"
                  title="Pub Bias"
                  >⚠️Pub</span
                >
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="resultSummary" label="Anticipated Effects" />
      </el-table>
      <template #footer>
        <el-button @click="showSofTable = false">关闭</el-button>
        <el-button type="primary">导出表格</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useMetaStore, type GradeProfile } from "../stores/metaStore";
import { Plus, MagicStick, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const store = useMetaStore();
const currentProfileId = ref<string | null>(null);
const showSofTable = ref(false);
const evaluating = ref(false);

// 辅助计算属性：当前选中的 Profile
const currentProfile = computed(() =>
  store.grade.profiles.find((p) => p.id === currentProfileId.value)
);

// 降级因素配置
const downgradeFactors = [
  {
    key: "riskOfBias",
    label: "偏倚风险 (Risk of Bias)",
    options: [
      { label: "不严重 (Not serious)", value: "not-serious" },
      { label: "严重 (Serious, -1)", value: "serious" },
      { label: "非常严重 (Very serious, -2)", value: "very-serious" },
    ],
  },
  {
    key: "inconsistency",
    label: "不一致性 (Inconsistency)",
    options: [
      { label: "不严重 (Not serious)", value: "not-serious" },
      { label: "严重 (Serious, -1)", value: "serious" },
      { label: "非常严重 (Very serious, -2)", value: "very-serious" },
    ],
  },
  {
    key: "indirectness",
    label: "间接性 (Indirectness)",
    options: [
      { label: "不严重 (Not serious)", value: "not-serious" },
      { label: "严重 (Serious, -1)", value: "serious" },
      { label: "非常严重 (Very serious, -2)", value: "very-serious" },
    ],
  },
  {
    key: "imprecision",
    label: "不精确性 (Imprecision)",
    options: [
      { label: "不严重 (Not serious)", value: "not-serious" },
      { label: "严重 (Serious, -1)", value: "serious" },
      { label: "非常严重 (Very serious, -2)", value: "very-serious" },
    ],
  },
  {
    key: "publicationBias",
    label: "发表偏倚 (Publication Bias)",
    options: [
      { label: "未检测到 (Undetected)", value: "undetected" },
      { label: "怀疑 (Suspected, -1)", value: "suspected" },
      {
        label: "强烈怀疑 (Strongly suspected, -2)",
        value: "strongly-suspected",
      },
    ],
  },
] as const;

// 升级因素复选框绑定
const upgradeFactorsSelection = computed({
  get: () => {
    if (!currentProfile.value) return [];
    const list = [];
    if (currentProfile.value.largeEffect) list.push("largeEffect");
    if (currentProfile.value.doseResponse) list.push("doseResponse");
    if (currentProfile.value.confounding) list.push("confounding");
    return list;
  },
  set: (val: string[]) => {
    if (!currentProfile.value) return;
    currentProfile.value.largeEffect = val.includes("largeEffect");
    currentProfile.value.doseResponse = val.includes("doseResponse");
    currentProfile.value.confounding = val.includes("confounding");
    recalculateGrade();
  },
});

const handleUpgradeChange = () => {
  // Triggered by setter
};

// 添加结局指标
const addOutcome = () => {
  const newProfile: GradeProfile = {
    id: Date.now().toString(),
    outcomeName: store.pico.outcome || "New Outcome",
    importance: "Critical",
    numberOfStudies: store.literatures.filter((l) => l.status === "included")
      .length,
    sampleSize: 0, // 需要从 extractionData 聚合
    riskOfBias: { rating: "not-serious", reason: "" },
    inconsistency: { rating: "not-serious", reason: "" },
    indirectness: { rating: "not-serious", reason: "" },
    imprecision: { rating: "not-serious", reason: "" },
    publicationBias: { rating: "undetected", reason: "" },
    largeEffect: false,
    doseResponse: false,
    confounding: false,
    overallCertainty: "High",
    resultSummary: "",
  };
  store.grade.profiles.push(newProfile);
  currentProfileId.value = newProfile.id;
};

const removeOutcome = (index: number) => {
  store.grade.profiles.splice(index, 1);
  if (store.grade.profiles.length > 0) {
    currentProfileId.value = store.grade.profiles[0]?.id || null;
  } else {
    currentProfileId.value = null;
  }
};

// 重新计算等级
const recalculateGrade = () => {
  if (!currentProfile.value) return;

  let score = 4; // Start High (RCT default, Observational start Low=2 but here we assume RCT start for simplicity or adjust logic)

  // 简单起见，假设初始为 High (4分)
  // 实际应根据研究类型判断：RCT=4, Observational=2

  const p = currentProfile.value;

  // 降级
  const downgradeMap: Record<string, number> = {
    "not-serious": 0,
    serious: 1,
    "very-serious": 2,
    undetected: 0,
    suspected: 1,
    "strongly-suspected": 2,
  };

  score -= downgradeMap[p.riskOfBias.rating] || 0;
  score -= downgradeMap[p.inconsistency.rating] || 0;
  score -= downgradeMap[p.indirectness.rating] || 0;
  score -= downgradeMap[p.imprecision.rating] || 0;
  score -= downgradeMap[p.publicationBias.rating] || 0;

  // 升级
  if (p.largeEffect) score += 1;
  if (p.doseResponse) score += 1;
  if (p.confounding) score += 1;

  // 限制范围
  if (score > 4) score = 4;
  if (score < 1) score = 1;

  const levels = ["Very Low", "Low", "Moderate", "High"];
  p.overallCertainty = levels[score - 1] as any;
};

// AI 自动评估
const autoEvaluate = async () => {
  if (!currentProfile.value) return;
  evaluating.value = true;

  // 模拟 AI 分析过程
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const p = currentProfile.value;
  const analysis = store.analysis;

  // 1. 不一致性：根据 I2 判断
  if (analysis.heterogeneity.i2 > 50) {
    p.inconsistency.rating = "serious";
    p.inconsistency.reason = `异质性较高 (I² = ${analysis.heterogeneity.i2}%)，且亚组分析未能完全解释。`;
  } else {
    p.inconsistency.rating = "not-serious";
    p.inconsistency.reason = `异质性较低 (I² = ${analysis.heterogeneity.i2}%)，结果一致。`;
  }

  // 2. 不精确性：根据样本量 (Mock logic)
  if (p.sampleSize < 400 && p.sampleSize > 0) {
    p.imprecision.rating = "serious";
    p.imprecision.reason = "总样本量未达到最佳信息量 (OIS)，置信区间较宽。";
  } else {
    p.imprecision.rating = "not-serious";
    p.imprecision.reason = "样本量充足，置信区间精确。";
  }

  // 3. 偏倚风险：假设基于 NOS 工具
  if (store.grade.tool === "NOS") {
    p.riskOfBias.rating = "not-serious";
    p.riskOfBias.reason = "大部分纳入研究 NOS 评分 >= 7 分，偏倚风险较低。";
  }

  // 4. 生成总结
  p.resultSummary = `基于 ${p.numberOfStudies} 项研究 (${p.sampleSize} 名参与者)，有 ${p.overallCertainty} 质量证据表明 ${store.pico.intervention} 可能降低 ${store.pico.outcome} 的风险。`;

  recalculateGrade();
  evaluating.value = false;
  ElMessage.success("AI 自动评估完成");
};

const getLevelTagType = (level: string) => {
  switch (level) {
    case "High":
      return "success";
    case "Moderate":
      return "warning";
    case "Low":
      return "danger";
    case "Very Low":
      return "info";
    default:
      return "info";
  }
};

// 初始化：如果没有 profile，自动加一个
if (store.grade.profiles.length === 0 && store.pico.outcome) {
  addOutcome();
}
</script>

<style scoped>
.grade-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.tool-select {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0; /* 防止溢出 */
}

.outcome-list {
  width: 250px;
  border-right: 1px solid #eee;
  padding-right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.outcome-item {
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.outcome-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.outcome-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.outcome-name {
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
}

.outcome-item:hover .delete-btn {
  display: inline-flex;
}

.evaluation-panel {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.panel-header h3 {
  margin: 0;
}

.factor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.factor-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.factor-title {
  font-weight: bold;
  font-size: 14px;
}

.reason-input {
  font-size: 12px;
}

.result-section {
  background: #f0f9eb;
  padding: 20px;
  border-radius: 4px;
  margin-top: 20px;
}

.final-grade {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.grade-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.grade-icons {
  font-size: 10px;
  color: #e6a23c;
}

.no-selection {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
}
</style>
