<template>
  <v-list
    two-line
    subheader
    style="background: transparent; width: 100%"
  >
    <v-subheader>Minecraft</v-subheader>

    <v-list-item>
      <v-list-item-content style="flex: 1">
        <v-list-item-title>
          {{ t("instance.mcOptions") }}
          <BaseSettingGlobalLabel
            :global="isGlobalMcOptions"
            @clear="resetMcOptions"
            @click="gotoSetting"
          />
        </v-list-item-title>
        <v-list-item-subtitle>
          <v-text-field
            v-model="mcOptions"
            solo
            class="m-1 mt-2"
            hide-details
            required
            :placeholder="t('instance.mcOptionsHint')"
          />
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-list-item>
      <v-list-item-action>
        <v-icon class="material-icons-outlined icon-image-preview">
          preview
        </v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          {{
            t("instance.launchArguments")
          }}
        </v-list-item-title>
      </v-list-item-content>

      <v-list-item-action>
        <v-btn
          icon
          @click="copyToClipboard"
        >
          <v-icon>content_copy</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action>
        <v-btn
          icon
          @click="showPreview"
        >
          <v-icon>print</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-dialog
      v-model="isPreviewShown"
      :width="500"
      style="overflow: hidden"
    >
      <v-card>
        <v-toolbar color="primary">
          {{
            t("instance.launchArguments")
          }}
        </v-toolbar>
        <v-textarea
          hide-details
          readonly
          filled
          :value="previewText"
          no-resize
          :height="480"
        />
      </v-card>
    </v-dialog>
  </v-list>
</template>

<script lang=ts setup>

import { useNotifier } from '../composables/notifier'
import { useLaunchPreview } from '../composables/launchPreview'
import { injection } from '@/util/inject'
import { InstanceEditInjectionKey } from '../composables/instanceEdit'
import BaseSettingGlobalLabel from './BaseSettingGlobalLabel.vue'

const { t } = useI18n()
const { preview, refresh, command } = useLaunchPreview()
const { notify } = useNotifier()
const { save, isGlobalMcOptions, resetMcOptions, mcOptions } = injection(InstanceEditInjectionKey)
const isPreviewShown = ref(false)
const previewText = computed(() => preview.value.join('\n'))
const { push } = useRouter()

async function showPreview() {
  await save()
  await refresh()
  isPreviewShown.value = true
}
async function copyToClipboard() {
  await save()
  await refresh()
  notify({ level: 'success', title: t('copyClipboard.success') })
  navigator.clipboard.writeText(command.value)
}
const gotoSetting = () => {
  push('/setting')
}

</script>

<style scoped=true>
.flex {
  padding: 6px 8px !important;
}
.theme--.v-list .v-list__group--active:after,
.theme--.v-list .v-list__group--active:before {
  background: unset;
}
</style>

<style>
.v-textarea.v-text-field--enclosed .v-text-field__slot textarea {
  word-break: break-all;
}
</style>
