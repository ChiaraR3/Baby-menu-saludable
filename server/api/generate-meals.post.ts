import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const menuTextFromPDF = body.menuText;

  // ¡MUY IMPORTANTE! Guarda tu API Key en variables de entorno.
  // En Nuxt 3, crea un archivo .env en la raíz del proyecto:
  // NUXT_GEMINI_API_KEY=TU_API_KEY_AQUI
  // Y accede a ella con process.env.NUXT_GEMINI_API_KEY o runtimeConfig
  const apiKey = process.env.NUXT_GEMINI_API_KEY;
 

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "API Key de Gemini no configurada.",
    });
  }

  if (!menuTextFromPDF) {
    throw createError({
      statusCode: 400,
      statusMessage: "No se proporcionó el texto del menú.",
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // o gemini-pro

  // ----- ESTE ES EL PROMPT, LA PARTE MÁS IMPORTANTE -----
  const prompt = `
   Eres un asistente experto en nutrición infantil especializado en niños de 1 a 5 años.
He extraído el siguiente menú de una guardería. Aunque el menú proporcionado pueda ser semanal, necesito que generes un plan de comidas complementarias para **UN MES COMPLETO (aproximadamente 4 semanas)**.

--- MENÚ GUARDERÍA ---
${menuTextFromPDF}
--- FIN MENÚ GUARDERÍA ---

Basándote en este menú (que puede ser la base para cada semana del mes), y teniendo en cuenta las recomendaciones de la OMS para niños de 1 a 5 años, necesito que me proporciones:

1.  **Sugerencias de Cenas de Lunes a Viernes para cada una de las 4 semanas del mes.** Intenta variar las sugerencias entre las semanas para ofrecer una mayor diversidad mensual, aunque el almuerzo de la guardería se repita semanalmente.
2.  **Sugerencias de Comidas Y Cenas para todos los Sábados y Domingos de cada una de las 4 semanas del mes.**
3.  **Identificación de Días Festivos:** Si el menú de la guardería indica algún día festivo específico, genera comida y cena para ese día. Si no se indican festivos, por favor, estructura la respuesta como si no hubiera festivos adicionales a los fines de semana, pero menciona que se podrían añadir si el usuario los especifica.

Consideraciones cruciales para TODAS las sugerencias:
-   **ROTACIÓN DE PROTEÍNAS MENSUAL Y SEMANAL:** Asegura una excelente variedad y rotación de proteínas (pescado blanco, pescado azul, pollo, pavo, ternera magra, cerdo magro, huevo, legumbres como lentejas, garbanzos, alubias) a lo largo de cada semana y también a lo largo del mes. Evita repetir la proteína principal del almuerzo de la guardería en la cena del mismo día. Intenta que no se repitan las mismas cenas exactas en la misma semana del mes siguiente si es posible.
-   **GRUPOS DE ALIMENTOS COMPLETOS:** Cada comida sugerida (almuerzo o cena) debe ser equilibrada, incluyendo:
    *   Una fuente de proteína principal.
    *   Carbohidratos complejos (ej. patata, boniato, arroz integral, pasta integral, quinoa, cuscús, pan integral).
    *   Verduras y/o hortalizas variadas (crudas o cocidas, diferentes colores).
    *   Grasas saludables (ej. aceite de oliva virgen extra, aguacate en pequeñas cantidades).
    *   Fruta fresca de postre o como parte de una merienda (si quieres sugerir meriendas, es opcional pero bienvenido).
-   **RECOMENDACIONES OMS (1-5 años):** Porciones adecuadas al tamaño del niño (no forzar), mucha variedad, limitar azúcares añadidos (evitar zumos procesados, bollería, galletas azucaradas), reducir la sal (usar hierbas aromáticas para sazonar), evitar grasas saturadas y trans. Prioriza alimentos frescos, de temporada y mínimamente procesados.
-   **FORMATO DE RESPUESTA CLARO Y ESTRUCTURADO POR SEMANAS:**
    Devuelve la información organizada por semanas. Ejemplo:

    SEMANA 1:
      LUNES:
        Cena: [Sugerencia de cena para Lunes, Semana 1]
      MARTES:
        Cena: [Sugerencia de cena para Martes, Semana 1]
      ...
      SÁBADO:
        Comida: [Sugerencia de comida para Sábado, Semana 1]
        Cena: [Sugerencia de cena para Sábado, Semana 1]
      DOMINGO:
        Comida: [Sugerencia de comida para Domingo, Semana 1]
        Cena: [Sugerencia de cena para Domingo, Semana 1]

    SEMANA 2:
      LUNES:
        Cena: [Sugerencia de cena para Lunes, Semana 2, idealmente diferente a Semana 1]
      ... y así sucesivamente para las 4 semanas.

Por favor, sé específico con los platos sugeridos (ej. "Crema de calabacín con picatostes y huevo duro rallado" en lugar de "Crema y proteína").
Si el menú de la guardería no es claro o falta información, haz tu mejor esfuerzo para complementarlo lógicamente basándote en una dieta infantil saludable. Considera que el menú de la guardería es el almuerzo de Lunes a Viernes.
  `;
  // -------------------------------------------------------

  try {
    // Para modelos de solo texto como gemini-pro:
    // const result = await model.generateContent(prompt);
    // const response = result.response;
    // const text = response.text();

    // Para modelos multimodales o que soportan streaming (como gemini-1.5-flash)
    // aunque aquí solo usamos texto, el SDK es el mismo
    const generationConfig = {
      temperature: 0.7, // Controla la creatividad. Más bajo = más determinista.
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048, // Ajusta según necesidad
    };

     const safetySettings = [ // Configuración de seguridad
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [], // Puedes añadir historial si quieres conversaciones más largas
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    const text = response.text();


    return { suggestions: text };

  } catch (error) {
    console.error("Error llamando a Gemini API:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error al contactar con el servicio de IA.",
    });
  }
});