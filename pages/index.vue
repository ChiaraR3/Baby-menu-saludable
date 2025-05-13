<template>
  <div>
    <h1>Planificador de Cenas Infantiles</h1>

    <input type="file" @change="handleFileUpload" accept="application/pdf" />

    <div v-if="isLoading">
      <p>Procesando tu menú... 🧠</p>
    </div>

    <div v-if="extractedText">
      <h2>Texto Extraído del Menú (para depurar):</h2>
      <pre>{{ extractedText }}</pre>
    </div>

    <div v-if="mealSuggestions">
      <h2>Sugerencias de Comidas:</h2>
      <!-- Aquí mostraremos las sugerencias de Gemini -->
      <pre>{{ mealSuggestions }}</pre>
    </div>

    <button v-if="extractedText && !isLoading" @click="getMealSuggestions">
      Obtener Sugerencias
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";

const isLoading = ref(false);
const extractedText = ref("");
const mealSuggestions = ref(null);
let pdfFile = null;
import * as pdfjsLib from "pdfjs-dist/build/pdf";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const handleFileUpload = async (event) => {
  pdfFile = event.target.files[0];
  if (!pdfFile) {
    extractedText.value = "";
    return;
  }
  isLoading.value = true;
  extractedText.value = "";
  mealSuggestions.value = null;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const typedArray = new Uint8Array(e.target.result);
    try {
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      let textContent = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        text.items.forEach((item) => {
          textContent += item.str + " "; // Añade un espacio entre items
        });
        textContent += "\n"; // Nueva línea por página
      }
      extractedText.value = textContent.trim();
      console.log("Texto extraído:", extractedText.value);
    } catch (error) {
      console.error("Error al leer el PDF:", error);
      extractedText.value =
        "Error al leer el PDF. Asegúrate de que sea un PDF válido.";
      alert("Hubo un error al leer el PDF.");
    } finally {
      isLoading.value = false;
    }
  };
  reader.onerror = (error) => {
    console.error("Error con FileReader:", error);
    isLoading.value = false;
    alert("Error al cargar el archivo.");
  };
  reader.readAsArrayBuffer(pdfFile);
};

const getMealSuggestions = async () => {
  if (!extractedText.value) {
    alert("Primero sube y procesa un PDF.");
    return;
  }
  isLoading.value = true;
  mealSuggestions.value = null;

  try {
    // Aquí llamaremos a nuestra API de Nuxt que contactará con Gemini
    // (Ver Fase 3 y 4)
    const response = await fetch("/api/generate-meals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ menuText: extractedText.value }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Error del servidor: ${response.status}`
      );
    }

    const data = await response.json();
    mealSuggestions.value = data.suggestions; // Asumiendo que Gemini devuelve un texto o JSON
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
    mealSuggestions.value = `Error: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Estilos básicos, puedes usar TailwindCSS o CSS normal */
div {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: sans-serif;
}
input,
button {
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 8px;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap; /* Para que el texto largo se ajuste */
  word-wrap: break-word;
}
</style>
