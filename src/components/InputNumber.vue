<script setup lang="ts">
import InputNumber, {
  type InputNumberPassThroughOptions,
} from "primevue/inputnumber";
import { computed } from "vue";

export interface InputNumberInterface {
  step?: number;
  ptProps?: InputNumberPassThroughOptions;
  unitClass?: string;
  placeholder?: string;
  inputUnit?: string;
  inputName?: string;
  isIncreamentButton?: boolean;
  isDisabled: boolean;
  inputWrapper: string;
  mode?: any;
  useGrouping?: boolean;
  minFractionDigits?: number | undefined;
  maxFractionDigits?: number | undefined;
  allowEmpty?: boolean;
  max?: number;
  min?: number;
  maxlength?: number;
}

//props
const props = defineProps<{
  inputProps: InputNumberInterface;
  modelValue: String | Number | any;
}>();

// emits
const emit = defineEmits(["update:modelValue", "focusIn", "focusOut"]);

const inputModel = computed({
  get() {
    return props.modelValue;
  },
  set(newValue) {
    emit("update:modelValue", newValue);
    return newValue;
  },
});
</script>
<template>
  <div class="relative flex" :class="props.inputProps.inputWrapper">
    <span
      v-if="props.inputProps.inputName"
      class="absolute left-14 top-3.5 text-blue-tint-600 font-semibold"
      :class="props.inputProps.unitClass"
    >
      {{ props.inputProps.inputName }}
    </span>

    <InputNumber
      unstyled
      :disabled="props.inputProps.isDisabled"
      v-model="inputModel"
      :placeholder="props.inputProps.placeholder"
      :pt="inputProps.ptProps"
      :mode="props.inputProps.mode"
      :useGrouping="props.inputProps.useGrouping"
      :minFractionDigits="props.inputProps.minFractionDigits"
      :maxFractionDigits="props.inputProps.maxFractionDigits"
      :allowEmpty="props.inputProps.allowEmpty"
      :max="props.inputProps.max"
      :min="props.inputProps.min"
      inputId="horizontal-buttons"
      showButtons
      buttonLayout="horizontal"
      :step="props.inputProps.step"
      @focus="emit('focusIn')"
      @blur="emit('focusOut')"
    >
      <template #incrementbuttonicon>
        <span class="fa-solid fa-plus" />
      </template>
      <template #decrementbuttonicon>
        <span class="fa-solid fa-minus" />
      </template>
    </InputNumber>
    <span
      v-if="props.inputProps.inputUnit"
      class="absolute right-14 top-3.5 text-blue-tint-600 font-semibold"
      :class="props.inputProps.unitClass"
    >
      {{ props.inputProps.inputUnit }}
    </span>
  </div>
</template>
