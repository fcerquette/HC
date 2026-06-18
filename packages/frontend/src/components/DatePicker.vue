<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{ modelValue: string; placeholder?: string; id?: string }>(),
  { placeholder: 'dd/mm/aaaa' },
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function parse(v: string): { y: number; m: number; d: number } | null {
  const mm = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '')
  return mm ? { y: +mm[1], m: +mm[2] - 1, d: +mm[3] } : null
}
function pad(n: number): string {
  return String(n).padStart(2, '0')
}
function iso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

const hoy = new Date()
const hoyIso = iso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const viewY = ref(hoy.getFullYear())
const viewM = ref(hoy.getMonth())

// Al abrir o cambiar el valor, posicionar el calendario en el mes correcto.
watch(
  () => props.modelValue,
  (v) => {
    const p = parse(v)
    if (p) {
      viewY.value = p.y
      viewM.value = p.m
    }
  },
  { immediate: true },
)

const display = computed(() => {
  const p = parse(props.modelValue)
  return p ? `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` : ''
})

const semanas = computed(() => {
  const first = new Date(viewY.value, viewM.value, 1)
  const offset = (first.getDay() + 6) % 7 // Lu = 0
  const total = new Date(viewY.value, viewM.value + 1, 0).getDate()
  const celdas: ({ d: number; iso: string } | null)[] = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= total; d++) celdas.push({ d, iso: iso(viewY.value, viewM.value, d) })
  while (celdas.length % 7 !== 0) celdas.push(null)
  const out: ({ d: number; iso: string } | null)[][] = []
  for (let i = 0; i < celdas.length; i += 7) out.push(celdas.slice(i, i + 7))
  return out
})

function prevMes() {
  if (viewM.value === 0) {
    viewM.value = 11
    viewY.value--
  } else viewM.value--
}
function nextMes() {
  if (viewM.value === 11) {
    viewM.value = 0
    viewY.value++
  } else viewM.value++
}
function elegir(d: string) {
  emit('update:modelValue', d)
  open.value = false
}
function seleccionarHoy() {
  elegir(hoyIso)
}
function limpiar() {
  emit('update:modelValue', '')
  open.value = false
}
function toggle() {
  open.value = !open.value
}

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
watch(open, (o) => {
  if (o) {
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
  } else {
    document.removeEventListener('mousedown', onDocClick)
    document.removeEventListener('keydown', onKey)
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="dp">
    <button
      :id="id"
      type="button"
      class="dp__field"
      :class="{ 'dp__field--empty': !display }"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <span>{{ display || placeholder }}</span>
      <span class="dp__icon" aria-hidden="true">📅</span>
    </button>

    <div v-if="open" class="dp__pop" role="dialog" aria-label="Elegir fecha">
      <div class="dp__head">
        <button type="button" class="dp__nav" aria-label="Mes anterior" @click="prevMes">
          <i class="dp__chevron dp__chevron--left" aria-hidden="true"></i>
        </button>
        <span class="dp__title">{{ MESES[viewM] }} {{ viewY }}</span>
        <button type="button" class="dp__nav" aria-label="Mes siguiente" @click="nextMes">
          <i class="dp__chevron dp__chevron--right" aria-hidden="true"></i>
        </button>
      </div>

      <div class="dp__grid dp__grid--dias">
        <span v-for="d in DIAS" :key="d" class="dp__dow">{{ d }}</span>
      </div>

      <div class="dp__grid">
        <template v-for="(sem, si) in semanas" :key="si">
          <template v-for="(c, ci) in sem" :key="`${si}-${ci}`">
            <button
              v-if="c"
              type="button"
              class="dp__dia"
              :class="{
                'dp__dia--sel': c.iso === modelValue,
                'dp__dia--hoy': c.iso === hoyIso && c.iso !== modelValue,
              }"
              @click="elegir(c.iso)"
            >
              {{ c.d }}
            </button>
            <span v-else class="dp__dia dp__dia--vacio"></span>
          </template>
        </template>
      </div>

      <div class="dp__foot">
        <button type="button" class="dp__link" @click="seleccionarHoy">Hoy</button>
        <button v-if="display" type="button" class="dp__link" @click="limpiar">Limpiar</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dp {
  position: relative;

  &__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    width: 100%;
    min-height: 2.5rem;
    padding: 0.55rem 0.7rem;
    color: var(--c-text);
    background: var(--c-surface);
    border: 1px solid var(--c-border-strong);
    border-radius: var(--radius-sm);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;

    &--empty {
      color: var(--c-text-faint);
    }

    &:hover {
      border-color: var(--c-text-faint);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--c-primary);
      box-shadow: var(--focus-ring);
    }
  }

  &__icon {
    flex: 0 0 auto;
    opacity: 0.7;
  }

  &__pop {
    position: absolute;
    z-index: 50;
    top: calc(100% + 6px);
    left: 0;
    width: 17rem;
    max-width: 90vw;
    padding: var(--sp-3);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--sp-2);
  }

  &__title {
    font-weight: 700;
    font-size: var(--fs-sm);
  }

  &__nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    color: var(--c-text-muted);
    background: var(--c-surface);
    border: 1px solid var(--c-border-strong);
    border-radius: var(--radius-pill);
    transition: background-color 0.12s, color 0.12s, border-color 0.12s;

    &:hover {
      background: var(--c-primary-weak);
      color: var(--c-primary-text);
      border-color: var(--c-primary-weak-border);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  }

  &__chevron {
    width: 0.45rem;
    height: 0.45rem;
    border-style: solid;
    border-width: 2px 2px 0 0;
    border-color: currentColor;
    border-radius: 1px;

    &--left {
      transform: translateX(1px) rotate(-135deg);
    }
    &--right {
      transform: translateX(-1px) rotate(45deg);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;

    &--dias {
      margin-bottom: var(--sp-1);
    }
  }

  &__dow {
    text-align: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--c-text-faint);
    padding: 0.2rem 0;
  }

  &__dia {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    padding: 0;
    font-size: var(--fs-sm);
    color: var(--c-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color 0.12s, color 0.12s;

    &:hover {
      background: var(--c-primary-weak);
    }

    &--hoy {
      border-color: var(--c-primary-weak-border);
      font-weight: 700;
    }

    &--sel {
      background: var(--c-primary);
      color: #fff;
      font-weight: 700;
    }

    &--vacio {
      cursor: default;
      background: transparent;
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  }

  &__foot {
    display: flex;
    justify-content: space-between;
    margin-top: var(--sp-2);
    padding-top: var(--sp-2);
    border-top: 1px solid var(--c-border);
  }

  &__link {
    padding: 0.2rem 0.4rem;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--c-primary-text);
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;

    &:hover {
      background: var(--c-primary-weak);
    }
  }
}
</style>
