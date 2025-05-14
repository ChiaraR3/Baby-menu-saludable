<template>
  <div class="ghibli-container">
    <header class="ghibli-header">
      <!-- Podrías poner un logo simple o un nombre estilizado aquí -->
      <h1>
        La vida es demasiado complicada para pensar en la rotación de las
        proteinas
      </h1>
    </header>

    <main class="content-area">
      <div class="upload-section">
        <label for="pdf-upload" class="ghibli-button file-label">
          {{ pdfFile ? pdfFile.name : "Seleccionar Menú PDF del Peque" }}
        </label>
        <input
          id="pdf-upload"
          type="file"
          @change="handleFileUpload"
          accept="application/pdf"
          :disabled="!isPdfJsLoaded"
          style="display: none"
        />
        <p v-if="!isPdfJsLoaded" class="loading-pdf-lib">
          Cargando magia para leer PDFs...
        </p>
      </div>

      <div v-if="isLoading" class="loading-indicator">
        <p>Cocinando ideas porque los platos los vas a preparar tu... 🍳✨</p>
        <!-- Podrías poner un spinner animado aquí -->
      </div>

      <div v-if="extractedText && !isLoading" class="debug-text">
        <h2>Texto del Menú (para nosotros):</h2>
        <pre>{{ extractedText }}</pre>
      </div>

      <button
        v-if="extractedText && !isLoading && !mealSuggestions"
        @click="getMealSuggestions"
        class="ghibli-button submit-button"
      >
        ¡Sugerir Cenas!
      </button>

      <div v-if="mealSuggestions" class="suggestions-container">
        <h2>Menu Sugerido:</h2>
        <div v-html="formattedSuggestions" class="suggestions-content"></div>
      </div>
    </main>

    <footer class="ghibli-footer">
      <p>Hecho con ❤️ y desesperación por una mamá</p>
    </footer>
  </div>
</template>

<script setup>
// ... (tu script setup actual sin cambios, solo asegúrate de tener `pdfFile` ref si quieres mostrar el nombre)
import { computed, onMounted, ref } from "vue";

const isLoading = ref(false);
const extractedText = ref("");
const mealSuggestions = ref(null);
const pdfFile = ref(null); // Cambiado a ref para reactividad en el label
let pdfjsLib = null;
const isPdfJsLoaded = ref(false);

onMounted(async () => {
  try {
    const module = await import("pdfjs-dist/build/pdf");
    pdfjsLib = module;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    isPdfJsLoaded.value = true;
    console.log("pdf.js cargado y worker configurado.");
  } catch (error) {
    console.error("Error al cargar pdf.js dinámicamente:", error);
  }
});

const handleFileUpload = async (event) => {
  if (!pdfjsLib) {
    alert("La librería para procesar PDF aún no está lista.");
    return;
  }

  const file = event.target.files[0];
  if (!file) {
    extractedText.value = "";
    pdfFile.value = null;
    return;
  }
  pdfFile.value = file; // Guardar el objeto File
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
          textContent += item.str + " ";
        });
        textContent += "\n";
      }
      extractedText.value = textContent.trim();
    } catch (error) {
      console.error("Error al leer el PDF:", error);
      extractedText.value = "Error al leer el PDF.";
    } finally {
      isLoading.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
};

