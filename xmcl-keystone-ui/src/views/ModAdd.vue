<template>
  <div class="flex flex-col select-none h-full overflow-auto pt-4 pb-0">
    <SharedTooltip />
    <v-progress-linear
      class="absolute top-0 z-10 m-0 p-0 left-0"
      :active="loading"
      height="3"
      :indeterminate="true"
    />

    <v-card
      class="rounded-lg py-1 pr-2 z-5 shadow mx-4"
      outlined
    >
      <div
        class="flex flex-shrink flex-grow-0 items-center gap-2"
      >
        <v-text-field
          v-model="keyword"
          filled
          dense
          class="pl-2 pt-2 max-w-200 max-h-full"
          :label="t('mod.filter')"
          :loading="loading"
        />
        <v-select
          class="max-w-40"
          hide-details
          label="Minecraft"
          flat
          solo
          clearable
        />
        <div class="flex-grow" />

        <v-btn icon>
          <v-icon>
            shopping_cart
          </v-icon>
        </v-btn>
        <v-btn color="primary">
          <v-icon left>
            file_download
          </v-icon>
          Install
        </v-btn>
      </div>
      <div
        class="flex flex-shrink flex-grow-0 items-center justify-center gap-2"
      >
        <v-tabs
          v-model="tab"
          centered
        >
          <v-tab>
            <v-icon left>
              all_inclusive
            </v-icon>
            All
            <div
              class="v-badge__badge primary static ml-1 w-[unset]"
            >
              {{ mods.length + curseforgeCount + modrinthCount }}
            </div>
          </v-tab>
          <v-tab>
            <v-icon left>
              storage
            </v-icon>
            Local
            <div
              class="v-badge__badge primary static ml-1 w-[unset]"
            >
              {{ mods.length }}
            </div>
          </v-tab>
          <v-tab :disabled="!curseforge || curseforge.data.length === 0">
            <v-icon left>
              $vuetify.icons.curseforge
            </v-icon>
            Curseforge
            <div
              class="v-badge__badge primary static ml-1 w-[unset]"
            >
              {{ curseforgeCount }}
            </div>
          </v-tab>
          <v-tab :disabled="!modrinth || modrinth.hits.length === 0">
            <v-icon left>
              $vuetify.icons.modrinth
            </v-icon>
            Modrinth
            <div
              class="v-badge__badge primary static ml-1 w-[unset]"
            >
              {{ modrinthCount }}
            </div>
          </v-tab>
        </v-tabs>
      </div>
    </v-card>

    <div
      class="grid h-full overflow-auto grid-cols-12 py-0 divide-x divide-dark-50 "
      @dragover.prevent
      @drop="onDropToImport"
    >
      <v-list
        color="transparent"
        class="lg:col-span-7 col-span-5 h-full visible-scroll overflow-auto"
      >
        <v-list-item-group
          v-model="selectedItem"
        >
          <v-list-item
            v-for="p of items"
            :key="p.id"
          >
            <v-list-item-avatar>
              <v-img
                :src="p.icon"
              />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ p.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ p.description }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      <div class="h-full overflow-auto lg:col-span-5 col-span-7">
        <template v-if="!!selected">
          <ModAddModrinthDetail
            v-if="selected.modrinth"
            :hint="selected.modrinth"
            :loader="forge ? 'forge' : fabricLoader ? 'fabric' : ''"
            :minecraft="minecraft"
          />
          <ModAddCurseforgeDetail
            v-else-if="selected.curseforge"
            :mod="selected.curseforge"
            :loader="forge ? 'forge' : fabricLoader ? 'fabric' : ''"
            :minecraft="minecraft"
          />
        </template>
      </div>

      <!-- <Hint
        v-else-if="items.length === 0"
        icon="save_alt"
        :text="t('mod.dropHint')"
        :absolute="true"
        class="h-full z-0"
      /> -->
      <!-- <v-virtual-scroll
        v-else
        :class="{ 'selection-mode': isSelectionMode }"
        :items="items"
        :bench="2"
        class="overflow-auto max-h-full"
        item-height="100"
      >
        <template #default="{ item, index }">
          <div class="mx-8 invisible-scroll last:mb-4">
            <ModCard
              :key="item.path + '@' + item.hash"
              :item="item"
              :index="index"
              :selection="isSelectionMode"
              :on-enable="onEnable"
              :on-tags="onTags"
              :on-select="onSelect"
              :on-item-dragstart="onItemDragstart"
              :on-click="onClick"
              :on-delete="startDelete"
            />
          </div>
        </template>
      </v-virtual-scroll> -->
    </div>
    <div class="absolute w-full left-0 bottom-0 flex items-center justify-center mb-5 pointer-events-none">
      <!-- <FloatButton
        class="pointer-events-auto"
        :deleting="isDraggingMod"
        :visible="isDraggingMod || isModified"
        :loading="committing"
        @drop="startDelete()"
        @click="commit"
      /> -->
    </div>
  </div>
