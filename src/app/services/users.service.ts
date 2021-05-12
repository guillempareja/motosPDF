import { Component, Injectable, Injector } from '@angular/core';
import { FilterUsers } from '../interfaces/filter-users.interface';
import { Commons } from '../utils/commons.util';
import { UserModel } from '../models/user.model';
import { FirebaseService } from './firebase.service';
import { MotosService } from './motos.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  public collection = 'users';
  public filters: FilterUsers;
  public page = 1;

  constructor(private commons: Commons, private firebase: FirebaseService, private injector: Injector) { }

  getUser(id: string): Promise<UserModel> | any {
    return this.firebase.getElment(this.collection, id);
  }

  async getUsers(filters?: FilterUsers): Promise<UserModel[]> {
    let users: UserModel[] = await this.firebase.getElments(this.collection, ref => ref.orderBy('timestamp', 'desc'));
    users = filters ? users.filter(user => (
      Object.entries(filters).some(([key, value]) => (
        value && String(user[key]).toLowerCase().includes(String(value).toLowerCase())
      ))
    )) : users;
    this.filters = filters;
    return users;
  }

  async isDniRepeated(dni: string, id?: string): Promise<boolean> {
    const users = await this.firebase.getElments(this.collection, ref => ref.where('dni', '==', dni));
    return users.some(user => user.id !== id);
  }

  async createUser(user: UserModel): Promise<any> {
    if (await this.isDniRepeated(user.dni, user.id)) {
      return Promise.reject();
    }
    return this.firebase.create(this.collection, user);
  }

  async updateUser(user: UserModel): Promise<any> {
    if (user.dni && await this.isDniRepeated(user.dni, user.id)) {
      return Promise.reject();
    }
    return this.firebase.update(this.collection, user);
  }

  async deleteUser(id: string): Promise<any> {
    await this.firebase.delete(this.collection, id);
    const motosService = this.injector.get(MotosService);
    const motos = await this.firebase.getElments('motos', ref => ref.where('user', '==', id));
    motos.forEach(async moto => await motosService.deleteMoto(moto.id));
  }

  async actualizeMotos(id: string): Promise<any> {
    const motos = await this.firebase.getElments('motos', ref => ref.where('user', '==', id));
    const user = {
      id,
      motos: motos.length
    };
    this.updateUser(user);
  }

  resetConfiguration(): void {
    this.page = 1;
    this.filters = null;
  }

}

