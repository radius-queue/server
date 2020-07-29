/**
 * Parser for displaying phone numbers
 * @param {string} phoneNum
 * @return {string} parsed phone number
 */
export function parsePhoneNum(phoneNum : string) : string {
  let number = phoneNum;
  if (phoneNum.length < 3) {
    return phoneNum;
  } else {
    number = '(' + phoneNum.substring(0, 3) + ')' + number.substring(3);
  }

  if (number.length > 8) {
    number = number.substring(0, 8) + '-' + number.substring(8);
  }
  return number;
}

/**
 * Parses Name for customer side display
 * @param {string} firstName first name of customer
 * @param {string} lastName last name of customer
 * @return {string} display name
 */
export function parseShortName(firstName: string, lastName: String) : string {
  if (lastName.length < 1) {
    return firstName.substring(0, 1).toUpperCase();
  }
  return firstName.substring(0, 1).toUpperCase() + ' ' +
      lastName.substring(0, 1).toUpperCase();
}
