/**
 * This class represents a queue
 */
export class Queue {
  parties: Party[]; // where parties[0] is the front of the line
  uid : string;
  open: boolean;

  /**
   * @param {string} uid Uid of Queue
   * @param {boolean} open true if queue is open
   * @param {Party[]} parties Optional field for initializing current queue,
   *    Default value is set to empty array
   */
  constructor(uid: string, open: boolean,
      parties?: Party[]) {
    this.parties = parties ? parties :[];
    this.open = open;
    this.uid = uid;
  }
}

/**
 * A party in the queue
 */
export class Party {
  firstName: string;
  lastName: string;
  checkIn : string;
  size: number;
  phoneNumber: string;
  quote: number;
  messages: [string, string][];
  // uid: string;

  /**
   * @param {string} firstName first name
   * @param {number} size Size of the party
   * @param {string} phoneNumber phoneNumber of the party
   * @param {number} quote The given estimated time to be called
   * @param {string} checkIn Optional time when customer checked in.
   *    Default is set to now.
   * @param {string} lastName last name
   * @param {[string, string][]} messages array of Date, string pairs as messages
   *    for the party
   */
  constructor(firstName: string, size: number, phoneNumber: string,
      quote:number, checkIn : string= new Date().toString(), lastName : string = '',
      messages: [string, string][] = []) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.checkIn = checkIn;
    this.size = size;
    this.phoneNumber = phoneNumber;
    this.quote = quote;
    this.messages = messages;
    // this.uid = uid || "";
  }

  /**
   *
   * @param {any[]} messages firebase entry for messages
   * @return {[string, string][]} messages representation
   */
  static messageFromFB(messages: any[]): [string, string][] {
    const ret : [string, string][] = [];
    if (messages) {
      for (const message of messages) {
        const entry = [];
        entry[0] = message.date;
        entry[1] = message.message;
        ret.push(entry as [string, string]);
      }
    }
    return ret;
  }

  /**
   *
   * @param {[string, string][]} messages
   * @return {any[]} firebase representation of messages
   */
  static messageToFB(messages: [string, string][]) : any[] {
    const ret : any[] = [];
    if (messages) {
      for (const message of messages) {
        const entry = {
          date: message[0],
          message: message[1],
        };
        ret.push(entry);
      }
    }
    return ret;
  }

  /**
  * @param party
  */
  static fromFirebase(party: any): Party {
    const partyPrams : [string, number, string, number, string, string,
        [string, string][]] = [
          party.firstName,
          party.size,
          party.phoneNumber,
          party.quote,
          party.checkIn,
          party.lastName,
          this.messageFromFB(party.messages),
        ];
    return new Party(...partyPrams);
  }
}

/**
 * This class represents a queue
 */
export interface QueueInfo {
  length: number;
  longestWaitTime: number;
  open: boolean;
}
