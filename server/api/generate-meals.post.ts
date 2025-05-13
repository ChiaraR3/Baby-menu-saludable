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
    He extraído el siguiente menú mensual de una guardería:
    --- MENÚ GUARDERÍA ---
    ${menuTextFromPDF}
    --- FIN MENÚ GUARDERÍA ---

    Basándote en este menú, y teniendo en cuenta las recomendaciones de la OMS para niños de 1 a 5 años,
    necesito que me proporciones:
    1. Todas las cenas de Lunes a Viernes para complementar las comidas de la guardería.
    2. Todas las comidas Y cenas para los Sábados, Domingos y días festivos que identifiques o que yo te indique.
       (Por ahora, asume fines de semana estándar, a menos que el menú indique festivos).

    Consideraciones cruciales:
    - ROTACIÓN DE PROTEÍNAS: Asegura una buena variedad y rotación de proteínas (pescado, pollo, carne roja magra, huevo, legumbres) a lo largo de la semana, evitando repetir la proteína principal del almuerzo de la guardería en la cena del mismo día.
    - GRUPOS DE ALIMENTOS: Cada comida sugerida debe ser equilibrada, incluyendo una fuente de proteína, carbohidratos complejos (ej. patata, arroz integral, pasta, quinoa) y verduras/hortalizas. Incluye frutas como postre o parte de la merienda si lo ves conveniente.
    - RECOMENDACIONES OMS (1-5 años): Porciones adecuadas, variedad, limitar azúcares añadidos, sal y grasas saturadas. Prioriza alimentos frescos y naturales.
    - FORMATO DE RESPUESTA: Devuelve la información de forma clara, idealmente día por día. Por ejemplo:
      LUNES:
        Cena: [Sugerencia de cena]
      MARTES:
        Cena: [Sugerencia de cena]
      ...
      SÁBADO:
        Comida: [Sugerencia de comida]
        Cena: [Sugerencia de cena]
      DOMINGO:
        Comida: [Sugerencia de comida]
        Cena: [Sugerencia de cena]

    Por favor, sé específico con los platos sugeridos. Si el menú de la guardería es semanal y se repite, genera las sugerencias para una semana típica. Si es mensual, intenta cubrir todo el mes.
    Si el menú de la guardería no es claro o falta información, haz tu mejor esfuerzo para complementarlo lógicamente.
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