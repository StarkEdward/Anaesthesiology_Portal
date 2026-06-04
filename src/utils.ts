import { AttendanceType } from './types';

export const MARATHI_DIGITS_MAP: { [key: string]: string } = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९'
};

export function toMarathiDigits(input: number | string): string {
  const str = String(input);
  return str.split('').map(char => MARATHI_DIGITS_MAP[char] || char).join('');
}

export function fromMarathiDigits(input: string): string {
  const reverseMap: { [key: string]: string } = {};
  Object.entries(MARATHI_DIGITS_MAP).forEach(([en, mr]) => {
    reverseMap[mr] = en;
  });
  return input.split('').map(char => reverseMap[char] || char).join('');
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getDayOfWeek(year: number, month: number, day: number): number {
  // Returns 0 (Sunday) to 6 (Saturday)
  return new Date(year, month - 1, day).getDay();
}

export const MARATHI_MONTHS: { [key: number]: string } = {
  1: 'जानेवारी',
  2: 'फेब्रुवारी',
  3: 'मार्च',
  4: 'एप्रिल',
  5: 'मे',
  6: 'जून',
  7: 'जुलै',
  8: 'ऑगस्ट',
  9: 'सप्टेंबर',
  10: 'ऑक्टोबर',
  11: 'नोव्हेंबर',
  12: 'डिसेंबर'
};

export function getMarathiMonthName(month: number): string {
  return MARATHI_MONTHS[month] || '';
}

export function calculateAttendanceStats(attendance: { [day: number]: AttendanceType }, totalDays: number) {
  let present = 0;
  let absent = 0;
  let holidaysAndWo = 0;

  for (let d = 1; d <= totalDays; d++) {
    const status = attendance[d] || 'A';
    if (status === 'P') {
      present++;
    } else if (status === 'A') {
      absent++;
    } else if (status === 'WO' || status === 'H') {
      holidaysAndWo++;
    }
  }

  return {
    present,
    absent,
    holidaysAndWo,
    total: totalDays
  };
}
