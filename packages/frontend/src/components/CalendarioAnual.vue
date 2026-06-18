<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface EventoFecha {
  fecha: string // yyyy-mm-dd
  tipo: 'visita' | 'laboratorio' | 'estudio'
  label: string
  origen: 'visita' | 'ficha'
  refId: number
}

const props = defineProps<{ eventos: EventoFecha[] }>()
const emit = defineEmits<{ (e: 'seleccionar', evento: EventoFecha): void }>()

const TIPOS: Record<EventoFecha['tipo'], { label: string; color: string }> = {
  visita: { label: 'Visita', color: '#2f9e5f' },
  laboratorio: { label: 'Laboratorio', color: '#d9822b' },
  estudio: { label: 'Estudio', color: '#2f7fc4' },
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const anioActual = new Date().getFullYear()
const anio = ref(anioActual)
const mesSel = ref<number | null>(null)

const anios = computed(() => {
  const set = new Set<number>()
  for (const e of props.eventos) {
    const y = Number(e.fecha.slice(0, 4))
    if (y) set.add(y)
  }
  return [...set].sort((a, b) => b - a)
})

watch(
  anios,
  (a) => {
    if (a.length && !a.includes(anio.value)) anio.value = a[0]
  },
  { immediate: true },
)
watch(anio, () => {
  mesSel.value = null
})

const eventosDelAnio = computed(() =>
  props.eventos.filter((e) => Number(e.fecha.slice(0, 4)) === anio.value),
)

function mesDe(e: EventoFecha): number {
  return Number(e.fecha.slice(5, 7)) - 1
}

const tiposPorMes = computed(() => {
  const m: Record<number, Set<EventoFecha['tipo']>> = {}
  for (const e of eventosDelAnio.value) {
    const mm = mesDe(e)
    if (!m[mm]) m[mm] = new Set()
    m[mm].add(e.tipo)
  }
  return m
})

function tiposDelMes(mes: number): EventoFecha['tipo'][] {
  return [...(tiposPorMes.value[mes] ?? [])]
}

function toggleMes(mes: number) {
  mesSel.value = mesSel.value === mes ? null : mes
}

const agenda = computed(() => {
  let evs = eventosDelAnio.value
  if (mesSel.value !== null) evs = evs.filter((e) => mesDe(e) === mesSel.value)
  return [...evs].sort((a, b) => b.fecha.localeCompare(a.fecha))
})

function formatFecha(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}` : value
}

function cambiarAnio(delta: number) {
  anio.value += delta
}
</script>

<template>
  <div class="cal">
    <div class="cal__header">
      <div class="cal__nav">
        <button
          type="button"
          class="cal__nav-btn"
          aria-label="Año anterior"
          @click="cambiarAnio(-1)"
        >
          <i class="cal__chevron cal__chevron--left" aria-hidden="true"></i>
        </button>
        <span class="cal__anio">{{ anio }}</span>
        <button
          type="button"
          class="cal__nav-btn"
          aria-label="Año siguiente"
          @click="cambiarAnio(1)"
        >
          <i class="cal__chevron cal__chevron--right" aria-hidden="true"></i>
        </button>
      </div>

      <ul class="cal__leyenda">
        <li v-for="(info, tipo) in TIPOS" :key="tipo">
          <span class="cal__dot" :style="{ background: info.color }"></span>
          {{ info.label }}
        </li>
      </ul>
    </div>

    <!-- Tira de meses (panorama del año; clic filtra la agenda) -->
    <div class="cal__tira">
      <button
        v-for="(ab, mes) in MESES"
        :key="mes"
        type="button"
        class="cal__mes"
        :class="{
          'cal__mes--con': tiposDelMes(mes).length,
          'cal__mes--activo': mesSel === mes,
        }"
        @click="toggleMes(mes)"
      >
        <span class="cal__mes-ab">{{ ab }}</span>
        <span class="cal__mes-dots">
          <span
            v-for="t in tiposDelMes(mes)"
            :key="t"
            class="cal__dot"
            :style="{ background: TIPOS[t].color }"
          ></span>
        </span>
      </button>
    </div>

    <!-- Agenda del año (vista principal) -->
    <div class="cal__agenda">
      <div class="cal__agenda-head">
        <h4>Eventos {{ anio }}</h4>
        <button v-if="mesSel !== null" type="button" class="cal__filtro" @click="mesSel = null">
          {{ MESES[mesSel] }}
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <p v-if="!agenda.length" class="cal__vacio">
        Sin eventos {{ mesSel !== null ? 'este mes' : 'registrados este año' }}.
      </p>

      <ul v-else class="cal__lista">
        <li
          v-for="(e, i) in agenda"
          :key="i"
          class="cal__ev"
          tabindex="0"
          @click="emit('seleccionar', e)"
          @keydown.enter="emit('seleccionar', e)"
        >
          <span class="cal__dot" :style="{ background: TIPOS[e.tipo].color }"></span>
          <span class="cal__ev-fecha">{{ formatFecha(e.fecha) }}</span>
          <span
            class="cal__ev-tipo"
            :style="{
              color: TIPOS[e.tipo].color,
              borderColor: TIPOS[e.tipo].color,
            }"
          >
            {{ TIPOS[e.tipo].label }}
          </span>
          <span class="cal__ev-label">{{ e.label }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cal {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-4);
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  &__nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    color: var(--c-text-muted);
    background: var(--c-surface);
    border: 1px solid var(--c-border-strong);
    border-radius: var(--radius-pill);
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;

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

  // Chevron dibujado con bordes: centra perfecto, sin depender de la fuente.
  &__chevron {
    width: 0.5rem;
    height: 0.5rem;
    border-style: solid;
    border-width: 2px 2px 0 0; // bordes superior + derecho
    border-color: currentColor;
    border-radius: 1px;

    &--left {
      transform: translateX(1px) rotate(-135deg); // punta hacia la izquierda
    }

    &--right {
      transform: translateX(-1px) rotate(45deg); // punta hacia la derecha
    }
  }

  &__anio {
    min-width: 3.5rem;
    text-align: center;
    font-size: var(--fs-lg);
    font-weight: 700;
  }

  &__leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-4);
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: var(--fs-sm);
    color: var(--c-text-muted);

    li {
      display: flex;
      align-items: center;
      gap: var(--sp-2);
    }
  }

  &__dot {
    display: inline-block;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    flex: 0 0 auto;
  }

  &__tira {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--sp-2);
    margin: var(--sp-5) 0;
  }

  &__mes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-1);
    min-height: 3.25rem;
    padding: var(--sp-2) var(--sp-1);
    background: var(--c-surface-2);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    color: var(--c-text-faint);
    font-size: 0.72rem;
    font-weight: 600;
    transition: background-color 0.12s, border-color 0.12s, color 0.12s;

    &--con {
      color: var(--c-text);
      background: var(--c-surface);
      border-color: var(--c-border);
    }

    &:hover {
      border-color: var(--c-border-strong);
    }

    &--activo {
      color: var(--c-primary-text);
      background: var(--c-primary-weak);
      border-color: var(--c-primary);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  }

  &__mes-dots {
    display: flex;
    gap: 2px;
    min-height: 0.6rem;
  }

  &__agenda {
    margin-top: var(--sp-5);
  }

  &__agenda-head {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-bottom: var(--sp-3);

    h4 {
      margin: 0;
      font-size: var(--fs-base);
    }
  }

  &__filtro {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
    padding: 0.15rem 0.6rem;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--c-primary-text);
    background: var(--c-primary-weak);
    border: 1px solid var(--c-primary-weak-border);
    border-radius: var(--radius-pill);

    &:hover {
      background: var(--c-surface);
    }
  }

  &__lista {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__ev {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-2);
    border-bottom: 1px solid var(--c-border);
    cursor: pointer;
    transition: background-color 0.12s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--c-surface-2);
    }

    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--c-primary);
      border-radius: var(--radius-sm);
    }
  }

  &__ev-fecha {
    flex: 0 0 3rem;
    font-weight: 700;
    color: var(--c-text);
  }

  &__ev-tipo {
    flex: 0 0 auto;
    padding: 0.05rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border: 1px solid;
    border-radius: var(--radius-pill);
    opacity: 0.9;
  }

  &__ev-label {
    color: var(--c-text);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__vacio {
    color: var(--c-text-muted);
    font-size: var(--fs-sm);
  }
}
</style>
