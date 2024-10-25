import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-asistente-voz',
  templateUrl: './asistente-voz.component.html',
  styleUrls: ['./asistente-voz.component.css']
})
export class AsistenteVozComponent implements OnInit, OnDestroy {
  transcript: string = "Aquí aparecerá tu mensaje...";
  respuesta: string = "Aquí aparecerá la respuesta...";
  socket!: WebSocket;
  recognition: any;

  ngOnInit() {
    // Configuración del WebSocket
    this.socket = new WebSocket("ws://localhost:8000/ws/conversar");

    this.socket.onmessage = (event) => {
      this.respuesta = "Respuesta del asistente: " + event.data;

      // Text-to-Speech
      const speech = new SpeechSynthesisUtterance(event.data);
      window.speechSynthesis.speak(speech);
    };

    this.socket.onopen = () => console.log("Conexión WebSocket abierta.");
    this.socket.onclose = () => console.log("Conexión WebSocket cerrada.");

    // Configuración del reconocimiento de voz
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    // Cuando se obtiene el resultado de la transcripción
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.transcript = "Tu mensaje: " + transcript;

      // Envía el texto transcrito al WebSocket
      this.socket.send(transcript);
    };

    // Manejo de errores
    this.recognition.onerror = (event: any) => console.error("Error en el reconocimiento de voz: ", event.error);
  }

  ngOnDestroy() {
    // Cerrar el WebSocket cuando el componente se destruya
    if (this.socket) {
      this.socket.close();
    }
  }

  // Método para iniciar el reconocimiento de voz
  startRecognition() {
    this.recognition.start();
    console.log("Escuchando...");
  }
}
``