const getMealSuggestions = async () => {
  if (!extractedText.value) {
    alert("Primero sube y procesa un PDF.");
    return;
  }
  isLoading.value = true;
  mealSuggestions.value = null;

  try {
    const response = await fetch("/api/generate-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuText: extractedText.value }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Error del servidor: ${response.status}`
      );
    }
    const data = await response.json();
    mealSuggestions.value = data.suggestions;
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
    mealSuggestions.value = `Error: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};

const formattedSuggestions = computed(() => {
  if (!mealSuggestions.value) return "";
  // Mejorar un poco el formato, buscando patrones de "SEMANA X:" y "DIA:"
  let html = mealSuggestions.value;
  // Envolver los títulos de semana en <h3>
  html = html.replace(/(SEMANA\s*\d+:)/gi, "<h3>$1</h3>");
  // Envolver los días en <h4> (LUNES:, MARTES:, etc.)
  html = html.replace(
    /^(LUNES:|MARTES:|MIÉRCOLES:|MIERCOLES:|JUEVES:|VIERNES:|SÁBADO:|SABADO:|DOMINGO:)/gim,
    "<h4>$1</h4>"
  );
  // Reemplazar saltos de línea con <br>
  html = html.replace(/\n/g, "<br />");
  // Quitar <br> después de <h3> y <h4>
  html = html.replace(/<h3>(.*?)<\/h3>\s*<br\s*\/?>/gi, "<h3>$1</h3>");
  html = html.replace(/<h4>(.*?)<\/h4>\s*<br\s*\/?>/gi, "<h4>$1</h4>");
  return html;
});
</script>

<style scoped>
.ghibli-container {
  font-family: "M PLUS Rounded 1c", sans-serif;
  background-color: var(--ghibli-blue-sky); /* Fondo cielo */
  /* Para un fondo con imagen sutil (necesitarás la imagen en tu carpeta `public`): */
  /* background-image: url('/ghibli-sky-pattern.png'); */
  /* background-size: cover; */
  min-height: 100vh;
  color: var(--ghibli-text-dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.ghibli-header {
  margin-bottom: 30px;
  text-align: center;
}

.ghibli-header h1 {
  color: var(--ghibli-green-medium);
  font-weight: 700;
  font-size: 1.9em; /* Ajusta según veas */
  text-shadow: 1px 1px 2px var(--ghibli-text-light);
}

.content-area {
  background-color: rgba(
    255,
    255,
    255,
    0.85
  ); /* Blanco semi-transparente para legibilidad */
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 700px; /* Ajusta el ancho */
}

.upload-section {
  margin-bottom: 20px;
  text-align: center;
}

.ghibli-button {
  background-color: var(--ghibli-green-medium);
  color: var(--ghibli-text-light);
  border: none;
  padding: 12px 25px;
  border-radius: 25px; /* Muy redondeado */
  font-size: 1.1em;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: inline-block; /* Para que el label funcione como botón */
}

.ghibli-button:hover {
  background-color: #5d8c50; /* Un verde un poco más oscuro */
  transform: translateY(-2px);
}

.ghibli-button:active {
  transform: translateY(0px);
}

.ghibli-button.file-label {
  background-color: var(--ghibli-brown-earth);
  color: var(--ghibli-text-dark);
}
.ghibli-button.file-label:hover {
  background-color: #c1a37a;
}

.ghibli-button.submit-button {
  background-color: var(
    --ghibli-accent-red
  ); /* Botón de acción principal con color acento */
  display: block; /* Para que ocupe el ancho */
  margin: 20px auto 0; /* Centrado */
}
.ghibli-button.submit-button:hover {
  background-color: #b0655f;
}

.loading-pdf-lib,
.loading-indicator p {
  color: var(--ghibli-green-medium);
  font-style: italic;
  margin-top: 10px;
}

.loading-indicator {
  text-align: center;
  padding: 30px;
  font-size: 1.3em;
}

.debug-text pre {
  background-color: #f0f0e0; /* Crema */
  border: 1px dashed var(--ghibli-green-light);
  padding: 10px;
  border-radius: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 150px;
  overflow-y: auto;
  font-size: 0.8em;
}

.suggestions-container {
  margin-top: 30px;
  border: 2px solid var(--ghibli-green-light);
  padding: 20px;
  border-radius: 10px;
  background-color: #fdfdfa; /* Un blanco muy cálido */
}

.suggestions-container h2 {
  color: var(--ghibli-green-medium);
  text-align: center;
  margin-bottom: 15px;
}

/* Estilos para el contenido generado por Gemini */
.suggestions-content {
  line-height: 1.7;
}
.suggestions-content :deep(h3) {
  /* CORREGIDO AQUÍ */
  /* Para aplicar estilos a HTML inyectado con v-html */
  color: var(--ghibli-accent-red);
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 1.4em;
  border-bottom: 1px solid var(--ghibli-green-light);
  padding-bottom: 5px;
}
.suggestions-content :deep(h4) {
  /* CORREGIDO AQUÍ */
  color: var(--ghibli-text-dark);
  margin-top: 15px;
  margin-bottom: 5px;
  font-size: 1.1em;
  font-weight: 500;
}

.ghibli-footer {
  margin-top: 40px;
  text-align: center;
  font-size: 0.9em;
  color: rgba(79, 72, 64, 0.7); /* Texto del footer más sutil */
}

/* Para que el input file no se vea y usemos el label */
input[type="file"] {
  display: none;
}
</style>
