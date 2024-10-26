import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';

interface Message {
  sender: 'user' | 'assistant';
  content: string;
  formattedContent?: SafeHtml;
}

@Component({
  selector: 'app-asistente-voz',
  templateUrl: './asistente-voz.component.html',
  styleUrls: ['./asistente-voz.component.css'],
})
export class AsistenteVozComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild('chatBox') private chatBox!: ElementRef;
  transcript: string = 'Aquí aparecerá tu mensaje...';
  respuesta: string = 'Aquí aparecerá la respuesta...';
  messages: Message[] = [];
  socket!: WebSocket;
  recognition: any;
  ocultar: boolean = true;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Configuración del WebSocket
    this.socket = new WebSocket('ws://localhost:8000/ws/conversar');
    //this.socket = new WebSocket("wss://s3svcvl8-8000.use2.devtunnels.ms/ws/conversar");

    this.socket.onmessage = (event) => {
      const assistantResponse = event.data;
      this.respuesta = 'Respuesta del asistente: ' + assistantResponse;

      // Convierte los saltos de línea en <br> y marca como HTML seguro
      const formattedResponse = this.sanitizer.bypassSecurityTrustHtml(
        assistantResponse.replace(/\n/g, '<br>')
      );

      // Agrega el mensaje del asistente al historial
      this.messages.push({
        sender: 'assistant',
        content: assistantResponse,
        formattedContent: formattedResponse,
      });

      // Hace scroll al último mensaje
      this.scrollToBottom();

      // Detener el reconocimiento de voz mientras el asistente habla
      this.recognition.stop();

      // Text-to-Speech
      const speech = new SpeechSynthesisUtterance(assistantResponse);
      window.speechSynthesis.speak(speech);

      // Reanuda el reconocimiento de voz después de que el asistente termine de hablar
      speech.onend = () => {
        console.log(
          'Asistente terminó de hablar, reiniciando reconocimiento de voz...'
        );
        this.recognition.start();
      };
    };

    this.socket.onopen = () => console.log('Conexión WebSocket abierta.');
    this.socket.onclose = () => console.log('Conexión WebSocket cerrada.');
    this.socket.onclose = () => {
      this.ocultar = true;
      Swal.fire({
        title: 'Se ha finalizado la llamada',
        text: 'Gracias por comunicarte con nosotros.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    // Configuración del reconocimiento de voz
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    // Cuando se obtiene el resultado de la transcripción
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.transcript = 'Tu mensaje: ' + transcript;

      // Agrega el mensaje del usuario al historial
      this.messages.push({ sender: 'user', content: transcript });

      // Envía el texto transcrito al WebSocket
      this.socket.send(transcript);

      // Hace scroll al último mensaje
      this.scrollToBottom();
    };

    // Reinicia el reconocimiento automáticamente al finalizar
    this.recognition.onend = () => {
      console.log('Reiniciando reconocimiento de voz...');
      if (!window.speechSynthesis.speaking) {
        this.recognition.start();
      }
    };

    this.recognition.onerror = (event: any) =>
      console.error('Error en el reconocimiento de voz: ', event.error);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    // Cerrar el WebSocket cuando el componente se destruya
    if (this.socket) {
      this.socket.close();
    }

    // Detiene el reconocimiento de voz si se está ejecutando
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  startRecognition() {
    this.ocultar = false;

    const audio = new Audio('assets/telephone_call.mp3');

    audio.play();

    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      console.log('Sonido finalizado, iniciando reconocimiento de voz...');
      this.recognition.start();
    }, 5000);
  }

  // Método para hacer scroll al último mensaje
  private scrollToBottom(): void {
    try {
      this.chatBox.nativeElement.scrollTop =
        this.chatBox.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error al hacer scroll: ', err);
    }
  }
}
