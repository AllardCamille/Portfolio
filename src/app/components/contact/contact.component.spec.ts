import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';
import emailjs from '@emailjs/browser';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call emailjs if form is invalid', () => {
    const sendFormSpy = spyOn(emailjs, 'sendForm');
    const formElement = document.createElement('form');

    spyOn(formElement, 'checkValidity').and.returnValue(false);
    spyOn(formElement, 'reportValidity');

    const dummyEvent = new Event('submit');
    Object.defineProperty(dummyEvent, 'target', { value: formElement });

    component.sendEmail(dummyEvent);

    expect(formElement.checkValidity).toHaveBeenCalled();
    expect(formElement.reportValidity).toHaveBeenCalled();
    expect(sendFormSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should call emailjs and handle success when form is valid', async () => {
    const sendFormSpy = spyOn(emailjs, 'sendForm').and.resolveTo({ status: 200, text: 'OK' });

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    spyOn(formElement, 'checkValidity').and.returnValue(true);
    spyOn(formElement, 'reset');

    const dummyEvent = new Event('submit');
    Object.defineProperty(dummyEvent, 'target', { value: formElement });

    await component.sendEmail(dummyEvent);

    expect(sendFormSpy).toHaveBeenCalled();
    expect(component.isSuccess).toBeTrue();
    expect(component.statusMessage).toContain('Message envoyé avec succès');
    expect(component.isSubmitting).toBeFalse();
    expect(formElement.reset).toHaveBeenCalled();
  });

  it('should handle error when emailjs submission fails', async () => {
    spyOn(emailjs, 'sendForm').and.rejectWith('API Error');

    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    spyOn(formElement, 'checkValidity').and.returnValue(true);

    const dummyEvent = new Event('submit');
    Object.defineProperty(dummyEvent, 'target', { value: formElement });

    await component.sendEmail(dummyEvent);

    expect(component.isSuccess).toBeFalse();
    expect(component.statusMessage).toContain('Une erreur est survenue');
    expect(component.isSubmitting).toBeFalse();
  });
});
