import firebase from 'firebase/app';
/**
 * This class represents a queue
 */
export class Queue {
  name : string;
  parties: Party[]; // where parties[0] is the front of the line
  end: Date;
  uid : string;
  open: boolean;

  /**
   * @param {string} name Name of Queue
   * @param {Date} end End time
   * @param {string} uid Uid of Queue
   * @param {boolean} open true if queue is open
   * @param {Party[]} parties Optional field for initializing current queue,
   *    Default value is set to empty array
   */
  constructor(name: string, end: Date, uid: string, open: boolean,
      parties?: Party[]) {
    this.name = name;
    this.parties = parties ? parties :[];
    this.end = end;
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
  checkIn : Date;
  size: number;
  phoneNumber: string;
  quote: number;
  messages: [Date, string][];
  // uid: string;

  /**
   * @param {string} firstName first name
   * @param {number} size Size of the party
   * @param {string} phoneNumber phoneNumber of the party
   * @param {number} quote The given estimated time to be called
   * @param {Date} checkIn Optional time when customer checked in.
   *    Default is set to now.
   * @param {string} lastName last name
   * @param {[Date, string][]} messages array of Date, string pairs as messages
   *    for the party
   */
  constructor(firstName: string, size: number, phoneNumber: string,
      quote:number, checkIn : Date= new Date(), lastName : string = '',
      messages: [Date, string][] = []) {
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
   * @return {[Date, string][]} messages representation
   */
  static messageFromFB(messages: any[]): [Date, string][] {
    const ret : [Date, string][] = [];
    if (messages) {
      for (let i =0; i < messages.length; i++) {
        const entry : [Date, string] =[new Date(), ''];
        entry[0] = messages[i].date.toDate();
        entry[1] = messages[i].message;
        ret.push(entry);
      }
    }
    return ret;
  }

  /**
   *
   * @param {[Date, string][]} messages
   * @return {any[]} firebase representation of messages
   */
  static messageToFB(messages: [Date, string][]) : any[] {
    const ret : any[] = [];
    if (messages) {
      for (let i = 0; i <messages.length; i++) {
        const entry = {
          date: messages[i][0],
          message: messages[i][1],
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
    const partyPrams : [string, number, string, number, Date, string,
        [Date, string][]] = [
          party.firstName,
          party.size,
          party.phoneNumber,
          party.quote,
          party.checkIn.toDate(),
          party.lastName,
          this.messageFromFB(party.messages),
        ];
    return new Party(...partyPrams);
  }

  /**
    * @param party
    */
  static toFirebase(party: Party): any {
    return {
      firstName: party.firstName,
      size: party.size,
      phoneNumber: party.phoneNumber,
      quote: party.quote,
      checkIn: firebase.firestore.Timestamp.fromDate(party.checkIn!),
      lastName: party.lastName,
      messages: this.messageToFB(party.messages),
    };
  }
}

export const Q_COLUMNS : string[] = ['#', 'Name', 'Party Size', 'Quoted Time'];

export const queueConverter = {
  toFirestore: function(q: Queue) {
    return {
      name: q.name,
      parties: q.parties.map((e) => Party.toFirebase(e)),
      end: firebase.firestore.Timestamp.fromDate(q.end!),
      open: q.open,
    };
  },
  fromFirestore: function(snapshot: any, options: any) {
    const data = snapshot.data(options);
    return new Queue(
        data.name,
        data.end.toDate(),
        '',
        data.open,
        data.parties.map((party: any)=> Party.fromFirebase(party)),
    );
  },
};


/**
 * This class represents a queue
 */
export class QueueInfo {
  length: number;
  longestWaitTime: number;
  open: boolean;

  constructor(length: number, longestWaitTime: number, open: boolean) {
    this.length = length;
    this.longestWaitTime = longestWaitTime;
    this.open = open;
  }
}

export const queueInfoConverter = {
  toFirestore: function(q: Queue) {
    return {
      name: q.name,
      parties: q.parties.map((e) => Party.toFirebase(e)),
      end: firebase.firestore.Timestamp.fromDate(q.end!),
      open: q.open,
    };
  },
  fromFirestore: function(snapshot: any, options: any) {
    const data = snapshot.data(options);
    return new QueueInfo(
        data.parties.length,
        diff_minutes(data.parties[0].checkIn.toDate(), new Date()),
        data.open,
    );
  },
};

function diff_minutes(dt2: Date, dt1: Date) {
  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}