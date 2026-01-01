// Google Places API configuration
const API_KEY = 'AIzaSyCYWs5ZAZV-xLazWaphLb-dsUgTDsU0Cm0';
const PLACE_ID = "ChIJfwpyZj-N2EcR08pMha2yaQM";

function displayOpeningHours(weekdayDescriptions, specialOpeningHours) {
  const openingHoursDiv = document.getElementById('opening-hours');
  
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) {
    openingHoursDiv.innerHTML = '<p>Opening hours not available</p>';
    openingHoursDiv.classList.remove('loading');
    return;
  }

  // Helper function to format date as "Dec 25th"
  function formatDateWithOrdinal(year, month, day) {
    const date = new Date(year, month - 1, day);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    
    return `${monthName} ${day}`;
  }

  // Helper function to get weekday name from a date
  function getWeekdayName(year, month, day) {
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  let html = '<ul>';
  
  // Regular weekday hours
  weekdayDescriptions.forEach(dayText => {
    const parts = dayText.split(':');
    if (parts.length >= 2) {
      const weekdayName = parts[0].trim();
      const hoursText = parts.slice(1).join(':').trim();
      
      // Check if this weekday matches any special day
      let matchingSpecialDay = null;
      if (specialOpeningHours && specialOpeningHours.specialDays && specialOpeningHours.specialDays.length > 0) {
        matchingSpecialDay = specialOpeningHours.specialDays.find(specialDay => {
          const specialDayWeekday = getWeekdayName(
            specialDay.date.year,
            specialDay.date.month,
            specialDay.date.day
          );
          return specialDayWeekday === weekdayName;
        });
      }
      
      if (matchingSpecialDay) {
        // Format as "Friday 11:00 am - 1:00 pm (Dec 25th)"
        const dateFormatted = formatDateWithOrdinal(
          matchingSpecialDay.date.year,
          matchingSpecialDay.date.month,
          matchingSpecialDay.date.day
        );
        html += `<li style="background-color: #fff3cd; font-weight: bold;"><span class="day">${weekdayName}:</span> ${hoursText} (${dateFormatted})</li>`;
      } else {
        html += `<li><span class="day">${weekdayName}:</span> ${hoursText}</li>`;
      }
    } else {
      html += `<li>${dayText}</li>`;
    }
  });
  
  html += '</ul>';
  
  
  openingHoursDiv.innerHTML = html;
  openingHoursDiv.classList.remove('loading');
}

// Fetch opening hours from Google Places API
fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
  headers: {
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": "currentOpeningHours.weekdayDescriptions,currentOpeningHours.specialDays,currentOpeningHours.periods"
  }
})
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => {
        console.error('API Error Response:', err);
        throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      });
    }
    return res.json();
  })
  .then(data => {
    console.log('API Response:', data);
    
    if (data.error) {
      console.error('API Error:', data.error);
      document.getElementById('opening-hours').innerHTML = `<p>Error: ${data.error.message || 'Unknown error'}</p>`;
      document.getElementById('opening-hours').classList.remove('loading');
      return;
    }
    
    // Check for weekdayDescriptions in the response
    // Places API (New) uses currentOpeningHours instead of openingHours
    const weekdayDescriptions = data.currentOpeningHours?.weekdayDescriptions || null;
    const specialOpeningHours = data.currentOpeningHours?.specialDays ? 
      { specialDays: data.currentOpeningHours.specialDays } : null;
    
    if (weekdayDescriptions && weekdayDescriptions.length > 0) {
      displayOpeningHours(weekdayDescriptions, specialOpeningHours);
    } else {
      console.warn('No opening hours in response:', data);
      console.warn('Available keys:', Object.keys(data));
      if (data.currentOpeningHours) {
        console.warn('currentOpeningHours structure:', data.currentOpeningHours);
      }
      document.getElementById('opening-hours').innerHTML = '<p>Opening hours not available</p>';
      document.getElementById('opening-hours').classList.remove('loading');
    }
  })
  .catch(error => {
    console.error('Error fetching opening hours:', error);
    document.getElementById('opening-hours').innerHTML = `<p>Unable to load opening hours: ${error.message}</p>`;
    document.getElementById('opening-hours').classList.remove('loading');
  });
