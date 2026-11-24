export function you(login: string, viewer: string) {
  return login === viewer ? " (you)" : "";
}
