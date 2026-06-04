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

const TIPOS: Record<EventoFecha['tipo'], { label: string; icon: string; color: string }> = {
  visita: { label: 'Visita', icon: '🩺', color: '#27ae60' },
  laboratorio: { label: 'Laboratorio', icon: '🧪', color: '#e67e22' },
  estudio: { label: 'Estudio', icon: '📷', color: '#2980b9' },
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
        <button type="button" @click="cambiarAnio(-1)">‹</button>
        <strong>{{ anio }}</strong>
        <button type="button" @click="cambiarAnio(1)">›</button>
      </div>
      <ul class="cal__leyenda">
        <li v-for="(info, tipo) in TIPOS" :key="tipo">
          <span class="cal__dot" :style="{ background: info.color }"></span>
          {{ info.icon }} {{ info.label }}
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
      <h4>
        Eventos {{ anio }}
        <button v-if="mesSel !== null" type="button" class="cal__filtro" @click="mesSel = null">
          {{ MESES[mesSel] }} ✕
        </button>
      </h4>
      <p v-if="!agenda.length" class="cal__vacio">
        Sin eventos {{ mesSel !== null ? 'este mes' : 'registrados este año' }}.
      </p>
      <ul v-else>
        <li v-for="(e, i) in agenda" :key="i" @click="emit('seleccionar', e)">
          <span class="cal__dot" :style="{ background: TIPOS[e.tipo].color }"></span>
          <strong>{{ formatFecha(e.fecha) }}</strong>
          <span class="cal__ev-icon">{{ TIPOS[e.tipo].icon }}</span>
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
    gap: 0.5rem 1rem;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    button {
      width: 1.8rem;
      height: 1.8rem;
      line-height: 1;
    }

    strong {
      font-size: 1.1rem;
      min-width: 3.5rem;
      text-align: center;
    }
  }

  &__leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 0.8rem;

    li {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
  }

  &__dot {
    display: inline-block;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
  }

  &__tira {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.3rem;
    margin: 1rem 0;
  }

  &__mes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.2rem;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 6px;
    color: #999;
    font-size: 0.7rem;

    &--con {
      color: #222;
      background: #fff;
      border-color: #ddd;
    }

    &--activo {
      border-color: #2c7be5;
      box-shadow: 0 0 0 1px #2c7be5 inset;
      color: #1a4f8b;
    }
  }

  &__mes-dots {
    display: flex;
    gap: 2px;
    min-height: 0.6rem;
  }

  &__agenda {
    margin-top: 1rem;

    h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.5rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.25rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;

      &:hover {
        background: #fafafa;
      }
    }
  }

  &__filtro {
    background: #eef2f7;
    color: #1a4f8b;
    border-color: transparent;
    padding: 0.1rem 0.5rem;
    font-size: 0.75rem;
  }

  &__ev-label {
    color: #444;
  }

  &__vacio {
    color: #888;
    font-size: 0.9rem;
  }
}
</style>
