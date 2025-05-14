// app.vue
<template>
  <div>
    <!-- Aquí puedes poner layouts, cabeceras, etc. que quieras en TODAS las páginas -->
    <!-- <NuxtLayout> -->
    <NuxtPage />
    <!-- ESTO ES ESENCIAL para que se rendericen las páginas de la carpeta `pages` -->
    <!-- </NuxtLayout> -->
  </div>
</template>

<script setup>
// Puedes tener lógica aquí si es global para la app
</script>

<style>
/* SIN scoped para estilos globales */
/* Importar una fuente de Google Fonts (ejemplo: M PLUS Rounded 1c) */
@import url("https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700&display=swap");

:root {
  --ghibli-green-light: #b4e7b7;
  --ghibli-green-medium: #288fb5;
  --ghibli-blue-sky: #a9d9ef;
  --ghibli-brown-earth: #d2b48c;
  --ghibli-text-dark: #4f4840;
  --ghibli-text-light: #f0f0e0;
  --ghibli-accent-red: #c77770;
}

body {
  /* Estilos para el body */
  font-family: "M PLUS Rounded 1c", sans-serif;
  background-color: var(--ghibli-blue-sky);
  color: var(--ghibli-text-dark);
  margin: 0;
  min-height: 100vh;
}

/* Aquí podrías poner otros estilos globales si los necesitas */
</style>
