export class UserModel {
  id?: string;
  dni: string;
  name: string;
  surname: string;
  phone: number;
  mail: string;
  timestamp: number;

  constructor() {
    this.timestamp = new Date().getTime();
  }
}
