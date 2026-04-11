from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import re
import urllib.request
import urllib.parse
import json

app = FastAPI(title="Validador de Texto")

# Permitir CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos del frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

class TextoEntrada(BaseModel):
    texto: str

def limpiar_palabra(palabra: str) -> str:
    """Elimina signos de puntuación alrededor de una palabra."""
    return re.sub(r"^[^\w]+|[^\w]+$", "", palabra, flags=re.UNICODE)

@app.get("/")
def index():
    return FileResponse("static/index.html")

@app.post("/validar")
def validar_texto(entrada: TextoEntrada):
    texto = entrada.texto.strip()
    errores = []

    # --- Validación 1: Detección de coherencia (¿Tiene letras?) ---
    tiene_letras = any(c.isalpha() for c in texto)
    
    if not tiene_letras and texto:
        return {
            "total_errores": 1,
            "errores": [{
                "tipo": "incoherente",
                "mensaje": "No hay nada coherente que revisar. El texto debe contener al menos algunas letras para ser analizado.",
                "sugerencia": None
            }],
            "texto_original": texto,
            "texto_corregido": texto
        }

    # --- Validación 2: comenzar con mayúscula (Solo si hay letras) ---
    # Buscamos la primera letra del texto
    primera_letra_match = re.search(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]', texto)
    if primera_letra_match:
        index = primera_letra_match.start()
        letra = primera_letra_match.group()
        if not letra.isupper():
            errores.append({
                "tipo": "mayuscula",
                "mensaje": "El texto debería comenzar con una letra mayúscula.",
                "sugerencia": texto[:index] + letra.upper() + texto[index+1:]
            })

    # --- Validación 3: ortografía y gramática con LanguageTool ---
    texto_corregido = texto
    
    if texto:
        try:
            data = urllib.parse.urlencode({
                'text': texto, 
                'language': 'es',
                'enabledRules': 'COMPOUND_WORDS_SPANISH,DE_QUE,MISSING_ACCENT_ES',
                'enabledCategories': 'PUNCTUATION,TYPOS,GRAMMAR'
            }).encode('utf-8')
            req = urllib.request.Request('https://api.languagetoolplus.com/v2/check', data=data)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                matches = result.get('matches', [])
                
                matches_sorted = sorted(matches, key=lambda x: x['offset'], reverse=True)
                
                lt_errores = []
                for match in matches_sorted:
                    offset = match['offset']
                    length = match['length']
                    palabra_original = texto[offset:offset+length]
                    mensaje = match['message']
                    tipo_match = match.get('rule', {}).get('issueType', 'ortografia')
                    
                    sugerencias_lt = match.get('replacements', [])
                    sugerencia = None
                    candidatos = []
                    
                    if sugerencias_lt:
                        sugerencia = str(sugerencias_lt[0]['value'])
                        candidatos = [str(r.get('value', '')) for r in sugerencias_lt[:5]]
                        texto_corregido = texto_corregido[:offset] + sugerencia + texto_corregido[offset+length:]
                    
                    lt_errores.append({
                        "tipo": "ortografia" if tipo_match == 'misspelling' else "gramatica",
                        "mensaje": mensaje,
                        "sugerencia": sugerencia,
                        "candidatos": candidatos,
                        "palabra_original": palabra_original
                    })
                
                lt_errores.reverse()
                errores.extend(lt_errores)
                
        except Exception as e:
            print(f"Error con LanguageTool: {e}")

    # --- Validación 4: Puntuación y Espaciado (Reglas Personalizadas) ---
    # Detectar signos repetidos innecesarios (:::, ;;;, ,,,)
    for match in re.finditer(r'([,:;])\1+', texto):
        orig = match.group()
        errores.append({
            "tipo": "gramatica",
            "mensaje": f"Puntuación inusual detectada: '{orig}'. Generalmente solo se necesita un signo.",
            "sugerencia": orig[0],
            "palabra_original": orig
        })
        # También lo corregimos en el texto final
        texto_corregido = texto_corregido.replace(orig, orig[0], 1)

    # Detectar exceso de puntos suspensivos (más de 3)
    for match in re.finditer(r'\.{4,}', texto):
        orig = match.group()
        errores.append({
            "tipo": "gramatica",
            "mensaje": "Se han detectado demasiados puntos seguidos. Use solo tres para puntos suspensivos (...).",
            "sugerencia": "...",
            "palabra_original": orig
        })
        texto_corregido = texto_corregido.replace(orig, "...", 1)

    return {
        "total_errores": len(errores),
        "errores": errores,
        "texto_original": texto,
        "texto_corregido": texto_corregido
    }
