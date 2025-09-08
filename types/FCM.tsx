export interface IUser {
  salesPersonCode: number;
  fullName: string;
}

export interface IDevice {
  name: string;
  platform: string;
  OS: string;
}

export interface IUserRequestBody {
  PushToken: string;
  UUID: string;
  User: IUser;
  Device: IDevice;
}