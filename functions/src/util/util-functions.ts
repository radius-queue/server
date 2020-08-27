import { Party } from "./queue";
import { BusinessLocation } from "./business";
import * as admin from 'firebase-admin';



export function partyToFirebase(party: Party): any {
  return {
    firstName: party.firstName,
    size: party.size,
    phoneNumber: party.phoneNumber,
    quote: party.quote,
    checkIn: party.checkIn,
    lastName: party.lastName,
    messages: messageToFB(party.messages),
    pushToken: party.pushToken,
  };
}

export function messageToFB(messages: [string, string][]) : any[] {
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

export function businessLocationToFirebase(location: any) {
  return {
    name: location.name,
    address: location.address,
    phoneNumber: location.phoneNumber,
    hours: BusinessLocation.hoursToFirebase(location.hours), // need fixing
    coordinates: new admin.firestore.GeoPoint(
        location.coordinates[0],
        location.coordinates[1],
    ),
    queues: location.queues,
    geoFenceRadius: location.geoFenceRadius,
    images: location.images,
  };
}

export function diff_minutes(dt2: Date, dt1: Date) {
  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}
