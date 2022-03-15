export class UserInfo {
  public userId: string;
  public roleNames: string[];
  public groupPaths: string[];
  constructor(payload) {
    this.userId = payload.sub;
    this.groupPaths = payload?.groups;
    this.roleNames = payload?.realm_access?.roles;
  }
}
