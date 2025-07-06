export function formatDate(date: Date | string | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (date === undefined || date === null) { // Check for null as well
    return 'N/A';
  }

  let dateObject: Date;
  if (typeof date === 'string') {
    // Check if the string results in a valid date
    if (isNaN(Date.parse(date))) {
      return 'Invalid Date';
    }
    dateObject = new Date(date);
  } else {
    dateObject = date;
  }

  // Check if the Date object itself is valid
  if (isNaN(dateObject.getTime())) {
    return 'Invalid Date';
  }

  try {
    return new Intl.DateTimeFormat('en-US', options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObject);
  } catch (e) {
    // Catch any unexpected errors during formatting, though the checks above should prevent most.
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
}
