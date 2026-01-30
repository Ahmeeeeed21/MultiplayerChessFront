import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import {AuthResponse} from "../models/auth-response/auth-response.module";
import {RegisterRequest} from "../models/register-request/register-request.module";
import {LoginRequest} from "../models/login-request/login-request.module";
import {User} from "../models/user/user.module";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8088/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        if (response.userId) {
          this.saveUserToStorage(response);
        }
      })
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response.userId) {
          this.saveUserToStorage(response);
        }
      })
    );
  }

  logout(): Observable<void> {
    const user = this.currentUserSubject.value;
    if (user) {
      return this.http.post<void>(`${this.apiUrl}/logout/${user.id}`, {}).pipe(
        tap(() => {
          this.clearUserFromStorage();
        })
      );
    }
    this.clearUserFromStorage();
    return new Observable(observer => observer.complete());
  }

  getOnlineUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/online`);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  private saveUserToStorage(response: AuthResponse): void {
    const user: User = {
      id: response.userId,
      username: response.username,
      email: response.email,
      status: 'ONLINE'
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', response.token);
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.currentUserSubject.next(user);
    }
  }

  private clearUserFromStorage(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }
}
