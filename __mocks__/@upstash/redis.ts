export class Redis {
    static fromEnv() {
      return new Redis();
    }
  
    async get() {
      return null;
    }
  
    async set() {
      return "OK";
    }
  }
  
  export class Ratelimit {
    constructor() {}
    async limit() {
      return { success: true };
    }
  }
  