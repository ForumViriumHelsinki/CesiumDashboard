<!-- Main Vue app -->
<script setup lang="ts">
import CesiumViewer from "./components/CesiumViewer.vue";
import SideMenu from "./components/SideMenu.vue";
</script>

<template>
    <div>
        <v-layout>
            <SideMenu />
            <CesiumViewer v-once />
        </v-layout>
    </div>
</template>
