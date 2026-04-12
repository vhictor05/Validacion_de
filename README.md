# Validador de Texto Inteligente

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

Este proyecto es una herramienta web para la validación y corrección de textos en español. Utiliza un backend potente para analizar ortografía, gramática y estructura, ofreciendo una interfaz intuitiva para el usuario final.

## 🚀 Características

- **Corrección Gramatical:** Detección de errores de concordancia y sintaxis.
- **Ortografía Avanzada:** Sugerencias precisas basadas en el contexto.
- **Reglas Personalizadas:** Control de mayúsculas iniciales y limpieza de signos de puntuación repetidos.
- **Interfaz Interactiva:** Resaltado de errores por colores (Rojo: Ortografía, Amarillo: Gramática).
- **Corrección Automática:** Botón para aplicar todas las sugerencias de forma inmediata.

## 🛠️ Tecnologías Utilizadas

- **Backend:** Python con [FastAPI](https://fastapi.tiangolo.com/).
- **Servicio de Validación:** Integración con la API de [LanguageTool](https://languagetool.org/).
- **Frontend:** HTML5, CSS3 (Diseño moderno) y JavaScript Vanilla.
- **Servidor:** Uvicorn.

## 📋 Requisitos

- Python 3.8 o superior.
- Conexión a internet (necesaria para las validaciones externas).

## 🔧 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/Validacion_de.git
   cd Validacion_de
   ```

2. **Crear y activar entorno virtual:**
   ```bash
   python -m venv .venv
   # En Windows:
   .\.venv\Scripts\activate
   ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

## 🏃 Ejecución

### Opción Rápida (Windows)
Simplemente haz doble clic en el archivo `iniciar_app.bat`. Este abrirá el navegador y ejecutará el servidor automáticamente.

### Opción Manual
Desde la terminal con el entorno activado:
```bash
uvicorn main:app --reload
```
Luego accede a `http://127.0.0.1:8000` en tu navegador.

## 📂 Estructura del Proyecto

```text
Validacion_de/
├── static/              # Archivos del frontend (HTML, CSS, JS)
├── main.py              # Lógica principal del servidor FastAPI
├── requirements.txt     # Dependencias del proyecto
├── iniciar_app.bat      # Script de inicio automatizado
└── README.md            # Documentación principal
```

## 📝 Notas
La aplicación utiliza la versión gratuita de la API de LanguageTool, por lo que tiene un límite de caracteres por petición razonable para demostraciones y uso personal.
