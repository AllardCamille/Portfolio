import { Component } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  isSubmitting = false;
  statusMessage = '';
  isSuccess = false;

  sendEmail(event: Event): Promise<void> | void {
    event.preventDefault();

    const target = event.target as HTMLElement;
    const form = (target.tagName === 'FORM' ? target : target.closest('form')) as HTMLFormElement;

    if (!form || !form.checkValidity()) {
      form?.reportValidity();
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = '';

    return emailjs.sendForm(
      environment.emailjs.serviceId,
      environment.emailjs.templateId,
      form,
      environment.emailjs.publicKey
    )
      .then(() => {
        this.isSuccess = true;
        this.statusMessage = 'Message envoyé avec succès ! Un mail de confirmation vous a été adressé.';
        form.reset();
      })
      .catch((error) => {
        console.error('EmailJS Error:', error);
        this.isSuccess = false;
        this.statusMessage = "Une erreur est survenue lors de l'envoi. Veuillez réessayer.";
      })
      .finally(() => {
        this.isSubmitting = false;
      });
  }
}