</template>

<script lang=ts setup>
import Hint from '@/components/Hint.vue'
import RefreshingTile from '@/components/RefreshingTile.vue'
import { useDrop, useService } from '@/composables'
import { useModDeletion } from '@/composables/modDelete'
import { useModDragging } from '@/composables/modDraggable'
import { useModFilter } from '@/composables/modFilter'
import { useModSelection } from '@/composables/modSelection'
import { kSharedTooltip, useSharedTooltip } from '@/composables/sharedTooltip'
import { Resource, ResourceDomain, ResourceServiceKey } from '@xmcl/runtime-api'
import DeleteDialog from '../components/DeleteDialog.vue'
import { ModItem, useInstanceMods } from '../composables/mod'
import ModCard from './ModCard.vue'
import ModDeleteView from './ModDeleteView.vue'
import FloatButton from './ModFloatButton.vue'
import ModHeader from './ModHeader.vue'
import SharedTooltip from '../components/SharedTooltip.vue'
import { CompatibleDetail } from '@/util/modCompatible'
import { useModsSearch } from '@/composables/modSearch'
import { getDiceCoefficient } from '@/util/sort'
import { Mod } from '@xmcl/curseforge'
import { Project, SearchResultHit } from '@xmcl/modrinth'
import ModAddModrinthDetail from './ModAddModrinthDetail.vue'
import { useInstanceVersionBase } from '@/composables/instance'
import ModAddCurseforgeDetail from './ModAddCurseforgeDetail.vue'

interface SearchItem {
  id: string
  icon: string
  title: string
  description: string

  curseforge?: Mod
  modrinth?: SearchResultHit
  resource?: Resource
}

const selectedItem = ref(undefined)
const { importResources } = useService(ResourceServiceKey)
const tab = ref(0)
const keyword = ref('')
const { minecraft, forge, fabricLoader } = useInstanceVersionBase()
const {
  modrinth, modrinthError, loadingModrinth,
  curseforge, curseforgeError, loadingCurseforge,
  mods,
} = useModsSearch(keyword, minecraft, forge, fabricLoader)
const loading = computed(() => loadingModrinth.value || loadingCurseforge.value)
const curseforgeCount = computed(() => curseforge.value ? curseforge.value.pagination.totalCount : 0)
const modrinthCount = computed(() => modrinth.value ? modrinth.value.total_hits : 0)
const disableModrinth = computed(() => tab.value !== 0 && tab.value !== 3)
const disableCurseforge = computed(() => tab.value !== 0 && tab.value !== 2)

const items = computed(() => {
  const results: [SearchItem, number][] = []
  const modr = modrinth.value
  if (modr && !disableModrinth.value) {
    for (const i of modr.hits) {
      results.push([{
        id: i.project_id,
        icon: i.icon_url,
        title: i.title,
        description: i.description,
        modrinth: i,
      }, getDiceCoefficient(keyword.value, i.title)])
    }
  }
  const cf = curseforge.value
  if (cf && !disableCurseforge.value) {
    for (const i of cf.data) {
      results.push(([{
        id: i.id.toString(),
        icon: i.logo.url,
        title: i.name,
        description: i.summary,
        curseforge: i,
      }, getDiceCoefficient(keyword.value, i.name)]))
    }
  }
  for (const m of mods.value) {
    let description = ''
    if (m.metadata.forge) {
      description = m.metadata.forge.description
    } else if (m.metadata.fabric) {
      if (m.metadata.fabric instanceof Array) {
        description = m.metadata.fabric[0].description || ''
      } else {
        description = m.metadata.fabric.description || ''
      }
    }
    results.push(([{
      id: m.path,
      icon: m.icons?.[0] ?? '',
      title: m.name,
      description: description,
      resource: m,
    }, getDiceCoefficient(keyword.value, m.name)]))
  }
  results.sort((a, b) => -a[1] + b[1])
  return results.map(v => v[0])
})

const selected = computed(() => {
  const index = selectedItem.value
  if (index !== undefined) return items.value[index]
  return undefined
})

provide(kSharedTooltip, useSharedTooltip<CompatibleDetail>((dep) => {
  const compatibleText = dep.compatible === 'maybe'
    ? t('mod.maybeCompatible')
    : dep.compatible
      ? t('mod.compatible')
      : t('mod.incompatible')
  return compatibleText + t('mod.acceptVersion', { version: dep.requirements }) + ', ' + t('mod.currentVersion', { current: dep.version || '⭕' }) + '.'
}))

const { t } = useI18n()

const { onDrop: onDropToImport } = useDrop((file) => {
  importResources([{ path: file.path, domain: ResourceDomain.Mods }])
})
</script>
