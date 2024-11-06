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
  isRecognitionActive: boolean = false;
  isFirstRecognition: boolean = true;
  isPlayingAudio: boolean = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    //this.socket = new WebSocket('ws://localhost:8000/ws/conversar');
    this.socket = new WebSocket(
      'wss://s3svcvl8-8000.use2.devtunnels.ms/ws/conversar'
    );

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const assistantResponse = data.texto;
      const audioBase64 = data.audio;

      this.respuesta = 'Respuesta del asistente: ' + assistantResponse;

      const formattedResponse = this.sanitizer.bypassSecurityTrustHtml(
        assistantResponse.replace(/\n/g, '<br><br>')
      );

      this.messages.push({
        sender: 'assistant',
        content: assistantResponse,
        formattedContent: formattedResponse,
      });

      this.scrollToBottom();

      this.stopRecognition(); // Asegúrate de detener el reconocimiento antes de reproducir audio
      this.playAudio(audioBase64);
    };

    this.socket.onopen = () => console.log('Conexión WebSocket abierta.');
    this.socket.onclose = () => {
      console.log('Conexión WebSocket cerrada.');
      this.ocultar = true;
      Swal.fire({
        title: 'Se ha finalizado la llamada',
        text: 'Gracias por comunicarte con nosotros.',
        icon: 'success',
        confirmButtonText: 'Cerrar',
      });
      setTimeout(() => {
        window.location.reload();
      }, 15000);
    };

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.transcript = 'Tu mensaje: ' + transcript;

      this.messages.push({ sender: 'user', content: transcript });

      this.socket.send(transcript);

      this.scrollToBottom();
    };

    this.recognition.onend = () => {
      this.isRecognitionActive = false;
      // Solo reinicia el reconocimiento si el audio no está en reproducción
      setTimeout(() => {
        if (!this.isRecognitionActive && !this.isPlayingAudio) {
          this.startRecognition();
        }
      }, 1000);
    };

    this.recognition.onerror = (event: any) =>
      console.error('Error en el reconocimiento de voz: ', event.error);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.close();
    }
    if (this.recognition) {
      this.stopRecognition();
    }
  }

  startRecognition() {
    if (!this.isRecognitionActive && !this.isPlayingAudio) {
      this.isRecognitionActive = true;

      if (this.isFirstRecognition) {
        this.isFirstRecognition = false;
        this.ocultar = false;
        const audio = new Audio('assets/telephone_call.mp3');
        audio.play();

        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log('Sonido finalizado, iniciando reconocimiento de voz...');
          this.recognition.start();
        }, 5000);
      } else {
        this.recognition.start();
      }
    }
  }

  private stopRecognition() {
    if (this.isRecognitionActive) {
      this.recognition.stop();
      this.isRecognitionActive = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatBox.nativeElement.scrollTop =
        this.chatBox.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error al hacer scroll: ', err);
    }
  }

  private playAudio(base64Audio: string) {
    this.stopRecognition();
    this.isPlayingAudio = true;
    const audioContent = 'data:audio/mp3;base64,' + base64Audio;
    const audio = new Audio(audioContent);
    audio
      .play()
      .catch((error) => console.error('Error al reproducir audio:', error));

    audio.onended = () => {
      this.isPlayingAudio = false; // Marcar que el audio ha terminado
      this.startRecognition(); // Reiniciar el reconocimiento solo después de que el audio termine
    };
  }
}
