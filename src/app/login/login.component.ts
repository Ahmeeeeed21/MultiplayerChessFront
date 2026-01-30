import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {AuthService} from "../services/auth.service";
import {WebSocketService} from "../services/websocket.service";
import {LoginRequest} from "../models/login-request/login-request.module";
import {RegisterRequest} from "../models/register-request/register-request.module";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isLoginMode = true;
  username = '';
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router
  ) {}

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  login(): void {
    const request: LoginRequest = {
      username: this.username,
      password: this.password
    };

    this.authService.login(request).subscribe({
      next: (response) => {
        if (response.userId) {
          this.successMessage = 'Login successful!';
          this.wsService.connect(response.userId);
          setTimeout(() => this.router.navigate(['/lobby']), 500);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.errorMessage = 'Login failed. Please try again.';
        console.error('Login error:', error);
      }
    });
  }

  register(): void {
    const request: RegisterRequest = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        if (response.userId) {
          this.successMessage = 'Registration successful! You can now login.';
          this.isLoginMode = true;
          this.password = '';
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.errorMessage = 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }
}
