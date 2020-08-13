/**
 * This class represents a Business
 */
export class Business {
  name: string;
  firstName: string;
  lastName:string;
  email: string;
  locations: BusinessLocation[];
  uid : string;
  type : string;

  /**
   * @param {string} name Business name
   * @param {string} firstName Owner First Name
   * @param {string} lastName Owner Last Name
   * @param {string} email Account email
   * @param {string} uid Unique Identifier
   * @param {string} type Type of establishment
   * @param {BusinessLocation[]} locations Optional array of store location
   *    objects, Default value is set to be empty array
   */
  constructor(name: string, firstName: string, lastName: string, email: string,
      uid: string, type: string, locations: BusinessLocation[] =[]) {
    this.name = name;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.uid = uid;
    this.locations = locations;
    this.type = type;
  }
}

/**
 * A specific business location
 */
export class BusinessLocation {
  name: string;
  address: string;
  phoneNumber: string;
  hours: [string | null, string | null][];
  coordinates: number[]; // in decimal degrees (DD).
  queues: string[];
  geoFenceRadius: number; // in meters
  images: string[];
  type: string;
  uid: string;

  /**
   * @param {string} name Name of specific location
   * @param {string} address Address of location
   * @param {string} phoneNumber phone number of the location
   * @param {[string | null, string | null][]} hours business hours for queue
   *    operation as array of Date object pairs.
   * @param {number[]} coordinates Geographic coordinates of location in
   *    decimal degrees (DD). ex: [41.40338, 2.17403] lat, long
   * @param {string} type type of establishment
   * @param {string[]} queues Optional array of queue ids associated with
   *    this location, Default value of empty array
   * @param {number} geoFenceRadius Optional radius around business location
   *    (in meters) that a customer is allowed to enter queue, Default value
   *    of -1
   * @param {string[]} images array of string urls that correspond to uploaded
   *    images from the business
   */
  constructor(name: string, address: string, phoneNumber: string,
      hours: [string | null, string | null][],
      coordinates: number[], type: string, queues: string[] = [],
      geoFenceRadius: number = -1, images: string[] = []) {
    this.name = name;
    this.address = address;
    this.phoneNumber = phoneNumber;
    this.hours = hours;
    this.coordinates = coordinates;
    this.type = type;
    this.queues = queues;
    this.geoFenceRadius = geoFenceRadius;
    this.images = images;
    this.uid = '';
  }

  /* Firebase helper methods */

  /**
  * Convert location object from firebase to js object
  * @param {object} location firebase location object
  * @return {BusinessLocation} equivalent js object
  */
  static fromFirebase(type: string, location: any): BusinessLocation {
    const locPrams : [string, string, string, [string | null, string | null][], number[],
     string, string[], number, string[]] = [
       location.name,
       location.address,
       location.phoneNumber,
       BusinessLocation.hoursFromFirebase(location.hours),
       [location.coordinates.latitude,
         location.coordinates.longitude],
       type,
       location.queues,
       location.geoFenceRadius,
       location.images,
     ];
    return new BusinessLocation(...locPrams);
  }

  /**
   *
   * @param hours
   */
  static hoursToFirebase(hours: [string | null, string | null][]): any {
    const ret: {[id:string]: [string | null, string | null]} = {};
    for (let i = 0; i < DATE_INDEX.size; i++) {
      const day = hours[i];
      const dayName: string = DATE_INDEX.get(i)!;
      ret[dayName] = [day[0] ? day[0] : null, day[1] ? day[1] : null];
    }
    return ret;
  }

  /**
   *
   * @param hour
   */
  static hoursFromFirebase(hours: any): [string | null, string | null][] {
    const ret: [string | null, string | null][] = [];
    for (let i = 0; i < DATE_INDEX.size; i++) {
      const day = hours[(DATE_INDEX.get(i))!];
      ret.push([day[0], day[1]]);
    }
    return ret;
  }
}

export function getHoursArray(input: [string, string][]) {
  const result : [Date | null, Date | null][] = [];
  for (const pair of input) {
    if (pair[0] && pair[1]) {
      const openParts : string[] = pair[0].split(':');
      const closeParts : string[] = pair[1].split(':');

      const openDate = new Date(2020, 0, 1, parseInt(openParts[0]), parseInt(openParts[1]));
      const closeDate = new Date(2020, 0, 1, parseInt(closeParts[0]), parseInt(closeParts[1]));

      result.push([openDate, closeDate]);
    } else {
      result.push([null, null]);
    }
  }
  return result;
}

const DATE_INDEX: Map<number, string> = new Map<number, string>([
  [0, 'Sunday'],
  [1, 'Monday'],
  [2, 'Tuesday'],
  [3, 'Wednesday'],
  [4, 'Thursday'],
  [5, 'Friday'],
  [6, 'Saturday'],
]);
