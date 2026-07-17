<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import ModalOverlay from '@/components/overlay/ModalOverlay.vue';
import {
  cancelUserTourPause,
  confirmUserTourPause,
  isUserTourPauseOpen
} from '@/services/guide/userTourPause';
</script>

<template>
  <ModalOverlay
    :model-value="isUserTourPauseOpen"
    :close-on-backdrop="false"
    :close-on-esc="false"
    overlay-class="tour-pause-modal"
    panel-class="!text-left"
    max-width="560px"
    @update:model-value="cancelUserTourPause"
  >
    <template #title>{{ $t('userTour.pauseConfirmation.title') }}</template>
    <template #description>{{ $t('userTour.pauseConfirmation.description') }}</template>
    <template #actions>
      <Button
        type="button"
        variant="secondary"
        data-testid="user-tour-continue"
        @click="cancelUserTourPause"
      >
        {{ $t('userTour.pauseConfirmation.continue') }}
      </Button>
      <Button
        type="button"
        variant="primary"
        data-testid="user-tour-confirm-pause"
        @click="confirmUserTourPause"
      >
        {{ $t('userTour.pauseConfirmation.confirm') }}
      </Button>
    </template>
  </ModalOverlay>
</template>
