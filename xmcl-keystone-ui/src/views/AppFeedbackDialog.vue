<template>
  <v-dialog
    v-model="isShown"
    hide-overlay
    transition="dialog-bottom-transition"
    width="500"
  >
    <v-toolbar color="warning">
      <v-toolbar-title>{{ t('feedback.name') }}</v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        @click="hide"
      >
        <v-icon>close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-list
      three-line
      subheader
    >
      <v-subheader>{{ t('feedback.description') }}</v-subheader>

      <FeedbackCard />
      <v-subheader> {{ t('feedback.channel') }} </v-subheader>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('feedback.github') }}</v-list-item-title>
          <v-list-item-subtitle>{{ t('feedback.githubDescription') }}</v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn
            text
            href="https://github.com/Voxelum/x-minecraft-launcher/issues/new"
          >
            {{ t('feedback.githubOpenIssue') }}
          </v-btn>
        </v-list-item-action>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('feedback.kook') }}</v-list-item-title>
          <v-list-item-subtitle
            style="max-width: 80%"
          >
            {{ t('feedback.kookDescription') }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn
            text
            href="https://kook.top/gqjSHh"
          >
            {{ t('feedback.qqEnterGroup') }}
          </v-btn>
        </v-list-item-action>
      </v-list-item>

      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>{{ t('feedback.discord') }}</v-list-item-title>
          <v-list-item-subtitle
            style="max-width: 80%"
          >
            {{ t('feedback.discordDescription') }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn
            text
            href="https://discord.gg/W5XVwYY7GQ"
          >
            {{ t('feedback.discordJoin') }}
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-dialog>
</template>

<script lang=ts setup>
import FeedbackCard from '../components/FeedbackCard.vue'
import { useDialog } from '../composables/dialog'

const { hide, isShown } = useDialog('feedback')
const { t } = useI18n()

</script>

<style>
.diff {
  color: #81c784;
  font-style: italic;
}
</style>
