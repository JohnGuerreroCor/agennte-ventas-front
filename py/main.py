from fastapi import FastAPI, WebSocket  # type: ignore
from datetime import datetime, timedelta
import openai  # type: ignore
import re

app = FastAPI()

# Configura la clave de API de OpenAI
openai.api_key = "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"

# Función para interactuar con el agente en tiempo real
async def interactuar_agente_conversacional(mensaje):
    response = await openai.ChatCompletion.acreate(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Eres un asistente de ventas de bienes raíces."},
            {"role": "user", "content": mensaje},
        ],
        max_tokens=150,
        temperature=0.9,
        n=1
    )
    return response['choices'][0]['message']['content']

# Variable global para almacenar el estado de la conversación
estado_conversacion = {
    "nombre": None,
    "cedula": None,
    "correo": None,
    "apartamento": None,
    "fecha_visita": None,
    "paso": 1
}

@app.websocket("/ws/conversar")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    global estado_conversacion
    
    while True:
        try:
            mensaje = await websocket.receive_text()

            # Paso 1: Pedir nombre
            if estado_conversacion["paso"] == 1:
                estado_conversacion["paso"] = 2
                await websocket.send_text("Cordial saludo, soy el asistente de ventas Denis. ¿Podrías decirme tu nombre, por favor?")

            # Paso 2: Pedir cédula usando el nombre
            elif estado_conversacion["paso"] == 2:
                estado_conversacion["nombre"] = mensaje
                if estado_conversacion["nombre"]:
                    estado_conversacion["paso"] = 3
                    await websocket.send_text(f"Gracias, {estado_conversacion['nombre']}. ¿Podrías proporcionarme tu número de cédula?")
                else:
                    await websocket.send_text("No he recibido tu nombre, ¿podrías decírmelo nuevamente?")

            # Paso 3: Pedir correo y validarlo
            elif estado_conversacion["paso"] == 3:
                estado_conversacion["cedula"] = mensaje
                if estado_conversacion["cedula"]:
                    estado_conversacion["paso"] = 4
                    await websocket.send_text("¿Me podrías indicar tu correo electrónico, por favor?")
                else:
                    await websocket.send_text("La cédula debe ser un número. ¿Podrías intentar nuevamente?")

            elif estado_conversacion["paso"] == 4:
                if re.match(r"[^@]+@[^@]+\.[^@]+", mensaje):
                    estado_conversacion["correo"] = mensaje
                    estado_conversacion["paso"] = 5
                    await websocket.send_text(f"Gracias, {estado_conversacion['nombre']}. ¿Te interesaría conocer nuestros apartamentos disponibles? Responde 'sí' o 'no'.")
                else:
                    await websocket.send_text("El correo proporcionado no es válido. ¿Podrías intentar de nuevo?")

            # Paso 5: Preguntar si desea ver apartamentos
            elif estado_conversacion["paso"] == 5:
                if mensaje.lower() in ["sí", "no"]:
                    if mensaje.lower() == "sí":
                        estado_conversacion["paso"] = 6
                        await websocket.send_text("Tenemos los siguientes apartamentos disponibles:\n OPCIÓN A. Apartamento en la ciudad\n OPCIÓN B. Apartamento en la playa\n OPCIÓN C. Apartamento en las montañas\n¿Te interesa alguno en particular?")
                    else:
                        await websocket.send_text("Entendido, muchas gracias por tu tiempo. ¡Que tengas un excelente día!")
                        await websocket.close()
                else:
                    await websocket.send_text("Por favor responde 'sí' o 'no'.")

           # Paso 6: Preguntar por el interés en un apartamento específico
            elif estado_conversacion["paso"] == 6:
                if mensaje.upper() in ["OPCIÓN A", "OPCIÓN B", "OPCIÓN C"]:
                    estado_conversacion["apartamento"] = mensaje  
                    estado_conversacion["paso"] = 7
                    await websocket.send_text("Excelente elección.")
                else:
                    await websocket.send_text("Por favor selecciona uno de los apartamentos disponibles (OPCIÓN A, OPCIÓN B o OPCIÓN C).")

          # Paso 7: Solicitar fecha de visita y proponer tres opciones de fecha
            elif estado_conversacion["paso"] == 7:
                try:
                    # Obtener la fecha de hoy
                    hoy = datetime.now().date()

                    # Mapeo de los meses en español
                    meses = [
                        "enero", "febrero", "marzo", "abril", "mayo", "junio",
                        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
                    ]

                    # Generar tres opciones de fecha a partir de hoy
                    opciones_fecha = [
                        f"{(hoy + timedelta(days=i)).day} de {meses[(hoy + timedelta(days=i)).month - 1]} de {(hoy + timedelta(days=i)).year}"
                        for i in range(1, 4)
                    ]
                    
                    # Almacenar las opciones de fecha en el estado de la conversación
                    estado_conversacion["opciones_fecha"] = opciones_fecha
                    estado_conversacion["paso"] = 8

                    # Enviar las opciones al usuario
                    opciones_texto = "\n".join([f"Opción {i+1}: {fecha}" for i, fecha in enumerate(opciones_fecha)])
                    await websocket.send_text(f"Por favor, selecciona una de las siguientes opciones de fecha para tu visita:\n{opciones_texto}")
                    
                except Exception as e:
                    await websocket.send_text("Ocurrió un error al generar las opciones de fecha. Inténtalo nuevamente.")

            # Paso 8: Recibir la opción de fecha seleccionada
            elif estado_conversacion["paso"] == 8:
                try:
                    fecha_opcion = int(mensaje.split()[-1])  # Suponiendo que el usuario responde con 'Opción 1', 'Opción 2', o 'Opción 3'
                    if 1 <= fecha_opcion <= 3:
                        estado_conversacion["fecha_visita"] = estado_conversacion["opciones_fecha"][fecha_opcion - 1]
                        estado_conversacion["paso"] = 9

                        # Generar el mensaje final
                        resultado_final = (
                            f"{estado_conversacion['nombre']} con cédula {estado_conversacion['cedula']} "
                            f"se programó para ver el apartamento {estado_conversacion['apartamento']} "
                            f"el día {estado_conversacion['fecha_visita']} "
                            f"y se enviará al correo {estado_conversacion['correo']}."
                        )
                        await websocket.send_text(resultado_final)
                    else:
                        await websocket.send_text("Por favor selecciona una opción válida (Opción 1, Opción 2 o Opción 3).")
                except Exception as e:
                    await websocket.send_text("Ocurrió un error al procesar tu selección. Inténtalo nuevamente.")
                    
            # Paso 9: Ofrecer ayuda adicional
            elif estado_conversacion["paso"] == 9:
                if mensaje.lower() == "sí":
                    estado_conversacion["paso"] = 10
                    await websocket.send_text("Perfecto, ¿en qué puedo ayudarte? Puedes hacerme cualquier pregunta adicional.")
                elif mensaje.lower() == "no":
                    await websocket.send_text("¡Gracias por confiar en nosotros! Que tengas un excelente día.")
                    await websocket.close()
                else:
                    await websocket.send_text("Por favor responde 'sí' o 'no' si necesitas alguna otra asesoría.")        

           # Paso 10: Responder a preguntas adicionales usando el modelo
            elif estado_conversacion["paso"] == 10:
                despedidas = ["adiós", "hasta luego", "nos vemos", "gracias", "bye", "chau", "me despido"]

                # Convertir el mensaje a minúsculas para una coincidencia de texto más sencilla
                mensaje_normalizado = mensaje.lower().strip()

                # Verificar si el mensaje contiene una despedida
                if any(despedida in mensaje_normalizado for despedida in despedidas):
                    await websocket.send_text("Gracias por usar nuestro servicio. ¡Hasta pronto!")
                    await websocket.close()  # Cerrar la conexión WebSocket
                else:
                    # Interactuar con el agente si no es una despedida
                    respuesta_modelo = await interactuar_agente_conversacional(f"Responde de manera clara y educativa: {mensaje}")
                    await websocket.send_text(respuesta_modelo)

        
        except Exception as e:
            await websocket.close()

# Inicia el servidor FastAPI con Uvicorn
if __name__ == "__main__":
    import uvicorn  # type: ignore
    uvicorn.run(app, host="0.0.0.0", port=8000)
