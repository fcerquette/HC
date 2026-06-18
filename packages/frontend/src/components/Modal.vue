<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps<{ modelValue: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

function close() {
  emit('update:modelValue', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @mousedown.self="close"
      >
        <div class="modal__dialog">
          <header class="modal__head">
            <h2 class="modal__title">{{ title }}</h2>
            <button type="button" class="modal__close" aria-label="Cerrar" @click="close">
              <span aria-hidden="true">✕</span>
            </button>
          </header>
          <div class="modal__body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--sp-6) var(--sp-4);
  background: rgba(16, 40, 52, 0.45);
  overflow-y: auto;

  &__dialog {
    width: 100%;
    max-width: 560px;
    max-height: calc(100vh - 2 * var(--sp-6));
    display: flex;
    flex-direction: column;
    background: var(--c-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--sp-5);
    border-bottom: 1px solid var(--c-border);
  }

  &__title {
    margin: 0;
    font-size: var(--fs-lg);
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    color: var(--c-text-muted);
    background: transparent;
    border: none;
    border-radius: var(--radius-pill);
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.12s, color 0.12s;

    &:hover {
      background: var(--c-surface-2);
      color: var(--c-text);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  }

  &__body {
    padding: var(--sp-5);
    overflow-y: auto;
  }
}

/* Transición de entrada/salida */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;

  .modal__dialog {
    transition: transform 0.18s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal__dialog {
    transform: translateY(-12px);
  }
}
</style>
