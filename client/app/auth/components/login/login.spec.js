import { TestComponentBuilder } from 'angular2/testing';
import { FormBuilder } from 'angular2/common';
import { Router } from 'angular2/router';
import { provide } from 'angular2/core';
import { BrowserDomAdapter } from 'angular2/platform/browser';
import { TRANSLATE_PROVIDERS } from 'ng2-translate/ng2-translate';
import { HTTP_PROVIDERS } from 'angular2/http';
import { Observable } from 'rxjs';
import { LoginComponent } from './login';
import { UserService } from '../../services/user';

class RouterMock {
  navigate() {}
}
class UserServiceMock {
  login(val) {
    console.log(val)
  }
}

function stubLoginMethod(result) {
  let loginResult = Observable.of(result);
  spyOn(UserServiceMock.prototype, 'login').and.returnValue(loginResult);
}

describe('LoginComponent', () => {
  let subjectFixture;
  let subject;
  let subjectElement;
  let credentials = { email: 'test@gmail.com', password: 'secret' };
  let dom;

  beforeEachProviders(() => [
    TestComponentBuilder,
    FormBuilder,
    BrowserDomAdapter,
    TRANSLATE_PROVIDERS,
    HTTP_PROVIDERS,
    provide(UserService, { useClass: UserServiceMock }),
    provide(Router, { useClass: RouterMock })
  ]);

  beforeEach(injectAsync([TestComponentBuilder, BrowserDomAdapter], (componentBuilder, _dom_) => {
    dom = _dom_;

    return componentBuilder
      .createAsync(LoginComponent)
      .then(fixture => {
        subject = fixture.componentInstance;
        subjectElement = fixture.nativeElement;
        subjectFixture = fixture;
      });
  }));

  it('should send login request', () => {
    stubLoginMethod(true);

    subject.onSubmit(credentials);

    expect(UserServiceMock.prototype.login).toHaveBeenCalledWith(credentials);
  });

  it('should navigate to list page on successful login', () => {
    stubLoginMethod(true);
    spyOn(RouterMock.prototype, 'navigate');

    subject.onSubmit(credentials);

    expect(RouterMock.prototype.navigate).toHaveBeenCalledWith(['List']);
  });

  it('should skip navigation on failed login', () => {
    stubLoginMethod(false);
    spyOn(RouterMock.prototype, 'navigate');

    subject.onSubmit(credentials);

    expect(RouterMock.prototype.navigate.calls.count()).toEqual(0);
  });

  it('should send credentials from input fields', (done) => {
    subject.loginForm.controls['email'].updateValue(credentials.email);
    subject.loginForm.controls['password'].updateValue(credentials.password);
    subjectFixture.detectChanges();

    stubLoginMethod(true);

    dom.querySelector(subjectElement, 'button[type=submit]').click();

    setTimeout(() => {
      expect(UserServiceMock.prototype.login).toHaveBeenCalledWith(credentials);
      done();
    }, 0);
  });
});
