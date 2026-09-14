import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ContactComponent} from './contact.component';
import emailjs from '@emailjs/browser';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call emailjs and block submission if form is invalid', () => {
    const sendFormSpy = spyOn(emailjs, 'sendForm');
    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    spyOn(formElement, 'checkValidity').and.returnValue(false);
    spyOn(formElement, 'reportValidity');

    const submitEvent = new SubmitEvent('submit', {cancelable: true, bubbles: true});
    spyOn(submitEvent, 'preventDefault').and.callThrough();

    // Utilisation de dispatchEvent pour que le navigateur assigne correctement le target
    formElement.dispatchEvent(submitEvent);
    component.sendEmail(submitEvent);

    expect(submitEvent.preventDefault).toHaveBeenCalled();
    expect(formElement.checkValidity).toHaveBeenCalled();
    expect(formElement.reportValidity).toHaveBeenCalled();
    expect(sendFormSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should call emailjs and handle success when form is valid', async () => {
    const sendFormSpy = spyOn(emailjs, 'sendForm').and.returnValue(Promise.resolve({status: 200, text: 'OK'}));

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    spyOn(formElement, 'checkValidity').and.returnValue(true);
    spyOn(formElement, 'reset');

    const submitEvent = new SubmitEvent('submit', {cancelable: true, bubbles: true});
    spyOn(submitEvent, 'preventDefault').and.callThrough();

    formElement.dispatchEvent(submitEvent);
    await component.sendEmail(submitEvent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const messageElement = compiled.querySelector('.form-status');

    expect(submitEvent.preventDefault).toHaveBeenCalled();
    expect(sendFormSpy).toHaveBeenCalled();
    expect(component.isSuccess).toBeTrue();
    expect(component.statusMessage).toContain('Message envoyé avec succès');
    expect(messageElement).toBeTruthy();
    expect(messageElement?.textContent).toContain('Message envoyé avec succès');
    expect(component.isSubmitting).toBeFalse();
    expect(formElement.reset).toHaveBeenCalled();
  });

  it('should handle error and display error message when emailjs submission fails', async () => {
    spyOn(emailjs, 'sendForm').and.returnValue(Promise.reject('API Error'));

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    spyOn(formElement, 'checkValidity').and.returnValue(true);

    const submitEvent = new SubmitEvent('submit', {cancelable: true, bubbles: true});
    spyOn(submitEvent, 'preventDefault').and.callThrough();

    formElement.dispatchEvent(submitEvent);
    await component.sendEmail(submitEvent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const messageElement = compiled.querySelector('.form-status');

    expect(submitEvent.preventDefault).toHaveBeenCalled();
    expect(component.isSuccess).toBeFalse();
    expect(component.statusMessage).toContain("Une erreur est survenue lors de l'envoi");
    expect(messageElement).toBeTruthy();
    expect(messageElement?.textContent).toContain("Une erreur est survenue lors de l'envoi");
    expect(component.isSubmitting).toBeFalse();
  });
});
