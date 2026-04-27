export class ClientRegistry {
  constructor() {
    this.map = new Map();
  }

  set(ws, data) {
    this.map.set(ws, data);
  }

  get(ws) {
    return this.map.get(ws);
  }

  has(ws) {
    return this.map.has(ws);
  }

  delete(ws) {
    return this.map.delete(ws);
  }

  entries() {
    return this.map.entries();
  }

  forEach(callback) {
    this.map.forEach((client, ws) => callback(ws, client));
  }

  add(ws, data) {
    this.set(ws, data);
  }

  remove(ws) {
    this.delete(ws);
  }
}